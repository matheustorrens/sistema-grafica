import { Order, OrderStatus, Material, MaterialStatus, Payment, Supplier } from '../types';

// Initial Mock Data
const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    clientName: 'Tech Solutions Ltda',
    clientPhone: '5511999998888',
    description: '500 Cartões de Visita - Fosco com Verniz Local',
    totalAmount: 450.00,
    status: OrderStatus.COMPLETED,
    createdAt: '2023-10-01T10:00:00Z',
    deadline: '2023-10-05T18:00:00Z',
    items: [],
    payments: [
      { id: 'PAY-001', date: '2023-10-01', amount: 450.00, note: 'Pagamento integral via PIX' }
    ],
    notes: [
        { id: 'NOTE-1', content: 'Cliente pediu para caprichar no verniz.', createdAt: '2023-10-01T10:05:00Z' }
    ],
    attachments: []
  },
  {
    id: 'ORD-002',
    clientName: 'Restaurante Sabor Mineiro',
    clientPhone: '5511977776666',
    description: '50 Cardápios Plastificados',
    totalAmount: 1200.00,
    status: OrderStatus.PRODUCTION,
    createdAt: '2023-10-25T14:30:00Z',
    deadline: '2023-11-01T12:00:00Z',
    items: [],
    payments: [
      { id: 'PAY-002', date: '2023-10-25', amount: 600.00, note: 'Sinal 50%' }
    ],
    notes: [],
    attachments: []
  },
  {
    id: 'ORD-003',
    clientName: 'Dra. Ana Silva',
    clientPhone: '5511955554444',
    description: '1000 Receituários A5',
    totalAmount: 380.00,
    status: OrderStatus.PENDING_PAYMENT,
    createdAt: '2023-10-28T09:15:00Z',
    deadline: '2023-10-30T17:00:00Z',
    items: [],
    payments: [],
    notes: [],
    attachments: []
  },
  {
    id: 'ORD-004',
    clientName: 'Evento Corporativo XYZ',
    clientPhone: '5511944443333', // Added phone for testing batch charge
    description: 'Banner Lona 2x1m',
    totalAmount: 150.00,
    status: OrderStatus.QUOTE,
    createdAt: new Date().toISOString(),
    deadline: '2023-11-10T09:00:00Z',
    items: [],
    payments: [],
    notes: [],
    attachments: []
  }
];

const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'SUP-001', name: 'Papelaria Silva', phone: '5511999990001' },
  { id: 'SUP-002', name: 'Distribuidora Tech', phone: '5511988880002' },
  { id: 'SUP-003', name: 'Master Tintas & Insumos', phone: '5511977770003' }
];

const MOCK_MATERIALS: Material[] = [
  { id: 'MAT-001', name: 'Papel Couchê 300g', quantity: '500 folhas', status: MaterialStatus.IN_STOCK, estimatedCost: 120.00, supplierIds: ['SUP-001'] },
  { id: 'MAT-002', name: 'Tinta Ciano (Plotter)', quantity: '1 Litro', status: MaterialStatus.PENDING, estimatedCost: 350.00, supplierIds: ['SUP-002', 'SUP-003'] },
  { id: 'MAT-003', name: 'Laminação Fosca', quantity: '1 Rolo', status: MaterialStatus.PURCHASED, estimatedCost: 85.00, supplierIds: ['SUP-002'] },
  { id: 'MAT-004', name: 'Papel Sulfite A4', quantity: '10 Resmas', status: MaterialStatus.IN_STOCK, estimatedCost: 250.00, supplierIds: ['SUP-001'] },
];

// Simulating Async Database Operations
let orders = [...MOCK_ORDERS];
let materials = [...MOCK_MATERIALS];
let suppliers = [...MOCK_SUPPLIERS];

export const api = {
  getOrders: async (): Promise<Order[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...orders]), 300);
    });
  },

  getOrderById: async (id: string): Promise<Order | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(orders.find(o => o.id === id)), 200);
    });
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    return new Promise((resolve) => {
      const newOrder: Order = {
        id: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        clientName: orderData.clientName || 'Cliente',
        clientPhone: orderData.clientPhone || '',
        description: orderData.description || '',
        totalAmount: orderData.totalAmount || 0,
        status: orderData.status || OrderStatus.QUOTE,
        createdAt: new Date().toISOString(),
        deadline: orderData.deadline || new Date().toISOString(),
        payments: [],
        items: [],
        notes: [],
        attachments: []
      };
      orders = [newOrder, ...orders];
      setTimeout(() => resolve(newOrder), 300);
    });
  },

  updateOrder: async (updatedOrder: Order): Promise<Order> => {
    return new Promise((resolve) => {
      orders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
      setTimeout(() => resolve(updatedOrder), 300);
    });
  },

  deleteOrder: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
        orders = orders.filter(o => o.id !== id);
        setTimeout(() => resolve(), 200);
    });
  },

  addPayment: async (orderId: string, payment: Omit<Payment, 'id'>): Promise<Order> => {
    return new Promise((resolve, reject) => {
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) {
        reject('Order not found');
        return;
      }
      
      const newPayment: Payment = {
        ...payment,
        id: `PAY-${Math.random().toString(36).substr(2, 9)}`
      };

      const updatedOrder = {
        ...orders[orderIndex],
        payments: [...orders[orderIndex].payments, newPayment]
      };
      
      // Auto-update status if fully paid
      const paidAmount = updatedOrder.payments.reduce((sum, p) => sum + p.amount, 0);
      if (paidAmount >= updatedOrder.totalAmount && updatedOrder.status === OrderStatus.PENDING_PAYMENT) {
          updatedOrder.status = OrderStatus.COMPLETED;
      }

      orders[orderIndex] = updatedOrder;
      setTimeout(() => resolve(updatedOrder), 300);
    });
  },

  getMaterials: async (): Promise<Material[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...materials]), 300));
  },

  createMaterial: async (materialData: Partial<Material>): Promise<Material> => {
    return new Promise((resolve) => {
      const newMaterial: Material = {
        id: `MAT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        name: materialData.name || 'Novo Material',
        quantity: materialData.quantity || '0',
        status: materialData.status || MaterialStatus.PENDING,
        estimatedCost: materialData.estimatedCost || 0,
        supplierIds: materialData.supplierIds || []
      };
      materials = [...materials, newMaterial];
      setTimeout(() => resolve(newMaterial), 300);
    });
  },

  updateMaterial: async (updatedMaterial: Material): Promise<Material> => {
    return new Promise((resolve, reject) => {
      const index = materials.findIndex(m => m.id === updatedMaterial.id);
      if (index === -1) {
        reject('Material not found');
        return;
      }
      materials[index] = updatedMaterial;
      setTimeout(() => resolve(updatedMaterial), 200);
    });
  },

  updateMaterialStatus: async (id: string, newStatus: MaterialStatus): Promise<Material> => {
    return new Promise((resolve, reject) => {
      const index = materials.findIndex(m => m.id === id);
      if (index === -1) {
        reject('Material not found');
        return;
      }
      materials[index] = { ...materials[index], status: newStatus };
      setTimeout(() => resolve(materials[index]), 200);
    });
  },

  deleteMaterial: async (id: string): Promise<void> => {
      return new Promise((resolve) => {
          materials = materials.filter(m => m.id !== id);
          setTimeout(() => resolve(), 200);
      });
  },

  getSuppliers: async (): Promise<Supplier[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...suppliers]), 200));
  }
};