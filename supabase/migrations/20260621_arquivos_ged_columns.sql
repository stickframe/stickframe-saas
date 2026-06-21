-- GED columns for arquivos table
ALTER TABLE public.arquivos ADD COLUMN IF NOT EXISTS disciplina    text;
ALTER TABLE public.arquivos ADD COLUMN IF NOT EXISTS status_doc    text DEFAULT 'Ativo';
ALTER TABLE public.arquivos ADD COLUMN IF NOT EXISTS cientes_uids  uuid[] DEFAULT '{}';
