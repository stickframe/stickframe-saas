CREATE TABLE IF NOT EXISTS anotacoes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id  uuid REFERENCES empresas(id) ON DELETE CASCADE,
  arquivo_id  uuid REFERENCES arquivos(id) ON DELETE CASCADE,
  usuario_id  uuid REFERENCES auth.users(id),
  layer_json  jsonb,
  pagina      integer DEFAULT 1,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anotacoes_empresa" ON anotacoes
  FOR ALL USING (empresa_id = get_empresa_id());

CREATE INDEX IF NOT EXISTS idx_anotacoes_arquivo ON anotacoes(arquivo_id);
