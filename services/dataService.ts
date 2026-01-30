import { Order, Payment, Material, OrderStatus, MaterialStatus } from '../types';
import { MOCK_ORDERS, MOCK_PAYMENTS, MOCK_MATERIALS } from '../constants';

// In a real app, these would be async calls to Supabase
// For now, we manage state in memory within the App component, 
// but this service structure allows easy migration.

export const calculateOrderTotal = (order: Order): number => {
  if (order.items && order.items.length > 0) {
    return order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }
  return order.totalAmount;
};

export const calculateOrderPaid = (orderId: string, payments: Payment[]): number => {
  return payments
    .filter(p => p.orderId === orderId)
    .reduce((sum, p) => sum + p.amount, 0);
};

export const calculateRemaining = (order: Order, payments: Payment[]): number => {
  const total = calculateOrderTotal(order);
  const paid = calculateOrderPaid(order.id, payments);
  return total - paid;
};

// Helper for formatting currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Status Colors Helper
export const getStatusColor = (status: string) => {
  switch (status) {
    case OrderStatus.QUOTE: return 'bg-gray-100 text-gray-700 border-gray-200';
    case OrderStatus.PRODUCTION: return 'bg-blue-100 text-blue-700 border-blue-200';
    case OrderStatus.PENDING_PAYMENT: return 'bg-amber-100 text-amber-700 border-amber-200';
    case OrderStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getMaterialStatusColor = (status: MaterialStatus) => {
    switch (status) {
        case MaterialStatus.PENDING: return 'bg-red-50 text-red-700 border-red-200';
        case MaterialStatus.PURCHASED: return 'bg-amber-50 text-amber-700 border-amber-200';
        case MaterialStatus.IN_STOCK: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
}