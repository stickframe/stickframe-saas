CREATE TABLE IF NOT EXISTS certificacoes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  colaborador_id   UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  nr               TEXT NOT NULL,           -- e.g. "NR-35", "NR-10"
  descricao        TEXT,                    -- "Trabalho em Altura"
  data_emissao     DATE,
  data_validade    DATE NOT NULL,
  instituicao      TEXT,                    -- training institution
  carga_horaria    INTEGER,                 -- hours
  status           TEXT DEFAULT 'Vigente',  -- Vigente | Vencendo | Vencida
  observacoes      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_empresa       ON certificacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cert_colaborador   ON certificacoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_cert_validade      ON certificacoes(data_validade);

ALTER TABLE certificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert_empresa" ON certificacoes
  USING (empresa_id = get_empresa_id())
  WITH CHECK (empresa_id = get_empresa_id());
