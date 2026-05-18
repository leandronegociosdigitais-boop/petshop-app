-- ============================================
-- PetShop App - RLS com Autenticacao
-- Execute este script no SQL Editor do Supabase
-- APOS ativar Auth e criar o usuario
-- ============================================

-- Habilitar RLS (ja deve estar habilitado)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;

-- Remover politicas publicas antigas
DROP POLICY IF EXISTS "Acesso total clientes" ON clientes;
DROP POLICY IF EXISTS "Acesso total pets" ON pets;
DROP POLICY IF EXISTS "Acesso total servicos" ON servicos;
DROP POLICY IF EXISTS "Acesso total atendimentos" ON atendimentos;
DROP POLICY IF EXISTS "Acesso total financeiro" ON financeiro;

-- Criar politicas restritas a usuarios autenticados
CREATE POLICY "auth_only_clientes" ON clientes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_only_pets" ON pets FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_only_servicos" ON servicos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_only_atendimentos" ON atendimentos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_only_financeiro" ON financeiro FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
