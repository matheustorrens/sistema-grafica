/**
 * Layout Component
 * Main application layout with sidebar navigation
 */

import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Settings as SettingsIcon, 
  Store, 
  MessageCircle, 
  Users, 
  LogOut,
  FileText
} from 'lucide-react';
import { useSettings } from '@/shared/context/SettingsContext';
import { useAuth } from '@/shared/context/AuthContext';
import { signOut, IS_DEMO_MODE } from '@/shared/services/supabase';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { companyName, logoUrl } = useSettings();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const isFullWidthPage = location.pathname === '/materials';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/signin', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 overflow-hidden flex-col">
      {/* Demo Banner */}
      {IS_DEMO_MODE && (
        <div className="bg-amber-500 text-white text-xs font-bold py-1 px-4 text-center shadow-md flex items-center justify-center gap-2 z-50">
          <Store size={14} className="fill-white text-amber-500" />
          🧪 MODO DEMO - Os dados são salvos apenas neste navegador (LocalStorage)
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col border-r border-slate-800">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            {logoUrl ? (
              <div className="bg-white rounded-md p-1 h-10 w-auto min-w-[40px] flex items-center justify-center overflow-hidden">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-full w-auto object-contain max-w-[150px]" 
                />
              </div>
            ) : (
              <div className="bg-indigo-600 p-2 rounded-lg flex-shrink-0">
                <Store size={24} className="text-white" />
              </div>
            )}
            <h1 className="text-lg font-bold tracking-tight truncate leading-tight text-white" title={companyName}>
              {companyName}
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            <NavLink to="/" end className={navLinkClass}>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
            <NavLink to="/orders" className={navLinkClass}>
              <ShoppingCart size={20} />
              Pedidos
            </NavLink>
            <NavLink to="/quotes" className={navLinkClass}>
              <FileText size={20} />
              Orçamentos
            </NavLink>
            <NavLink to="/materials" className={navLinkClass}>
              <Package size={20} />
              Materiais
            </NavLink>

            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Gestão
              </p>
              
              <NavLink to="/automation" className={navLinkClass}>
                <MessageCircle size={20} />
                Automação
              </NavLink>

              <NavLink to="/suppliers" className={navLinkClass}>
                <Users size={20} />
                Fornecedores
              </NavLink>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-slate-800 text-white ring-1 ring-slate-700' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <SettingsIcon size={20} />
              Configurações
            </NavLink>

            {/* User Info & Logout */}
            <div className="pt-2 border-t border-slate-800 mt-2">
              {user && (
                <div className="px-4 py-2 mb-2">
                  <p className="text-xs text-slate-500 truncate" title={user.email || ''}>
                    {user.email}
                  </p>
                </div>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full disabled:opacity-50"
              >
                <LogOut size={20} />
                {loggingOut ? 'Saindo...' : 'Sair'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain bg-white rounded-sm" />
              ) : (
                <Store size={20} />
              )}
              <span className="font-bold truncate">{companyName}</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className={isFullWidthPage ? 'h-full' : 'max-w-7xl mx-auto'}>
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
