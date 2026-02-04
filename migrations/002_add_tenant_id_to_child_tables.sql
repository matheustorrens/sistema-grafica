-- ==============================================================================
-- Migration 002: Add tenant_id to child tables
-- ==============================================================================
-- 
-- This migration:
-- 1. Removes old RLS policies (that use subquery via order_id)
-- 2. Adds tenant_id column to: payments, order_items, order_notes, order_attachments
-- 3. Backfills tenant_id from parent orders table
-- 4. Creates new RLS policies using tenant_id directly (better performance)
--
-- RUN THIS IN STAGING FIRST, THEN IN PRODUCTION AFTER VALIDATION
-- ==============================================================================

-- ============================================
-- STEP 1: Remove OLD RLS policies (subquery-based)
-- ============================================
-- These are the policies from the original migration that use order_id subquery

DROP POLICY IF EXISTS "Tenant isolation for payments" ON payments;
DROP POLICY IF EXISTS "Tenant isolation for order_items" ON order_items;
DROP POLICY IF EXISTS "Tenant isolation for order_notes" ON order_notes;
DROP POLICY IF EXISTS "Tenant isolation for order_attachments" ON order_attachments;

-- ============================================
-- STEP 2: Add tenant_id column to each table
-- ============================================

-- 2.1 PAYMENTS
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 2.2 ORDER_ITEMS
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 2.3 ORDER_NOTES
ALTER TABLE order_notes 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 2.4 ORDER_ATTACHMENTS
ALTER TABLE order_attachments 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- ============================================
-- STEP 3: Backfill tenant_id from orders table
-- ============================================
-- Derive tenant_id from the parent order

-- 3.1 PAYMENTS
UPDATE payments p
SET tenant_id = o.tenant_id
FROM orders o
WHERE p.order_id = o.id
AND p.tenant_id IS NULL;

-- 3.2 ORDER_ITEMS
UPDATE order_items oi
SET tenant_id = o.tenant_id
FROM orders o
WHERE oi.order_id = o.id
AND oi.tenant_id IS NULL;

-- 3.3 ORDER_NOTES
UPDATE order_notes nt
SET tenant_id = o.tenant_id
FROM orders o
WHERE nt.order_id = o.id
AND nt.tenant_id IS NULL;

-- 3.4 ORDER_ATTACHMENTS
UPDATE order_attachments att
SET tenant_id = o.tenant_id
FROM orders o
WHERE att.order_id = o.id
AND att.tenant_id IS NULL;

-- ============================================
-- STEP 4: Verify backfill before making NOT NULL
-- ============================================
-- Run this SELECT to check if any rows are missing tenant_id
-- If count > 0, investigate before proceeding!

-- SELECT 'payments' as tbl, COUNT(*) as missing FROM payments WHERE tenant_id IS NULL
-- UNION ALL SELECT 'order_items', COUNT(*) FROM order_items WHERE tenant_id IS NULL
-- UNION ALL SELECT 'order_notes', COUNT(*) FROM order_notes WHERE tenant_id IS NULL
-- UNION ALL SELECT 'order_attachments', COUNT(*) FROM order_attachments WHERE tenant_id IS NULL;

-- ============================================
-- STEP 5: Make tenant_id NOT NULL (after backfill verified)
-- ============================================
-- IMPORTANT: Only run this if STEP 4 shows 0 missing rows!
-- If you have orphan rows, you need to fix them first.

-- Uncomment these after verifying backfill:
-- ALTER TABLE payments ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE order_items ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE order_notes ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE order_attachments ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================
-- STEP 6: Add indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_tenant_id ON order_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_attachments_tenant_id ON order_attachments(tenant_id);

-- ============================================
-- STEP 7: Create NEW RLS policies (direct tenant_id)
-- ============================================
-- These policies use tenant_id directly (much better performance than subquery)

-- 7.1 PAYMENTS POLICY
CREATE POLICY "Tenant isolation for payments" ON payments
  FOR ALL
  TO PUBLIC
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 7.2 ORDER_ITEMS POLICY
CREATE POLICY "Tenant isolation for order_items" ON order_items
  FOR ALL
  TO PUBLIC
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 7.3 ORDER_NOTES POLICY
CREATE POLICY "Tenant isolation for order_notes" ON order_notes
  FOR ALL
  TO PUBLIC
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 7.4 ORDER_ATTACHMENTS POLICY
CREATE POLICY "Tenant isolation for order_attachments" ON order_attachments
  FOR ALL
  TO PUBLIC
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================
-- STEP 8: Verification queries (run after migration)
-- ============================================

-- 8.1 Check if all tables have tenant_id column
SELECT 
  'payments' as table_name, COUNT(*) as total, COUNT(tenant_id) as with_tenant 
FROM payments
UNION ALL
SELECT 
  'order_items', COUNT(*), COUNT(tenant_id) 
FROM order_items
UNION ALL
SELECT 
  'order_notes', COUNT(*), COUNT(tenant_id) 
FROM order_notes
UNION ALL
SELECT 
  'order_attachments', COUNT(*), COUNT(tenant_id) 
FROM order_attachments;

-- 8.2 Check RLS policies are in place
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('payments', 'order_items', 'order_notes', 'order_attachments')
ORDER BY tablename;

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
