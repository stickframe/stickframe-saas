CREATE TABLE IF NOT EXISTS rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  numero TEXT NOT NULL, -- RFI-001, RFI-002...
  titulo TEXT NOT NULL,
  descricao TEXT,
  disciplina TEXT DEFAULT 'Estrutural',
  urgencia TEXT DEFAULT 'Normal', -- Normal | Alta | Crítica
  status TEXT DEFAULT 'Aberto', -- Aberto | Em análise | Respondido | Fechado
  solicitante TEXT,
  responsavel TEXT,
  data_solicitacao DATE DEFAULT CURRENT_DATE,
  data_resposta DATE,
  resposta TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rfis_obra ON rfis(obra_id);
CREATE INDEX IF NOT EXISTS idx_rfis_empresa ON rfis(empresa_id);
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rfis' AND policyname='rfis_empresa') THEN
    CREATE POLICY "rfis_empresa" ON rfis USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());
  END IF;
END $$;
-- Auto-number trigger
CREATE OR REPLACE FUNCTION set_rfi_numero() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'RFI-' || LPAD((SELECT COUNT(*)+1 FROM rfis WHERE obra_id=NEW.obra_id)::TEXT,3,'0');
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_rfi_numero ON rfis;
CREATE TRIGGER trg_rfi_numero BEFORE INSERT ON rfis FOR EACH ROW EXECUTE FUNCTION set_rfi_numero();
