
import { Order, OrderStatus, Payment } from '../../types';
import { MOCK_ORDERS, MOCK_PAYMENTS } from '../../constants';

const STORAGE_KEY = 'demo_orders';

const getLocal = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Populate mock orders with some mock payments for realism
    const ordersWithPayments = MOCK_ORDERS.map((o, index) => ({
      ...o,
      orderNumber: 100 + index, // Simulated sequential ID
      payments: MOCK_PAYMENTS.filter(p => p.orderId === o.id),
      notes: [],
      attachments: []
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ordersWithPayments));
    return ordersWithPayments;
  }
  return JSON.parse(data);
};

const setLocal = (data: Order[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getLocalOrders = async (): Promise<Order[]> => {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 400));
  return getLocal();
};

export const getLocalOrderById = async (id: string): Promise<Order | undefined> => {
  await new Promise(r => setTimeout(r, 200));
  const orders = getLocal();
  return orders.find(o => o.id === id);
};

export const createLocalOrder = async (orderData: Partial<Order>): Promise<Order> => {
  await new Promise(r => setTimeout(r, 500));
  const orders = getLocal();
  
  // Find max orderNumber to simulate auto-increment
  const maxOrderNumber = orders.reduce((max, o) => (o.orderNumber && o.orderNumber > max) ? o.orderNumber : max, 0);

  const newOrder: Order = {
      ...orderData as Order,
      id: `ord-${Date.now()}`,
      orderNumber: maxOrderNumber + 1, // Auto-increment simulation
      createdAt: new Date().toISOString(),
      status: orderData.status || OrderStatus.QUOTE,
      payments: [],
      items: orderData.items || [],
      notes: [],
      attachments: []
  };
  orders.unshift(newOrder); // Add to top
  setLocal(orders);
  return newOrder;
};

export const updateLocalOrder = async (updatedOrder: Order): Promise<Order> => {
  await new Promise(r => setTimeout(r, 400));
  const orders = getLocal();
  const index = orders.findIndex(o => o.id === updatedOrder.id);
  if (index !== -1) {
      orders[index] = updatedOrder;
      setLocal(orders);
      return updatedOrder;
  }
  throw new Error('Order not found');
};

export const deleteLocalOrder = async (id: string): Promise<void> => {
  const orders = getLocal();
  const filtered = orders.filter(o => o.id !== id);
  setLocal(filtered);
};

export const addLocalPayment = async (orderId: string, payment: Omit<Payment, 'id'>): Promise<Order> => {
  await new Promise(r => setTimeout(r, 300));
  const orders = getLocal();
  const index = orders.findIndex(o => o.id === orderId);
  
  if (index === -1) throw new Error("Order not found");
  
  const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      orderId: orderId,
      ...payment
  };
  
  const order = orders[index];
  order.payments = [...order.payments, newPayment];

  // Auto-complete logic
  const totalPaid = order.payments.reduce((acc, p) => acc + p.amount, 0);
  if (totalPaid >= order.totalAmount && order.status === OrderStatus.PENDING_PAYMENT) {
      order.status = OrderStatus.COMPLETED;
  }

  orders[index] = order;
  setLocal(orders);
  return order;
};
