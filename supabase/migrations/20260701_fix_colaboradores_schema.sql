-- Adiciona a coluna cargo_extra à tabela public.colaboradores
ALTER TABLE public.colaboradores 
ADD COLUMN IF NOT EXISTS cargo_extra text;
