/**
 * Revenue Adjustments Service
 * 
 * Handles CRUD operations for manual revenue adjustments.
 * Used by the "Receita Total" badge on the Dashboard.
 */

import { supabase } from './client';
import { RevenueAdjustment, CreateRevenueAdjustmentData } from '@/shared/types';

/**
 * Map database row to RevenueAdjustment type
 */
const mapAdjustmentFromDB = (row: any): RevenueAdjustment => ({
  id: row.id,
  tenantId: row.tenant_id,
  adjustmentDate: row.adjustment_date,
  amount: parseFloat(row.amount),
  note: row.note,
  createdAt: row.created_at,
  isReversed: row.is_reversed || false,
  reversedAt: row.reversed_at,
  reversedById: row.reversed_by_id
});

/**
 * Get all revenue adjustments for the current tenant
 * Excludes reversed adjustments
 */
export const getSupabaseRevenueAdjustments = async (): Promise<RevenueAdjustment[]> => {
  try {
    const { data, error } = await supabase
      .from('revenue_adjustments')
      .select('*')
      .eq('is_reversed', false)
      .order('adjustment_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAdjustmentFromDB);
  } catch (error) {
    console.error('Error fetching revenue adjustments:', error);
    return [];
  }
};

/**
 * Get revenue adjustments filtered by date range
 */
export const getSupabaseRevenueAdjustmentsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<RevenueAdjustment[]> => {
  try {
    const { data, error } = await supabase
      .from('revenue_adjustments')
      .select('*')
      .eq('is_reversed', false)
      .gte('adjustment_date', startDate)
      .lte('adjustment_date', endDate)
      .order('adjustment_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAdjustmentFromDB);
  } catch (error) {
    console.error('Error fetching revenue adjustments by date range:', error);
    return [];
  }
};

/**
 * Get all adjustments including reversed (for history view)
 */
export const getSupabaseRevenueAdjustmentsHistory = async (): Promise<RevenueAdjustment[]> => {
  try {
    const { data, error } = await supabase
      .from('revenue_adjustments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAdjustmentFromDB);
  } catch (error) {
    console.error('Error fetching revenue adjustments history:', error);
    return [];
  }
};

/**
 * Create a new revenue adjustment
 */
export const createSupabaseRevenueAdjustment = async (
  data: CreateRevenueAdjustmentData
): Promise<RevenueAdjustment> => {
  try {
    const dbData = {
      adjustment_date: data.adjustmentDate || new Date().toISOString().split('T')[0],
      amount: data.amount,
      note: data.note || null
    };

    const { data: result, error } = await supabase
      .from('revenue_adjustments')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return mapAdjustmentFromDB(result);
  } catch (error) {
    console.error('Error creating revenue adjustment:', error);
    throw error;
  }
};

/**
 * Reverse (soft delete) a revenue adjustment
 * Creates a compensating entry and marks the original as reversed
 */
export const reverseSupabaseRevenueAdjustment = async (
  adjustmentId: string
): Promise<void> => {
  try {
    // Mark the adjustment as reversed
    const { error } = await supabase
      .from('revenue_adjustments')
      .update({
        is_reversed: true,
        reversed_at: new Date().toISOString()
      })
      .eq('id', adjustmentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error reversing revenue adjustment:', error);
    throw error;
  }
};

/**
 * Calculate total adjustments for a date range
 * Returns: { totalAdded, totalSubtracted, netAdjustment }
 */
export const calculateSupabaseAdjustmentsTotals = async (
  startDate: string,
  endDate: string
): Promise<{ totalAdded: number; totalSubtracted: number; netAdjustment: number }> => {
  try {
    const adjustments = await getSupabaseRevenueAdjustmentsByDateRange(startDate, endDate);
    
    let totalAdded = 0;
    let totalSubtracted = 0;

    adjustments.forEach(adj => {
      if (adj.amount > 0) {
        totalAdded += adj.amount;
      } else {
        totalSubtracted += Math.abs(adj.amount);
      }
    });

    return {
      totalAdded,
      totalSubtracted,
      netAdjustment: totalAdded - totalSubtracted
    };
  } catch (error) {
    console.error('Error calculating adjustment totals:', error);
    return { totalAdded: 0, totalSubtracted: 0, netAdjustment: 0 };
  }
};
