import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { KanbanColumn } from '../types';

interface CreateColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string, color: string, enableWhatsApp: boolean }) => void;
  initialData?: KanbanColumn;
}

const COLORS = [
  '#eab308', // Yellow
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#ec4899', // Pink
  '#06b6d4'  // Cyan
];

const CreateColumnModal: React.FC<CreateColumnModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [enableWhatsApp, setEnableWhatsApp] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setTitle(initialData.title);
            setSelectedColor(initialData.color);
            setEnableWhatsApp(initialData.enableWhatsApp);
        } else {
            // Reset for creation
            setTitle('');
            setSelectedColor(COLORS[0]);
            setEnableWhatsApp(false);
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, color: selectedColor, enableWhatsApp });
    
    // Only reset if creating, if editing we keep state until closed or updated
    if (!initialData) {
        setTitle('');
        setSelectedColor(COLORS[0]);
        setEnableWhatsApp(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {initialData ? 'Editar Coluna' : 'Nova Coluna'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Column Name */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-white mb-1">Nome da Coluna *</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Em Análise"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Cor da Coluna</label>
            <div className="flex flex-wrap gap-3">
                {COLORS.map(color => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110 shadow-sm' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                    >
                        {selectedColor === color && <Check size={18} className="text-white/90 drop-shadow-sm" />}
                    </button>
                ))}
            </div>
          </div>

          {/* Contact Supplier Toggle */}
          <div className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
             <div>
                 <h4 className="font-bold text-gray-800 dark:text-white text-sm">Contatar Fornecedor?</h4>
                 <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-[200px]">Cards nesta coluna terão botão de contato via WhatsApp</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={enableWhatsApp}
                    onChange={(e) => setEnableWhatsApp(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
             </label>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
             <span className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Pré-visualização:</span>
             <div className="w-full h-2 rounded-full mb-2 opacity-80" style={{ backgroundColor: selectedColor }}></div>
             <h4 className="font-bold text-lg text-slate-800 dark:text-white">
                 {title || 'Nome da Coluna'}
             </h4>
          </div>

          <div className="flex gap-3 pt-2">
             <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
             >
                Cancelar
             </button>
             <button 
                type="submit" 
                className="flex-1 py-2.5 bg-slate-900 dark:bg-indigo-600 rounded-lg text-white font-medium hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-sm"
             >
                {initialData ? 'Salvar Alterações' : 'Criar'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateColumnModal;