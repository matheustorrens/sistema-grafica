import React, { useState } from 'react';
import { X, Pencil, Trash2, Plus, GripVertical } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { OrderStatusItem } from '../types';

interface ManageStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageStatusModal: React.FC<ManageStatusModalProps> = ({ isOpen, onClose }) => {
  const { orderStatuses, addOrderStatus, updateOrderStatus, deleteOrderStatus } = useSettings();
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#fbbf24');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
      if (!newStatusName.trim()) return;
      addOrderStatus(newStatusName, newStatusColor);
      setNewStatusName('');
  };

  const startEdit = (status: OrderStatusItem) => {
      setEditingId(status.id);
      setEditName(status.label);
  };

  const saveEdit = (id: string) => {
      updateOrderStatus(id, { label: editName });
      setEditingId(null);
  };

  const handleColorChange = (id: string, color: string) => {
      updateOrderStatus(id, { color });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-scale-up overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Status de Pedidos</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crie, edite ou remova status.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <X size={20} />
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/50 dark:bg-slate-900/50">
            {orderStatuses.map(status => (
                <div key={status.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm flex items-center gap-3 group">
                     {/* Color Indicator */}
                     <div className="relative">
                         <input 
                            type="color" 
                            value={status.color}
                            onChange={(e) => handleColorChange(status.id, e.target.value)}
                            className="w-8 h-8 rounded-full overflow-hidden border-none p-0 cursor-pointer absolute opacity-0"
                         />
                         <div 
                            className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: status.color }}
                         ></div>
                     </div>

                     {/* Name */}
                     <div className="flex-1">
                         {editingId === status.id ? (
                             <input 
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => saveEdit(status.id)}
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(status.id)}
                                className="w-full px-2 py-1 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                                autoFocus
                             />
                         ) : (
                             <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">{status.label}</span>
                         )}
                     </div>

                     {/* Actions */}
                     <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => startEdit(status)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                         >
                             <Pencil size={14} />
                         </button>
                         <button 
                            onClick={() => deleteOrderStatus(status.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                         >
                             <Trash2 size={14} />
                         </button>
                     </div>
                </div>
            ))}
        </div>

        {/* Footer (Add New) */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Adicionar novo status</h4>
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <input 
                        type="text"
                        placeholder="Nome do status"
                        value={newStatusName}
                        onChange={(e) => setNewStatusName(e.target.value)}
                        className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                </div>
                <div className="relative">
                     <div 
                        className="w-full h-full min-w-[100px] bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg flex items-center gap-2 px-2 cursor-pointer"
                        onClick={() => document.getElementById('newStatusColor')?.click()}
                     >
                         <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: newStatusColor }}></div>
                         <span className="text-xs text-gray-600 dark:text-slate-400">Cor</span>
                     </div>
                     <input 
                        id="newStatusColor"
                        type="color"
                        value={newStatusColor}
                        onChange={(e) => setNewStatusColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                </div>
                <button 
                    onClick={handleAdd}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                    <Plus size={16} />
                    Adicionar
                </button>
            </div>
            <div className="mt-4 flex justify-end">
                <button 
                    onClick={onClose}
                    className="bg-slate-900 dark:bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                >
                    Fechar
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStatusModal;