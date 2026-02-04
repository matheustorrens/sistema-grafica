-- ==============================================================================
-- Migration 003: PRODUCTION Multi-Tenant Migration
-- ==============================================================================
-- 
-- IMPORTANTE: Executar no Supabase SQL Editor do projeto PRODUÇÃO
-- Data: Fevereiro 2026
-- 
-- Este script transforma o sistema single-tenant em multi-tenant:
-- 1. Cria tabelas tenants e user_tenants
-- 2. Cria funções auxiliares (get_current_tenant_id)
-- 3. Adiciona tenant_id a TODAS as tabelas de dados
-- 4. Migra dados existentes para o primeiro tenant (CJ Multimídia)
-- 5. Habilita RLS em todas as tabelas
-- 
-- BACKUP: Certifique-se de ter feito backup dos dados via CSV antes!
-- ==============================================================================

-- ============================================
-- PARTE 1: CRIAR ESTRUTURA DE TENANTS
-- ============================================

-- 1.1 Tabela de Tenants (empresas/clientes do SaaS)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- 1.2 Tabela de relação User <-> Tenant
CREATE TABLE IF NOT EXISTS user_tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- 1.3 Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- ============================================
-- PARTE 2: CRIAR FUNÇÃO get_current_tenant_id()
-- ============================================

-- Esta função retorna o tenant_id do usuário logado
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant UUID;
BEGIN
  -- Busca o tenant do usuário autenticado
  SELECT ut.tenant_id INTO tenant
  FROM user_tenants ut
  WHERE ut.user_id = auth.uid()
  LIMIT 1;
  
  RETURN tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- PARTE 3: CRIAR PRIMEIRO TENANT (CJ MULTIMÍDIA)
-- ============================================

