/**
 * API Service
 * 
 * Unified API layer that abstracts the data source (Supabase or LocalStorage).
 * In demo mode, uses LocalStorage. In production, uses Supabase.
 */

import { IS_DEMO_MODE } from './supabase/client';
import * as localStorageService from './localStorage';
import * as supabaseService from './supabase';
import { Order, Material, Payment, Supplier, MaterialStatus, RevenueAdjustment, CreateRevenueAdjustmentData } from '@/shared/types';

export const api = {
  // ============================================
  // ORDERS & PAYMENTS
  // ============================================

  getOrders: async (): Promise<Order[]> => {
    if (IS_DEMO_MODE) {
      return localStorageService.getLocalOrders();
    }
    return supabaseService.getSupabaseOrders();
  },

  getOrderById: async (id: string): Promise<Order | undefined> => {
    if (IS_DEMO_MODE) {
      return localStorageService.getLocalOrderById(id);
    }
    return supabaseService.getSupabaseOrderById(id);
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    if (IS_DEMO_MODE) {
      return localStorageService.createLocalOrder(orderData);
    }
    return supabaseService.createSupabaseOrder(orderData);
  },

  updateOrder: async (updatedOrder: Order): Promise<Order> => {
    if (IS_DEMO_MODE) {
      return localStorageService.updateLocalOrder(updatedOrder);
    }
    return supabaseService.updateSupabaseOrder(updatedOrder);
  },

  deleteOrder: async (id: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      return localStorageService.deleteLocalOrder(id);
    }
    return supabaseService.deleteSupabaseOrder(id);
  },

  addPayment: async (orderId: string, payment: Omit<Payment, 'id'>): Promise<Order> => {
    if (IS_DEMO_MODE) {
      return localStorageService.addLocalPayment(orderId, payment);
    }
    return supabaseService.addSupabasePayment(orderId, payment);
  },

  deletePayment: async (orderId: string, paymentId: string): Promise<Order> => {
    if (IS_DEMO_MODE) {
      throw new Error('Not implemented in demo mode');
    }
    return supabaseService.deleteSupabasePayment(orderId, paymentId);
  },

  // ============================================
  // ORDER ITEMS
  // ============================================

  addOrderItem: async (orderId: string, item: { name: string; unitPrice: number; quantity?: number; description: string }): Promise<Order> => {
    if (IS_DEMO_MODE) {
      // For demo mode, we'll skip this for now
      throw new Error('Not implemented in demo mode');
    }
    return supabaseService.addSupabaseOrderItem(orderId, item);
  },

  updateOrderItem: async (orderId: string, itemId: string, item: { name: string; unitPrice: number; quantity?: number; description: string }): Promise<Order> => {
    if (IS_DEMO_MODE) {
      throw new Error('Not implemented in demo mode');
    }
    return supabaseService.updateSupabaseOrderItem(orderId, itemId, item);
  },

  deleteOrderItem: async (orderId: string, itemId: string): Promise<Order> => {
    if (IS_DEMO_MODE) {
      throw new Error('Not implemented in demo mode');
    }
    return supabaseService.deleteSupabaseOrderItem(orderId, itemId);
  },

  // ============================================
  // MATERIALS
  // ============================================

  getMaterials: async (): Promise<Material[]> => {
    if (IS_DEMO_MODE) {
      return localStorageService.getLocalMaterials();
    }
    return supabaseService.getSupabaseMaterials();
  },

  createMaterial: async (materialData: Partial<Material>): Promise<Material> => {
    if (IS_DEMO_MODE) {
      return localStorageService.createLocalMaterial(materialData);
    }
    return supabaseService.createSupabaseMaterial(materialData);
  },

  updateMaterial: async (updatedMaterial: Material): Promise<Material> => {
    if (IS_DEMO_MODE) {
      return localStorageService.updateLocalMaterial(updatedMaterial);
    }
    return supabaseService.updateSupabaseMaterial(updatedMaterial);
  },

  updateMaterialStatus: async (id: string, newStatus: MaterialStatus): Promise<Material> => {
    if (IS_DEMO_MODE) {
      return localStorageService.updateLocalMaterialStatus(id, newStatus);
    }
    return supabaseService.updateSupabaseMaterialStatus(id, newStatus);
  },

  deleteMaterial: async (id: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      return localStorageService.deleteLocalMaterial(id);
    }
    return supabaseService.deleteSupabaseMaterial(id);
  },

  // ============================================
  // SUPPLIERS
  // ============================================

  getSuppliers: async (): Promise<Supplier[]> => {
    if (IS_DEMO_MODE) {
      return localStorageService.getLocalSuppliers();
    }
    return supabaseService.getSupabaseSuppliers();
  },

  createSupplier: async (supplierData: Partial<Supplier>): Promise<Supplier> => {
    if (IS_DEMO_MODE) {
      return localStorageService.createLocalSupplier(supplierData);
    }
    return supabaseService.createSupabaseSupplier(supplierData);
  },

  updateSupplier: async (updatedSupplier: Supplier): Promise<Supplier> => {
    if (IS_DEMO_MODE) {
      return localStorageService.updateLocalSupplier(updatedSupplier);
    }
    return supabaseService.updateSupabaseSupplier(updatedSupplier);
  },

  deleteSupplier: async (id: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      return localStorageService.deleteLocalSupplier(id);
    }
    return supabaseService.deleteSupabaseSupplier(id);
  },

  // ============================================
  // REVENUE ADJUSTMENTS
  // ============================================

  getRevenueAdjustments: async (): Promise<RevenueAdjustment[]> => {
    if (IS_DEMO_MODE) {
      return localStorageService.getLocalRevenueAdjustments();
    }
    return supabaseService.getSupabaseRevenueAdjustments();
  },

  getRevenueAdjustmentsByDateRange: async (startDate: string, endDate: string): Promise<RevenueAdjustment[]> => {
    if (IS_DEMO_MODE) {
      return localStorageService.getLocalRevenueAdjustmentsByDateRange(startDate, endDate);
    }
    return supabaseService.getSupabaseRevenueAdjustmentsByDateRange(startDate, endDate);
  },

  getRevenueAdjustmentsHistory: async (): Promise<RevenueAdjustment[]> => {
    if (IS_DEMO_MODE) {
      return localStorageService.getLocalRevenueAdjustmentsHistory();
    }
    return supabaseService.getSupabaseRevenueAdjustmentsHistory();
  },

  createRevenueAdjustment: async (data: CreateRevenueAdjustmentData): Promise<RevenueAdjustment> => {
    if (IS_DEMO_MODE) {
      return localStorageService.createLocalRevenueAdjustment(data);
    }
    return supabaseService.createSupabaseRevenueAdjustment(data);
  },

  reverseRevenueAdjustment: async (adjustmentId: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      return localStorageService.reverseLocalRevenueAdjustment(adjustmentId);
    }
    return supabaseService.reverseSupabaseRevenueAdjustment(adjustmentId);
  },

  calculateAdjustmentsTotals: async (startDate: string, endDate: string): Promise<{ totalAdded: number; totalSubtracted: number; netAdjustment: number }> => {
    if (IS_DEMO_MODE) {
      return localStorageService.calculateLocalAdjustmentsTotals(startDate, endDate);
    }
    return supabaseService.calculateSupabaseAdjustmentsTotals(startDate, endDate);
  }
};

export default api;
