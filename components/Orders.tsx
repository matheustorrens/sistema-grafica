import React from 'react';
import { Order, OrderStatus } from '../types';
import { formatCurrency, calculateOrderTotal, getStatusColor } from '../services/dataService';
import { Search, Plus, ArrowRight } from 'lucide-react';

interface OrdersProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
  onCreateOrder: () => void;
}

const Orders: React.FC<OrdersProps> = ({ orders, onSelectOrder, onCreateOrder }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Gestão de Pedidos</h1>
        <button 
          onClick={onCreateOrder}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Pedido
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Simple Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Buscar por cliente ou pedido..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente / Descrição</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr 
                    key={order.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => onSelectOrder(order.id)}
                >
                  <td className="px-6 py-4 font-mono text-slate-500">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{order.clientName}</span>
                        <span className="text-slate-500 text-xs">{order.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {formatCurrency(calculateOrderTotal(order))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                        className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onSelectOrder(order.id); }}
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          Nenhum pedido encontrado.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;