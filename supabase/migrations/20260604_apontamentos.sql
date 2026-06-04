CREATE TABLE IF NOT EXISTS apontamentos (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id   uuid REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id      uuid REFERENCES obras(id) ON DELETE CASCADE,
  arquivo_id   uuid REFERENCES arquivos(id) ON DELETE SET NULL,
  coord_x      numeric NOT NULL,
  coord_y      numeric NOT NULL,
  pagina       integer DEFAULT 1,
  titulo       text NOT NULL,
  descricao    text,
  prioridade   text DEFAULT 'Media' CHECK (prioridade IN ('Baixa','Media','Alta','Critica')),
  status       text DEFAULT 'Aberto' CHECK (status IN ('Aberto','Em andamento','Resolvido')),
  criado_por   uuid REFERENCES auth.users(id),
  responsavel_id uuid REFERENCES usuarios(id),
  prazo        date,
  foto_antes   text,
  foto_depois  text,
  resolvido_em timestamptz,
  resolvido_por uuid REFERENCES auth.users(id),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE apontamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apontamentos_empresa" ON apontamentos FOR ALL USING (empresa_id = get_empresa_id());
CREATE INDEX IF NOT EXISTS idx_apontamentos_obra ON apontamentos(obra_id);
CREATE INDEX IF NOT EXISTS idx_apontamentos_arquivo ON apontamentos(arquivo_id);
