-- ============================================
-- Adicionar colunas de lembrete de pagamento
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- Adicionar data de vencimento
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- Adicionar status de pagamento
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS status_pagamento TEXT NOT NULL DEFAULT 'pago'
  CHECK (status_pagamento IN ('pago', 'pendente', 'vencido'));

-- Atualizar saidas futuras existentes: se a data eh futura, marcar como pendente
UPDATE financeiro
SET status_pagamento = 'pendente'
WHERE tipo = 'saida' AND data > CURRENT_DATE AND status_pagamento = 'pago';
