
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, Material, MaterialStatus, Supplier } from '../types';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { DollarSign, Clock, AlertCircle, CheckCircle2, Calendar, TrendingUp, AlertTriangle, Package, MessageCircle, X, Moon, Sun, TrendingDown } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

type DateFilterType = '7D' | '30D' | '6M' | '1Y' | 'CUSTOM';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { suppliers, messageTemplate, orderStatuses, theme, toggleTheme } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chart Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterType>('30D');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // WhatsApp Modal State
  const [supplierModalData, setSupplierModalData] = useState<{material: Material, suppliers: Supplier[]} | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, materialsData] = await Promise.all([
            api.getOrders(),
            api.getMaterials()
        ]);
        setOrders(ordersData);
        setMaterials(materialsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- WhatsApp Logic ---
  const handleContactSupplier = (material: Material) => {
      const linkedSuppliers = suppliers.filter(s => material.supplierIds?.includes(s.id));
      
      if (linkedSuppliers.length === 0) {
          showToast('Nenhum fornecedor vinculado a este item.');
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

      const url = `https://wa.me/${supplier.phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setShowSupplierModal(false);
  };

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  // --- KPIs Calculation ---
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Income Today
  const incomeToday = orders.reduce((acc, order) => {
    const todayPayments = order.payments.filter(p => p.date.startsWith(todayStr));
    return acc + todayPayments.reduce((sum, p) => sum + p.amount, 0);
  }, 0);

  // Income Yesterday
  const incomeYesterday = orders.reduce((acc, order) => {
    const yestPayments = order.payments.filter(p => p.date.startsWith(yesterdayStr));
    return acc + yestPayments.reduce((sum, p) => sum + p.amount, 0);
  }, 0);

  // Growth Logic: Today >= Yesterday is GREEN (Good), otherwise RED (Bad)
  const isGrowth = incomeToday >= incomeYesterday;

  const totalReceivables = orders.reduce((acc, order) => {
    const paid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const pending = order.totalAmount - paid;
    return acc + (pending > 0 ? pending : 0);
  }, 0);

  const openOrdersCount = orders.filter(o => {
    const paid = o.payments.reduce((sum, p) => sum + p.amount, 0);
    return (o.totalAmount - paid) > 0.01;
  }).length;

  const completedCount = orders.filter(o => o.status === OrderStatus.COMPLETED).length;

  // --- Revenue Chart Data (Bar) ---
  const revenueChartData = useMemo(() => {
    const chartDataMap = new Map<string, number>();
    const now = new Date();

    orders.forEach(order => {
        order.payments.forEach(payment => {
            const paymentDate = new Date(payment.date);
            const [pYear, pMonth, pDay] = payment.date.split('-'); 
            const dateStr = `${pDay}/${pMonth}`; 
            
            let isValid = false;
            
            if (dateFilter === 'CUSTOM') {
                if (customStartDate && customEndDate) {
                    const start = new Date(customStartDate);
                    const end = new Date(customEndDate);
                    end.setHours(23, 59, 59);
                    isValid = paymentDate >= start && paymentDate <= end;
                } else {
                    isValid = true;
                }
            } else {
                const diffTime = Math.abs(now.getTime() - paymentDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                switch (dateFilter) {
                    case '7D': isValid = diffDays <= 7; break;
                    case '30D': isValid = diffDays <= 30; break;
                    case '6M': isValid = diffDays <= 180; break;
                    case '1Y': isValid = diffDays <= 365; break;
                    default: isValid = true;
                }
            }

            if (isValid) {
                const current = chartDataMap.get(dateStr) || 0;
                chartDataMap.set(dateStr, current + payment.amount);
            }
        });
    });
    
    return Array.from(chartDataMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .reverse(); 
  }, [orders, dateFilter, customStartDate, customEndDate]);

  // --- Dynamic Status Chart Data (Donut) ---
  const statusChartData = useMemo(() => {
      // Criar um mapa de contagem baseado nos status configurados pelo usuário
      const counts: Record<string, number> = {};
      
      // Inicializar todos os status conhecidos com zero
      orderStatuses.forEach(status => {
          counts[status.label] = 0;
      });

      // Contar pedidos por status
      orders.forEach(o => {
          if (counts[o.status] !== undefined) {
              counts[o.status]++;
          } else {
              // Se o pedido tiver um status que não está mais nas configurações, ainda assim contamos
              counts[o.status] = (counts[o.status] || 0) + 1;
          }
      });

      // Mapear para o formato do Recharts usando as cores do SettingsContext
      return orderStatuses.map(status => ({
          name: status.label,
          value: counts[status.label] || 0,
          color: status.color
      })).filter(item => item.value > 0); // Exibir apenas status que possuem pedidos
  }, [orders, orderStatuses]);

  // --- Low Stock Data ---
  const lowStockMaterials = useMemo(() => {
      return materials
        .filter(m => m.status !== MaterialStatus.IN_STOCK)
        .sort((a, b) => b.estimatedCost - a.estimatedCost)
        .slice(0, 5);
  }, [materials]);


  if (loading) return <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">Carregando painel...</div>;

  const FilterButton = ({ label, value }: { label: string, value: DateFilterType }) => (
    <button
        onClick={() => setDateFilter(value)}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
            dateFilter === value 
            ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200 dark:ring-indigo-900 ring-opacity-50' 
            : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
        }`}
    >
        {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
          <div className="fixed top-4 right-4 bg-gray-800 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 text-sm font-medium">
              {toastMessage}
          </div>
      )}

      <div className="flex justify-between items-end">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Visão Geral</h2>
          <button
              type="button"
              onClick={toggleTheme}
              className={`
                relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}
              `}
              title="Alternar Modo Escuro"
           >
              <span className="sr-only">Toggle theme</span>
              <span
                className={`
                  flex items-center justify-center pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}
                `}
              >
                 {theme === 'dark' ? <Moon size={14} className="text-indigo-600" /> : <Sun size={14} className="text-amber-500" />}
              </span>
           </button>
      </div>

      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entrou Hoje */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                <DollarSign size={24} />
            </div>
            {/* UPDATED BADGE: Shows Yesterday's Absolute Value */}
            <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                isGrowth
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
            }`}>
                Ontem: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeYesterday)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entrou Hoje</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeToday)}
            </h3>
          </div>
        </div>

        {/* A Receber */}
        <div 
            onClick={() => navigate('/orders?status=open')}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all group"
        >
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">A Receber</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceivables)}
            </h3>
          </div>
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform">
            <AlertCircle size={24} />
          </div>
        </div>

        {/* Pedidos em Aberto */}
        <div 
            onClick={() => navigate('/orders?status=open')}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
        >
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Pedidos em Aberto</p>
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{openOrdersCount}</h3>
          </div>
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
        </div>

        {/* Concluídos */}
        <div 
            onClick={() => navigate('/orders?status=completed')}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-md transition-all group"
        >
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">Concluídos (Total)</p>
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200">
              {completedCount}
            </h3>
          </div>
          <div className="bg-gray-100 dark:bg-slate-700/50 p-3 rounded-full text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* 2. Main Revenue Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                Evolução da Receita
            </h3>
            
            <div className="flex flex-wrap items-center gap-2 bg-gray-50 dark:bg-slate-900 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700">
                <FilterButton label="7 Dias" value="7D" />
                <FilterButton label="30 Dias" value="30D" />
                <FilterButton label="6 Meses" value="6M" />
                <FilterButton label="Ano" value="1Y" />
                <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div>
                <FilterButton label="Customizado" value="CUSTOM" />
            </div>
        </div>

        {dateFilter === 'CUSTOM' && (
            <div className="flex flex-wrap items-end gap-4 mb-6 animate-in slide-in-from-top-2 bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Data Inicial</label>
                    <input 
                        type="date" 
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                    />
                </div>
                <div className="text-gray-400 mb-2">-</div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Data Final</label>
                    <input 
                        type="date" 
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                    />
                </div>
            </div>
        )}

        <div className="h-80 w-full">
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    tickFormatter={(val) => `R$${val}`} 
                />
                <Tooltip 
                    formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Receita']}
                    cursor={{fill: 'rgba(99, 102, 241, 0.1)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }}
                />
                <Bar 
                    dataKey="amount" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                    animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-900/50">
              <Calendar size={32} className="mb-2 opacity-50" />
              <p>Sem receitas registradas neste período.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Grid: Donut Chart & Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Status Donut Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-indigo-600 dark:text-indigo-400" />
                  Distribuição de Pedidos
              </h3>
              <div className="flex-1 min-h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip 
                             formatter={(value: number) => [`${value} Pedidos`, 'Quantidade']}
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }}
                             itemStyle={{ color: '#e2e8f0' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="circle"
                            formatter={(value) => <span className="text-sm text-gray-600 dark:text-slate-300 ml-1">{value}</span>}
                          />
                      </PieChart>
                  </ResponsiveContainer>
                  {statusChartData.length === 0 && (
                       <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-slate-500">
                           Sem dados
                       </div>
                  )}
              </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-amber-500" />
                  Alertas de Estoque
              </h3>
              
              <div className="flex-1 space-y-4">
                  {lowStockMaterials.length > 0 ? (
                      lowStockMaterials.map(material => (
                          <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all group">
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${material.status === MaterialStatus.PENDING ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                      <Package size={18} />
                                  </div>
                                  <div>
                                      <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{material.name}</p>
                                      {/* Updated display with current vs required quantity */}
                                      <div className="text-xs text-gray-500 dark:text-slate-400 flex flex-col">
                                          <span>Qtd Necessária: <span className="font-medium text-gray-700 dark:text-slate-300">{material.quantity} {material.unit}</span></span>
                                          <span>Qtd Atual: <span className="font-medium text-gray-700 dark:text-slate-300">{material.currentQuantity || 0} {material.unit}</span></span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="text-right mr-2">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                          material.status === MaterialStatus.PENDING 
                                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30' 
                                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                      }`}>
                                          {material.status === MaterialStatus.PENDING ? 'Pendente' : 'Comprado'}
                                      </span>
                                      <p className="text-xs text-gray-400 mt-1">Est: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(material.estimatedCost)}</p>
                                  </div>

                                  <button 
                                      onClick={(e) => { e.stopPropagation(); handleContactSupplier(material); }}
                                      className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white dark:hover:text-white rounded-full transition-all shadow-sm"
                                      title="Contatar Fornecedor"
                                  >
                                      <MessageCircle size={18} />
                                  </button>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                          <CheckCircle2 size={32} className="mb-2 text-emerald-500 opacity-50" />
                          <p className="text-sm">Estoque em dia!</p>
                      </div>
                  )}
                  
                  {lowStockMaterials.length > 0 && (
                      <button 
                        onClick={() => navigate('/materials')}
                        className="w-full mt-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      >
                          Ver todos os materiais
                      </button>
                  )}
              </div>
          </div>
      </div>

      {/* Supplier Selection Modal */}
      {showSupplierModal && supplierModalData && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm animate-scale-up overflow-hidden border border-gray-100 dark:border-slate-700">
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

export default Dashboard;
