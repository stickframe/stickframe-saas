-- 
-- StickFrame CRM Enterprise Expansion Migration
-- 

-- 1. Alterar a tabela lead_historico para permitir múltiplos tipos de eventos na timeline comercial
ALTER TABLE public.lead_historico
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'status_change',
  ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

-- Criar índices para otimizar a timeline por tipo
CREATE INDEX IF NOT EXISTS idx_lead_historico_tipo ON public.lead_historico(tipo);

-- 2. Alterar a tabela pre_orcamentos para suportar os agendamentos de "Próxima Ação"
ALTER TABLE public.pre_orcamentos
  ADD COLUMN IF NOT EXISTS proxima_acao text,
  ADD COLUMN IF NOT EXISTS proxima_acao_data date;

-- 3. Alterar a tabela orcamentos para ligar de forma direta ao lead do CRM
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS lead_id bigint REFERENCES public.pre_orcamentos(id) ON DELETE SET NULL;
