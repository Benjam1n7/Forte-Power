import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  /** True until the persisted session has been restored from SecureStore. */
  loading: boolean;
  /** True while the Google OAuth browser round-trip is in progress. */
  signingIn: boolean;
  error: string | null;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null; cancelled?: boolean }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Extracts a query parameter from a redirect URL (query or fragment form). */
function extractParam(url: string, name: string): string | null {
  try {
    const qIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');
    const queryStart = qIndex >= 0 ? qIndex : hashIndex;
    if (queryStart >= 0) {
      const query = url.slice(queryStart + 1).split('#')[0];
      for (const pair of query.split('&')) {
        const [key, value] = pair.split('=');
        if (key === name) return decodeURIComponent(value ?? '');
      }
    }
    return null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against the redirect URL being handled twice (once by the
  // openAuthSessionAsync result and once by the Linking deep-link listener).
  const handledUrlRef = useRef<Set<string>>(new Set());
  const exchangeInFlightRef = useRef(false);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  /**
   * Completes a PKCE OAuth redirect: the URL carries `?code=...`, which is
   * exchanged (using the code verifier persisted by supabase-js in SecureStore)
   * for a session. Falls back to implicit-style tokens when present.
   */
  const handleAuthRedirectUrl = useCallback(async (url: string): Promise<boolean> => {
    if (!url || handledUrlRef.current.has(url)) return false;
    handledUrlRef.current.add(url);
    if (handledUrlRef.current.size > 16) {
      handledUrlRef.current = new Set([url]);
    }
    if (sessionRef.current) return true; // already signed in

    const code = extractParam(url, 'code');
    const accessToken = extractParam(url, 'access_token');
    const refreshToken = extractParam(url, 'refresh_token');

    if (!code && !accessToken) return false;
    if (exchangeInFlightRef.current) return true;
    exchangeInFlightRef.current = true;
    try {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          // A code can only be redeemed once; if a session already exists
          // (handled by a parallel path) treat it as success.
          if (!sessionRef.current) {
            console.warn('[Auth] exchangeCodeForSession failed:', exchangeError.message);
            setError(`Sign-in failed: ${exchangeError.message}`);
            return false;
          }
        }
        return true;
      }
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          setError(`Sign-in failed: ${sessionError.message}`);
          return false;
        }
        return true;
      }
      return false;
    } finally {
      exchangeInFlightRef.current = false;
    }
  }, []);

  // Restore persisted session, subscribe to auth changes, and handle OAuth
  // deep links (`forteoptions://auth-callback`) and the PKCE code exchange.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // 1. Restore any persisted session (stored securely in SecureStore).
    supabase.auth
      .getSession()
      .then(({ data: { session: restored }, error }) => {
        if (!mounted) return;
        if (!error && restored) {
          setSession(restored);
          setUser(restored.user);
        }
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    // 2. React to auth transitions (signed in, token refreshed, signed out).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    // 3. Handle deep links that arrive while the app is running.
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      void handleAuthRedirectUrl(url);
    });

    // 4. Handle cold-start deep links (app was terminated during OAuth).
    Linking.getInitialURL()
      .then((url) => {
        if (url) void handleAuthRedirectUrl(url);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, [handleAuthRedirectUrl]);

  /**
   * Google sign-in against the SAME Supabase project / Google account as the
   * website. Uses the browser OAuth flow with a custom-scheme redirect
   * (`forteoptions://auth-callback`) and the PKCE code exchange.
   */
  const signInWithGoogle = useCallback(async (): Promise<{
    error: Error | null;
    cancelled?: boolean;
  }> => {
    setError(null);

    if (!isSupabaseConfigured) {
      const err = new Error(
        'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env.'
      );
      setError(err.message);
      return { error: err };
    }

    setSigningIn(true);
    try {
      const redirectTo = Linking.createURL('auth-callback');

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // we open the browser ourselves below
        },
      });

      if (oauthError) {
        const err = new Error(oauthError.message);
        setError(err.message);
        return { error: err };
      }
      if (!data.url) {
        const err = new Error('Google sign-in did not return an authorization URL.');
        setError(err.message);
        return { error: err };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const handled = await handleAuthRedirectUrl(result.url);
        if (!handled && !sessionRef.current) {
          const err = new Error(
            'Google sign-in returned an incomplete response. Please try again.'
          );
          setError(err.message);
          return { error: err };
        }
        return { error: null };
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        // Not an error: the user closed the browser before finishing.
        return { error: null, cancelled: true };
      }

      return { error: null };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed unexpectedly.';
      setError(message);
      return { error: err as Error };
    } finally {
      setSigningIn(false);
    }
  }, [handleAuthRedirectUrl]);

  /** Signs out locally and revokes the session server-side when possible. */
  const signOut = useCallback(async () => {
    setError(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Offline or server error — fall back to a local-only sign out so the
      // user is never stuck in a half-signed-in state.
      console.warn('[Auth] signOut server call failed, clearing locally:', err);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // ignore — state is cleared below regardless
      }
    }
    setSession(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signingIn,
        error,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

