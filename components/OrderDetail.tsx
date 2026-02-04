import React, { useState } from 'react';
import { Order, Payment, OrderStatus } from '../types';
import { 
    formatCurrency, 
    calculateOrderTotal, 
    calculateOrderPaid, 
    calculateRemaining,
    getStatusColor 
} from '../services/dataService';
import { ArrowLeft, Printer, CreditCard, Plus, Calendar, CheckCircle } from 'lucide-react';

// Função utilitária para formatar data brasileira sem problemas de timezone
const formatDateBR = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Não definido';
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return 'Data inválida';
  return `${day}/${month}/${year}`;
};

interface OrderDetailProps {
  order: Order;
  payments: Payment[];
  onBack: () => void;
  onAddPayment: (amount: number, note: string) => void;
  onUpdateStatus: (newStatus: string) => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ 
    order, 
    payments, 
    onBack, 
    onAddPayment,
    onUpdateStatus
}) => {
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payNote, setPayNote] = useState('');

  const total = calculateOrderTotal(order);
  const paid = calculateOrderPaid(order.id, payments);
  const remaining = total - paid;
  
  // Set default payment amount to remaining when opening modal
  const handleOpenPayModal = () => {
      setPayAmount(remaining.toString());
      setPayNote('');
      setShowPayModal(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = parseFloat(payAmount);
      if (isNaN(amount) || amount <= 0) return;
      
      onAddPayment(amount, payNote);
      setShowPayModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                Pedido #{order.id}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                    {order.status}
                </span>
            </h1>
            <p className="text-slate-500">{order.clientName}</p>
        </div>
        <div className="flex items-center gap-2">
            <select 
                value={order.status}
                onChange={(e) => onUpdateStatus(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
            >
                {Object.values(OrderStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">
                <Printer className="w-4 h-4" />
                Imprimir
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Itens do Pedido</h3>
                <div className="overflow-hidden border rounded-lg border-slate-100">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700">
                            <tr>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3 text-center">Qtd</th>
                                <th className="px-4 py-3 text-right">Unitário</th>
                                <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 font-medium text-slate-900">{item.description}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                                        {formatCurrency(item.quantity * item.unitPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-semibold text-slate-900">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right">Total do Pedido</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

             {/* Order Timeline / Info (Mock) */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Informações</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500">Data de Criação</p>
                        <p className="font-medium text-slate-900">{formatDateBR(order.createdAt)}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Prazo de Entrega</p>
                        <p className="font-medium text-slate-900">{formatDateBR(order.deadline)}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Financial Panel */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    Financeiro
                </h3>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Valor Total</span>
                        <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Pago até agora</span>
                        <span className="font-medium text-emerald-600">{formatCurrency(paid)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="font-medium text-slate-700">Restante a Pagar</span>
                        <span className={`font-bold text-lg ${remaining > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {formatCurrency(remaining)}
                        </span>
                    </div>
                </div>

                {remaining > 0 ? (
                    <button 
                        onClick={handleOpenPayModal}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Pagamento
                    </button>
                ) : (
                     <div className="w-full bg-emerald-50 text-emerald-700 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Totalmente Pago
                    </div>
                )}

                <div className="mt-6">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Histórico de Pagamentos</h4>
                    <div className="space-y-3">
                        {payments.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Nenhum pagamento registrado.</p>
                        ) : (
                            payments.map(payment => (
                                <div key={payment.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{payment.note || 'Pagamento'}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(payment.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-600">
                                        {formatCurrency(payment.amount)}
                                    