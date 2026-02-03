
import React, { useEffect, useState, useRef } from 'react';
import { Material, KanbanColumn, Supplier, MaterialStatus } from '../types';
import { api } from '../services/api';
import { Plus, GripVertical, Trash2, Columns, MessageCircle, X, MoreHorizontal, Pencil, GripHorizontal, Box } from 'lucide-react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult,
  DraggableProvided,
  DroppableProvided
} from '@hello-pangea/dnd';

import MaterialModal from '../components/CreateMaterialModal';
import CreateColumnModal from '../components/CreateColumnModal';
import ConfirmModal from '../components/ConfirmModal'; 
import { useSettings } from '../context/SettingsContext';

// --- UI Components for Material Card ---

const MaterialCard: React.FC<{ 
    material: Material; 
    onEdit?: (m: Material) => void;
    onDelete?: (id: string) => void;
    showWhatsApp?: boolean;
    onContactSupplier?: (m: Material) => void;
    provided: DraggableProvided;
    isDragging: boolean;
}> = ({ material, onEdit, onDelete, showWhatsApp, onContactSupplier, provided, isDragging }) => {
    
    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onContactSupplier) {
            onContactSupplier(material);
        }
    };

    return (
        <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`
                relative flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden 
                transition-all duration-200 group mb-3
                ${isDragging ? 'shadow-xl scale-105 rotate-2 ring-2 ring-indigo-500/20 z-50' : 'hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md'}
            `}
            style={provided.draggableProps.style}
        >
            <div className="flex items-stretch">
                 {/* 1. DRAG HANDLE ZONE */}
                <div 
                    className="w-10 bg-gray-50 dark:bg-slate-700/50 border-r border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Arraste por aqui"
                >
                    <GripVertical size={20} />
                </div>

                {/* 2. CONTENT ZONE */}
                <div 
                    className="flex-1 p-3 min-w-0 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-slate-700/30 transition-colors flex flex-col justify-center select-none"
                    onDoubleClick={() => onEdit && onEdit(material)}
                    title="Dê dois cliques para editar"
                >
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate leading-tight mb-1" title={material.name}>
                            {material.name}
                        </h4>
                    </div>
                    
                    <div className="flex flex-col gap-1 mt-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded border border-gray-200 dark:border-slate-600">
                             <span className="font-semibold text-indigo-600 dark:text-indigo-400">Necessária: {material.quantity} {material.unit}</span>
                             <span className="mx-1 text-gray-400">|</span>
                             <span>Atual: {material.currentQuantity || 0} {material.unit}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-500 text-right">
                            Est: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(material.estimatedCost)}
                        </span>
                    </div>
                </div>

                {/* 3. ACTION ZONE - Botão Excluir */}
                {!isDragging && onDelete && (
                    <div className="flex flex-col items-center justify-center pr-1 pl-1 border-l border-gray-50 dark:border-slate-700 bg-gray-50/10 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()} 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                onDelete(material.id);
                            }}
                            className="p-1.5 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* 4. WHATSAPP BUTTON (CONDITIONAL) */}
            {showWhatsApp && !isDragging && (
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs font-medium transition-colors"
                >
                    <MessageCircle size={14} />
                    Contatar Fornecedor
                </button>
            )}
        </div>
    );
};

