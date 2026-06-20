-- Adiciona coluna opcionais (JSONB) na tabela orcamentos
-- Armazena itens adicionados manualmente ou via catálogo de produtos
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS opcionais jsonb DEFAULT '[]'::jsonb;
