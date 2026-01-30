import { Order, OrderStatus, Payment, Material, MaterialStatus } from './types';

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    clientName: 'Tech Solutions Ltda',
    description: '1000 Cartões de Visita + Verniz',
    status: OrderStatus.PRODUCTION,
    totalAmount: 450.00,
    createdAt: '2023-10-25T10:00:00Z',
    deadline: '2023-11-05',
    payments: [],
    items: [
      { id: 'itm-1', description: 'Cartão de Visita Couché 300g', quantity: 1000, unitPrice: 0.45 }
    ]
  },
  {
    id: 'ord-002',
    clientName: 'Restaurante Sabor Mineiro',
    description: '5 Banners em Lona 440g',
    status: OrderStatus.PENDING_PAYMENT,
    totalAmount: 400.00,
    createdAt: '2023-10-26T14:30:00Z',
    deadline: '2023-10-30',
    payments: [],
    items: [
      { id: 'itm-2', description: 'Banner 90x120cm', quantity: 5, unitPrice: 80.00 }
    ]
  },
  {
    id: 'ord-003',
    clientName: 'Advocacia Silva',
    description: 'Papel Timbrado e Envelopes',
    status: OrderStatus.QUOTE,
    totalAmount: 600.00,
    createdAt: '2023-10-28T09:15:00Z',
    deadline: '2023-11-01',
    payments: [],
    items: [
      { id: 'itm-3', description: 'Papel Timbrado A4', quantity: 500, unitPrice: 0.60 },
      { id: 'itm-4', description: 'Envelope Saco', quantity: 200, unitPrice: 1.50 }
    ]
  },
  {
    id: 'ord-004',
    clientName: 'Eventos Top',
    description: 'Backdrop para Evento',
    status: OrderStatus.COMPLETED,
    totalAmount: 1200.00,
    createdAt: '2023-10-20T11:00:00Z',
    deadline: '2023-10-25',
    payments: [],
    items: [
      { id: 'itm-5', description: 'Estrutura + Lona 3x2m', quantity: 1, unitPrice: 1200.00 }
    ]
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  { id: 'pay-001', orderId: 'ord-001', amount: 200.00, date: '2023-10-25', note: 'Sinal 50%' },
  { id: 'pay-002', orderId: 'ord-004', amount: 1200.00, date: '2023-10-22', note: 'Pagamento Total' },
  // Adding a payment for "today" simulation (assuming today is fixed for demo purposes or we check date logic)
  { id: 'pay-003', orderId: 'ord-002', amount: 100.00, date: new Date().toISOString().split('T')[0], note: 'Sinal' }
];

export const MOCK_MATERIALS: Material[] = [
  { id: 'mat-001', name: 'Papel Couché 300g A3', status: MaterialStatus.IN_STOCK, quantity: '500 fls', estimatedCost: 150.00, supplierIds: [] },
  { id: 'mat-002', name: 'Tinta Ciano Eco-Solvente', status: MaterialStatus.PENDING, quantity: '2 Litros', estimatedCost: 200.00, supplierIds: [] },
  { id: 'mat-003', name: 'Ilhós Metálico', status: MaterialStatus.PURCHASED, quantity: '1000 un', estimatedCost: 50.00, supplierIds: [] },
  { id: 'mat-004', name: 'Lona Frontlight 440g', status: MaterialStatus.PENDING, linkedOrderId: 'ord-002', quantity: '1 Rolo', estimatedCost: 180.00, supplierIds: [] }
];