-- ============================================
-- Corrigir tabela atendimentos - colunas faltantes
-- Execute no SQL Editor do Supabase Dashboard
-- (abra em aba anonima: https://supabase.com/dashboard)
-- ============================================

ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS forma_pagamento_2 TEXT;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS valor_2 NUMERIC(10,2);
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS banco_2 TEXT;
