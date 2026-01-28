import React, { useState, useEffect } from 'react';
import { X, Trash2, Store } from 'lucide-react';
import { Material, MaterialStatus, Supplier } from '../types';
import { useSettings } from '../context/SettingsContext';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  initialData?: Material | null;
}

const MaterialModal: React.FC<MaterialModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const { suppliers, materialColumns } = useSettings(); // Get materialColumns from context
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    estimatedCost: '',
    status: '', // Initialize as empty string
    supplierIds: [] as string[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        quantity: initialData.quantity,
        estimatedCost: initialData.estimatedCost.toString(),
        status: initialData.status,
        supplierIds: initialData.supplierIds || []
      });
    } else {
      // Default to the first column available
      const defaultStatus = materialColumns.length > 0 ? materialColumns[0].id : '';
      setFormData({
        name: '',
        quantity: '',
        estimatedCost: '',
        status: defaultStatus,
        supplierIds: []
      });
    }
  }, [initialData, isOpen, materialColumns]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure status is set (fallback to first column if empty)
    let finalStatus = formData.status;
    if (!finalStatus && materialColumns.length > 0) {
        finalStatus = materialColumns[0].id;
    }

    onSave({
      ...formData,
      status: finalStatus,
      estimatedCost: parseFloat(formData.estimatedCost) || 0,
      id: initialData?.id // Pass ID back if editing
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.preventDefault(); 
      e.stopPropagation();

      if (initialData && onDelete) {
          onDelete(initialData.id);
      }
  }

  const toggleSupplier = (supplierId: string) => {
      setFormData(prev => {
          const ids = prev.supplierIds.includes(supplierId)
              ? prev.supplierIds.filter(id => id !== supplierId)
              : [...prev.supplierIds, supplierId];
          return { ...prev, supplierIds: ids };
      });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {initialData ? 'Editar Material' : 'Novo Material'}
          </h2>
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nome do Item</label>
            <input 
              required
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Papel Couchê 300g"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Quantidade Necessária</label>
            <input 
              required
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              placeholder="Ex: 500 folhas, 2 Litros"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Custo Estimado (R$)</label>
             <input 
               type="number" 
               step="0.01"
               min="0"
               className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
               value={formData.estimatedCost}
               onChange={e => setFormData({...formData, estimatedCost: e.target.value})}
               placeholder="0,00"
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Coluna</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              {materialColumns.map(col => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
          </div>

          {/* Supplier Selection */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Store size={16} className="text-gray-500 dark:text-slate-400"/>
                Fornecedores
            </label>
            <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50 dark:bg-slate-900">
                {suppliers.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">
                        Nenhum fornecedor cadastrado. Vá em Configurações.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {suppliers.map(supplier => (
                            <label key={supplier.id} className="flex items-center gap-3 p-2 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
                                <input 
                                    type="checkbox"
                                    checked={formData.supplierIds.includes(supplier.id)}
                                    onChange={() => toggleSupplier(supplier.id)}
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-slate-300">{supplier.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Selecione quem vende este item.</p>
          </div>

          <div className="pt-4 flex gap-3 flex-shrink-0">
             {initialData && onDelete && (
                 <button 
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center cursor-pointer"
                    title="Excluir Material"
                 >
                     <Trash2 size={20} />
                 </button>
             )}
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
                {initialData ? 'Salvar Alterações' : 'Criar Material'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialModal;