import { supabase } from './supabaseClient';
import { Order, OrderStatus, Material, MaterialStatus, Payment, Supplier } from '../types';

// --- HELPERS TO MAP DB SNAKE_CASE TO TS CAMELCASE ---

const mapOrderFromDB = (row: any): Order => {
  return {
    id: row.id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    description: row.description,
    totalAmount: row.total_amount,
    status: row.status,
    createdAt: row.created_at,
    deadline: row.deadline,
    // Map nested arrays if they exist, handling potential nulls
    payments: (row.payments || []).map((p: any) => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      note: p.note,
      orderId: p.order_id
    })),
    items: (row.order_items || []).map((i: any) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unit_price
    })),
    notes: (row.order_notes || []).map((n: any) => ({
      id: n.id,
      content: n.content,
      createdAt: n.created_at
    })),
    attachments: (row.order_attachments || []).map((a: any) => ({
      id: a.id,
      fileName: a.file_name,
      fileType: a.file_type,
      fileUrl: a.file_url,
      fileSize: a.file_size,
      createdAt: a.created_at
    }))
  };
};

const mapMaterialFromDB = (row: any): Material => ({
  id: row.id,
  name: row.name,
  quantity: row.quantity,
  status: row.status,
  estimatedCost: row.estimated_cost,
  supplierIds: row.supplier_ids || [],
  linkedOrderId: row.linked_order_id
});

const mapSupplierFromDB = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  tags: row.tags || []
});

export const api = {
  // --- ORDERS & PAYMENTS (REAL SUPABASE IMPLEMENTATION) ---

  getOrders: async (): Promise<Order[]> => {
    try {
      // Fetch orders with all related data using Supabase joins
      // Assumes table names: orders, payments, order_items, order_notes, order_attachments
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          payments (*),
          order_items (*),
          order_notes (*),
          order_attachments (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapOrderFromDB);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  getOrderById: async (id: string): Promise<Order | undefined> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          payments (*),
          order_items (*),
          order_notes (*),
          order_attachments (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return undefined;
      return mapOrderFromDB(data);
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      return undefined;
    }
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    try {
      // 1. Insert the main order
      const dbOrder = {
        client_name: orderData.clientName,
        client_phone: orderData.clientPhone,
        description: orderData.description,
        total_amount: orderData.totalAmount,
        status: orderData.status || OrderStatus.QUOTE,
        deadline: orderData.deadline,
        created_at: new Date().toISOString() // Optional if DB has default
      };

      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert(dbOrder)
        .select()
        .single();

      if (error) throw error;

      // 2. Insert items if present
      if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map(item => ({
          order_id: newOrder.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice
        }));
        await supabase.from('order_items').insert(itemsToInsert);
      }

      // Return the complete object
      return api.getOrderById(newOrder.id) as Promise<Order>;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  updateOrder: async (updatedOrder: Order): Promise<Order> => {
    try {
      // 1. Update main order fields
      const { error: mainError } = await supabase
        .from('orders')
        .update({
          client_name: updatedOrder.clientName,
          client_phone: updatedOrder.clientPhone,
          description: updatedOrder.description,
          total_amount: updatedOrder.totalAmount,
          status: updatedOrder.status,
          deadline: updatedOrder.deadline
        })
        .eq('id', updatedOrder.id);

      if (mainError) throw mainError;

      // 2. Handle nested updates (Notes, Items, Attachments)
      // Sync Notes
      if (updatedOrder.notes && updatedOrder.notes.length > 0) {
        const notesUpsert = updatedOrder.notes.map(n => ({
            id: n.id.startsWith('NOTE-') ? undefined : n.id, // Let DB generate ID if it's a temp ID
            order_id: updatedOrder.id,
            content: n.content,
            created_at: n.createdAt
        }));
        const sanitizedNotes = notesUpsert.map(({id, ...rest}) => id ? {id, ...rest} : rest);
        await supabase.from('order_notes').upsert(sanitizedNotes);
      }

      // Sync Attachments
      if (updatedOrder.attachments && updatedOrder.attachments.length > 0) {
         const attUpsert = updatedOrder.attachments.map(a => ({
            id: a.id.startsWith('ATT-') ? undefined : a.id,
            order_id: updatedOrder.id,
            file_name: a.fileName,
            file_type: a.fileType,
            file_url: a.fileUrl,
            file_size: a.fileSize,
            created_at: a.createdAt
         }));
         const sanitizedAtt = attUpsert.map(({id, ...rest}) => id ? {id, ...rest} : rest);
         await supabase.from('order_attachments').upsert(sanitizedAtt);
      }

      // Return fresh data
      return (await api.getOrderById(updatedOrder.id))!;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  deleteOrder: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  addPayment: async (orderId: string, payment: Omit<Payment, 'id'>): Promise<Order> => {
    try {
      // 1. Insert Payment
      const { error: payError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount: payment.amount,
          date: payment.date,
          note: payment.note
        });

      if (payError) throw payError;

      // 2. Fetch fresh order data
      const freshOrder = await api.getOrderById(orderId);
      if (!freshOrder) throw new Error("Order not found after adding payment");

      // 3. Logic to auto-complete order if paid in full
      const totalPaid = freshOrder.payments.reduce((acc, p) => acc + p.amount, 0);
      
      if (totalPaid >= freshOrder.totalAmount && freshOrder.status === OrderStatus.PENDING_PAYMENT) {
          await api.updateOrder({ ...freshOrder, status: OrderStatus.COMPLETED });
          freshOrder.status = OrderStatus.COMPLETED;
      }

      return freshOrder;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  },

  // --- MATERIALS (REAL SUPABASE IMPLEMENTATION) ---

  getMaterials: async (): Promise<Material[]> => {
    try {
      const { data, error } = await supabase.from('materials').select('*').order('name');
      if (error) throw error;
      return (data || []).map(mapMaterialFromDB);
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  },

  createMaterial: async (materialData: Partial<Material>): Promise<Material> => {
    try {
      const dbMaterial = {
        name: materialData.name,
        quantity: materialData.quantity,
        status: materialData.status,
        estimated_cost: materialData.estimatedCost,
        supplier_ids: materialData.supplierIds,
        linked_order_id: materialData.linkedOrderId
      };

      const { data, error } = await supabase
        .from('materials')
        .insert(dbMaterial)
        .select()
        .single();

      if (error) throw error;
      return mapMaterialFromDB(data);
    } catch (error) {
       console.error('Error creating material:', error);
       throw error;
    }
  },

  updateMaterial: async (updatedMaterial: Material): Promise<Material> => {
    try {
      const dbMaterial = {
        name: updatedMaterial.name,
        quantity: updatedMaterial.quantity,
        status: updatedMaterial.status,
        estimated_cost: updatedMaterial.estimatedCost,
        supplier_ids: updatedMaterial.supplierIds,
        linked_order_id: updatedMaterial.linkedOrderId
      };

      const { data, error } = await supabase
        .from('materials')
        .update(dbMaterial)
        .eq('id', updatedMaterial.id)
        .select()
        .single();

      if (error) throw error;
      return mapMaterialFromDB(data);
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  },

  updateMaterialStatus: async (id: string, newStatus: MaterialStatus): Promise<Material> => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapMaterialFromDB(data);
    } catch (error) {
      console.error('Error updating material status:', error);
      throw error;
    }
  },

  deleteMaterial: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  },

  // --- SUPPLIERS (REAL SUPABASE IMPLEMENTATION) ---

  getSuppliers: async (): Promise<Supplier[]> => {
    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      return (data || []).map(mapSupplierFromDB);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  }
};