import React, { useMemo } from 'react';
import { Order, Payment, OrderStatus } from '../types';
import { calculateOrderTotal, calculateOrderPaid, formatCurrency } from '../services/dataService';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Package 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  orders: Order[];
  payments: Payment[];
  goToOrders: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, payments, goToOrders }) => {
  
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Entered Today
    const incomeToday = payments
      .filter(p => p.date === today)
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Receivables (Total Order Value - Paid Amount) for non-completed/non-cancelled
    // Actually, receivables is simpler: (Total Value of Active Orders) - (Total Paid for those orders)
    // We can also include completed orders that aren't fully paid yet.
    let receivables = 0;
    orders.forEach(order => {
      if (order.status !== OrderStatus.QUOTE) { // Quotes don't count as receivables yet
        const total = calculateOrderTotal(order);
        const paid = calculateOrderPaid(order.id, payments);
        receivables += Math.max(0, total - paid);
      }
    });

    // 3. Open Orders
    const openOrdersCount = orders.filter(o => o.status !== OrderStatus.COMPLETED).length;

    // 4. Monthly Revenue (Simplification: Group payments by day for current month)
    // For demo, we just take all payments and map to days
    const revenueMap = new Map<string, number>();
    payments.forEach(p => {
        // Just formatting DD/MM for the chart
        const dateObj = new Date(p.date);
        const key = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`; 
        revenueMap.set(key, (revenueMap.get(key) || 0) + p.amount);
    });

    const chartData = Array.from(revenueMap.entries()).map(([day, amount]) => ({
        day,
        amount
    }));

    return {
      incomeToday,
      receivables,
      openOrdersCount,
      chartData
    };
  }, [orders, payments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
        <span className="text-sm text-slate-500">Atualizado agora</span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Entrou Hoje */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12% vs ontem</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Entrou hoje</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.incomeToday)}</h3>
          </div>
        </div>

        {/* A Receber */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">A Receber</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.receivables)}</h3>
          </div>
        </div>

        {/* Pedidos em Aberto */}
        <div 
            onClick={goToOrders}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:border-indigo-200 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pedidos em Aberto</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics.openOrdersCount}</h3>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Receita do Mês</h2>
        <div className="h-64 w-full">
          {metrics.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                    cursor={{fill: '#F1F5F9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40}>
                   {metrics.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#6366F1'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
                Sem dados de receita para este período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;