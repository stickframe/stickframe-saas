-- Migration: SaaS Metrics Views
-- Created: 2026-06-27
-- Purpose: Materialized views for activation, engagement, and retention analysis

-- Active companies: at least 1 obra or orcamento in last 30 days
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_active_companies AS
SELECT
  e.id AS empresa_id,
  e.nome AS empresa_nome,
  e.plano,
  e.created_at AS cadastro_em,
  COUNT(DISTINCT o.id) AS total_obras_30d,
  COUNT(DISTINCT orc.id) AS total_orcamentos_30d,
  GREATEST(
    MAX(o.created_at),
    MAX(orc.created_at)
  ) AS ultima_atividade
FROM public.empresas e
LEFT JOIN public.obras o ON o.empresa_id = e.id AND o.created_at >= now() - interval '30 days'
LEFT JOIN public.orcamentos orc ON orc.empresa_id = e.id AND orc.created_at >= now() - interval '30 days'
GROUP BY e.id, e.nome, e.plano, e.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_active_companies ON public.vw_active_companies (empresa_id);

-- Activation funnel: how many companies reached each milestone
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_activation_funnel AS
SELECT
  'criou_conta' AS etapa,
  COUNT(DISTINCT e.id) AS total
FROM public.empresas e
UNION ALL
SELECT
  'criou_obra' AS etapa,
  COUNT(DISTINCT o.empresa_id) AS total
FROM public.obras o
UNION ALL
SELECT
  'fez_orcamento' AS etapa,
  COUNT(DISTINCT orc.empresa_id) AS total
FROM public.orcamentos orc
UNION ALL
SELECT
  'convidou_usuario' AS etapa,
  COUNT(DISTINCT uc.empresa_id) AS total
FROM public.usuario_convites uc;

-- Retention: weekly returning companies (companies active this week that were also active last week)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_retention_weekly AS
WITH weekly_activity AS (
  SELECT
    empresa_id,
    date_trunc('week', created_at) AS semana
  FROM public.obras
  WHERE created_at >= now() - interval '60 days'
  GROUP BY empresa_id, date_trunc('week', created_at)
  UNION
  SELECT
    empresa_id,
    date_trunc('week', created_at) AS semana
  FROM public.orcamentos
  WHERE created_at >= now() - interval '60 days'
  GROUP BY empresa_id, date_trunc('week', created_at)
),
current_week AS (
  SELECT empresa_id FROM weekly_activity WHERE semana = date_trunc('week', now())
),
previous_week AS (
  SELECT empresa_id FROM weekly_activity WHERE semana = date_trunc('week', now() - interval '7 days')
)
SELECT
  date_trunc('week', now()) AS semana,
  (SELECT COUNT(*) FROM current_week) AS ativos_essa_semana,
  (SELECT COUNT(*) FROM previous_week) AS ativos_semana_passada,
  (SELECT COUNT(*) FROM current_week c WHERE EXISTS (SELECT 1 FROM previous_week p WHERE p.empresa_id = c.empresa_id)) AS retidos;
