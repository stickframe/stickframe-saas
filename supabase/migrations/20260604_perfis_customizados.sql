CREATE TABLE IF NOT EXISTS perfis_customizados (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  cor        TEXT DEFAULT '#6b7280',
  paginas    TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfis_empresa ON perfis_customizados(empresa_id);

ALTER TABLE perfis_customizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfis_empresa" ON perfis_customizados
  USING (empresa_id = get_empresa_id())
  WITH CHECK (empresa_id = get_empresa_id());
