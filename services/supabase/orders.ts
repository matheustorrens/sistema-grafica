
import { supabase } from './client';
import { Order, OrderStatus, Payment } from '../../types';

const mapOrderFromDB = (row: any): Order => {
  return {
    id: row.id,
    orderNumber: row.order_number, // Map the database column to the type property
    clientName: row.client_name,
    clientPhone: row.client_phone,
    description: row.description,
    totalAmount: row.total_amount,
    status: row.status,
    createdAt: row.created_at,
    deadline: row.deadline,
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

export const getSupabaseOrders = async (): Promise<Order[]> => {
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapOrderFromDB);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getSupabaseOrderById = async (id: string): Promise<Order | undefined> => {
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
};

export const createSupabaseOrder = async (orderData: Partial<Order>): Promise<Order> => {
  try {
    // 1. Insert the main order
    // Note: We do NOT insert 'order_number' here, the database handles the SERIAL increment automatically.
    const dbOrder = {
      client_name: orderData.clientName,
      client_phone: orderData.clientPhone,
      description: orderData.description,
      total_amount: orderData.totalAmount,
      status: orderData.status || OrderStatus.QUOTE,
      deadline: orderData.deadline,
      created_at: new Date().toISOString()
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

    return (await getSupabaseOrderById(newOrder.id)) as Order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateSupabaseOrder = async (updatedOrder: Order): Promise<Order> => {
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
    if (updatedOrder.notes && updatedOrder.notes.length > 0) {
      const notesUpsert = updatedOrder.notes.map(n => ({
          id: n.id.startsWith('NOTE-') ? undefined : n.id,
          order_id: updatedOrder.id,
          content: n.content,
          created_at: n.createdAt
      }));
      const sanitizedNotes = notesUpsert.map(({id, ...rest}) => id ? {id, ...rest} : rest);
      await supabase.from('order_notes').upsert(sanitizedNotes);
    }

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

    return (await getSupabaseOrderById(updatedOrder.id))!;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const deleteSupabaseOrder = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

export const addSupabasePayment = async (orderId: string, payment: Omit<Payment, 'id'>): Promise<Order> => {
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
    const freshOrder = await getSupabaseOrderById(orderId);
    if (!freshOrder) throw new Error("Order not found after adding payment");

    // 3. Logic to auto-complete order if paid in full
    const totalPaid = freshOrder.payments.reduce((acc, p) => acc + p.amount, 0);
    
    if (totalPaid >= freshOrder.totalAmount && freshOrder.status === OrderStatus.PENDING_PAYMENT) {
        await updateSupabaseOrder({ ...freshOrder, status: OrderStatus.COMPLETED });
        freshOrder.status = OrderStatus.COMPLETED;
    }

    return freshOrder;
  } catch (error) {
    console.error('Error adding payment:', error);
    throw error;
  }
};
