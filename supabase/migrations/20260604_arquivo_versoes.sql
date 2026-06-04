-- File versioning columns for arquivos table
ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS revisao text DEFAULT 'Rev A';
ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS versao_num integer DEFAULT 1;
ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS arquivo_pai uuid REFERENCES arquivos(id);
ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS publicado boolean DEFAULT true;
ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS publicado_por uuid REFERENCES auth.users(id);
ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS notas_revisao text;
