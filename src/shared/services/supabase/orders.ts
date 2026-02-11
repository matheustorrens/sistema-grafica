/**
 * Supabase Orders Service
 * Handles all order-related database operations
 */

import { supabase, getCurrentTenantId } from './client';
import { Order, OrderStatus, Payment } from '@/shared/types';

const mapOrderFromDB = (row: any): Order => {
  return {
    id: row.id,
    orderNumber: row.order_number,
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
      name: i.name,
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
    // Get tenant_id for multi-tenant isolation
    const tenantId = await getCurrentTenantId();
    
    const dbOrder = {
      client_name: orderData.clientName,
      client_phone: orderData.clientPhone,
      description: orderData.description,
      total_amount: orderData.totalAmount,
      status: orderData.status || OrderStatus.QUOTE,
      deadline: orderData.deadline,
      created_at: new Date().toISOString(),
      tenant_id: tenantId // Multi-tenant support
    };

    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert(dbOrder)
      .select()
      .single();

    if (error) throw error;

    if (orderData.items && orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map(item => ({
        order_id: newOrder.id,
        name: item.name || '',
        description: item.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unitPrice,
        tenant_id: tenantId
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
      }
    }

    return (await getSupabaseOrderById(newOrder.id)) as Order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateSupabaseOrder = async (updatedOrder: Order): Promise<Order> => {
  try {
    // Get tenant_id for multi-tenant isolation
    const tenantId = await getCurrentTenantId();
    
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

    if (updatedOrder.notes && updatedOrder.notes.length > 0) {
      const notesUpsert = updatedOrder.notes.map(n => ({
        id: n.id.startsWith('NOTE-') ? undefined : n.id,
        order_id: updatedOrder.id,
        content: n.content,
        created_at: n.createdAt,
        tenant_id: tenantId
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
        created_at: a.createdAt,
        tenant_id: tenantId
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
    // Get tenant_id for multi-tenant isolation
    const tenantId = await getCurrentTenantId();
    
    const { error: payError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount: payment.amount,
        date: payment.date,
        note: payment.note,
        tenant_id: tenantId
      });

    if (payError) throw payError;

    const freshOrder = await getSupabaseOrderById(orderId);
    if (!freshOrder) throw new Error("Order not found after adding payment");

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

export const deleteSupabasePayment = async (orderId: string, paymentId: string): Promise<Order> => {
  try {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw error;

    const freshOrder = await getSupabaseOrderById(orderId);
    if (!freshOrder) throw new Error("Order not found after deleting payment");

    return freshOrder;
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};

// ============================================
// ORDER ITEMS CRUD
// ============================================

// Helper to generate description from items
const generateDescriptionFromItems = (items: { name?: string; description?: string }[]): string => {
  return items
    .map(i => i.name || i.description || '')
    .filter(Boolean)
    .join(' / ');
};

export const addSupabaseOrderItem = async (orderId: string, item: { name: string; unitPrice: number; quantity?: number; description: string }): Promise<Order> => {
  try {
    const tenantId = await getCurrentTenantId();
    
    const { error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        name: item.name,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unitPrice,
        tenant_id: tenantId
      });

    if (error) throw error;

    // Update order total and description
    const freshOrder = await getSupabaseOrderById(orderId);
    if (!freshOrder) throw new Error("Order not found");
    
    const newTotal = freshOrder.items.reduce((acc, i) => acc + (i.unitPrice * (i.quantity || 1)), 0);
    const newDescription = generateDescriptionFromItems(freshOrder.items);
    await supabase.from('orders').update({ total_amount: newTotal, description: newDescription }).eq('id', orderId);

    return (await getSupabaseOrderById(orderId))!;
  } catch (error) {
    console.error('Error adding order item:', error);
    throw error;
  }
};

export const updateSupabaseOrderItem = async (orderId: string, itemId: string, item: { name: string; unitPrice: number; quantity?: number; description: string }): Promise<Order> => {
  try {
    const { error } = await supabase
      .from('order_items')
      .update({
        name: item.name,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unitPrice
      })
      .eq('id', itemId);

    if (error) throw error;

    // Update order total and description
    const freshOrder = await getSupabaseOrderById(orderId);
    if (!freshOrder) throw new Error("Order not found");
    
    const newTotal = freshOrder.items.reduce((acc, i) => acc + (i.unitPrice * (i.quantity || 1)), 0);
    const newDescription = generateDescriptionFromItems(freshOrder.items);
    await supabase.from('orders').update({ total_amount: newTotal, description: newDescription }).eq('id', orderId);

    return (await getSupabaseOrderById(orderId))!;
  } catch (error) {
    console.error('Error updating order item:', error);
    throw error;
  }
};

export const deleteSupabaseOrderItem = async (orderId: string, itemId: string): Promise<Order> => {
  try {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Update order total and description
    const freshOrder = await getSupabaseOrderById(orderId);
    if (!freshOrder) throw new Error("Order not found");
    
    const newTotal = freshOrder.items.reduce((acc, i) => acc + (i.unitPrice * (i.quantity || 1)), 0);
    const newDescription = generateDescriptionFromItems(freshOrder.items);
    await supabase.from('orders').update({ total_amount: newTotal, description: newDescription || 'Sem itens' }).eq('id', orderId);

    return freshOrder;
  } catch (error) {
    console.error('Error deleting order item:', error);
    throw error;
  }
};
