import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, History, Undo2, DollarSign } from 'lucide-react';
import { RevenueAdjustment } from '../types';
import { api } from '../services/api';

interface RevenueAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  totalFromOrders: number;
  filterStartDate: string;
  filterEndDate: string;
}

// Função para formatar valor monetário
const formatCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const amount = parseInt(numbers || '0', 10) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const formatDisplayCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
};

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RevenueAdjustmentModal: React.FC<RevenueAdjustmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  totalFromOrders,
  filterStartDate,
  filterEndDate
}) => {
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [adjustments, setAdjustments] = useState<RevenueAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingReverseId, setConfirmingReverseId] = useState<string | null>(null);

  // Calculate totals from adjustments
  const totalAdded = adjustments
    .filter(a => a.amount > 0)
    .reduce((sum, a) => sum + a.amount, 0);
  
  const totalSubtracted = adjustments
    .filter(a => a.amount < 0)
    .reduce((sum, a) => sum + Math.abs(a.amount), 0);

  const netAdjustment = totalAdded - totalSubtracted;
  const maxSubtractable = totalAdded - totalSubtracted; // Can only subtract what was added

  useEffect(() => {
    if (isOpen) {
      fetchAdjustments();
      setAmount('');
      setNote('');
      setError(null);
      setConfirmingReverseId(null);
    }
  }, [isOpen, filterStartDate, filterEndDate]);

  // Close confirmation dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (confirmingReverseId) {
        const target = e.target as HTMLElement;
        if (!target.closest('.confirmation-dropdown') && !target.closest('[data-reverse-button]')) {
          setConfirmingReverseId(null);
        }
      }
    };

    if (confirmingReverseId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [confirmingReverseId]);

  const fetchAdjustments = async () => {
    try {
      const data = await api.getRevenueAdjustmentsByDateRange(filterStartDate, filterEndDate);
      setAdjustments(data);
    } catch (err) {
      console.error('Error fetching adjustments:', err);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setAmount(formatted);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseCurrency(amount);
    
    if (numericAmount <= 0) {
      setError('Digite um valor maior que zero');
      return;
    }

    // Check if subtraction is allowed
    if (mode === 'subtract' && numericAmount > maxSubtractable) {
      setError(`Você só pode subtrair até ${formatDisplayCurrency(maxSubtractable)} (valor dos ajustes manuais)`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createRevenueAdjustment({
        amount: mode === 'add' ? numericAmount : -numericAmount,
        note: note || (mode === 'add' ? 'Adição manual' : 'Subtração manual'),
        adjustmentDate: new Date().toISOString().split('T')[0]
      });

      setAmount('');
      setNote('');
      await fetchAdjustments();
      onSave();
    } catch (err) {
      console.error('Error creating adjustment:', err);
      setError('Erro ao salvar ajuste. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async (adjustmentId: string) => {
    setLoading(true);
    setConfirmingReverseId(null);
    try {
      await api.reverseRevenueAdjustment(adjustmentId);
      await fetchAdjustments();
      onSave();
    } catch (err) {
      console.error('Error reversing adjustment:', err);
      setError('Erro ao reverter ajuste.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-gray-100 dark:border-slate-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <DollarSign size={22} className="text-blue-600 dark:text-blue-400" />
            Ajustar Receita Total
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total dos Pedidos</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDisplayCurrency(totalFromOrders)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Ajustes Manuais</p>
              <p className={`text-lg font-bold ${netAdjustment >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {netAdjustment >= 0 ? '+' : ''}{formatDisplayCurrency(netAdjustment)}
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setMode('add'); setError(null); }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'add' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <Plus size={18} />
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => { setMode('subtract'); setError(null); }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'subtract' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <Minus size={18} />
              Subtrair
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Valor (R$)
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={amount}
                onChange={handleAmountChange}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              />
              {mode === 'subtract' && maxSubtractable > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Máximo permitido: {formatDisplayCurrency(maxSubtractable)}
                </p>
              )}
              {mode === 'subtract' && maxSubtractable <= 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Não há valor de ajustes para subtrair
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Observação (opcional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={mode === 'add' ? 'Ex: Serviço extra' : 'Ex: Correção de valor'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'subtract' && maxSubtractable <= 0)}
              className={`w-full py-2.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'add'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {loading ? 'Salvando...' : mode === 'add' ? 'Adicionar Valor' : 'Subtrair Valor'}
            </button>
          </form>

          {/* History Toggle */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full mt-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center gap-2 transition-colors"
          >
            <History size={16} />
            {showHistory ? 'Ocultar Histórico' : 'Ver Histórico de Ajustes'}
          </button>

          {/* History List */}
          {showHistory && (
            <div className="mt-4 border-t border-gray-100 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                Histórico do Período
              </h4>
              {adjustments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhum ajuste neste período
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-visible">
                  {adjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className="relative flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${adj.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {adj.amount > 0 ? '+' : ''}{formatDisplayCurrency(adj.amount)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDateTime(adj.createdAt)} {adj.note && `• ${adj.note}`}
                        </p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setConfirmingReverseId(adj.id)}
                          disabled={loading}
                          data-reverse-button
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Reverter ajuste"
                        >
                          <Undo2 size={16} />
                        </button>
                        
                        {/* Confirmation Dropdown */}
                        {confirmingReverseId === adj.id && (
                          <div className="confirmation-dropdown absolute right-0 bottom-full mb-2 z-[200] bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-2 border-red-400 dark:border-red-600 p-4 w-56 animate-in fade-in">
                            <p className="text-sm text-gray-700 dark:text-gray-200 mb-3 font-medium">
                              Deseja reverter este ajuste?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmingReverseId(null)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleReverse(adj.id)}
                                disabled={loading}
                                className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium shadow-sm"
                              >
                                Reverter
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueAdjustmentModal;
