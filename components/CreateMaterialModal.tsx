
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

const UNITS = [
    'un', 'folhas', 'resmas', 'caixa', 'pacote', 
    'ml', 'litros', 'galão', 
    'mm', 'cm', 'metros', 'rolo', 
    'g', 'kg', 'ton'
];

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
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// Função para validar unidade (apenas letras e alguns caracteres)
const formatUnit = (value: string): string => {
  // Remove números, permite apenas letras, espaços e alguns caracteres especiais
  return value.replace(/[0-9]/g, '').slice(0, 20);
};

// Função para formatar quantidade (apenas números e ponto/vírgula decimal)
const formatQuantity = (value: string): string => {
  // Remove tudo exceto números, ponto e vírgula
  let cleaned = value.replace(/[^\d.,]/g, '');
  // Substitui vírgula por ponto
  cleaned = cleaned.replace(',', '.');
  // Remove pontos extras (mantém apenas o primeiro)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

const MaterialModal: React.FC<MaterialModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const { suppliers, materialColumns } = useSettings(); 
  const [formData, setFormData] = useState({
    name: '',
    quantity: '', // Required quantity (number as string for input)
    currentQuantity: '', // Current Stock (number as string for input)
    unit: '', // Unit of measurement
    estimatedCost: '',
    status: '', 
    supplierIds: [] as string[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        quantity: initialData.quantity.toString(),
        currentQuantity: (initialData.currentQuantity || 0).toString(),
        unit: initialData.unit || 'un',
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
        currentQuantity: '',
        unit: '',
        estimatedCost: '',
        status: defaultStatus,
        supplierIds: []
      });
    }
  }, [initialData, isOpen, materialColumns]);

  if (!isOpen) return null;

  const handleQuantityChange = (field: 'quantity' | 'currentQuantity') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatQuantity(e.target.value);
    setFormData({...formData, [field]: formatted});
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUnit(e.target.value);
    setFormData({...formData, unit: formatted});
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = value.replace(/\D/g, '');
    if (numbers === '') {
      setFormData({...formData, estimatedCost: ''});
      return;
    }
    const formatted = formatCurrency(numbers);
    setFormData({...formData, estimatedCost: formatted});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalStatus = formData.status;
    if (!finalStatus && materialColumns.length > 0) {
        finalStatus = materialColumns[0].id;
    }

    onSave({
      ...formData,
      quantity: parseFloat(formData.quantity.replace(',', '.')) || 0,
      currentQuantity: parseFloat(formData.currentQuantity.replace(',', '.')) || 0,
      status: finalStatus,
      estimatedCost: parseCurrency(formData.estimatedCost),
      id: initialData?.id 
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
          {/* 1. Nome do Item */}
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

          <div className="grid grid-cols-2 gap-4">
              {/* 2. Quantidade Necessária */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Qtd. Necessária</label>
                <input 
                  required
                  type="text"
                  inputMode="decimal"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                  value={formData.quantity}
                  onChange={handleQuantityChange('quantity')}
                  placeholder="Ex: 500"
                />
              </div>

               {/* 3. Quantidade Atual */}
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Qtd. Atual</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                  value={formData.currentQuantity}
                  onChange={handleQuantityChange('currentQuantity')}
                  placeholder="Ex: 120"
                />
              </div>
          </div>

          {/* 4. Unidade de Medida */}
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Unidade de Medida</label>
             <div className="relative">
                 <input 
                   type="text" 
                   list="units-list"
                   maxLength={20}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                   value={formData.unit}
                   onChange={handleUnitChange}
                   placeholder="Ex: folhas, litros, rolo"
                 />
                 <datalist id="units-list">
                     {UNITS.map(u => <option key={u} value={u} />)}
                 </datalist>
             </div>
          </div>

          {/* 5. Custo Estimado */}
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Custo Estimado (R$)</label>
             <input 
               type="text" 
               inputMode="numeric"
               className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
               value={formData.estimatedCost}
               onChange={handleCostChange}
               placeholder="0,00"
             />
          </div>

          {/* 6. Coluna */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Coluna do Kanban</label>
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

          {/* 7. Fornecedores */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Store size={16} className="text-gray-500 dark:text-slate-400"/>
                Fornecedores Vinculados
            </label>
            <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50 dark:bg-slate-900 custom-scrollbar">
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
            <p className="text-xs text-gray-400 mt-1">Selecione quem vende este item para facilitar o contato.</p>
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
