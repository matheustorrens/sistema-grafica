/**
 * Main App Component
 * Entry point for the application
 */

import React from 'react';
import AppProviders from './providers';
import AppRoutes from './routes';
import { env, IS_DEMO_MODE } from '@/config';

const App: React.FC = () => {
  // Log environment info in development
  if (env.IS_DEVELOPMENT) {
    console.log('🚀 PrintMasterERP');
    console.log(`📌 Environment: ${env.ENV}`);
    console.log(`🎭 Demo Mode: ${IS_DEMO_MODE ? 'Yes' : 'No'}`);
  }

  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
