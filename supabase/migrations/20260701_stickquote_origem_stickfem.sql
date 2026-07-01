-- StickFEM™ Fase 8 — rastreabilidade do orçamento gerado pela engenharia.
-- Aditivo: marca a origem do StickQuote e vincula ao projeto estrutural.
ALTER TABLE public.stickquote_versoes
  ADD COLUMN IF NOT EXISTS origem               text,
  ADD COLUMN IF NOT EXISTS projeto_estrutural_id uuid REFERENCES public.projeto_estrutural(id) ON DELETE SET NULL;
