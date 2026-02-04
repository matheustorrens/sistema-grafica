/**
 * Environment Configuration
 * 
 * This file provides typed access to environment variables
 * and handles different environments: production, staging, demo
 */

export type Environment = 'production' | 'staging' | 'demo' | 'development';

interface EnvironmentConfig {
  // Environment identification
  ENV: Environment;
  IS_PRODUCTION: boolean;
  IS_STAGING: boolean;
  IS_DEMO: boolean;
  IS_DEVELOPMENT: boolean;

  // Supabase configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;

  // App configuration
  APP_NAME: string;
  APP_URL: string;

  // Feature flags
  ENABLE_DEMO_BANNER: boolean;
  ENABLE_ANALYTICS: boolean;
}

/**
 * Get current environment from VITE_ENV or NODE_ENV
 */
const getEnvironment = (): Environment => {
  const env = (import.meta as any).env?.VITE_ENV || 
              (import.meta as any).env?.MODE || 
              'development';
  
  switch (env) {
    case 'production':
      return 'production';
    case 'staging':
    case 'test':
      return 'staging';
    case 'demo':
      return 'demo';
    default:
      return 'development';
  }
};

/**
 * Get environment variable with fallback
 */
const getEnvVar = (key: string, fallback: string = ''): string => {
  return (import.meta as any).env?.[key] || fallback;
};

/**
 * Build the environment configuration object
 */
const buildConfig = (): EnvironmentConfig => {
  const ENV = getEnvironment();

  return {
    // Environment identification
    ENV,
    IS_PRODUCTION: ENV === 'production',
    IS_STAGING: ENV === 'staging',
    IS_DEMO: ENV === 'demo',
    IS_DEVELOPMENT: ENV === 'development',

    // Supabase configuration
    SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL', 'https://placeholder.supabase.co'),
    SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY', 'placeholder'),

    // App configuration
    APP_NAME: getEnvVar('VITE_APP_NAME', 'PrintMasterERP'),
    APP_URL: getEnvVar('VITE_APP_URL', 'http://localhost:3000'),

    // Feature flags
    ENABLE_DEMO_BANNER: ENV === 'demo' || !getEnvVar('VITE_SUPABASE_URL'),
    ENABLE_ANALYTICS: ENV === 'production',
  };
};

// Export the configuration
export const env = buildConfig();

// Export individual checks for convenience
export const { 
  IS_PRODUCTION, 
  IS_STAGING, 
  IS_DEMO, 
  IS_DEVELOPMENT,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} = env;

// Backwards compatibility
export const IS_DEMO_MODE = env.ENABLE_DEMO_BANNER;
