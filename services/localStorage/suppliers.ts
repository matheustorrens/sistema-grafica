
import { Supplier } from '../../types';

const STORAGE_KEY = 'demo_suppliers';

const getLocal = (): Supplier[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
     const defaultSuppliers = [
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
    // Simulate network delay
    await new Promise(r => setTimeout(r, 300));
    return getLocal();
};

export const createLocalSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier> => {
    await new Promise(r => setTimeout(r, 300));
    const suppliers = getLocal();
    const newSupplier = {
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
