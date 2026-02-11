
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Order, OrderNote, OrderAttachment, OrderItem } from '../types';
import { api } from '../services/api';
import { ArrowLeft, Calendar, FileText, CreditCard, PlusCircle, Check, Pencil, MessageCircle, StickyNote, Clock, Trash2, Phone, Upload, Image as ImageIcon, Film, File as FileIcon, Download, Paperclip, Music, FileSpreadsheet, FileArchive, FileCode, Square, CheckSquare, X, Package, Plus } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useDropzone } from 'react-dropzone';

// Função utilitária para formatar data brasileira sem problemas de timezone
const formatDateBR = (dateString: string | null | undefined, long: boolean = false): string => {
  if (!dateString) return 'Não definido';
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return 'Data inválida';
  
  if (long) {
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
  }
  return `${day}/${month}/${year}`;
};

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

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Payment State
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentExceedsMax, setPaymentExceedsMax] = useState(false);

  // Inline Editing State
  const [editingField, setEditingField] = useState<'name' | 'phone' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notes State
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Attachments State
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  // Payment Delete State
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  
  // Items State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState('1');
  const [editItemDescription, setEditItemDescription] = useState('');
  
  // Preview Hover State
  const [hoveredAttachment, setHoveredAttachment] = useState<OrderAttachment | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (id) {
      api.getOrderById(id).then(setOrder).finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
      if (editingField && inputRef.current) {
          inputRef.current.focus();
      }
  }, [editingField]);

  // --- Helpers ---
  const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, fileType: string) => {
      const type = fileType.toLowerCase();
      const name = fileName.toLowerCase();

      // Images
      if (type.startsWith('image/')) {
          return <ImageIcon size={20} className="text-purple-600" />;
      }
      
      // Videos
      if (type.startsWith('video/')) {
          return <Film size={20} className="text-rose-600" />;
      }
      
      // Audio
      if (type.startsWith('audio/')) {
          return <Music size={20} className="text-pink-500" />;
      }
      
      // PDF
      if (type.includes('pdf')) {
          return <FileText size={20} className="text-orange-500" />;
      }
      
      // Spreadsheets (Excel, CSV, Numbers)
      if (type.includes('spreadsheet') || type.includes('excel') || name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.ods')) {
          return <FileSpreadsheet size={20} className="text-emerald-600" />;
      }
      
      // Archives (Zip, Rar, 7z, Tar)
      if (type.includes('zip') || type.includes('compressed') || type.includes('tar') || name.endsWith('.rar') || name.endsWith('.7z') || name.endsWith('.gz')) {
          return <FileArchive size={20} className="text-amber-500" />;
      }

      // Code/Web (HTML, CSS, JS, JSON)
      if (type.includes('json') || type.includes('javascript') || type.includes('html') || type.includes('css') || type.includes('xml')) {
          return <FileCode size={20} className="text-slate-600" />;
      }

      // Default File
      return <FileIcon size={20} className="text-blue-500" />;
  };

  const isPreviewable = (fileType: string) => {
      return fileType.startsWith('image/') || fileType.startsWith('video/');
  };

  // --- Actions ---

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const amount = parseCurrency(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    // Validar valor máximo
    const totalPaidSoFar = order.payments.reduce((acc, p) => acc + p.amount, 0);
    const remainingAmount = order.totalAmount - totalPaidSoFar;
    if (amount > remainingAmount + 0.01) {
      return; // O aviso já está visível abaixo do campo
    }

    try {
      const updatedOrder = await api.addPayment(order.id, {
        date: new Date().toISOString().split('T')[0],
        amount,
        note: paymentNote
      });
      setOrder(updatedOrder);
      setIsAddingPayment(false);
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentExceedsMax(false);
    } catch (error) {
      console.error("Error adding payment", error);
    }
  };

  const handleDeletePayment = async () => {
    if (!order || !paymentToDelete) return;
    
    try {
      const updatedOrder = await api.deletePayment(order.id, paymentToDelete);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Error deleting payment", error);
    } finally {
      setPaymentToDelete(null);
    }
  };

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Inline Editing Logic ---

  const startEditing = (field: 'name' | 'phone', value: string) => {
      setEditingField(field);
      setTempValue(value || '');
  };

  const saveClientData = async () => {
      if (!order || !editingField) return;

      const updatedOrder = { ...order };
      if (editingField === 'name') updatedOrder.clientName = tempValue;
      if (editingField === 'phone') updatedOrder.clientPhone = tempValue;

      try {
          await api.updateOrder(updatedOrder);
          setOrder(updatedOrder);
          showToast('Dados do cliente atualizados!');
      } catch (error) {
          console.error("Failed to update client data", error);
      } finally {
          setEditingField(null);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveClientData();
      if (e.key === 'Escape') setEditingField(null);
  };

  const openWhatsApp = () => {
      if (!order?.clientPhone) return;
      const phone = order.clientPhone.replace(/\D/g, '');
      if (!phone) {
          showToast('Telefone inválido');
          return;
      }
      window.open(`https://wa.me/${phone}`, '_blank');
  };

  // --- Internal Notes Logic ---

  const handleAddNote = async () => {
      if (!order || !newNote.trim()) return;

      const newNoteObj: OrderNote = {
          id: `NOTE-${Date.now()}`,
          content: newNote,
          createdAt: new Date().toISOString()
      };

      const updatedOrder = {
          ...order,
          notes: [...(order.notes || []), newNoteObj]
      };

      try {
          await api.updateOrder(updatedOrder);
          setOrder(updatedOrder);
          setNewNote('');
      } catch (error) {
          console.error("Failed to add note", error);
      }
  };

  const handleDeleteNoteRequest = (noteId: string) => {
      setNoteToDelete(noteId);
  }

  const confirmDeleteNote = async () => {
      if (!order || !noteToDelete) return;
      const updatedNotes = order.notes?.filter(n => n.id !== noteToDelete) || [];
      const updatedOrder = { ...order, notes: updatedNotes };
      
      try {
          await api.updateOrder(updatedOrder);
          setOrder(updatedOrder);
      } catch (error) {
          console.error("Failed to delete note", error);
      } finally {
          setNoteToDelete(null);
      }
  };

  const startEditingNote = (note: OrderNote) => {
      setEditingNoteId(note.id);
      setEditingNoteContent(note.content);
  };

  const saveEditedNote = async () => {
      if (!order || !editingNoteId) return;
      
      const updatedNotes = order.notes?.map(n => 
          n.id === editingNoteId ? { ...n, content: editingNoteContent } : n
      ) || [];

      const updatedOrder = { ...order, notes: updatedNotes };
      
      try {
          await api.updateOrder(updatedOrder);
          setOrder(updatedOrder);
          setEditingNoteId(null);
          setEditingNoteContent('');
      } catch (error) {
           console.error("Failed to update note", error);
      }
  };

  // --- Attachments Logic ---

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (!order || acceptedFiles.length === 0) return;

      const newAttachments: OrderAttachment[] = [];

      for (const file of acceptedFiles) {
          const reader = new FileReader();
          
          const filePromise = new Promise<OrderAttachment>((resolve) => {
              reader.onload = () => {
                  resolve({
                      id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      fileName: file.name,
                      fileType: file.type,
                      fileSize: file.size,
                      fileUrl: reader.result as string,
                      createdAt: new Date().toISOString()
                  });
              };
              reader.readAsDataURL(file);
          });

          newAttachments.push(await filePromise);
      }

      const updatedOrder = {
          ...order,
          attachments: [...(order.attachments || []), ...newAttachments]
      };

      try {
          await api.updateOrder(updatedOrder);
          setOrder(updatedOrder);
          showToast(`${newAttachments.length} arquivo(s) anexado(s)!`);
      } catch (error) {
          console.error("Failed to upload attachments", error);
      }
  }, [order]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Single Delete
  const handleDeleteAttachmentRequest = (attId: string) => {
      setAttachmentToDelete(attId);
  }

  const confirmDeleteAttachment = async () => {
      if (!order || !attachmentToDelete) return;
      
      const updatedAttachments = order.attachments?.filter(a => a.id !== attachmentToDelete) || [];
      const updatedOrder = { ...order, attachments: updatedAttachments };

      try {
          await api.updateOrder(updatedOrder);
          setOrder(updatedOrder);
          // If deleted item was selected, unselect it
          if (selectedAttachments.has(attachmentToDelete)) {
              const newSelected = new Set(selectedAttachments);
              newSelected.delete(attachmentToDelete);
              setSelectedAttachments(newSelected);
          }
      } catch (error) {
          console.error("Failed to delete attachment", error);
      } finally {
          setAttachmentToDelete(null);
      }
  };

  // Bulk Delete
  const toggleSelection = (id: string) => {
      const newSelected = new Set(selectedAttachments);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          newSelected.add(id);
      }
      setSelectedAttachments(newSelected);
  };

  const toggleSelectAll = () => {
      if (!order?.attachments) return;
      
      if (selectedAttachments.size === order.attachments.length) {
          setSelectedAttachments(new Set());
      } else {
          const allIds = new Set(order.attachments.map(a => a.id));
          setSelectedAttachments(allIds);
      }
  };

  const handleBulkDeleteRequest = () => {
      setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
      if (!order) return;
      
      const updatedAttachments = order.attachments?.filter(a => !selectedAttachments.has(a.id)) || [];
      const updatedOrder = { ...order, attachments: updatedAttachments };

      try {
          await api.updateOrder(updatedOrder);
          setOrder(updatedOrder);
          setSelectedAttachments(new Set());
      } catch (error) {
           console.error("Failed to bulk delete", error);
      } finally {
          setIsBulkDeleteModalOpen(false);
      }
  };

  // Hover Preview Handlers
  const handleMouseEnter = (e: React.MouseEvent, att: OrderAttachment) => {
      if (isPreviewable(att.fileType)) {
          setHoveredAttachment(att);
          setCursorPos({ x: e.clientX, y: e.clientY });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (hoveredAttachment) {
          setCursorPos({ x: e.clientX, y: e.clientY });
      }
  };

  const handleMouseLeave = () => {
      setHoveredAttachment(null);
  };


  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Carregando detalhes...</div>;
  if (!order) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Pedido não encontrado.</div>;

  const totalPaid = order.payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = order.totalAmount - totalPaid;
  const progressPercent = Math.min(100, (totalPaid / order.totalAmount) * 100);

  // Logic to display order ID or sequential number
  const orderDisplayId = order.orderNumber 
      ? order.orderNumber.toString().padStart(4, '0') 
      : order.id.substring(0, 8).toUpperCase();

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto pb-10">
      
      {/* Media Preview Portal/Tooltip */}
      {hoveredAttachment && (
          <div 
              className="fixed z-[100] pointer-events-none rounded-xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-700 bg-black animate-in fade-in zoom-in-95 duration-200"
              style={{
                  top: Math.min(window.innerHeight - 350, Math.max(20, cursorPos.y - 100)), // prevent going off screen vertically
                  left: cursorPos.x + 20, // Offset to right of cursor
                  width: '200px',
                  aspectRatio: '9/16'
              }}
          >
              {hoveredAttachment.fileType.startsWith('image/') ? (
                  <img 
                      src={hoveredAttachment.fileUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                  />
              ) : (
                  <video 
                      src={hoveredAttachment.fileUrl}
                      autoPlay 
                      muted 
                      loop 
                      className="w-full h-full object-cover"
                  />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-white text-xs truncate">
                  {hoveredAttachment.fileName}
              </div>
          </div>
      )}

      {/* Toast */}
      {toastMessage && (
          <div className="fixed top-4 right-4 bg-gray-800 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 text-sm font-medium flex items-center gap-2">
              <Check size={16} className="text-green-400" />
              {toastMessage}
          </div>
      )}

      <button 
        onClick={() => navigate('/orders')} 
        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para lista
      </button>

      {/* Header Card Redesigned */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          
          {/* Left Side: Order & Client Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Pedido #{orderDisplayId}
                </h1>
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-bold border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-wide">
                    {order.status}
                </span>
            </div>
            
            <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cliente</span>
                <div className="flex items-center gap-2 group min-h-[40px]">
                    {editingField === 'name' ? (
                        <input 
                            ref={inputRef}
                            type="text"
                            className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-indigo-500 outline-none px-1 bg-gray-50 dark:bg-slate-700 w-full max-w-md"
                            value={tempValue}
                            onChange={e => setTempValue(e.target.value)}
                            onBlur={saveClientData}
                            onKeyDown={handleKeyDown}
                        />
                    ) : (
                        <div 
                            onClick={() => startEditing('name', order.clientName)}
                            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 px-2 py-1 rounded-lg -ml-2 transition-all"
                        >
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{order.clientName}</p>
                            <Pencil size={18} className="text-gray-300 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>
            </div>
          </div>
          
          {/* Right Side: CONTACT HUB (Prominent) */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[280px]">
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-slate-700 flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Phone size={10} /> Telefone
                    </span>
                    <button 
                        onClick={() => startEditing('phone', order.clientPhone || '')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                        Editar
                    </button>
                </div>
                
                {editingField === 'phone' ? (
                     <input 
                        ref={inputRef}
                        type="text"
                        className="text-lg font-bold text-gray-800 dark:text-white border-b border-indigo-500 outline-none w-full bg-white dark:bg-slate-800 px-1"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={saveClientData}
                        onKeyDown={handleKeyDown}
                        placeholder="Ex: 551199999999"
                    />
                ) : (
                    <p className="text-lg font-bold text-gray-800 dark:text-white tracking-tighter">
                        {order.clientPhone || 'Não cadastrado'}
                    </p>
                )}
              </div>

              {order.clientPhone && (
                  <button 
                      onClick={openWhatsApp}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 font-bold text-lg active:scale-95"
                  >
                      <MessageCircle size={24} />
                      Chamar no WhatsApp
                  </button>
              )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8 pt-8 border-t border-gray-100 dark:border-slate-700">
            <div className="flex items-start gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <FileText size={20} />
                </div>
                <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Descrição</span>
                    <p className="text-gray-700 dark:text-slate-300 font-medium">{order.description}</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Clock size={20} />
                </div>
                <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data de Criação</span>
                    <p className="text-gray-700 dark:text-slate-300 font-medium">{new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                    <Calendar size={20} />
                </div>
                <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prazo de Entrega</span>
                    <p className="text-gray-700 dark:text-slate-300 font-medium">{formatDateBR(order.deadline, true)}</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <CreditCard size={20} />
                </div>
                <div className="w-full">
                    <div className="flex justify-between items-end mb-1">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financeiro</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid)} 
                            <span className="text-gray-400 font-normal"> / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount)}</span>
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-700 ease-out ${remaining <= 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    {remaining > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5 font-bold flex items-center gap-1">
                            <Clock size={12} /> Resta pagar: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)}
                        </p>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Main Grid: Financial + History & Attachments/Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Column 1: Items, Payment History */}
          <div className="space-y-6">
              
              {/* Order Items Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Package size={20} className="text-purple-600 dark:text-purple-400" />
                          Itens do Pedido
                      </h3>
                      <div className="flex items-center gap-2">
                          <button 
                              onClick={() => navigate(`/quotes?orderId=${order.id}`)}
                              className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
                          >
                              <FileText size={16} />
                              Gerar Orçamento
                          </button>
                          {!isAddingItem && (
                              <button 
                                  onClick={() => setIsAddingItem(true)}
                                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                              >
                                  <Plus size={16} />
                                  Adicionar
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Add Item Form */}
                  {isAddingItem && (
                      <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 animate-in slide-in-from-top-2 duration-200">
                          <div className="space-y-3">
                              <div className="flex gap-2">
                                  <input 
                                      type="text"
                                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm"
                                      value={newItemName}
                                      onChange={(e) => setNewItemName(e.target.value)}
                                      placeholder="Nome do item"
                                      autoFocus
                                  />
                                  <div className="w-16">
                                      <input 
                                          type="text"
                                          inputMode="numeric"
                                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm text-center"
                                          value={newItemQuantity}
                                          onChange={(e) => {
                                              const numbers = e.target.value.replace(/\D/g, '');
                                              setNewItemQuantity(numbers || '1');
                                          }}
                                          placeholder="Qtd"
                                          title="Quantidade"
                                      />
                                  </div>
                                  <div className="w-28 relative">
                                      <input 
                                          type="text"
                                          inputMode="numeric"
                                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm"
                                          value={newItemPrice}
                                          onChange={(e) => {
                                              const numbers = e.target.value.replace(/\D/g, '');
                                              if (numbers === '') { setNewItemPrice(''); return; }
                                              setNewItemPrice(formatCurrency(numbers));
                                          }}
                                          placeholder="Valor un."
                                      />
                                  </div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <input 
                                      type="text"
                                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm"
                                      value={newItemDescription}
                                      onChange={(e) => setNewItemDescription(e.target.value)}
                                      placeholder="Descrição (opcional)"
                                  />
                                  {parseInt(newItemQuantity, 10) > 1 && parseCurrency(newItemPrice) > 0 && (
                                      <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                                          = {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseCurrency(newItemPrice) * parseInt(newItemQuantity, 10))}
                                      </span>
                                  )}
                              </div>
                              <div className="flex gap-2">
                                  <button 
                                      onClick={async () => {
                                          if (!newItemName.trim() || !newItemPrice) return;
                                          try {
                                              const updatedOrder = await api.addOrderItem(order.id, {
                                                  name: newItemName.trim(),
                                                  unitPrice: parseCurrency(newItemPrice),
                                                  quantity: parseInt(newItemQuantity, 10) || 1,
                                                  description: newItemDescription.trim()
                                              });
                                              setOrder(updatedOrder);
                                              setNewItemName('');
                                              setNewItemPrice('');
                                              setNewItemQuantity('1');
                                              setNewItemDescription('');
                                              setIsAddingItem(false);
                                          } catch (error) {
                                              console.error('Error adding item:', error);
                                          }
                                      }}
                                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium text-sm transition-all"
                                  >
                                      Salvar
                                  </button>
                                  <button 
                                      onClick={() => { setIsAddingItem(false); setNewItemName(''); setNewItemPrice(''); setNewItemQuantity('1'); setNewItemDescription(''); }}
                                      className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                                  >
                                      Cancelar
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {(!order.items || order.items.length === 0) ? (
                          <div className="text-center py-8 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                              <p className="text-gray-400 dark:text-slate-500 text-sm italic">Nenhum item cadastrado.</p>
                          </div>
                      ) : (
                          order.items.map((item) => (
                              <div key={item.id} className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                                  {editingItemId === item.id ? (
                                      <div className="space-y-2">
                                          <div className="flex gap-2">
                                              <input 
                                                  type="text"
                                                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white text-sm"
                                                  value={editItemName}
                                                  onChange={(e) => setEditItemName(e.target.value)}
                                                  autoFocus
                                              />
                                              <div className="w-16">
                                                  <input 
                                                      type="text"
                                                      inputMode="numeric"
                                                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white text-sm text-center"
                                                      value={editItemQuantity}
                                                      onChange={(e) => {
                                                          const numbers = e.target.value.replace(/\D/g, '');
                                                          setEditItemQuantity(numbers || '1');
                                                      }}
                                                      placeholder="Qtd"
                                                      title="Quantidade"
                                                  />
                                              </div>
                                              <div className="w-28 relative">
                                                  <input 
                                                      type="text"
                                                      inputMode="numeric"
                                                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white text-sm"
                                                      value={editItemPrice}
                                                      onChange={(e) => {
                                                          const numbers = e.target.value.replace(/\D/g, '');
                                                          if (numbers === '') { setEditItemPrice(''); return; }
                                                          setEditItemPrice(formatCurrency(numbers));
                                                      }}
                                                      placeholder="Valor un."
                                                  />
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <input 
                                                  type="text"
                                                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white text-sm"
                                                  value={editItemDescription}
                                                  onChange={(e) => setEditItemDescription(e.target.value)}
                                                  placeholder="Descrição (opcional)"
                                              />
                                              {parseInt(editItemQuantity, 10) > 1 && parseCurrency(editItemPrice) > 0 && (
                                                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap">
                                                      = {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseCurrency(editItemPrice) * parseInt(editItemQuantity, 10))}
                                                  </span>
                                              )}
                                          </div>
                                          <div className="flex gap-2">
                                              <button 
                                                  onClick={async () => {
                                                      if (!editItemName.trim() || !editItemPrice) return;
                                                      try {
                                                          const updatedOrder = await api.updateOrderItem(order.id, item.id, {
                                                              name: editItemName.trim(),
                                                              unitPrice: parseCurrency(editItemPrice),
                                                              quantity: parseInt(editItemQuantity, 10) || 1,
                                                              description: editItemDescription.trim()
                                                          });
                                                          setOrder(updatedOrder);
                                                          setEditingItemId(null);
                                                      } catch (error) {
                                                          console.error('Error updating item:', error);
                                                      }
                                                  }}
                                                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded-lg font-medium text-sm"
                                              >
                                                  Salvar
                                              </button>
                                              <button 
                                                  onClick={() => setEditingItemId(null)}
                                                  className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-300 rounded-lg font-medium text-sm"
                                              >
                                                  Cancelar
                                              </button>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                  <p className="font-bold text-gray-900 dark:text-white">{item.name || item.description}</p>
                                                  {(item.quantity || 1) > 1 && (
                                                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                                                          x{item.quantity}
                                                      </span>
                                                  )}
                                              </div>
                                              {item.description && item.name && (
                                                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                                              )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice * (item.quantity || 1))}
                                              </span>
                                              <button 
                                                  onClick={() => {
                                                      setEditingItemId(item.id);
                                                      setEditItemName(item.name || item.description);
                                                      setEditItemPrice(item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                                      setEditItemDescription(item.name ? item.description : '');
                                                      setEditItemQuantity(String(item.quantity || 1));
                                                  }}
                                                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                              >
                                                  <Pencil size={14} />
                                              </button>
                                              <button 
                                                  onClick={() => setItemToDelete(item.id)}
                                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))
                      )}
                  </div>

                  {/* Items Total */}
                  {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                          <span className="font-medium text-gray-600 dark:text-slate-400">Total dos Itens:</span>
                          <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                  order.items.reduce((acc, item) => acc + (item.unitPrice * (item.quantity || 1)), 0)
                              )}
                          </span>
                      </div>
                  )}
              </div>

              {/* Payment History */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <CreditCard size={20} className="text-indigo-600 dark:text-indigo-400" />
                          Histórico de Pagamentos
                      </h3>
                      {remaining > 0 && !isAddingPayment && (
                          <button 
                              onClick={() => setIsAddingPayment(true)}
                              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                          >
                              <PlusCircle size={16} />
                              Adicionar
                          </button>
                      )}
                      {remaining <= 0 && (
                          <span className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                              <Check size={16} />

                              Pago
                          </span>
                      )}
                  </div>
                  
                  {/* Add Payment Form (inline) */}
                  {isAddingPayment && (
                      <form onSubmit={handleAddPayment} className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Valor (R$)</label>
                                  <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">R$</span>
                                      <input 
                                          type="text"
                                          inputMode="numeric"
                                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white font-bold"
                                          value={paymentAmount}
                                          onChange={(e) => {
                                              const numbers = e.target.value.replace(/\D/g, '');
                                              if (numbers === '') { 
                                                  setPaymentAmount(''); 
                                                  setPaymentExceedsMax(false);
                                                  return; 
                                              }
                                              const formatted = formatCurrency(numbers);
                                              setPaymentAmount(formatted);
                                              
                                              // Verificar se excede o máximo
                                              const amount = parseCurrency(formatted);
                                              const totalPaidSoFar = order.payments.reduce((acc, p) => acc + p.amount, 0);
                                              const remainingAmount = order.totalAmount - totalPaidSoFar;
                                              setPaymentExceedsMax(amount > remainingAmount + 0.01);
                                          }}
                                          placeholder={remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          autoFocus
                                          required
                                      />
                                  </div>
                                  {paymentExceedsMax && (
                                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5 font-medium flex items-center gap-1">
                                          ⚠️ Valor máximo permitido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)}
                                      </p>
                                  )}
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Método</label>
                                  <input 
                                      type="text" 
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-gray-200"
                                      value={paymentNote}
                                      onChange={(e) => setPaymentNote(e.target.value)}
                                      placeholder="PIX, Cartão..."
                                  />
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button 
                                  type="submit" 
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-all text-sm active:scale-95"
                              >
                                  Salvar
                              </button>
                              <button 
                                  type="button" 
                                  onClick={() => setIsAddingPayment(false)}
                                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                              >
                                  Cancelar
                              </button>
                          </div>
                      </form>
                  )}

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {order.payments.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                             <p className="text-gray-400 dark:text-slate-500 text-sm italic">Nenhum pagamento registrado.</p>
                          </div>
                      ) : (
                          order.payments.map((payment) => (
                              <div key={payment.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
                                  <div>
                                      <p className="font-extrabold text-gray-900 dark:text-white text-lg">
                                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{new Date(payment.date).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="text-right">
                                          {payment.note && <span className="text-xs text-gray-500 dark:text-slate-400 block max-w-[150px] truncate mb-1" title={payment.note}>{payment.note}</span>}
                                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded flex items-center justify-end gap-1">
                                              <Check size={10} /> CONFIRMADO
                                          </span>
                                      </div>
                                      <button 
                                          onClick={() => setPaymentToDelete(payment.id)}
                                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                          title="Excluir pagamento"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          {/* Column 2: Attachments & Internal Notes */}
          <div className="space-y-6">
              
              {/* Attachments Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Paperclip size={20} className="text-blue-500" />
                          Arquivos & Anexos
                      </h3>
                      {/* Bulk Actions Header */}
                      {order.attachments && order.attachments.length > 0 && (
                          <div className="flex items-center gap-3">
                              {selectedAttachments.size > 0 ? (
                                  <button 
                                      onClick={handleBulkDeleteRequest}
                                      className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                  >
                                      <Trash2 size={14} /> Excluir ({selectedAttachments.size})
                                  </button>
                              ) : null}
                              
                              <button 
                                  onClick={toggleSelectAll}
                                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors font-medium"
                              >
                                  {selectedAttachments.size === order.attachments.length ? (
                                      <CheckSquare size={16} />
                                  ) : (
                                      <Square size={16} />
                                  )}
                                  <span className="hidden sm:inline">Selecionar Tudo</span>
                              </button>
                          </div>
                      )}
                  </div>

                  {/* Dropzone */}
                  <div 
                      {...getRootProps()} 
                      className={`
                          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4
                          ${isDragActive 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                              : 'border-gray-200 dark:border-slate-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                          }
                      `}
                  >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-slate-400">
                          <Upload size={24} className="mb-1" />
                          <p className="text-sm font-medium">Clique ou arraste arquivos aqui</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">Imagens, vídeos, PDF...</p>
                      </div>
                  </div>

                  {/* Attachment List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[300px] space-y-3">
                      {order.attachments && order.attachments.length > 0 ? (
                          order.attachments.map(att => (
                              <div 
                                key={att.id} 
                                className={`flex items-center justify-between p-3 bg-white dark:bg-slate-900 border rounded-xl hover:shadow-md transition-all group relative
                                    ${selectedAttachments.has(att.id) ? 'border-indigo-500 bg-indigo-50/10' : 'border-gray-100 dark:border-slate-700'}
                                `}
                                onMouseEnter={(e) => handleMouseEnter(e, att)}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                              >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      {/* Checkbox for selection */}
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); toggleSelection(att.id); }}
                                          className={`flex-shrink-0 p-1 rounded transition-colors ${selectedAttachments.has(att.id) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400'}`}
                                      >
                                          {selectedAttachments.has(att.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                      </button>

                                      <div className="bg-gray-50 dark:bg-slate-800 p-2 rounded-lg flex-shrink-0">
                                          {getFileIcon(att.fileName, att.fileType)}
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-sm font-bold text-gray-800 dark:text-white truncate" title={att.fileName}>{att.fileName}</p>
                                          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                                              <span>{formatFileSize(att.fileSize)}</span>
                                              <span>•</span>
                                              <span>{new Date(att.createdAt).toLocaleString('pt-BR')}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                      {/* Preview/Download link simulation */}
                                      <a 
                                          href={att.fileUrl} 
                                          download={att.fileName}
                                          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                          title="Baixar / Visualizar"
                                      >
                                          <Download size={16} />
                                      </a>
                                      <button 
                                          onClick={() => handleDeleteAttachmentRequest(att.id)}
                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                          title="Excluir Anexo"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-6 text-gray-400 dark:text-slate-500 text-sm">
                              Nenhum arquivo anexado.
                          </div>
                      )}
                  </div>
              </div>

              {/* Internal Notes Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <StickyNote size={20} className="text-amber-500" />
                      Notas & Observações Internas
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar max-h-[300px] space-y-4">
                      {order.notes && order.notes.length > 0 ? (
                          order.notes.map(note => (
                              <div key={note.id} className="bg-amber-50/40 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-sm group relative hover:shadow-sm transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20">
                                {editingNoteId === note.id ? (
                                    <div className="space-y-3">
                                        <textarea 
                                            className="w-full p-3 border border-amber-200 dark:border-amber-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none bg-white dark:bg-slate-900 dark:text-slate-200 resize-none"
                                            value={editingNoteContent}
                                            onChange={(e) => setEditingNoteContent(e.target.value)}
                                            rows={3}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setEditingNoteId(null)}
                                                className="text-xs text-gray-500 dark:text-slate-400 font-bold hover:text-gray-700 dark:hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={saveEditedNote}
                                                className="text-xs bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 transition-all shadow-sm active:scale-95"
                                            >
                                                Salvar Alterações
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <p className="text-gray-800 dark:text-slate-200 mb-2 flex-1 pr-10 break-words whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 bg-white/80 dark:bg-slate-800/80 rounded-xl p-1 backdrop-blur-sm shadow-sm border border-amber-100 dark:border-amber-900/30">
                                                <button 
                                                    onClick={() => startEditingNote(note)}
                                                    className="p-1.5 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                                    title="Editar Nota"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteNoteRequest(note.id)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Excluir Nota"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-amber-700/50 dark:text-amber-500/50 font-bold flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {new Date(note.createdAt).toLocaleString('pt-BR')}
                                        </p>
                                    </>
                                )}
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-100 dark:border-slate-700">
                              <p className="text-gray-400 dark:text-slate-500 text-sm font-medium">Nenhuma observação interna.</p>
                          </div>
                      )}
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
                      <textarea 
                          placeholder="Algum detalhe importante? Digite aqui..."
                          className="w-full p-4 border border-gray-200 dark:border-slate-600 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none mb-3 bg-gray-50/50 dark:bg-slate-900 dark:text-white"
                          rows={2}
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                      />
                      <button 
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-amber-500/10 active:scale-95"
                      >
                          <PlusCircle size={18} /> Publicar Nota Interna
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <ConfirmModal 
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDeleteNote}
        title="Excluir Nota"
        description="Esta nota será removida permanentemente do histórico do pedido. Confirmar exclusão?"
        confirmText="Excluir Agora"
        variant="danger"
      />

      <ConfirmModal 
        isOpen={!!attachmentToDelete}
        onClose={() => setAttachmentToDelete(null)}
        onConfirm={confirmDeleteAttachment}
        title="Excluir Anexo"
        description="Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita."
        confirmText="Excluir Arquivo"
        variant="danger"
      />

      <ConfirmModal 
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Excluir Múltiplos Arquivos"
        description={`Você selecionou ${selectedAttachments.size} arquivos. Deseja excluí-los permanentemente? Esta ação não pode ser desfeita.`}
        confirmText="Excluir Selecionados"
        variant="danger"
      />

      <ConfirmModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
            if (!itemToDelete || !order) return;
            try {
                const updatedOrder = await api.deleteOrderItem(order.id, itemToDelete);
                setOrder(updatedOrder);
            } catch (error) {
                console.error('Error deleting item:', error);
            } finally {
                setItemToDelete(null);
            }
        }}
        title="Excluir Item"
        description="Tem certeza que deseja excluir este item? O valor total do pedido será atualizado automaticamente."
        confirmText="Excluir Item"
        variant="danger"
      />

      <ConfirmModal 
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        title="Excluir Pagamento"
        description="Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita."
        confirmText="Excluir Pagamento"
        variant="danger"
      />
    </div>
  );
};

export default OrderDetails;
