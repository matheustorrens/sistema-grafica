import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Materials from './pages/Materials';
import Settings from './pages/Settings';
import Automation from './pages/Automation';
import Suppliers from './pages/Suppliers';
import { SettingsProvider } from './context/SettingsContext';

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </SettingsProvider>
  );
};

export default App;