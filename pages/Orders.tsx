import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { Search, Filter, Plus, ChevronRight, MessageSquare, Send, X, Settings, MessageCircle, Trash2, ArrowUpDown, AlertTriangle, CreditCard, DollarSign } from 'lucide-react';
import CreateOrderModal from '../components/CreateOrderModal';
import ManageStatusModal from '../components/ManageStatusModal';
import ConfirmModal from '../components/ConfirmModal'; 
import { useSettings } from '../context/SettingsContext';

type SortOption = 'PENDING_FIRST' | 'DEADLINE_ASC' | 'DEADLINE_DESC';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pixKey, orderStatuses, billingMessageTemplate } = useSettings(); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Sorting
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('PENDING_FIRST');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isQuickPayModalOpen, setIsQuickPayModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Quick Payment State
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // Billing State
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [billingMessage, setBillingMessage] = useState('');

  useEffect(() => {
    fetchOrders();
    
    const statusParam = searchParams.get('status');
    if (statusParam === 'open') {
        setFilterStatus('OPEN');
    } else if (statusParam === 'completed') {
        setFilterStatus(OrderStatus.COMPLETED);
    }

  }, [searchParams]);

  const fetchOrders = () => {
    setLoading(true);
    api.getOrders().then(setOrders).finally(() => setLoading(false));
  };

  const handleCreateOrder = async (orderData: any) => {
    try {
      await api.createOrder(orderData);
      setIsCreateModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Error creating order", error);
    }
  };

  const handleDeleteRequest = (id: string) => {
      setOrderToDelete(id);
  };

  const confirmDeleteOrder = async () => {
      if (!orderToDelete) return;
      try {
          setOrders(prev => prev.filter(o => o.id !== orderToDelete));
          await api.deleteOrder(orderToDelete);
      } catch (error) {
          console.error("Failed to delete order", error);
          fetchOrders();
      } finally {
          setOrderToDelete(null);
      }
  };

  const generateBillingMessage = (order: Order, isFullTotal: boolean = false) => {
    // Determine the amount to show (Total or Pending)
    let valueToShow: number;
    if (isFullTotal) {
      valueToShow = order.totalAmount;
    } else {
      valueToShow = calculatePending(order);
    }
    const valueFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueToShow);

    let template = billingMessageTemplate || `Olá {cliente}, seu pedido #{pedido} no valor de {valor} está aguardando pagamento. Chave PIX: {pix}`;

    template = template.replace(/{cliente}/g, order.clientName);
    template = template.replace(/{pedido}/g, order.id.split('-')[1] || order.id);
    template = template.replace(/{valor}/g, valueFormatted);
    template = template.replace(/{pix}/g, pixKey || '[CHAVE_PIX_DA_LOJA]');

    return template;
  }

  const handleStatusChange = async (order: Order, newStatus: string) => {
      const isPendingPaymentLabel = newStatus === 'Aguardando Pagamento'; 

      if (isPendingPaymentLabel && order.status !== newStatus) {
          const message = generateBillingMessage(order, true); // Use total amount for status change trigger usually
          
          setBillingMessage(message);
          setPendingOrder({ ...order, status: newStatus });
          setIsBillingModalOpen(true);
      } else {
          await updateOrderStatus(order, newStatus);
      }
  };

  const updateOrderStatus = async (order: Order, status: string) => {
      try {
          const updated = { ...order, status };
          await api.updateOrder(updated);
          setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
      } catch (error) {
          console.error("Failed to update status", error);
      }
  };

  const confirmBilling = async (sendWhatsApp: boolean) => {
      if (!pendingOrder) return;

      await updateOrderStatus(pendingOrder, pendingOrder.status);

      if (sendWhatsApp) {
          const phone = pendingOrder.clientPhone?.replace(/\D/g, '') || '';
          const url = `https://wa.me/${phone}?text=${encodeURIComponent(billingMessage)}`;
          window.open(url, '_blank');
      }

      setIsBillingModalOpen(false);
      setPendingOrder(null);
  };

  const handleQuickPayOpen = (order: Order) => {
      const pending = calculatePending(order);
      setSelectedOrderForPay(order);
      setPayAmount(pending.toFixed(2));
      setPayNote('');
      setIsQuickPayModalOpen(true);
  };

  const handleQuickPaySave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedOrderForPay) return;

      const amount = parseFloat(payAmount);
      if (isNaN(amount) || amount <= 0) return;

      try {
          const updatedOrder = await api.addPayment(selectedOrderForPay.id, {
              amount,
              note: payNote,
              date: new Date().toISOString().split('T')[0]
          });
          setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
          setIsQuickPayModalOpen(false);
      } catch (error) {
          console.error("Error adding payment", error);
      }
  };

  const handleSingleCharge = (order: Order) => {
      const template = generateBillingMessage(order, false); // Use pending amount for ad-hoc charge
      const phone = order.clientPhone?.replace(/\D/g, '') || '';
      
      if(phone) {
           const url = `https://wa.me/${phone}?text=${encodeURIComponent(template)}`;
           window.open(url, '_blank');
      } else {
          alert('Cliente sem telefone cadastrado.');
      }
  };

  const getBadgeStyle = (statusLabel: string) => {
      const statusObj = orderStatuses.find(s => s.label === statusLabel);
      if (statusObj) {
          return {
              borderColor: statusObj.color,
              backgroundColor: `${statusObj.color}20`,
              color: statusObj.color
          };
      }
      return { backgroundColor: '#f3f4f6', color: '#374151' };
  };

  const calculatePaid = (order: Order) => order.payments.reduce((acc, curr) => acc + curr.amount, 0);
  const calculatePending = (order: Order) => order.totalAmount - calculatePaid(order);

  const filteredOrders = orders.filter(order => {
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          const matches = order.clientName.toLowerCase().includes(lowerTerm) || 
                          order.description.toLowerCase().includes(lowerTerm) ||
                          order.id.toLowerCase().includes(lowerTerm);
          if (!matches) return false;
      }

      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'OPEN') {
          return order.status !== OrderStatus.COMPLETED;
      }
      return order.status === filterStatus;
  }).sort((a, b) => {
      if (sortBy === 'DEADLINE_ASC') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }

      if (sortBy === 'DEADLINE_DESC') {
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      }

      const pendingA = calculatePending(a) > 0.01;
      const pendingB = calculatePending(b) > 0.01;

      if (pendingA && !pendingB) return -1;
      if (!pendingA && pendingB) return 1;
      return 0;
  });

  const pendingCount = orders.filter(o => calculatePending(o) > 0.01).length;

  if (loading && !isCreateModalOpen && orders.length === 0) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Carregando pedidos...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-6">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Pedidos</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie todos os pedidos da sua gráfica</p>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsStatusModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
            >
                <Settings size={18} />
                Gerenciar Status
            </button>
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-slate-900/10"
            >
                <Plus size={18} />
                Novo Pedido
            </button>
        </div>
      </div>

      {/* 2. Alert Banner Section (Yellow/Amber) */}
      {pendingCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 shadow-sm">
              <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
                  <AlertTriangle size={24} className="text-amber-500" />
                  <span className="font-medium text-lg">{pendingCount} pedido(s) com pagamento pendente</span>
              </div>
          </div>
      )}

      {/* 3. Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700 dark:text-gray-200 placeholder-gray-400 shadow-sm"
            />
          </div>

          <div className="flex gap-4">
            <div className="relative min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ArrowUpDown size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <select 
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 font-medium shadow-sm cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                    <option value="PENDING_FIRST">Prioridade Pagamento</option>
                    <option value="DEADLINE_ASC">Prazo: Mais Próximo</option>
                    <option value="DEADLINE_DESC">Prazo: Mais Distante</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <ChevronRight size={16} className="rotate-90" />
                </div>
            </div>

            <div className="relative min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <select 
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 font-medium shadow-sm cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="ALL">Todos os Status</option>
                    <option value="OPEN">Em Aberto</option>
                    {orderStatuses.map(s => (
                        <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <ChevronRight size={16} className="rotate-90" />
                </div>
            </div>
          </div>
      </div>

      {/* 4. Orders List (Cards) */}
      <div className="space-y-4">
         <h3 className="font-bold text-lg text-gray-800 dark:text-white ml-1">{filteredOrders.length} pedido(s) encontrado(s)</h3>
         
         {filteredOrders.map((order) => {
             const paid = calculatePaid(order);
             const pending = calculatePending(order);
             const badgeStyle = getBadgeStyle(order.status);
             const isCompleted = order.status === OrderStatus.COMPLETED;

             return (
                 <div 
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className={`rounded-xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-md transition-all cursor-pointer group ${
                        isCompleted 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30' 
                        : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700'
                    }`}
                 >
                    {/* Left Info */}
                    <div className="flex-1 min-w-0 w-full lg:w-auto text-center lg:text-left">
                        <div className="flex flex-col lg:flex-row items-center gap-3 mb-1 justify-center lg:justify-start">
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg truncate max-w-[250px]" title={order.clientName}>
                                {order.clientName}
                            </h4>
                            <span 
                                className="px-3 py-1 rounded-full text-xs font-bold border"
                                style={badgeStyle}
                            >
                                {order.status}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 truncate" title={order.description}>{order.description}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs">
                            Entrega: {new Date(order.deadline).toLocaleDateString('pt-BR')}
                        </p>
                    </div>

                    {/* Financial Stats */}
                    <div className="flex items-center gap-8 text-sm">
                        <div className="text-center lg:text-left">
                            <span className="block text-gray-500 dark:text-gray-400 text-xs mb-1">Total</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount)}
                            </span>
                        </div>
                        <div className="text-center lg:text-left">
                            <span className="block text-gray-500 dark:text-gray-400 text-xs mb-1">Pago</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paid)}
                            </span>
                        </div>
                        <div className="text-center lg:text-left relative">
                            <span className="block text-gray-500 dark:text-gray-400 text-xs mb-1">Pendente</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-600 dark:text-amber-500">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pending)}
                                </span>
                                
                                {/* QUICK PAY BUTTON - Only show if pending and not completed */}
                                {pending > 0.01 && !isCompleted && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleQuickPayOpen(order); }}
                                        className="bg-indigo-600 text-white rounded-full p-1 hover:bg-indigo-700 hover:scale-110 transition-all shadow-sm flex items-center justify-center"
                                        title="Registrar Pagamento Rápido"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-end">
                         <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <select 
                                value={order.status}
                                onChange={(e) => handleStatusChange(order, e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                            >
                                {orderStatuses.map(s => (
                                    <option key={s.id} value={s.label}>{s.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <ChevronRight size={14} className="rotate-90" />
                            </div>
                         </div>

                         {pending > 0.01 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleSingleCharge(order); }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                            >
                                <MessageCircle size={16} />
                                Cobrar
                            </button>
                         )}

                         <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteRequest(order.id); }}
                            className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg transition-colors"
                            title="Excluir Pedido"
                         >
                             <Trash2 size={18} />
                         </button>
                    </div>
                 </div>
             );
         })}

         {filteredOrders.length === 0 && (
             <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 border-dashed">
                 <p className="text-gray-400 dark:text-slate-500">Nenhum pedido encontrado.</p>
             </div>
         )}
      </div>

      <CreateOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateOrder}
      />

      <ManageStatusModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />

      <ConfirmModal 
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={confirmDeleteOrder}
        title="Excluir Pedido"
        description="Tem certeza que deseja excluir este pedido permanentemente? Esta ação não pode ser desfeita."
        confirmText="Excluir Pedido"
        variant="danger"
      />

      {/* QUICK PAYMENT MODAL */}
      {isQuickPayModalOpen && selectedOrderForPay && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
                  <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                              <DollarSign size={24} />
                          </div>
                          <button onClick={() => setIsQuickPayModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                              <X size={20} />
                          </button>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Registrar Pagamento</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{selectedOrderForPay.clientName}</p>
                      
                      <form onSubmit={handleQuickPaySave} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Valor (R$)</label>
                              <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    autoFocus
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white font-bold text-lg transition-all"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Método / Obs</label>
                              <input 
                                type="text" 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-gray-200 transition-all"
                                value={payNote}
                                onChange={(e) => setPayNote(e.target.value)}
                                placeholder="Ex: PIX, Dinheiro, Cartão"
                              />
                          </div>

                          <div className="pt-4 flex gap-3">
                              <button 
                                type="button" 
                                onClick={() => setIsQuickPayModalOpen(false)}
                                className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                              >
                                  Cancelar
                              </button>
                              <button 
                                type="submit"
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
                              >
                                  Confirmar
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* BILLING AUTOMATION MODAL */}
      {isBillingModalOpen && pendingOrder && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/20">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          <MessageSquare size={20} className="text-indigo-600 dark:text-indigo-400"/>
                          Confirmar Cobrança
                      </h3>
                      <button onClick={() => setIsBillingModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6">
                      <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
                          Deseja enviar a mensagem de cobrança para <strong>{pendingOrder.clientName}</strong>?
                      </p>
                      
                      <div className="mb-6">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mensagem (Editável)</label>
                          <textarea 
                              className="w-full h-32 p-3 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50 dark:bg-slate-900"
                              value={billingMessage}
                              onChange={(e) => setBillingMessage(e.target.value)}
                          />
                      </div>

                      <div className="flex flex-col gap-3">
                          <button 
                             onClick={() => confirmBilling(true)}
                             className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                          >
                              <Send size={18} />
                              Enviar no WhatsApp e Salvar
                          </button>
                          
                          <button 
                             onClick={() => confirmBilling(false)}
                             className="w-full py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
                          >
                              Apenas Mudar Status (Sem Enviar)
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Orders;