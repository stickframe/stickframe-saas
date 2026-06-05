-- Colunas faltando identificadas via logs do Postgres
ALTER TABLE obras ADD COLUMN IF NOT EXISTS area_m2 NUMERIC(10,2);
ALTER TABLE medicoes ADD COLUMN IF NOT EXISTS data_medicao DATE;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
