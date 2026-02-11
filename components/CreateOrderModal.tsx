
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface OrderItem {
  id: string;
  name: string;
  unitPrice: string;
  quantity: string;
  description: string;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

// Função para formatar telefone brasileiro
const formatPhone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limited = numbers.slice(0, 11);
  
  // Aplica a máscara
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
};

// Função para formatar valor monetário
const formatCurrency = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Converte para número e divide por 100 para ter os centavos
  const amount = parseInt(numbers || '0', 10) / 100;
  
  // Formata como moeda brasileira sem o símbolo
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para converter string formatada para número
const parseCurrency = (value: string): number => {
  // Remove pontos de milhar e troca vírgula por ponto
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// Função para validar data
const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  // Verifica formato YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length !== 3) return false;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Ano atual + 5 anos como limite máximo
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 5;
  
  // Valida ano (2020 até 5 anos no futuro)
  if (year < 2020 || year > maxYear) return false;
  
  // Valida mês
  if (month < 1 || month > 12) return false;
  
  // Valida dia baseado no mês
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  
  return true;
};

// Calcula o ano máximo permitido (atual + 5)
const getMaxYear = (): number => new Date().getFullYear() + 5;

const generateItemId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSave }) => {
  const { orderStatuses } = useSettings();
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    downPayment: '',
    deadline: '',
    status: ''
  });
  const [items, setItems] = useState<OrderItem[]>([{ id: generateItemId(), name: '', unitPrice: '', quantity: '1', description: '' }]);
  const [dateError, setDateError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
        setFormData({
            clientName: '',
            clientPhone: '',
            downPayment: '',
            deadline: '',
            status: orderStatuses.length > 0 ? orderStatuses[0].label : ''
        });
        setItems([{ id: generateItemId(), name: '', unitPrice: '', quantity: '1', description: '' }]);
        setDateError('');
    }
  }, [isOpen, orderStatuses]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({...formData, clientPhone: formatted});
  };

  const handleCurrencyChange = (field: 'downPayment') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = value.replace(/\D/g, '');
    if (numbers === '') {
      setFormData({...formData, [field]: ''});
      return;
    }
    const formatted = formatCurrency(numbers);
    setFormData({...formData, [field]: formatted});
  };

  const handleItemChange = (itemId: string, field: keyof OrderItem, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      if (field === 'unitPrice') {
        const numbers = value.replace(/\D/g, '');
        return { ...item, [field]: numbers ? formatCurrency(numbers) : '' };
      }
      if (field === 'quantity') {
        const numbers = value.replace(/\D/g, '');
        return { ...item, [field]: numbers || '1' };
      }
      return { ...item, [field]: value };
    }));
  };

  const addItem = () => {
    if (items.length < 10) {
      setItems(prev => [...prev, { id: generateItemId(), name: '', unitPrice: '', quantity: '1', description: '' }]);
    }
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const calculateTotal = (): number => {
    return items.reduce((acc, item) => {
      const qty = parseInt(item.quantity, 10) || 1;
      return acc + (parseCurrency(item.unitPrice) * qty);
    }, 0);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({...formData, deadline: value});
    
    if (value && !isValidDate(value)) {
      setDateError('Data inválida');
    } else {
      setDateError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar data antes de enviar
    if (!isValidDate(formData.deadline)) {
      setDateError('Data inválida');
      return;
    }

    // Validar se há pelo menos um item com nome e preço
    const validItems = items.filter(item => item.name.trim() && parseCurrency(item.unitPrice) > 0);
    if (validItems.length === 0) {
      return;
    }

    // Gerar descrição a partir dos itens
    const description = validItems.map(item => item.name).join(' / ');
    
    onSave({
      ...formData,
      clientPhone: formData.clientPhone.replace(/\D/g, ''),
      description,
      totalAmount: calculateTotal(),
      downPayment: parseCurrency(formData.downPayment),
      items: validItems.map(item => ({
        name: item.name,
        description: item.description,
        unitPrice: parseCurrency(item.unitPrice),
        quantity: parseInt(item.quantity, 10) || 1
      }))
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up border border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Novo Pedido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nome do Cliente</label>
            <input 
              required
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              value={formData.clientName}
              onChange={e => setFormData({...formData, clientName: e.target.value})}
              placeholder="Ex: Empresa ABC Ltda"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">WhatsApp / Telefone</label>
            <input 
              type="tel" 
              inputMode="numeric"
              maxLength={15}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              value={formData.clientPhone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* Itens do Pedido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Itens do Pedido</label>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <input 
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                        value={item.name}
                        onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="Nome do item"
                      />
                    </div>
                    <div className="w-16">
                      <input 
                        type="text"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm text-center"
                        value={item.quantity}
                        onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                        placeholder="Qtd"
                        title="Quantidade"
                      />
                    </div>
                    <div className="w-28">
                      <input 
                        type="text"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                        value={item.unitPrice}
                        onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)}
                        placeholder="Valor un."
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                      value={item.description}
                      onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="Descrição do item (opcional)"
                    />
                    {parseInt(item.quantity, 10) > 1 && parseCurrency(item.unitPrice) > 0 && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap">
                        = {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseCurrency(item.unitPrice) * parseInt(item.quantity, 10))}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionar Item */}
            {items.length < 10 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700"></div>
                <button
                  type="button"
                  onClick={addItem}
                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                >
                  <Plus size={16} />
                </button>
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700"></div>
              </div>
            )}

            {/* Total Calculado */}
            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Total do Pedido:</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
                </span>
              </div>
            </div>
          </div>

          {/* Sinal / Entrada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sinal / Entrada (R$)</label>
            <input 
              type="text" 
              inputMode="numeric"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              value={formData.downPayment}
              onChange={handleCurrencyChange('downPayment')}
              placeholder="0,00"
            />
          </div>

          {/* Linha Prazo e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Prazo de Entrega</label>
               <input 
                required
                type="date" 
                min="2020-01-01"
                max={`${getMaxYear()}-12-31`}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white ${
                  dateError ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                }`}
                value={formData.deadline}
                onChange={handleDateChange}
              />
              {dateError && (
                <p className="text-red-500 text-xs mt-1">{dateError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status Inicial</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                {orderStatuses.map(s => (
                  <option key={s.id} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
             >
                Cancelar
             </button>
             <button 
                type="submit" 
                className="flex-1 py-2.5 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
             >
                Criar Pedido
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
