-- Coluna de assinatura em EPIs
ALTER TABLE sst_epis ADD COLUMN IF NOT EXISTS assinatura_base64 text;

-- Tabela de assinaturas de DDS (múltiplos participantes)
CREATE TABLE IF NOT EXISTS sst_dds_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  dds_id uuid NOT NULL REFERENCES sst_dds(id) ON DELETE CASCADE,
  nome text NOT NULL,
  assinatura_base64 text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sst_dds_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dds_assinaturas_all" ON sst_dds_assinaturas
  USING (empresa_id = get_empresa_id())
  WITH CHECK (empresa_id = get_empresa_id());
