/**
 * Supabase Client Configuration
 * 
 * This is the main Supabase client used throughout the application.
 * Configuration is loaded from environment variables.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_DEMO_MODE } from '@/config';
import { API_RETRY_COUNT, API_RETRY_DELAY } from '@/config';

// Re-export for backwards compatibility
export { IS_DEMO_MODE };

/**
 * Custom fetch implementation with retry logic
 * Handles transient network errors and server errors (5xx)
 */
const fetchWithRetry = async (
  url: RequestInfo | URL, 
  options?: RequestInit
): Promise<Response> => {
  for (let attempt = 0; attempt <= API_RETRY_COUNT; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on server errors (500-599)
      if (!response.ok && response.status >= 500 && response.status < 600) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      // If it's the last attempt, rethrow the error
      if (attempt === API_RETRY_COUNT) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY));
    }
  }
  
  // TypeScript fallback (should be unreachable)
  throw new Error('Network request failed after retries');
};

/**
 * Create and export the Supabase client instance
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    global: {
      fetch: fetchWithRetry,
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Get the current user's tenant ID
 * Uses the get_current_tenant_id() function defined in Supabase
 */
export const getCurrentTenantId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('get_current_tenant_id');
    if (error) {
      console.error('Error getting tenant ID:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error getting tenant ID:', error);
    return null;
  }
};

export default supabase;
