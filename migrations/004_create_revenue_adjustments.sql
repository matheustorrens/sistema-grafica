-- ==============================================================================
-- Migration 004: Create revenue_adjustments table
-- ==============================================================================
-- 
-- This migration creates the table for manual revenue adjustments.
-- Used by the "Receita Total" badge on the Dashboard.
-- 
-- Purpose:
-- - Allow users to add/subtract manual adjustments to track real revenue
-- - The badge shows: Total from orders + Manual adjustments
-- - Users can only subtract up to the amount they manually added
--
-- RUN THIS IN STAGING (PrintMaster-Staging) FIRST FOR TESTING!
-- ==============================================================================

-- ============================================
-- STEP 1: Create the revenue_adjustments table
-- ============================================

CREATE TABLE IF NOT EXISTS revenue_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    
    -- Date of the adjustment (used for period filtering)
    adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Positive = added revenue, Negative = subtracted
    amount NUMERIC(10, 2) NOT NULL,
    
    -- Optional note explaining the adjustment
    note TEXT,
    
    -- Timestamp for history tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- For soft delete / reversal tracking
    is_reversed BOOLEAN DEFAULT FALSE,
    reversed_at TIMESTAMPTZ,
    reversed_by_id UUID  -- Reference to the adjustment that reversed this one
);

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================

-- Index for tenant filtering (essential for multi-tenant)
CREATE INDEX IF NOT EXISTS idx_revenue_adjustments_tenant_id 
ON revenue_adjustments(tenant_id);

-- Index for date-based filtering (for period filters like 7D, 30D, etc.)
CREATE INDEX IF NOT EXISTS idx_revenue_adjustments_date 
ON revenue_adjustments(adjustment_date DESC);

-- Composite index for common query pattern: tenant + date range + active
CREATE INDEX IF NOT EXISTS idx_revenue_adjustments_tenant_date_active
ON revenue_adjustments(tenant_id, adjustment_date DESC) 
WHERE is_reversed = FALSE;

-- ============================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE revenue_adjustments ENABLE ROW LEVEL SECURITY;

-- Policy for tenant isolation (users can only see their own tenant's adjustments)
CREATE POLICY "Tenant isolation for revenue_adjustments" ON revenue_adjustments
    FOR ALL
    USING (
        tenant_id = (
            SELECT tenant_id FROM user_tenants 
            WHERE user_id = auth.uid() 
            LIMIT 1
        )
    );

-- ============================================
-- STEP 4: Add comments for documentation
-- ============================================

COMMENT ON TABLE revenue_adjustments IS 
'Manual revenue adjustments for the Dashboard "Receita Total" badge. Tracks added/subtracted amounts by users.';

COMMENT ON COLUMN revenue_adjustments.amount IS 
'Positive for additions, negative for subtractions. Subtractions are limited to the total of previous positive adjustments.';

COMMENT ON COLUMN revenue_adjustments.is_reversed IS 
'Soft delete flag. When true, this adjustment is excluded from calculations.';

-- ============================================
-- STEP 5: (Alternative) Disable RLS for MVP testing
-- ============================================
-- Uncomment this if you want to test without RLS first
-- (useful for initial staging tests)

-- ALTER TABLE revenue_adjustments DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
