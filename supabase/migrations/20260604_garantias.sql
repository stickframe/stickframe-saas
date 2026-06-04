CREATE TABLE IF NOT EXISTS garantias (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id   uuid REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id      uuid REFERENCES obras(id) ON DELETE CASCADE,
  item         text NOT NULL,
  fornecedor   text,
  data_inicio  date,
  data_fim     date NOT NULL,
  prazo_anos   numeric DEFAULT 1,
  status       text DEFAULT 'Vigente' CHECK (status IN ('Vigente','Vencendo','Vencida','Acionada')),
  observacoes  text,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE garantias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "garantias_empresa" ON garantias FOR ALL USING (empresa_id = get_empresa_id());
CREATE INDEX IF NOT EXISTS idx_garantias_obra ON garantias(obra_id);
