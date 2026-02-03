import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const getColors = () => {
      switch(variant) {
          case 'danger': return { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', btn: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600' };
          case 'warning': return { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', btn: 'bg-amber-600 hover:bg-amber-700' };
          default: return { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700' };
      }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up border border-gray-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
            <div className={`w-14 h-14 ${colors.bg} rounded-full flex items-center justify-center mb-5 mx-auto transition-transform hover:scale-110 duration-300`}>
                <AlertTriangle className={colors.text} size={28} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2 tracking-tight">{title}</h3>
            <p className="text-gray-500 dark:text-slate-400 text-center text-sm leading-relaxed mb-8 px-2">
                {description}
            </p>

            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                >
                    {cancelText}
                </button>
                <button 
                    onClick={() => { onConfirm(); onClose(); }}
                    className={`flex-1 py-3 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95 duration-200 text-sm ${colors.btn}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;