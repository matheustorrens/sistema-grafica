/**
 * Shared Types
 * 
 * Core type definitions used across the application.
 * Domain-specific types should be in their respective feature folders.
 */

// ============================================
// Enums
// ============================================

export enum OrderStatus {
  QUOTE = 'Orçamento',
  PRODUCTION = 'Produção',
  PENDING_PAYMENT = 'Aguardando Pagamento',
  COMPLETED = 'Concluído'
}

export enum MaterialStatus {
  PENDING = 'Material Pendente',
  PURCHASED = 'Comprado',
  IN_STOCK = 'Em Estoque'
}

// ============================================
// Order Types
// ============================================

export interface OrderStatusItem {
  id: string;
  label: string;
  color: string;
  isDefault?: boolean;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  note?: string;
  orderId?: string;
}

export interface OrderItem {
  id: string;
  name?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface OrderAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber?: number;
  clientName: string;
  clientPhone?: string;
  description: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  deadline: string;
  payments: Payment[];
  items: OrderItem[];
  notes?: OrderNote[];
  attachments?: OrderAttachment[];
}

// ============================================
// Material Types
// ============================================

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  enableWhatsApp: boolean;
  isDefault?: boolean;
  order?: number;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  currentQuantity: number;
  unit: string;
  status: string;
  linkedOrderId?: string;
  estimatedCost: number;
  supplierIds: string[];
}

// ============================================
// Supplier Types
// ============================================

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  tags?: string[];
}

// ============================================
// Revenue Adjustment Types
// ============================================

export interface RevenueAdjustment {
  id: string;
  tenantId?: string;
  adjustmentDate: string;
  amount: number;
  note?: string;
  createdAt: string;
  isReversed: boolean;
  reversedAt?: string;
  reversedById?: string;
}

export interface CreateRevenueAdjustmentData {
  adjustmentDate?: string;
  amount: number;
  note?: string;
}

// ============================================
// UI Types
// ============================================

export type Theme = 'light' | 'dark';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}
