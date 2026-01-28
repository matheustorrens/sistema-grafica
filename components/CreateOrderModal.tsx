import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSave }) => {
  const { orderStatuses } = useSettings();
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    description: '',
    totalAmount: '',
    deadline: '',
    status: ''
  });

  // Set default status when modal opens or statuses load
  useEffect(() => {
    if (orderStatuses.length > 0 && !formData.status) {
        setFormData(prev => ({ ...prev, status: orderStatuses[0].label }));
    }
  }, [orderStatuses, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      totalAmount: parseFloat(formData.totalAmount) || 0
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
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              value={formData.clientPhone}
              onChange={e => setFormData({...formData, clientPhone: e.target.value})}
              placeholder="Ex: 11999999999"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Valor Total (R$)</label>
              <input 
                required
                type="number" 
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                value={formData.totalAmount}
                onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                placeholder="0,00"
              />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Prazo de Entrega</label>
               <input 
                required
                type="date" 
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                value={formData.deadline}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
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