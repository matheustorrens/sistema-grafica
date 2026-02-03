
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

export interface OrderStatusItem {
  id: string;
  label: string;
  color: string; // Hex code or tailwind class reference
  isDefault?: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  enableWhatsApp: boolean;
  isDefault?: boolean;
  order?: number; // Added for ordering
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
  fileUrl: string; // In a real app this is a URL, here likely a Base64 string for preview
  fileSize: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber?: number; // Added to support sequential numbers (e.g., 1, 2, 3...)
  clientName: string;
  clientPhone?: string; // Added for WhatsApp billing
  description: string;
  totalAmount: number;
  status: string; // Changed from OrderStatus enum to string to support dynamic statuses
  createdAt: string;
  deadline: string;
  payments: Payment[];
  items: OrderItem[];
  notes?: OrderNote[]; // New field for internal observations
  attachments?: OrderAttachment[]; // New field for files
}

export interface Supplier {
  id: string;
  name: string;
  phone: string; // Format: 5511999999999
  tags?: string[]; // e.g. ["Papel", "Tinta"]
}

export interface Material {
  id: string;
  name: string;
  quantity: number; // Changed from string to number
  currentQuantity: number; // New field
  unit: string; // New field
  status: string; // Changed to string to support dynamic columns IDs
  linkedOrderId?: string;
  estimatedCost: number;
  supplierIds: string[]; // List of Supplier IDs linked to this material
}
