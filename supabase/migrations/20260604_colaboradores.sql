-- Tabela de colaboradores (mão de obra da empresa)
CREATE TABLE IF NOT EXISTS colaboradores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome             TEXT NOT NULL,
  cargo            TEXT,
  email            TEXT,
  telefone         TEXT,
  especialidade    TEXT DEFAULT 'Montador',
  status           TEXT DEFAULT 'Ativo',
  salario          NUMERIC(12,2),
  tipo_contrato    TEXT DEFAULT 'CLT',
  valor_producao   NUMERIC(12,2),
  unidade_producao TEXT DEFAULT 'm²',
  observacoes      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa ON colaboradores(empresa_id);

ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colaboradores_empresa" ON colaboradores
  USING (empresa_id = get_empresa_id())
  WITH CHECK (empresa_id = get_empresa_id());

-- Tabela de alocações de colaboradores em obras
CREATE TABLE IF NOT EXISTS alocacoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  obra_id        UUID REFERENCES obras(id) ON DELETE CASCADE,
  data_inicio    DATE,
  data_fim       DATE,
  funcao         TEXT,
  observacoes    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alocacoes_empresa ON alocacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alocacoes_obra    ON alocacoes(obra_id);

ALTER TABLE alocacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alocacoes_empresa" ON alocacoes
  USING (empresa_id = get_empresa_id())
  WITH CHECK (empresa_id = get_empresa_id());

-- Tabela de horas trabalhadas
CREATE TABLE IF NOT EXISTS horas_trabalhadas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  obra_id        UUID REFERENCES obras(id) ON DELETE CASCADE,
  data           DATE NOT NULL,
  horas          NUMERIC(5,2) NOT NULL DEFAULT 0,
  descricao      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_horas_empresa ON horas_trabalhadas(empresa_id);

ALTER TABLE horas_trabalhadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "horas_empresa" ON horas_trabalhadas
  USING (empresa_id = get_empresa_id())
  WITH CHECK (empresa_id = get_empresa_id());
