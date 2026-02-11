/**
 * Revenue Adjustments LocalStorage Service
 * 
 * Demo mode fallback for revenue adjustments.
 * Uses localStorage to persist data for demo purposes.
 */

import { RevenueAdjustment, CreateRevenueAdjustmentData } from '@/shared/types';

const STORAGE_KEY = 'printmaster_revenue_adjustments';

/**
 * Get adjustments from localStorage
 */
const getAdjustmentsFromStorage = (): RevenueAdjustment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Save adjustments to localStorage
 */
const saveAdjustmentsToStorage = (adjustments: RevenueAdjustment[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(adjustments));
};

/**
 * Generate a unique ID
 */
const generateId = (): string => {
  return `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all revenue adjustments (excluding reversed)
 */
export const getLocalRevenueAdjustments = (): RevenueAdjustment[] => {
  return getAdjustmentsFromStorage().filter(adj => !adj.isReversed);
};

/**
 * Get revenue adjustments filtered by date range
 */
export const getLocalRevenueAdjustmentsByDateRange = (
  startDate: string,
  endDate: string
): RevenueAdjustment[] => {
  const adjustments = getLocalRevenueAdjustments();
  
  return adjustments.filter(adj => {
    return adj.adjustmentDate >= startDate && adj.adjustmentDate <= endDate;
  });
};

/**
 * Get all adjustments including reversed (for history)
 */
export const getLocalRevenueAdjustmentsHistory = (): RevenueAdjustment[] => {
  return getAdjustmentsFromStorage();
};

/**
 * Create a new revenue adjustment
 */
export const createLocalRevenueAdjustment = (
  data: CreateRevenueAdjustmentData
): RevenueAdjustment => {
  const adjustments = getAdjustmentsFromStorage();
  
  const newAdjustment: RevenueAdjustment = {
    id: generateId(),
    adjustmentDate: data.adjustmentDate || new Date().toISOString().split('T')[0],
    amount: data.amount,
    note: data.note,
    createdAt: new Date().toISOString(),
    isReversed: false
  };

  adjustments.unshift(newAdjustment);
  saveAdjustmentsToStorage(adjustments);
  
  return newAdjustment;
};

/**
 * Reverse (soft delete) a revenue adjustment
 */
export const reverseLocalRevenueAdjustment = (adjustmentId: string): void => {
  const adjustments = getAdjustmentsFromStorage();
  
  const index = adjustments.findIndex(adj => adj.id === adjustmentId);
  if (index !== -1) {
    adjustments[index] = {
      ...adjustments[index],
      isReversed: true,
      reversedAt: new Date().toISOString()
    };
    saveAdjustmentsToStorage(adjustments);
  }
};

/**
 * Calculate totals for a date range
 */
export const calculateLocalAdjustmentsTotals = (
  startDate: string,
  endDate: string
): { totalAdded: number; totalSubtracted: number; netAdjustment: number } => {
  const adjustments = getLocalRevenueAdjustmentsByDateRange(startDate, endDate);
  
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
};
