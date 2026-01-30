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

// Custom fetch implementation with Retry Logic
const fetchWithRetry = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is a server error (500-599), usually indicates maintenance or restart
      // We retry these as well.
      if (!response.ok && response.status >= 500 && response.status < 600) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      // If it's the last attempt, rethrow the error
      if (attempt === MAX_RETRIES) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  // TypeScript fallback (should be unreachable due to throw above)
  throw new Error('Network request failed after retries');
};

// Create and export the Supabase client instance with the custom fetch
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    global: {
      fetch: fetchWithRetry,
    },
  }
);