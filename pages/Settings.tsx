import React, { useState, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Save, Upload, Image as ImageIcon, X, Plus, Edit2, Trash2, MessageCircle, Store, Settings as SettingsIcon, CreditCard, Moon, Sun, Bot } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Supplier } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const Settings: React.FC = () => {
  const { 
      companyName, setCompanyName, 
      primaryColor, setPrimaryColor, 
      logoUrl, setLogoUrl,
      theme, toggleTheme,
      suppliers, addSupplier, updateSupplier, deleteSupplier,
      messageTemplate, setMessageTemplate,
      billingMessageTemplate, setBillingMessageTemplate,
      pixKey, setPixKey
  } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'general' | 'automation' | 'suppliers'>('general');
  const [showSuccess, setShowSuccess] = useState(false);

  // General Form Local State
  const [localName, setLocalName] = useState(companyName);
  const [localColor, setLocalColor] = useState(primaryColor);
  const [localLogo, setLocalLogo] = useState(logoUrl);

  // Automation Form Local State
  const [localTemplate, setLocalTemplate] = useState(messageTemplate);
  const [localBillingTemplate, setLocalBillingTemplate] = useState(billingMessageTemplate);
  const [localPixKey, setLocalPixKey] = useState(pixKey);

  // Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', tags: '' });
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  // Dropzone Logic
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setLocalLogo(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop,
      accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.svg'] },
      maxFiles: 1,
      multiple: false
  });

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyName(localName);
    setPrimaryColor(localColor);
    setLogoUrl(localLogo);
    showToast();
  };

  const handleSaveAutomation = (e: React.FormEvent) => {
      e.preventDefault();
      setMessageTemplate(localTemplate);
      setBillingMessageTemplate(localBillingTemplate);
      setPixKey(localPixKey);
      showToast();
  };

  const showToast = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Configurações</h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'general' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
          >
              <SettingsIcon size={16} /> Geral
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'automation' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
          >
              <MessageCircle size={16} /> Automação
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'suppliers' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
          >
              <Store size={16} /> Fornecedores
          </button>
      </div>

      {/* --- GENERAL TAB --- */}
      {activeTab === 'general' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <form onSubmit={handleSaveGeneral} className="p-6 space-y-8">
                
                {/* Company Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Nome da Empresa</label>
                    <input 
                        type="text" 
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 transition-shadow"
                        placeholder="Ex: Minha Gráfica"
                    />
                </div>

                {/* Logo Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Logotipo da Empresa</label>
                    
                    <div className="flex flex-col gap-4">
                        <div 
                            {...getRootProps()} 
                            className={`
                                border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                                ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'}
                            `}
                        >
                            <input {...getInputProps()} />
                            
                            {localLogo ? (
                                <div className="relative group">
                                    <img 
                                        src={localLogo} 
                                        alt="Preview" 
                                        className="max-h-32 object-contain rounded-md shadow-sm" 
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center text-white text-xs font-medium">
                                        Trocar Imagem
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full mb-3 text-indigo-600 dark:text-indigo-400">
                                        <Upload size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Clique para enviar ou arraste e solte</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">PNG, JPG ou SVG (máx. 2MB)</p>
                                </>
                            )}
                        </div>

                        {localLogo && (
                            <div className="flex justify-end">
                                <button 
                                    type="button" 
                                    onClick={() => setLocalLogo('')}
                                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <X size={16} /> Remover Logo
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Primary Color */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Cor do Tema</label>
                    <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900/50">
                        <input 
                            type="color" 
                            value={localColor}
                            onChange={(e) => setLocalColor(e.target.value)}
                            className="h-12 w-16 p-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded cursor-pointer shadow-sm"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Cor Principal</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400 font-mono uppercase">{localColor}</span>
                        </div>
                        <div 
                            className="ml-auto px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors"
                            style={{ backgroundColor: localColor }}
                        >
                            Visualizar Botão
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <div>{showSuccess && <SuccessMessage />}</div>
                    <button 
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-md active:scale-95 duration-150"
                    >
                        <Save size={18} />
                        Salvar Geral
                    </button>
                </div>
            </form>
          </div>
      )}

      {/* --- AUTOMATION TAB --- */}
      {activeTab === 'automation' && (
          <div className="space-y-6">
              
              {/* PIX Key Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <CreditCard className="text-indigo-600 dark:text-indigo-400" size={20} />
                      Dados Financeiros (PIX)
                  </h3>
                  <div className="max-w-md">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Chave PIX da Loja</label>
                      <input 
                          type="text" 
                          value={localPixKey}
                          onChange={(e) => setLocalPixKey(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                          placeholder="Ex: CNPJ, Email ou Telefone"
                      />
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                          Essa chave será usada automaticamente nas mensagens de cobrança.
                      </p>
                  </div>
              </div>

              {/* Message Template Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <MessageCircle className="text-indigo-600 dark:text-indigo-400" size={20} />
                      Modelos de Mensagem
                  </h3>
                  
                  <div className="space-y-6">
                      {/* Supplier Template */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Mensagem de Compra (Fornecedor)</label>
                          <textarea 
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-slate-900"
                              value={localTemplate}
                              onChange={(e) => setLocalTemplate(e.target.value)}
                          />
                          <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                              <strong>Variáveis:</strong> <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{`{fornecedor}`}</code>, <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{`{material}`}</code>
                          </p>
                      </div>

                      <div className="border-t border-gray-100 dark:border-slate-700 pt-4"></div>

                      {/* Billing Template */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Mensagem de Cobrança (Cliente)</label>
                          <textarea 
                              rows={5}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-slate-900"
                              value={localBillingTemplate}
                              onChange={(e) => setLocalBillingTemplate(e.target.value)}
                          />
                          <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                              <strong>Variáveis:</strong> <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{`{cliente}`}</code>, <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{`{pedido}`}</code>, <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{`{valor}`}</code>, <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{`{pix}`}</code>
                          </p>
                      </div>
                  </div>
              </div>

              {/* Save Automation Button */}
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                   <div>{showSuccess && <SuccessMessage />}</div>
                   <button 
                      onClick={handleSaveAutomation}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
                   >
                       Salvar Automações
                   </button>
              </div>
          </div>
      )}

      {/* --- SUPPLIERS TAB --- */}
      {activeTab === 'suppliers' && (
          <div className="space-y-6">
              {/* Suppliers List Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          <Store className="text-indigo-600 dark:text-indigo-400" size={20} />
                          Gestão de Fornecedores
                      </h3>
                      <button 
                          onClick={() => openSupplierModal()}
                          className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                          <Plus size={16} /> Novo Fornecedor
                      </button>
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
          </div>
      )}

      {/* Supplier Modal with Animation and Backdrop Blur */}
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

const SuccessMessage = () => (
    <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1 animate-in fade-in">
        <span className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </span> 
        Salvo com sucesso!
    </span>
);

export default Settings;