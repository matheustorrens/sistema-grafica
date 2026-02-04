/**
 * Application Providers
 * Combines all context providers into a single wrapper
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, SettingsProvider } from '@/shared/context';

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppProviders;