-- Inserir o tenant do cliente atual
INSERT INTO tenants (name, slug, settings)
VALUES (
  'CJ Multimídia',
  'cjmultimidia',
  '{"plan": "basic", "maxUsers": 5}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PARTE 4: ASSOCIAR USUÁRIO AO TENANT
-- ============================================

-- Buscar o usuário pelo email e associar ao tenant
-- IMPORTANTE: Ajuste o email se necessário!
DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Buscar o tenant
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'cjmultimidia';
  
  -- Buscar o usuário (ajuste o email se necessário)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'cjmultimidia@hotmail.com';
  
  -- Se encontrou ambos, criar a associação
  IF v_tenant_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO user_tenants (user_id, tenant_id, role)
    VALUES (v_user_id, v_tenant_id, 'owner')
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
    
    RAISE NOTICE 'Usuário associado ao tenant com sucesso!';
  ELSE
    RAISE NOTICE 'Tenant ID: %, User ID: %', v_tenant_id, v_user_id;
    RAISE WARNING 'Não foi possível encontrar tenant ou usuário. Verifique os dados.';
  END IF;
END $$;

-- ============================================
-- PARTE 5: ADICIONAR tenant_id ÀS TABELAS PRINCIPAIS
-- ============================================

-- 5.1 ORDERS
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 5.2 MATERIALS
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 5.3 SUPPLIERS
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 5.4 PAYMENTS
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 5.5 ORDER_ITEMS
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 5.6 ORDER_NOTES
ALTER TABLE order_notes 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 5.7 ORDER_ATTACHMENTS
ALTER TABLE order_attachments 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- ============================================
-- PARTE 6: MIGRAR DADOS EXISTENTES
-- ============================================

-- Migrar todos os dados existentes para o tenant CJ Multimídia
DO $$
DECLARE
  v_tenant_id UUID;
  v_orders_count INTEGER;
  v_payments_count INTEGER;
  v_materials_count INTEGER;
  v_suppliers_count INTEGER;
BEGIN
  -- Buscar o tenant
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'cjmultimidia';
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant cjmultimidia não encontrado!';
  END IF;
  
  -- Migrar ORDERS
  UPDATE orders SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  GET DIAGNOSTICS v_orders_count = ROW_COUNT;
  RAISE NOTICE 'Orders migrados: %', v_orders_count;
  
  -- Migrar PAYMENTS (via join com orders)
  UPDATE payments p
  SET tenant_id = o.tenant_id
  FROM orders o
  WHERE p.order_id = o.id
  AND p.tenant_id IS NULL;
  GET DIAGNOSTICS v_payments_count = ROW_COUNT;
  RAISE NOTICE 'Payments migrados: %', v_payments_count;
  
  -- Migrar ORDER_ITEMS (via join com orders)
  UPDATE order_items oi
  SET tenant_id = o.tenant_id
  FROM orders o
  WHERE oi.order_id = o.id
  AND oi.tenant_id IS NULL;
  RAISE NOTICE 'Order items migrados';
  
  -- Migrar ORDER_NOTES (via join com orders)
  UPDATE order_notes n
  SET tenant_id = o.tenant_id
  FROM orders o
  WHERE n.order_id = o.id
  AND n.tenant_id IS NULL;
  RAISE NOTICE 'Order notes migrados';
  
  -- Migrar ORDER_ATTACHMENTS (via join com orders)
  UPDATE order_attachments a
  SET tenant_id = o.tenant_id
  FROM orders o
  WHERE a.order_id = o.id
  AND a.tenant_id IS NULL;
  RAISE NOTICE 'Order attachments migrados';
  
  -- Migrar MATERIALS
  UPDATE materials SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  GET DIAGNOSTICS v_materials_count = ROW_COUNT;
  RAISE NOTICE 'Materials migrados: %', v_materials_count;
  
  -- Migrar SUPPLIERS
  UPDATE suppliers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  GET DIAGNOSTICS v_suppliers_count = ROW_COUNT;
  RAISE NOTICE 'Suppliers migrados: %', v_suppliers_count;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- PARTE 7: VERIFICAR MIGRAÇÃO
-- ============================================

-- 7.1 Verificar se há registros órfãos (sem tenant_id)
SELECT 'orders' as tabela, COUNT(*) as sem_tenant 
FROM orders WHERE tenant_id IS NULL
UNION ALL
SELECT 'payments', COUNT(*) FROM payments WHERE tenant_id IS NULL
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items WHERE tenant_id IS NULL
UNION ALL
SELECT 'order_notes', COUNT(*) FROM order_notes WHERE tenant_id IS NULL
UNION ALL
SELECT 'order_attachments', COUNT(*) FROM order_attachments WHERE tenant_id IS NULL
UNION ALL
SELECT 'materials', COUNT(*) FROM materials WHERE tenant_id IS NULL
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers WHERE tenant_id IS NULL;

-- SE HOUVER REGISTROS ÓRFÃOS, RESOLVA ANTES DE CONTINUAR!
-- Pode ser necessário deletar ou atribuir manualmente

-- ============================================
-- PARTE 8: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_materials_tenant_id ON materials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_tenant_id ON order_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_attachments_tenant_id ON order_attachments(tenant_id);

-- ============================================
-- PARTE 9: HABILITAR RLS (ROW LEVEL SECURITY)
-- ============================================

-- 9.1 Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 10: CRIAR POLÍTICAS RLS
-- ============================================

-- 10.1 TENANTS - Usuário só vê seu próprio tenant
DROP POLICY IF EXISTS "Users can view their tenant" ON tenants;
CREATE POLICY "Users can view their tenant" ON tenants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- 10.2 USER_TENANTS - Usuário só vê suas associações
DROP POLICY IF EXISTS "Users can view their associations" ON user_tenants;
CREATE POLICY "Users can view their associations" ON user_tenants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 10.3 ORDERS
DROP POLICY IF EXISTS "Tenant isolation for orders" ON orders;
CREATE POLICY "Tenant isolation for orders" ON orders
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 10.4 PAYMENTS
DROP POLICY IF EXISTS "Tenant isolation for payments" ON payments;
CREATE POLICY "Tenant isolation for payments" ON payments
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 10.5 ORDER_ITEMS
DROP POLICY IF EXISTS "Tenant isolation for order_items" ON order_items;
CREATE POLICY "Tenant isolation for order_items" ON order_items
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 10.6 ORDER_NOTES
DROP POLICY IF EXISTS "Tenant isolation for order_notes" ON order_notes;
CREATE POLICY "Tenant isolation for order_notes" ON order_notes
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 10.7 ORDER_ATTACHMENTS
DROP POLICY IF EXISTS "Tenant isolation for order_attachments" ON order_attachments;
CREATE POLICY "Tenant isolation for order_attachments" ON order_attachments
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 10.8 MATERIALS
DROP POLICY IF EXISTS "Tenant isolation for materials" ON materials;
CREATE POLICY "Tenant isolation for materials" ON materials
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- 10.9 SUPPLIERS
DROP POLICY IF EXISTS "Tenant isolation for suppliers" ON suppliers;
CREATE POLICY "Tenant isolation for suppliers" ON suppliers
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================
-- PARTE 11: VERIFICAÇÃO FINAL
-- ============================================

-- 11.1 Verificar tenant criado
SELECT id, name, slug, created_at FROM tenants;

-- 11.2 Verificar associação de usuário
SELECT 
  ut.id,
  ut.role,
  t.name as tenant_name,
  u.email as user_email
FROM user_tenants ut
JOIN tenants t ON t.id = ut.tenant_id
JOIN auth.users u ON u.id = ut.user_id;

-- 11.3 Verificar contagens por tenant
SELECT 
  t.name as tenant,
  (SELECT COUNT(*) FROM orders WHERE tenant_id = t.id) as orders,
  (SELECT COUNT(*) FROM payments WHERE tenant_id = t.id) as payments,
  (SELECT COUNT(*) FROM materials WHERE tenant_id = t.id) as materials,
  (SELECT COUNT(*) FROM suppliers WHERE tenant_id = t.id) as suppliers
FROM tenants t;

-- 11.4 Verificar políticas RLS ativas
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('orders', 'payments', 'materials', 'suppliers', 'tenants', 'user_tenants')
ORDER BY tablename;

-- ==============================================================================
-- FIM DA MIGRAÇÃO
-- ==============================================================================
-- 
-- PRÓXIMOS PASSOS APÓS EXECUTAR:
-- 1. Fazer login no sistema como o usuário cjmultimidia@hotmail.com
-- 2. Verificar se todos os pedidos aparecem corretamente
-- 3. Criar um novo pedido para testar
-- 4. Verificar se materiais e fornecedores estão funcionando
-- 
-- Se algo der errado, os dados originais continuam no banco - 
-- apenas o tenant_id foi adicionado e preenchido.
-- ==============================================================================
