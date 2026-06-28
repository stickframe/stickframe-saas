-- Migration: 20260621_fix_leads_captacao_delete_rls.sql
-- Habilita RLS e adiciona política de exclusão (DELETE) na tabela leads_captacao

ALTER TABLE public.leads_captacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_captacao_delete" ON public.leads_captacao;

CREATE POLICY "leads_captacao_delete" ON public.leads_captacao
  FOR DELETE
  TO public
  USING (auth.role() = 'authenticated'::text);
