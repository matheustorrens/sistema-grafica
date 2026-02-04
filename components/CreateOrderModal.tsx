
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

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

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSave }) => {
  const { orderStatuses } = useSettings();
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    description: '',
    totalAmount: '',
    downPayment: '',
    deadline: '',
    status: ''
  });
  const [dateError, setDateError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
        setFormData({
            clientName: '',
            clientPhone: '',
            description: '',
            totalAmount: '',
            downPayment: '',
            deadline: '',
            status: orderStatuses.length > 0 ? orderStatuses[0].label : ''
        });
        setDateError('');
    }
  }, [isOpen, orderStatuses]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({...formData, clientPhone: formatted});
  };

  const handleCurrencyChange = (field: 'totalAmount' | 'downPayment') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Apenas aceita números
    const numbers = value.replace(/\D/g, '');
    if (numbers === '') {
      setFormData({...formData, [field]: ''});
      return;
    }
    const formatted = formatCurrency(numbers);
    setFormData({...formData, [field]: formatted});
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
    
    onSave({
      ...formData,
      clientPhone: formData.clientPhone.replace(/\D/g, ''), // Salva apenas números
      totalAmount: parseCurrency(formData.totalAmount),
      downPayment: parseCurrency(formData.downPayment)
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Descrição</label>
            <input 
              required
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: 1000 Cartões de Visita"
            />
          </div>

          {/* Linha Financeira: Total e Sinal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Valor Total (R$)</label>
              <input 
                required
                type="text" 
                inputMode="numeric"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                value={formData.totalAmount}
                onChange={handleCurrencyChange('totalAmount')}
                placeholder="0,00"
              />
            </div>
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
