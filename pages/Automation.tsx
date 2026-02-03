
import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { CreditCard, MessageCircle, Save } from 'lucide-react';

const Automation: React.FC = () => {
  const { 
      messageTemplate, setMessageTemplate,
      billingMessageTemplate, setBillingMessageTemplate,
      pixKey, setPixKey
  } = useSettings();
  
  const [showSuccess, setShowSuccess] = useState(false);

  // Automation Form Local State
  const [localTemplate, setLocalTemplate] = useState(messageTemplate);
  const [localBillingTemplate, setLocalBillingTemplate] = useState(billingMessageTemplate);
  const [localPixKey, setLocalPixKey] = useState(pixKey);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Automação</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Configure mensagens automáticas e dados financeiros</p>
          </div>
      </div>

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
                  Modelos de Mensagem (WhatsApp)
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
               >
                   <Save size={18} />
                   Salvar Automações
               </button>
          </div>
      </div>
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

export default Automation;
