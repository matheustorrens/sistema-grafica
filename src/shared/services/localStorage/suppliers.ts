/**
 * LocalStorage Suppliers Service
 * Used in demo mode to persist suppliers in browser storage
 */

import { Supplier } from '@/shared/types';
import { STORAGE_KEYS } from '@/config';

const STORAGE_KEY = STORAGE_KEYS.SUPPLIERS_CACHE;

const getLocal = (): Supplier[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const defaultSuppliers: Supplier[] = [
      { id: 'SUP-DEMO-1', name: 'Fornecedor Exemplo', phone: '5511999999999', tags: ['Papel', 'Tinta'] }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSuppliers));
    return defaultSuppliers;
  }
  return JSON.parse(data);
};

const setLocal = (data: Supplier[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getLocalSuppliers = async (): Promise<Supplier[]> => {
  await new Promise(r => setTimeout(r, 300));
  return getLocal();
};

export const createLocalSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier> => {
  await new Promise(r => setTimeout(r, 300));
  const suppliers = getLocal();
  const newSupplier: Supplier = {
    ...supplierData as Supplier,
    id: `SUP-${Date.now()}`
  };
  suppliers.push(newSupplier);
  setLocal(suppliers);
  return newSupplier;
};

export const updateLocalSupplier = async (updatedSupplier: Supplier): Promise<Supplier> => {
  await new Promise(r => setTimeout(r, 300));
  const suppliers = getLocal();
  const index = suppliers.findIndex(s => s.id === updatedSupplier.id);
  if (index !== -1) {
    suppliers[index] = updatedSupplier;
    setLocal(suppliers);
    return updatedSupplier;
  }
  throw new Error('Supplier not found');
};

export const deleteLocalSupplier = async (id: string): Promise<void> => {
  await new Promise(r => setTimeout(r, 300));
  const suppliers = getLocal();
  const filtered = suppliers.filter(s => s.id !== id);
  setLocal(filtered);
};
