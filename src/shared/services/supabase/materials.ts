/**
 * Supabase Materials Service
 * Handles all material-related database operations
 */

import { supabase, getCurrentTenantId } from './client';
import { Material, MaterialStatus } from '@/shared/types';

const mapMaterialFromDB = (row: any): Material => ({
  id: row.id,
  name: row.name,
  quantity: Number(row.quantity) || 0,
  currentQuantity: Number(row.current_quantity || 0),
  unit: row.unit || '',
  status: row.status,
  estimatedCost: row.estimated_cost,
  supplierIds: row.supplier_ids || [],
  linkedOrderId: row.linked_order_id
});

export const getSupabaseMaterials = async (): Promise<Material[]> => {
  try {
    const { data, error } = await supabase.from('materials').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapMaterialFromDB);
  } catch (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
};

export const createSupabaseMaterial = async (materialData: Partial<Material>): Promise<Material> => {
  try {
    // Get tenant_id for multi-tenant isolation
    const tenantId = await getCurrentTenantId();
    
    const dbMaterial = {
      name: materialData.name,
      quantity: materialData.quantity,
      current_quantity: materialData.currentQuantity,
      unit: materialData.unit,
      status: materialData.status,
      estimated_cost: materialData.estimatedCost,
      supplier_ids: materialData.supplierIds,
      linked_order_id: materialData.linkedOrderId,
      tenant_id: tenantId // Multi-tenant support
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
};

export const updateSupabaseMaterial = async (updatedMaterial: Material): Promise<Material> => {
  try {
    const dbMaterial = {
      name: updatedMaterial.name,
      quantity: updatedMaterial.quantity,
      current_quantity: updatedMaterial.currentQuantity,
      unit: updatedMaterial.unit,
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
};

export const updateSupabaseMaterialStatus = async (id: string, newStatus: MaterialStatus): Promise<Material> => {
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
};

export const deleteSupabaseMaterial = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
};
