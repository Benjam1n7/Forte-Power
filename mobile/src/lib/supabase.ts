// Randomness + URL polyfills MUST be imported before supabase-js is created.
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { secureStorage } from './secureStorage';

// Only the two *public* Supabase values are ever read here (EXPO_PUBLIC_*
// variables are inlined into the JS bundle at build time and are safe to
// expose). No service-role key or database password exists anywhere in this
// app — all privileged writes happen inside the `create-order` Edge Function.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 0
);

// Placeholders prevent a client-creation crash when env vars are missing;
// isSupabaseConfigured lets the UI surface a clear configuration error
// instead of silently failing (same pattern as the website).
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    storage: secureStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // no URL to inspect inside a native app
    flowType: 'pkce',
  },
});

// Keep access tokens fresh while the app is in the foreground, and pause the
// background refresh timer when the app is backgrounded (documented pattern
// from the supabase-js README for React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
