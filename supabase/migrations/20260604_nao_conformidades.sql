CREATE TABLE IF NOT EXISTS nao_conformidades (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id     uuid REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id        uuid REFERENCES obras(id) ON DELETE CASCADE,
  numero         integer,
  titulo         text NOT NULL,
  descricao      text,
  disciplina     text DEFAULT 'Civil',
  gravidade      text DEFAULT 'Media' CHECK (gravidade IN ('Baixa','Media','Alta','Critica')),
  status         text DEFAULT 'Aberta' CHECK (status IN ('Aberta','Em análise','Em correção','Verificando','Fechada')),
  criado_por     uuid REFERENCES auth.users(id),
  responsavel_id uuid REFERENCES usuarios(id),
  prazo          date,
  acao_corretiva text,
  verificado_em  timestamptz,
  fechado_em     timestamptz,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE nao_conformidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ncr_empresa" ON nao_conformidades FOR ALL USING (empresa_id = get_empresa_id());
CREATE INDEX IF NOT EXISTS idx_ncr_obra ON nao_conformidades(obra_id);

CREATE OR REPLACE FUNCTION set_ncr_numero() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero FROM nao_conformidades WHERE obra_id=NEW.obra_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_ncr_numero BEFORE INSERT ON nao_conformidades FOR EACH ROW EXECUTE FUNCTION set_ncr_numero();
