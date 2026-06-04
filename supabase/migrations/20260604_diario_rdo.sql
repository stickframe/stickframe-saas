ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS clima text DEFAULT 'Ensolarado';
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS temperatura integer;
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS total_trabalhadores integer DEFAULT 0;
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS atividades_realizadas text;
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS intercorrencias text;
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS equipamentos_utilizados text;
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS fotos jsonb DEFAULT '[]'::jsonb;
