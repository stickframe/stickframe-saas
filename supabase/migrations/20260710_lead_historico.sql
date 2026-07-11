-- Migration: Criação da tabela de histórico de leads para auditoria CRM
-- Adiciona RLS, restrições e políticas de acesso unificadas.

CREATE TABLE IF NOT EXISTS public.lead_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id bigint NOT NULL REFERENCES public.pre_orcamentos(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario text NOT NULL,
  status_anterior text NOT NULL,
  status_novo text NOT NULL,
  observacao text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.lead_historico ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS de acordo com os padrões StickFrame
CREATE POLICY "lead_historico_select" ON public.lead_historico
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "lead_historico_insert" ON public.lead_historico
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

-- Histórico de auditoria é imutável
CREATE POLICY "lead_historico_no_update" ON public.lead_historico FOR UPDATE USING (false);
CREATE POLICY "lead_historico_no_delete" ON public.lead_historico FOR DELETE USING (false);

-- Indexação para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_lead_historico_lead_id ON public.lead_historico(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_historico_empresa_id ON public.lead_historico(empresa_id);
