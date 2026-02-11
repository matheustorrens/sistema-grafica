/**
 * Application Routes
 * Centralized route definitions with lazy loading
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, Layout } from '@/shared/components';

// Auth pages (lazy loaded)
const SignIn = lazy(() => import('@/features/auth/pages/SignIn'));
const SignUp = lazy(() => import('@/features/auth/pages/SignUp'));
const ForgotPassword = lazy(() => import('@/features/auth/pages/ForgotPassword'));

// Main pages (lazy loaded) - Importing from old location during migration
// These use relative paths from src/app/ to the old pages/ folder at root
const Dashboard = lazy(() => import('../../pages/Dashboard'));
const Orders = lazy(() => import('../../pages/Orders'));
const OrderDetails = lazy(() => import('../../pages/OrderDetails'));
const Materials = lazy(() => import('../../pages/Materials'));
const Suppliers = lazy(() => import('../../pages/Suppliers'));
const Settings = lazy(() => import('../../pages/Settings'));
const Automation = lazy(() => import('../../pages/Automation'));
const Quotes = lazy(() => import('../../pages/Quotes'));

// Loading spinner component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      <p className="text-slate-400 text-sm">Carregando...</p>
    </div>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth Routes (Public) */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Orders */}
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetails />} />

          {/* Quotes */}
          <Route path="quotes" element={<Quotes />} />

          {/* Materials */}
          <Route path="materials" element={<Materials />} />

          {/* Suppliers */}
          <Route path="suppliers" element={<Suppliers />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />

          {/* Automation */}
          <Route path="automation" element={<Automation />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
