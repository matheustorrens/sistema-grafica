
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Settings, Download, Eye, Upload, X, Save, Pencil } from 'lucide-react';
import { api } from '../services/api';
import { Order, OrderItem } from '../types';

// Função para formatar valor monetário
const formatCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const amount = parseInt(numbers || '0', 10) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para converter string formatada para número
const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/\.'/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// Função para formatar telefone brasileiro
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 11);
  
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
};

interface QuoteItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  description: string;
}

interface QuoteSettings {
  logoUrl: string;
  phone: string;
  address: string;
  defaultDeliveryTime: string;
}

const generateItemId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const Quotes: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  
  // Settings State
  const [settings, setSettings] = useState<QuoteSettings>({
    logoUrl: '',
    phone: '',
    address: '',
    defaultDeliveryTime: '5 dias úteis'
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState<string>('');
  const settingsFileInputRef = useRef<HTMLInputElement>(null);
  const quoteLogoInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isEditingDefaultDelivery, setIsEditingDefaultDelivery] = useState(false);
  const [tempDefaultDelivery, setTempDefaultDelivery] = useState('');
  
  // Quote State
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [observations, setObservations] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [quoteLogoUrl, setQuoteLogoUrl] = useState('');
  
  // UI State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState('1');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Load settings from localStorage or Supabase
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Load order items if orderId is present
  useEffect(() => {
    if (orderId) {
      loadOrderItems(orderId);
    } else {
      setLoading(false);
    }
  }, [orderId]);
  
  // Apply default settings when loaded
  useEffect(() => {
    if (settings.logoUrl && !quoteLogoUrl) {
      setQuoteLogoUrl(settings.logoUrl);
    }
  }, [settings]);
  
  const loadSettings = async () => {
    try {
      // Try to load from localStorage first
      const savedSettings = localStorage.getItem('quoteSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setSettingsLogoPreview(parsed.logoUrl || '');
      }
    } catch (error) {
      console.error('Error loading quote settings:', error);
    }
  };
  
  const saveSettings = () => {
    const newSettings = {
      ...settings,
      logoUrl: settingsLogoPreview
    };
    localStorage.setItem('quoteSettings', JSON.stringify(newSettings));
    setSettings(newSettings);
    setQuoteLogoUrl(settingsLogoPreview);
    setIsSettingsOpen(false);
  };
  
  const loadOrderItems = async (id: string) => {
    try {
      const order = await api.getOrderById(id);
      if (order) {
        setClientName(order.clientName);
        if (order.items && order.items.length > 0) {
          setItems(order.items.map(item => ({
            id: generateItemId(),
            name: item.name || item.description,
            unitPrice: item.unitPrice,
            quantity: item.quantity || 1,
            description: item.description || ''
          })));
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleQuoteLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };
  
  const processLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setQuoteLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };
  
  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };
  
  const handleLogoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
  };
  
  const saveDefaultDeliveryTime = () => {
    const newSettings = { ...settings, defaultDeliveryTime: tempDefaultDelivery };
    localStorage.setItem('quoteSettings', JSON.stringify(newSettings));
    setSettings(newSettings);
    setIsEditingDefaultDelivery(false);
  };
  
  const addItem = () => {
    if (!newItemName.trim() || !newItemPrice) return;
    
    setItems(prev => [...prev, {
      id: generateItemId(),
      name: newItemName.trim(),
      unitPrice: parseCurrency(newItemPrice),
      quantity: parseInt(newItemQuantity, 10) || 1,
      description: newItemDescription.trim()
    }]);
    
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity('1');
    setNewItemDescription('');
    setIsAddingItem(false);
  };
  
  const updateItem = () => {
    if (!editingItemId || !editItemName.trim() || !editItemPrice) return;
    
    setItems(prev => prev.map(item => 
      item.id === editingItemId 
        ? { ...item, name: editItemName.trim(), unitPrice: parseCurrency(editItemPrice), quantity: parseInt(editItemQuantity, 10) || 1, description: editItemDescription.trim() }
        : item
    ));
    
    setEditingItemId(null);
  };
  
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };
  
  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.unitPrice * (item.quantity || 1)), 0);
  };
  
  const generatePDF = () => {
    // Create a printable HTML and trigger print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const today = new Date().toLocaleDateString('pt-BR');
    const total = calculateTotal();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orçamento - ${clientName || 'Cliente'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
          .logo { max-width: 200px; max-height: 80px; object-fit: contain; }
          .company-info { text-align: right; font-size: 12px; color: #666; }
          .company-info p { margin: 4px 0; }
          .title { text-align: center; font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 30px; }
          .client-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
          .client-info h3 { font-size: 14px; color: #666; margin-bottom: 5px; }
          .client-info p { font-size: 18px; font-weight: bold; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { background: #4F46E5; color: white; padding: 12px; text-align: left; font-size: 14px; }
          .items-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          .items-table .description { color: #666; font-size: 12px; }
          .items-table .price { text-align: right; font-weight: bold; }
          .total-row { background: #f8f9fa; }
          .total-row td { font-weight: bold; font-size: 16px; }
          .observations { background: #fffbeb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b; }
          .observations h4 { font-size: 14px; color: #92400e; margin-bottom: 8px; }
          .observations p { font-size: 13px; color: #78350f; white-space: pre-wrap; }
          .delivery { text-align: center; padding: 15px; background: #ecfdf5; border-radius: 8px; }
          .delivery span { font-weight: bold; color: #059669; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          @media print {
            body { padding: 20px; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${quoteLogoUrl ? `<img src="${quoteLogoUrl}" class="logo" alt="Logo" />` : '<div></div>'}
          <div class="company-info">
            ${settings.phone ? `<p>📞 ${settings.phone}</p>` : ''}
            ${settings.address ? `<p>📍 ${settings.address}</p>` : ''}
            <p>📅 ${today}</p>
          </div>
        </div>
        
        <h1 class="title">ORÇAMENTO</h1>
        
        ${clientName ? `
        <div class="client-info">
          <h3>CLIENTE</h3>
          <p>${clientName}</p>
        </div>
        ` : ''}
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%">Item</th>
              <th style="width: 15%; text-align: center;">Qtd</th>
              <th style="width: 35%; text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>
                  <strong>${item.name}</strong>
                  ${item.description ? `<div class="description">${item.description}</div>` : ''}
                </td>
                <td style="text-align: center;">${item.quantity || 1}</td>
                <td class="price">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice * (item.quantity || 1))}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td class="price">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</td>
            </tr>
          </tbody>
        </table>
        
        ${observations ? `
        <div class="observations">
          <h4>📋 OBSERVAÇÕES</h4>
          <p>${observations}</p>
        </div>
        ` : ''}
        
        ${deliveryTime ? `
        <div class="delivery">
          Prazo de entrega: <span>${deliveryTime}</span>
        </div>
        ` : ''}
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="text-purple-600 dark:text-purple-400" size={28} />
            Orçamentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Crie e exporte orçamentos para seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Settings size={18} />
            Configurações
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Logo Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Logo do Orçamento</h3>
            {quoteLogoUrl ? (
              <div className="flex items-center gap-4">
                <img src={quoteLogoUrl} alt="Logo" className="h-16 w-auto object-contain bg-gray-50 dark:bg-slate-900 rounded-lg p-2" />
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => quoteLogoInputRef.current?.click()}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Trocar logo
                  </button>
                  <button 
                    onClick={() => setQuoteLogoUrl('')}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => quoteLogoInputRef.current?.click()}
                onDrop={handleLogoDrop}
                onDragOver={handleLogoDragOver}
                onDragLeave={handleLogoDragLeave}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDraggingLogo 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                }`}
              >
                <Upload size={32} className={`mx-auto mb-2 ${isDraggingLogo ? 'text-purple-500' : 'text-gray-400 dark:text-slate-500'}`} />
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {isDraggingLogo ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PNG, JPG ou SVG</p>
              </div>
            )}
            <input
              ref={quoteLogoInputRef}
              type="file"
              accept="image/*"
              onChange={handleQuoteLogoUpload}
              className="hidden"
            />
          </div>
          
          {/* Client Name */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
            <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Nome do Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
              placeholder="Ex: Empresa ABC"
            />
          </div>
          
          {/* Items */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Itens do Orçamento</h3>
              {!isAddingItem && (
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              )}
            </div>
            
            {/* Add Item Form */}
            {isAddingItem && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do item"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm"
                      autoFocus
                    />
                    <div className="w-16">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm text-center"
                      />
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={newItemPrice}
                        onChange={(e) => {
                          const numbers = e.target.value.replace(/\D/g, '');
                          if (numbers === '') { setNewItemPrice(''); return; }
                          setNewItemPrice(formatCurrency(numbers));
                        }}
                        className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm"
                  />
                  {parseInt(newItemQuantity, 10) > 1 && parseCurrency(newItemPrice) > 0 && (
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Subtotal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseCurrency(newItemPrice) * parseInt(newItemQuantity, 10))}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={addItem} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium text-sm">
                      Salvar
                    </button>
                    <button onClick={() => { setIsAddingItem(false); setNewItemName(''); setNewItemPrice(''); setNewItemQuantity('1'); setNewItemDescription(''); }} className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-300 rounded-lg text-sm">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Items List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                  <p className="text-gray-400 dark:text-slate-500 text-sm italic">Nenhum item adicionado.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                    {editingItemId === item.id ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                            autoFocus
                          />
                          <div className="w-16">
                            <input
                              type="number"
                              min="1"
                              value={editItemQuantity}
                              onChange={(e) => setEditItemQuantity(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-center"
                              placeholder="Qtd"
                            />
                          </div>
                          <div className="w-28 relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editItemPrice}
                              onChange={(e) => {
                                const numbers = e.target.value.replace(/\D/g, '');
                                if (numbers === '') { setEditItemPrice(''); return; }
                                setEditItemPrice(formatCurrency(numbers));
                              }}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editItemDescription}
                          onChange={(e) => setEditItemDescription(e.target.value)}
                          placeholder="Descrição (opcional)"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                        />
                        {parseInt(editItemQuantity, 10) > 1 && parseCurrency(editItemPrice) > 0 && (
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            Subtotal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseCurrency(editItemPrice) * parseInt(editItemQuantity, 10))}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button onClick={updateItem} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded-lg text-sm">Salvar</button>
                          <button onClick={() => setEditingItemId(null)} className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-500 rounded-lg text-sm">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</p>
                            {(item.quantity || 1) > 1 && (
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                                x{item.quantity}
                              </span>
                            )}
                          </div>
                          {item.description && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{item.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice * (item.quantity || 1))}
                          </span>
                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditItemName(item.name);
                              setEditItemPrice(item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                              setEditItemQuantity(String(item.quantity || 1));
                              setEditItemDescription(item.description);
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Total */}
            {items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total:</span>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
                </span>
              </div>
            )}
          </div>
          
          {/* Observations */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
            <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Observações</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
              placeholder="Observações adicionais..."
            />
          </div>
          
          {/* Delivery Time */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prazo de Entrega</label>
              <div className="group relative">
                <button
                  onClick={() => {
                    setTempDefaultDelivery(settings.defaultDeliveryTime);
                    setIsEditingDefaultDelivery(true);
                  }}
                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Editar prazo padrão"
                >
                  <Pencil size={14} />
                </button>
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                  Editar padrão
                </span>
              </div>
            </div>
            
            {isEditingDefaultDelivery ? (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <label className="block text-xs font-medium text-purple-700 dark:text-purple-400 mb-2">Novo prazo padrão:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempDefaultDelivery}
                    onChange={(e) => setTempDefaultDelivery(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white text-sm"
                    placeholder="Ex: 5 dias úteis"
                    autoFocus
                  />
                  <button
                    onClick={saveDefaultDeliveryTime}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => setIsEditingDefaultDelivery(false)}
                    className="px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-500 rounded-lg text-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                placeholder={settings.defaultDeliveryTime ? `Padrão: ${settings.defaultDeliveryTime}` : 'Ex: 5 dias úteis'}
              />
            )}
          </div>
        </div>
        
        {/* Right: Preview & Actions */}
        <div className="space-y-6">
          {/* Preview Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pré-visualização</h3>
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <Eye size={16} />
                Expandir
              </button>
            </div>
            
            {/* Mini Preview */}
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700 space-y-3 text-xs">
              {quoteLogoUrl && (
                <img src={quoteLogoUrl} alt="Logo" className="h-8 object-contain" />
              )}
              <div className="text-center font-bold text-purple-600 dark:text-purple-400">ORÇAMENTO</div>
              {clientName && <p className="font-medium text-gray-700 dark:text-gray-300">{clientName}</p>}
              {items.length > 0 && (
                <div className="space-y-1">
                  {items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span className="truncate mr-2">{item.name} {(item.quantity || 1) > 1 ? `(x${item.quantity})` : ''}</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice * (item.quantity || 1))}</span>
                    </div>
                  ))}
                  {items.length > 3 && <p className="text-gray-400 italic">+{items.length - 3} itens...</p>}
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-600 flex justify-between font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={generatePDF}
                disabled={items.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-all"
              >
                <Download size={20} />
                Gerar PDF / Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurações Padrão</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Logo Padrão</label>
                {settingsLogoPreview ? (
                  <div className="flex items-center gap-4">
                    <img src={settingsLogoPreview} alt="Logo" className="h-16 w-auto object-contain bg-gray-50 dark:bg-slate-900 rounded-lg p-2" />
                    <button onClick={() => setSettingsLogoPreview('')} className="text-sm text-red-600 hover:text-red-700">Remover</button>
                  </div>
                ) : (
                  <button
                    onClick={() => settingsFileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-lg hover:border-purple-400 transition-colors flex flex-col items-center gap-2 text-gray-400"
                  >
                    <Upload size={24} />
                    <span className="text-sm">Clique para enviar logo</span>
                  </button>
                )}
                <input
                  ref={settingsFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Seu Telefone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              {/* Address */}
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Endereço</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
                  placeholder="Rua Exemplo, 123 - Cidade/UF"
                />
              </div>
              
              {/* Default Delivery Time */}
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Prazo de Entrega Padrão</label>
                <input
                  type="text"
                  value={settings.defaultDeliveryTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultDeliveryTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                  placeholder="5 dias úteis"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex gap-3">
              <button
                onClick={saveSettings}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar Configurações
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Full Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pré-visualização do Orçamento</h2>
              <button onClick={() => setIsPreviewOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-purple-600">
                {quoteLogoUrl ? (
                  <img src={quoteLogoUrl} alt="Logo" className="h-16 object-contain" />
                ) : (
                  <div></div>
                )}
                <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                  {settings.phone && <p>📞 {settings.phone}</p>}
                  {settings.address && <p>📍 {settings.address}</p>}
                  <p>📅 {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400 text-center mb-6">ORÇAMENTO</h1>
              
              {clientName && (
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">CLIENTE</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{clientName}</p>
                </div>
              )}
              
              {/* Items Table */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="bg-purple-600 text-white">
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-slate-700">
                      <td className="p-3">
                        <strong className="text-gray-900 dark:text-white">{item.name}</strong>
                        {item.description && <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>}
                      </td>
                      <td className="p-3 text-center text-gray-900 dark:text-white">
                        {item.quantity || 1}
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice * (item.quantity || 1))}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-slate-900 font-bold">
                    <td colSpan={2} className="p-3 text-gray-900 dark:text-white">TOTAL</td>
                    <td className="p-3 text-right text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {/* Observations */}
              {observations && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4 border-l-4 border-amber-500">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-1">📋 OBSERVAÇÕES</p>
                  <p className="text-sm text-amber-900 dark:text-amber-300 whitespace-pre-wrap">{observations}</p>
                </div>
              )}
              
              {/* Delivery */}
              {deliveryTime && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg text-center">
                  <p className="text-emerald-800 dark:text-emerald-400">Prazo de entrega: <strong>{deliveryTime}</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;
