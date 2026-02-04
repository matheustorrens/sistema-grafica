/**
 * LocalStorage Materials Service
 * Used in demo mode to persist materials in browser storage
 */

import { Material, MaterialStatus } from '@/shared/types';
import { STORAGE_KEYS } from '@/config';

const STORAGE_KEY = STORAGE_KEYS.MATERIALS_CACHE;

const getLocal = (): Material[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
};

const setLocal = (data: Material[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getLocalMaterials = (): Material[] => {
  return getLocal();
};

export const createLocalMaterial = (materialData: Partial<Material>): Material => {
  const materials = getLocal();
  const newMaterial: Material = {
    ...materialData as Material,
    id: `mat-${Date.now()}`,
    supplierIds: materialData.supplierIds || []
  };
  materials.push(newMaterial);
  setLocal(materials);
  return newMaterial;
};

export const updateLocalMaterial = (updatedMaterial: Material): Material => {
  const materials = getLocal();
  const index = materials.findIndex(m => m.id === updatedMaterial.id);
  if (index !== -1) {
    materials[index] = updatedMaterial;
    setLocal(materials);
    return updatedMaterial;
  }
  throw new Error("Material not found");
};

export const updateLocalMaterialStatus = (id: string, newStatus: MaterialStatus): Material => {
  const materials = getLocal();
  const index = materials.findIndex(m => m.id === id);
  if (index !== -1) {
    materials[index].status = newStatus;
    setLocal(materials);
    return materials[index];
  }
  throw new Error("Material not found");
};

export const deleteLocalMaterial = (id: string): void => {
  const materials = getLocal();
  const filtered = materials.filter(m => m.id !== id);
  setLocal(filtered);
};
