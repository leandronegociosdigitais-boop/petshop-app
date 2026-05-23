-- ============================================
-- PetShop App - Schema Completo (com lembretes)
-- Projeto: ockwtcyohqfdhcfgclhh
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cpf TEXT,
  codigo TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pets
CREATE TABLE IF NOT EXISTS pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  especie TEXT NOT NULL DEFAULT 'Cachorro',
  raca TEXT,
  idade TEXT,
  peso NUMERIC(5,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Servicos
CREATE TABLE IF NOT EXISTS servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  duracao_minutos INTEGER DEFAULT 30,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Atendimentos (Agendamentos)
CREATE TABLE IF NOT EXISTS atendimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'cancelado')),
  observacoes TEXT,
  valor NUMERIC(10,2) DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'pix' CHECK (forma_pagamento IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'permuta')),
  status_pagamento TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pago', 'pendente', 'vencido')),
  data_vencimento DATE,
  banco TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Financeiro (Entradas e Saidas) - com colunas de lembrete
CREATE TABLE IF NOT EXISTS financeiro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL DEFAULT 'outros',
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT DEFAULT 'pix',
  grupo TEXT,
  banco TEXT,
  data_vencimento DATE,
  status_pagamento TEXT NOT NULL DEFAULT 'pago' CHECK (status_pagamento IN ('pago', 'pendente', 'vencido')),
  atendimento_id UUID REFERENCES atendimentos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_pets_cliente_id ON pets(cliente_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_pet_id ON atendimentos(pet_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_cliente_id ON atendimentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data_hora ON atendimentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status ON atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_financeiro_data ON financeiro(data);
CREATE INDEX IF NOT EXISTS idx_financeiro_tipo ON financeiro(tipo);
CREATE INDEX IF NOT EXISTS idx_financeiro_atendimento_id ON financeiro(atendimento_id);

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;

-- Politicas publicas (para funcionar imediatamente)
-- Depois ative as politicas de auth no rls-auth.sql
CREATE POLICY "Acesso total clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total pets" ON pets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total servicos" ON servicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total atendimentos" ON atendimentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total financeiro" ON financeiro FOR ALL USING (true) WITH CHECK (true);
