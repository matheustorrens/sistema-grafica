-- PrintMaster ERP - Supabase Schema
-- Run this script in the Supabase SQL Editor

-- Enable UUID extension (usually enabled by default, but good practice)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  description TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  note TEXT
);

-- 3. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- 4. ORDER NOTES TABLE
CREATE TABLE IF NOT EXISTS order_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDER ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS order_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUPPLIERS TABLE
-- Created before materials to act as reference if needed in future, 
-- though materials uses an array of IDs currently.
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  tags TEXT[] -- Array of text for tags like ['Paper', 'Ink']
);

-- 7. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity TEXT, -- Text because it can be "500 sheets", "2 Liters"
  status TEXT NOT NULL,
  estimated_cost NUMERIC(10, 2) DEFAULT 0,
  supplier_ids TEXT[], -- Array of Supplier UUIDs
  linked_order_id UUID REFERENCES orders(id) ON DELETE SET NULL -- If order is deleted, keep material but remove link
);

-- --- INDEXES FOR PERFORMANCE ---

-- Indexes on Foreign Keys
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_attachments_order_id ON order_attachments(order_id);
CREATE INDEX IF NOT EXISTS idx_materials_linked_order_id ON materials(linked_order_id);

-- Indexes on Frequently Filtered/Sorted Columns
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_name ON orders(client_name);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);

-- --- DISABLE ROW LEVEL SECURITY (RLS) FOR MVP ---
-- This allows public access with the anon key without writing policies yet.
-- WARNING: Enable RLS and write policies before going to production with real user data.

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- --- COMMENTS ---
COMMENT ON TABLE orders IS 'Core table for print jobs and services';
COMMENT ON TABLE payments IS 'Financial records linked to specific orders';
COMMENT ON TABLE materials IS 'Inventory and production items, can be linked to orders';
