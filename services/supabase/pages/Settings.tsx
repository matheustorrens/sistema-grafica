import React, { useState, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Save, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const Settings: React.FC = () => {
  const { 
      companyName, setCompanyName, 
      primaryColor, setPrimaryColor, 
      logoUrl, setLogoUrl,
  } = useSettings();
  
  const [showSuccess, setShowSuccess] = useState(false);

  // General Form Local State
  const [localName, setLocalName] = useState(companyName);
  const [localColor, setLocalColor] = useState(primaryColor);
  const [localLogo, setLocalLogo] = useState(logoUrl);

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

  const showToast = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Configurações Gerais</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Personalize a aparência do sistema</p>
          </div>
      </div>

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
                    Salvar Alterações
                </button>
            </div>
        </form>
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

export default Settings;