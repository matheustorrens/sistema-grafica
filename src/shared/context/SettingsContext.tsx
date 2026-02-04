/**
 * Settings Context
 * Manages application settings including appearance, automation, and user preferences
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Supplier, OrderStatusItem, OrderStatus, KanbanColumn, MaterialStatus, Theme } from '@/shared/types';
import { arrayMove } from '@dnd-kit/sortable';
import { api } from '@/shared/services/api';
import { DEFAULTS, STORAGE_KEYS } from '@/config';

interface SettingsContextType {
  // Appearance
  companyName: string;
  setCompanyName: (name: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  theme: Theme;
  toggleTheme: () => void;
  
  // Automation
  messageTemplate: string;
  setMessageTemplate: (template: string) => void;
  billingMessageTemplate: string;
  setBillingMessageTemplate: (template: string) => void;
  pixKey: string;
  setPixKey: (key: string) => void;
  
  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // Order Statuses
  orderStatuses: OrderStatusItem[];
  addOrderStatus: (label: string, color: string) => void;
  updateOrderStatus: (id: string, updates: Partial<OrderStatusItem>) => void;
  deleteOrderStatus: (id: string) => void;

  // Kanban Columns (Materials)
  materialColumns: KanbanColumn[];
  addMaterialColumn: (column: Omit<KanbanColumn, 'id'>) => void;
  updateMaterialColumn: (id: string, updates: Partial<KanbanColumn>) => void;
  deleteMaterialColumn: (id: string) => void;
  reorderMaterialColumns: (activeId: string, overId: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Initial Statuses
const INITIAL_STATUSES: OrderStatusItem[] = [
  { id: 'ST-1', label: OrderStatus.PENDING_PAYMENT, color: '#f59e0b', isDefault: true },
  { id: 'ST-2', label: OrderStatus.PRODUCTION, color: '#3b82f6', isDefault: true },
  { id: 'ST-3', label: OrderStatus.COMPLETED, color: '#10b981', isDefault: true },
  { id: 'ST-4', label: 'Entregue', color: '#8b5cf6', isDefault: true },
];

// Initial Kanban Columns
const INITIAL_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: MaterialStatus.PENDING, title: 'Pendente', color: '#eab308', enableWhatsApp: true, isDefault: true },
  { id: MaterialStatus.PURCHASED, title: 'Comprado', color: '#3b82f6', enableWhatsApp: false, isDefault: true },
  { id: MaterialStatus.IN_STOCK, title: 'Em Estoque', color: '#10b981', enableWhatsApp: false, isDefault: true },
];

// Helper to adjust hex color brightness
const adjustColor = (hex: string, percent: number) => {
  hex = hex.replace('#', '');
  const num = parseInt(hex, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00FF) + percent;
  let b = (num & 0x0000FF) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
};

const mixWithWhite = (hex: string, amount: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);

  return '#' + ((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1);
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // General Settings
  const [companyName, setCompanyName] = useState(() => 
    localStorage.getItem('companyName') || DEFAULTS.COMPANY_NAME
  );
  const [primaryColor, setPrimaryColor] = useState(() => 
    localStorage.getItem('primaryColor') || DEFAULTS.PRIMARY_COLOR
  );
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('logoUrl') || '');
  const [theme, setTheme] = useState<Theme>(() => 
    (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || 'light'
  );

  // Automation Settings
  const [messageTemplate, setMessageTemplate] = useState(() => 
    localStorage.getItem('messageTemplate') || DEFAULTS.MESSAGE_TEMPLATE
  );
  const [billingMessageTemplate, setBillingMessageTemplate] = useState(() => 
    localStorage.getItem('billingMessageTemplate') || DEFAULTS.BILLING_TEMPLATE
  );
  const [pixKey, setPixKey] = useState(() => localStorage.getItem('pixKey') || '');

  // Supplier Settings
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Status Settings
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusItem[]>(() => {
    const saved = localStorage.getItem('orderStatuses');
    return saved ? JSON.parse(saved) : INITIAL_STATUSES;
  });

  // Kanban Columns Settings
  const [materialColumns, setMaterialColumns] = useState<KanbanColumn[]>(() => {
    const saved = localStorage.getItem('materialColumns');
    return saved ? JSON.parse(saved) : INITIAL_KANBAN_COLUMNS;
  });

  // Load Suppliers on Mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await api.getSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error("Failed to load suppliers", error);
      }
    };
    fetchSuppliers();
  }, []);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('companyName', companyName); }, [companyName]);
  useEffect(() => { localStorage.setItem('logoUrl', logoUrl); }, [logoUrl]);
  useEffect(() => { localStorage.setItem('messageTemplate', messageTemplate); }, [messageTemplate]);
  useEffect(() => { localStorage.setItem('billingMessageTemplate', billingMessageTemplate); }, [billingMessageTemplate]);
  useEffect(() => { localStorage.setItem('pixKey', pixKey); }, [pixKey]);
  useEffect(() => { localStorage.setItem('orderStatuses', JSON.stringify(orderStatuses)); }, [orderStatuses]);
  useEffect(() => { localStorage.setItem('materialColumns', JSON.stringify(materialColumns)); }, [materialColumns]);

  // Theme Logic
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Color Logic
  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
    const root = document.documentElement;
    root.style.setProperty('--primary-600', primaryColor);
    root.style.setProperty('--primary-700', adjustColor(primaryColor, -20));
    root.style.setProperty('--primary-500', adjustColor(primaryColor, 20));
    root.style.setProperty('--primary-100', mixWithWhite(primaryColor, 0.85));
    root.style.setProperty('--primary-50', mixWithWhite(primaryColor, 0.93));
  }, [primaryColor]);

  // Supplier Actions
  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    try {
      const newSupplier = await api.createSupplier(supplierData);
      setSuppliers(prev => [...prev, newSupplier]);
    } catch (error) {
      console.error("Failed to add supplier", error);
    }
  };

  const updateSupplier = async (updatedSupplier: Supplier) => {
    try {
      const result = await api.updateSupplier(updatedSupplier);
      setSuppliers(prev => prev.map(s => s.id === result.id ? result : s));
    } catch (error) {
      console.error("Failed to update supplier", error);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await api.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Failed to delete supplier", error);
    }
  };

  // Status Actions
  const addOrderStatus = (label: string, color: string) => {
    const newStatus: OrderStatusItem = {
      id: `ST-${Date.now()}`,
      label,
      color,
      isDefault: false
    };
    setOrderStatuses(prev => [...prev, newStatus]);
  };

  const updateOrderStatus = (id: string, updates: Partial<OrderStatusItem>) => {
    setOrderStatuses(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteOrderStatus = (id: string) => {
    setOrderStatuses(prev => prev.filter(s => s.id !== id));
  };

  // Kanban Column Actions
  const addMaterialColumn = (column: Omit<KanbanColumn, 'id'>) => {
    const newColumn: KanbanColumn = {
      ...column,
      id: `COL-${Date.now()}`
    };
    setMaterialColumns(prev => [...prev, newColumn]);
  };

  const updateMaterialColumn = (id: string, updates: Partial<KanbanColumn>) => {
    setMaterialColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteMaterialColumn = (id: string) => {
    setMaterialColumns(prev => prev.filter(c => c.id !== id));
  };

  const reorderMaterialColumns = (activeId: string, overId: string) => {
    setMaterialColumns((items) => {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === overId);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  return (
    <SettingsContext.Provider value={{ 
      companyName, setCompanyName, 
      primaryColor, setPrimaryColor, 
      logoUrl, setLogoUrl,
      theme, toggleTheme,
      messageTemplate, setMessageTemplate,
      billingMessageTemplate, setBillingMessageTemplate,
      pixKey, setPixKey,
      suppliers, addSupplier, updateSupplier, deleteSupplier,
      orderStatuses, addOrderStatus, updateOrderStatus, deleteOrderStatus,
      materialColumns, addMaterialColumn, updateMaterialColumn, deleteMaterialColumn, reorderMaterialColumns
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
