
import { supabase } from './client';
import { Supplier } from '../../types';

const mapSupplierFromDB = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  tags: row.tags || []
});

export const getSupabaseSuppliers = async (): Promise<Supplier[]> => {
  try {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapSupplierFromDB);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
};

export const createSupabaseSupplier = async (supplier: Partial<Supplier>): Promise<Supplier> => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: supplier.name,
        phone: supplier.phone,
        tags: supplier.tags
      })
      .select()
      .single();

    if (error) throw error;
    return mapSupplierFromDB(data);
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

export const updateSupabaseSupplier = async (supplier: Supplier): Promise<Supplier> => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name: supplier.name,
        phone: supplier.phone,
        tags: supplier.tags
      })
      .eq('id', supplier.id)
      .select()
      .single();

    if (error) throw error;
    return mapSupplierFromDB(data);
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

export const deleteSupabaseSupplier = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};
