import { createClient } from '@supabase/supabase-js';

// Supabase URL and anon key from environment variables. At runtime (dev only)
// prefer a very early inline `window.__VITE_ENV_OVERRIDE__` when present so
// modules that evaluate early can pick up a corrected value without rebuild.
let supabaseUrl = '';
let supabaseAnonKey = '';

// Prefer runtime override if available (set by an inline script in `index.html`).
try {
  // @ts-ignore
  const w = typeof window !== 'undefined' ? window : null;
  // @ts-ignore
  const runtimeOverride = w && w.__VITE_ENV_OVERRIDE__ ? w.__VITE_ENV_OVERRIDE__ : null;
  if (runtimeOverride && runtimeOverride.VITE_SUPABASE_URL) {
    supabaseUrl = runtimeOverride.VITE_SUPABASE_URL;
    supabaseAnonKey = runtimeOverride.VITE_SUPABASE_ANON_KEY || '';
  } else {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }
} catch (e) {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

// Fallback placeholder only to prevent initialization crash if variables are not yet loaded
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  }
});

// Debug: surface configured values in browser console (masking anon key)
try {
  // eslint-disable-next-line no-console
  console.log('[Supabase] configured:', {
    url: supabaseUrl || '(not set)',
    anonKeyPresent: Boolean(supabaseAnonKey),
    isSupabaseConfigured,
  });
} catch (e) {
  // ignore in non-browser environments
}
// Expose a small debug object on window for runtime inspection in dev
try {
  // @ts-ignore
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__SUPABASE_DEBUG__ = {
      url: supabaseUrl || null,
      anonKeyPresent: Boolean(supabaseAnonKey),
      safeUrl,
      safeKeyPresent: Boolean(safeKey && safeKey !== 'placeholder-anon-key'),
      isSupabaseConfigured,
      runtimeOverridePresent: Boolean((window as any).__VITE_ENV_OVERRIDE__)
    };
  }
} catch (e) {
  // ignore
}

// Expose a minimal view of `import.meta.env` for debugging in dev only
try {
  // @ts-ignore
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__VITE_ENV__ = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || null,
      VITE_SUPABASE_ANON_KEY_present: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
      NODE_ENV: import.meta.env.MODE || null,
    };
  }
} catch (e) {
  // ignore
}