const Materials: React.FC = () => {
  const { 
      materialColumns, 
      addMaterialColumn, 
      updateMaterialColumn, 
      deleteMaterialColumn, 
      reorderMaterialColumns,
      suppliers, 
      messageTemplate 
  } = useSettings();
  
  const [materials, setMaterials] = useState<Material[]>([]);
  
  // Modals
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  
  // Delete Confirmation States
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);

  // WhatsApp Modal State
  const [supplierModalData, setSupplierModalData] = useState<{material: Material, suppliers: Supplier[]} | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | undefined>(undefined);
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
     // Click outside to close menus
     const handleClickOutside = () => setOpenMenuId(null);
     document.addEventListener('click', handleClickOutside);
     return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchMaterials = () => {
      api.getMaterials().then(setMaterials);
  };

  const getMaterialsByColumn = (columnId: string) => {
      return materials.filter(m => m.status === columnId);
  };

  // --- Drag & Drop Logic ---

  const handleDragEnd = async (result: DropResult) => {
      const { source, destination, type } = result;

      if (!destination) return;

      // 1. Handle Column Reordering
      if (type === 'COLUMN') {
          if (source.index !== destination.index) {
              const activeId = materialColumns[source.index].id;
              const overId = materialColumns[destination.index].id;
              reorderMaterialColumns(activeId, overId);
          }
          return;
      }

      // 2. Handle Material Card Movement
      const sourceColumnId = source.droppableId;
      const destColumnId = destination.droppableId;
      
      // If moving within same column
      if (sourceColumnId === destColumnId) {
          return; 
      }

      // Moving to different column
      const movedMaterialId = result.draggableId;
      
      // Optimistic UI Update
      setMaterials(prev => prev.map(m => 
          m.id === movedMaterialId ? { ...m, status: destColumnId } : m
      ));

      try {
          await api.updateMaterialStatus(movedMaterialId, destColumnId as MaterialStatus);
      } catch (error) {
          console.error("Failed to update status", error);
          fetchMaterials(); // Revert on error
      }
  };


  // --- CRUD Handlers ---

  const handleOpenCreateMaterial = () => {
      setEditingMaterial(null);
      setIsMaterialModalOpen(true);
  }

  const handleOpenEditMaterial = (material: Material) => {
      setEditingMaterial(material);
      setIsMaterialModalOpen(true);
  }

  const handleSaveMaterial = async (data: any) => {
      try {
          if (editingMaterial) {
              await api.updateMaterial(data);
          } else {
              if (!data.status && materialColumns.length > 0) {
                  data.status = materialColumns[0].id;
              }
              await api.createMaterial(data);
          }
          setIsMaterialModalOpen(false);
          fetchMaterials();
      } catch (error) {
          console.error("Error saving material", error);
      }
  };

  const handleDeleteMaterialRequest = (id: string) => {
      setMaterialToDelete(id);
  }

  const confirmDeleteMaterial = async () => {
      if (!materialToDelete) return;
      try {
          setMaterials(prev => prev.filter(m => m.id !== materialToDelete));
          setIsMaterialModalOpen(false); // Close edit modal if open
          await api.deleteMaterial(materialToDelete);
      } catch (error) {
          console.error("Error deleting material", error);
          fetchMaterials();
      } finally {
          setMaterialToDelete(null);
      }
  }

  // --- Column Handlers ---

  const handleOpenCreateColumn = () => {
      setEditingColumn(undefined);
      setIsColumnModalOpen(true);
  };

  const handleOpenEditColumn = (column: KanbanColumn) => {
      setEditingColumn(column);
      setIsColumnModalOpen(true);
  };

  const handleSaveColumn = (data: { title: string, color: string, enableWhatsApp: boolean }) => {
      if (editingColumn) {
          updateMaterialColumn(editingColumn.id, data);
      } else {
          addMaterialColumn(data);
      }
      setIsColumnModalOpen(false);
  };

  const handleDeleteColumnRequest = (id: string) => {
      setColumnToDelete(id);
  };

  const handleConfirmDeleteColumn = () => {
      if (columnToDelete) {
          deleteMaterialColumn(columnToDelete);
          setColumnToDelete(null);
      }
  };

  // --- WhatsApp Logic ---
  const handleContactSupplier = (material: Material) => {
      const linkedSuppliers = suppliers.filter(s => material.supplierIds?.includes(s.id));
      
      if (linkedSuppliers.length === 0) {
          alert('Nenhum fornecedor vinculado a este item. Edite o material para adicionar fornecedores.');
          return;
      }

      if (linkedSuppliers.length === 1) {
          openWhatsApp(linkedSuppliers[0], material);
      } else {
          setSupplierModalData({ material, suppliers: linkedSuppliers });
          setShowSupplierModal(true);
      }
  };

  const openWhatsApp = (supplier: Supplier, material: Material) => {
      let message = messageTemplate || "Olá {fornecedor}, preciso repor o estoque de *{material}*. Tem disponível?";
      message = message.replace(/{fornecedor}/g, supplier.name);
      message = message.replace(/{material}/g, material.name);
      
      const phone = supplier.phone.replace(/\D/g, '');
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setShowSupplierModal(false);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 flex-shrink-0">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Materiais</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seu estoque de produção</p>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={handleOpenCreateColumn}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
                <Columns size={16} />
                Nova Coluna
            </button>
            <button 
                onClick={handleOpenCreateMaterial}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
            >
                <Plus size={16} />
                Novo Material
            </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden -mx-6 lg:-mx-8 px-6 lg:px-8 custom-scrollbar pb-2">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                {(provided: DroppableProvided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex gap-6 h-full items-start"
                        style={{ minWidth: 'max-content' }}
                    >
                        {materialColumns.map((column, index) => {
                            const columnMaterials = getMaterialsByColumn(column.id);

                            return (
                                <Draggable key={column.id} draggableId={column.id} index={index}>
                                    {(columnProvided: DraggableProvided, columnSnapshot) => (
                                        <div
                                            ref={columnProvided.innerRef}
                                            {...columnProvided.draggableProps}
                                            className={`
                                                flex flex-col h-full w-[320px] bg-gray-50/50 dark:bg-slate-900/50 rounded-xl border border-gray-200/60 dark:border-slate-700/60 transition-all duration-200
                                                ${columnSnapshot.isDragging ? 'rotate-1 opacity-90 shadow-2xl z-50 ring-2 ring-indigo-500 bg-white dark:bg-slate-800' : ''}
                                            `}
                                        >
                                            {/* Column Header */}
                                            <div 
                                                {...columnProvided.dragHandleProps}
                                                className="flex-shrink-0 p-3 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-xl group cursor-grab active:cursor-grabbing"
                                                style={{ borderTop: `3px solid ${column.color}` }}
                                            >
                                                <div className="text-gray-300 dark:text-slate-600 group-hover:text-gray-400 dark:group-hover:text-slate-500 transition-colors">
                                                    <GripHorizontal size={18} />
                                                </div>

                                                <h3 className="font-bold text-gray-800 dark:text-white text-base truncate flex-1">{column.title}</h3>

                                                <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {columnMaterials.length}
                                                </span>

                                                {/* Column Menu */}
                                                <div className="relative">
                                                    <button 
                                                        onPointerDown={(e) => e.stopPropagation()} 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(openMenuId === column.id ? null : column.id);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                                                    >
                                                         <MoreHorizontal size={18} />
                                                    </button>
                                                    {openMenuId === column.id && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-lg rounded-lg z-20 w-32 py-1 animate-in fade-in zoom-in-95 duration-100">
                                                            <button 
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                onClick={() => { setOpenMenuId(null); handleOpenEditColumn(column); }}
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                            >
                                                                <Pencil size={14} /> Editar
                                                            </button>
                                                            <button 
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                onClick={() => { setOpenMenuId(null); handleDeleteColumnRequest(column.id); }}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                            >
                                                                <Trash2 size={14} /> Excluir
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Drop Zone for Materials - FLEX 1 TO FILL HEIGHT */}
                                            <Droppable droppableId={column.id} type="CARD">
                                                {(droppableProvided: DroppableProvided, snapshot) => (
                                                    <div 
                                                        ref={droppableProvided.innerRef}
                                                        {...droppableProvided.droppableProps}
                                                        className={`
                                                            flex-1 min-h-0 overflow-y-auto p-3 custom-scrollbar transition-colors duration-200
                                                            ${snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}
                                                        `}
                                                    >
                                                        {columnMaterials.map((material, mIndex) => (
                                                            <Draggable key={material.id} draggableId={material.id} index={mIndex}>
                                                                {(draggableProvided: DraggableProvided, draggableSnapshot) => (
                                                                    <MaterialCard 
                                                                        material={material} 
                                                                        provided={draggableProvided}
                                                                        isDragging={draggableSnapshot.isDragging}
                                                                        onEdit={handleOpenEditMaterial}
                                                                        onDelete={handleDeleteMaterialRequest}
                                                                        showWhatsApp={column.enableWhatsApp}
                                                                        onContactSupplier={handleContactSupplier}
                                                                    />
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {droppableProvided.placeholder}
                                                        
                                                        {columnMaterials.length === 0 && !snapshot.isDraggingOver && (
                                                            <div className="flex flex-col items-center justify-center py-10 text-gray-300 dark:text-slate-600 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-lg">
                                                                <Box className="h-6 w-6 mx-auto mb-2 opacity-40" />
                                                                <p className="text-xs font-medium">Vazio</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
          </DragDropContext>
      </div>

      {/* Material Modal */}
      <MaterialModal 
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSave={handleSaveMaterial}
        onDelete={handleDeleteMaterialRequest}
        initialData={editingMaterial}
      />

      {/* Create/Edit Column Modal */}
      <CreateColumnModal 
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onSave={handleSaveColumn}
        initialData={editingColumn}
      />

      {/* Confirmation Modal for Column Deletion */}
      <ConfirmModal 
        isOpen={!!columnToDelete}
        onClose={() => setColumnToDelete(null)}
        onConfirm={handleConfirmDeleteColumn}
        title="Excluir Coluna"
        description="Tem certeza que deseja excluir esta coluna? Os materiais nela contidos não serão apagados, mas ficarão ocultos até serem movidos."
        confirmText="Excluir Coluna"
        variant="danger"
      />

      {/* Confirmation Modal for Material Deletion */}
      <ConfirmModal 
        isOpen={!!materialToDelete}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={confirmDeleteMaterial}
        title="Excluir Material"
        description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />

      {/* Supplier Selection Modal */}
      {showSupplierModal && supplierModalData && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100 dark:border-slate-700">
                  <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
                      <h3 className="font-bold text-gray-800 dark:text-white">Selecione o Fornecedor</h3>
                      <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-4">
                      <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
                          Quem você deseja contatar para <strong>{supplierModalData.material.name}</strong>?
                      </p>
                      <div className="space-y-2">
                          {supplierModalData.suppliers.map(supplier => (
                              <button
                                  key={supplier.id}
                                  onClick={() => openWhatsApp(supplier, supplierModalData.material)}
                                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
                              >
                                  <span className="font-medium text-gray-700 dark:text-slate-200 group-hover:text-green-700 dark:group-hover:text-green-400">{supplier.name}</span>
                                  <MessageCircle size={18} className="text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Materials;
