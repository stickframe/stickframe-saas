-- ── change_orders v2: Add missing columns from spec ─────────────────────────
-- The base table was created in 20260603_change_orders.sql.
-- This migration adds the columns required by the formal Change Order spec.

CREATE TABLE IF NOT EXISTS change_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id         UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  numero          TEXT NOT NULL,           -- CO-001, CO-002...
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  tipo            TEXT DEFAULT 'Aditivo',  -- Aditivo | Supressão | Alteração
  valor           NUMERIC(12,2) DEFAULT 0,
  impacto_prazo   INTEGER DEFAULT 0,       -- days added/removed
  status          TEXT DEFAULT 'Rascunho', -- Rascunho | Pendente | Aprovado | Rejeitado
  solicitado_por  TEXT,
  aprovado_por    TEXT,
  data_solicitacao DATE DEFAULT CURRENT_DATE,
  data_aprovacao  TIMESTAMPTZ,
  justificativa   TEXT,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_co_obra    ON change_orders(obra_id);
CREATE INDEX IF NOT EXISTS idx_co_empresa ON change_orders(empresa_id);

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'change_orders' AND policyname = 'co_empresa'
  ) THEN
    CREATE POLICY "co_empresa" ON change_orders
      USING (empresa_id = get_empresa_id())
      WITH CHECK (empresa_id = get_empresa_id());
  END IF;
END;
$$;

-- Auto-number trigger (updated to produce text like CO-001)
CREATE OR REPLACE FUNCTION set_co_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'CO-' || LPAD(
      (SELECT COUNT(*) + 1 FROM change_orders WHERE obra_id = NEW.obra_id)::TEXT, 3, '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_co_numero ON change_orders;
CREATE TRIGGER trg_co_numero BEFORE INSERT ON change_orders FOR EACH ROW EXECUTE FUNCTION set_co_numero();
