import React from 'react';
import { Material, MaterialStatus } from '../types';
import { getMaterialStatusColor } from '../services/dataService';
import { ShoppingCart, PackageCheck, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface MaterialsProps {
  materials: Material[];
  onUpdateStatus: (id: string, newStatus: MaterialStatus) => void;
  onAddMaterial: () => void;
}

const KanbanColumn: React.FC<{
    title: string;
    icon: React.ReactNode;
    items: Material[];
    status: MaterialStatus;
    onMove: (id: string, status: MaterialStatus) => void;
    color: string;
}> = ({ title, icon, items, status, onMove, color }) => {
    
    // Helper to determine next/prev status logic
    const getNextStatus = (current: MaterialStatus): MaterialStatus | null => {
        if (current === MaterialStatus.PENDING) return MaterialStatus.PURCHASED;
        if (current === MaterialStatus.PURCHASED) return MaterialStatus.IN_STOCK;
        return null;
    };

    const getPrevStatus = (current: MaterialStatus): MaterialStatus | null => {
        if (current === MaterialStatus.IN_STOCK) return MaterialStatus.PURCHASED;
        if (current === MaterialStatus.PURCHASED) return MaterialStatus.PENDING;
        return null;
    };

    return (
        <div className="flex flex-col h-full bg-slate-100 rounded-xl p-4">
            <div className={`flex items-center gap-2 font-bold mb-4 ${color}`}>
                {icon}
                <span>{title}</span>
                <span className="ml-auto bg-white/50 px-2 py-0.5 rounded text-sm text-slate-600">{items.length}</span>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {items.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                        Vazio
                    </div>
                )}
                {items.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 group hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-slate-800 text-sm leading-snug">{item.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Qtd: <span className="font-semibold text-slate-700">{item.quantity}</span></p>
                        
                        {item.linkedOrderId && (
                             <div className="text-[10px] bg-slate-100 inline-block px-1.5 py-0.5 rounded text-slate-500 mb-2">
                                Pedido #{item.linkedOrderId}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                            {getPrevStatus(status) ? (
                                <button 
                                    onClick={() => onMove(item.id, getPrevStatus(status)!)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                                    title="Voltar"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                </button>
                            ) : <div></div>}
                            
                            {getNextStatus(status) ? (
                                <button 
                                    onClick={() => onMove(item.id, getNextStatus(status)!)}
                                    className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded"
                                    title="Avançar"
                                >
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            ) : <div></div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Materials: React.FC<MaterialsProps> = ({ materials, onUpdateStatus, onAddMaterial }) => {
  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold text-slate-800">Controle de Materiais</h1>
             <button onClick={onAddMaterial} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                 Adicionar Item
             </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
            <KanbanColumn 
                title="Pendente" 
                icon={<AlertCircle className="w-5 h-5"/>} 
                items={materials.filter(m => m.status === MaterialStatus.PENDING)}
                status={MaterialStatus.PENDING}
                onMove={onUpdateStatus}
                color="text-red-600"
            />
            <KanbanColumn 
                title="Comprado" 
                icon={<ShoppingCart className="w-5 h-5"/>} 
                items={materials.filter(m => m.status === MaterialStatus.PURCHASED)}
                status={MaterialStatus.PURCHASED}
                onMove={onUpdateStatus}
                color="text-amber-600"
            />
             <KanbanColumn 
                title="Em Estoque" 
                icon={<PackageCheck className="w-5 h-5"/>} 
                items={materials.filter(m => m.status === MaterialStatus.IN_STOCK)}
                status={MaterialStatus.IN_STOCK}
                onMove={onUpdateStatus}
                color="text-emerald-600"
            />
        </div>
    </div>
  );
};

export default Materials;