import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Plus, Edit2, Trash2, Users, X } from 'lucide-react';
import { Supplier } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const Suppliers: React.FC = () => {
  const { 
      suppliers, addSupplier, updateSupplier, deleteSupplier
  } = useSettings();
  
  // Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', tags: '' });
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  // Supplier Logic
  const openSupplierModal = (supplier?: Supplier) => {
      if (supplier) {
          setEditingSupplier(supplier);
          setSupplierForm({ 
              name: supplier.name, 
              phone: supplier.phone, 
              tags: supplier.tags ? supplier.tags.join(', ') : '' 
          });
      } else {
          setEditingSupplier(null);
          setSupplierForm({ name: '', phone: '', tags: '' });
      }
      setIsSupplierModalOpen(true);
  };

  const saveSupplier = (e: React.FormEvent) => {
      e.preventDefault();
      const tagsArray = supplierForm.tags.split(',').map(t => t.trim()).filter(t => t !== '');
      
      // Basic Phone Clean
      const cleanPhone = supplierForm.phone.replace(/\D/g, '');

      if (editingSupplier) {
          updateSupplier({
              ...editingSupplier,
              name: supplierForm.name,
              phone: cleanPhone,
              tags: tagsArray
          });
      } else {
          addSupplier({
              name: supplierForm.name,
              phone: cleanPhone,
              tags: tagsArray
          });
      }
      setIsSupplierModalOpen(false);
  };

  const handleDeleteSupplierRequest = (id: string) => {
      setSupplierToDelete(id);
  };

  const confirmDeleteSupplier = () => {
      if (supplierToDelete) {
          deleteSupplier(supplierToDelete);
          setSupplierToDelete(null);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Fornecedores</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie sua lista de contatos para compras</p>
          </div>
          <button 
              onClick={() => openSupplierModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
              <Plus size={16} /> Novo Fornecedor
          </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Users className="text-indigo-600 dark:text-indigo-400" size={20} />
                  Lista de Fornecedores
              </h3>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 text-xs uppercase font-semibold">
                          <th className="px-4 py-3 rounded-tl-lg">Nome</th>
                          <th className="px-4 py-3">WhatsApp</th>
                          <th className="px-4 py-3">Tags / Produtos</th>
                          <th className="px-4 py-3 rounded-tr-lg text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-sm">
                      {suppliers.map(supplier => (
                          <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{supplier.name}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-slate-300 font-mono">{supplier.phone}</td>
                              <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                      {supplier.tags?.map((tag, idx) => (
                                          <span key={idx} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-slate-600">
                                              {tag}
                                          </span>
                                      ))}
                                  </div>
                              </td>
                              <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                  <button 
                                      onClick={() => openSupplierModal(supplier)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                  >
                                      <Edit2 size={16} />
                                  </button>
                                  <button 
                                      onClick={() => handleDeleteSupplierRequest(supplier.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {suppliers.length === 0 && (
                          <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                                  Nenhum fornecedor cadastrado.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-scale-up duration-200 border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                      <button onClick={() => setIsSupplierModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                          <X size={20} />
                      </button>
                  </div>
                  <form onSubmit={saveSupplier} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nome da Empresa</label>
                          <input 
                              type="text" required
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              value={supplierForm.name}
                              onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">WhatsApp (DDD + Número)</label>
                          <input 
                              type="text" required
                              placeholder="5511999999999"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              value={supplierForm.phone}
                              onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                          />
                          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Apenas números, com código do país (55).</p>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tags (Separar por vírgula)</label>
                          <input 
                              type="text" 
                              placeholder="Ex: Papel, Tinta, Lona"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              value={supplierForm.tags}
                              onChange={e => setSupplierForm({...supplierForm, tags: e.target.value})}
                          />
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="flex-1 py-2 border dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200">Cancelar</button>
                          <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Salvar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <ConfirmModal 
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={confirmDeleteSupplier}
        title="Excluir Fornecedor"
        description="Tem certeza que deseja remover este fornecedor da sua lista? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
};

export default Suppliers;