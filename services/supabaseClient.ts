import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Error handling for missing configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase environment variables are missing! ' +
    'Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file.'
  );
}

// Create and export the Supabase client instance
// We use fallback strings to avoid immediate runtime crashes if env vars are missing,
// although requests will fail until properly configured.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);