-- Migration: growth_activation_score view + growth events
-- Created: 2026-06-27
-- Purpose: Track activation funnel and growth metrics per empresa

-- Activation score view
CREATE OR REPLACE VIEW public.vw_activation_score AS
WITH events AS (
  SELECT
    empresa_id,
    COUNT(*) FILTER (WHERE event_type = 'company_created')         AS has_company,
    COUNT(*) FILTER (WHERE event_type = 'created_first_client')    AS has_client,
    COUNT(*) FILTER (WHERE event_type = 'created_first_quote')     AS has_quote,
    COUNT(*) FILTER (WHERE event_type = 'created_first_obra')      AS has_obra,
    COUNT(*) FILTER (WHERE event_type = 'used_stickquote')         AS has_stickquote,
    COUNT(*) FILTER (WHERE event_type = 'opened_portal')           AS has_portal,
    COUNT(*) FILTER (WHERE event_type = 'opened_stickbrain')       AS has_stickbrain,
    COUNT(*) FILTER (WHERE event_type = 'approved_measurement')    AS has_measurement,
    COUNT(*) FILTER (WHERE event_type = 'completed_onboarding')    AS has_onboarding,
    MAX(created_at)                                                AS last_event_at
  FROM public.saas_events
  WHERE event_type IN (
    'company_created', 'created_first_client', 'created_first_quote',
    'created_first_obra', 'used_stickquote', 'opened_portal',
    'opened_stickbrain', 'approved_measurement', 'completed_onboarding'
  )
  GROUP BY empresa_id
)
SELECT
  empresa_id,
  CASE WHEN has_company > 0      THEN 1 ELSE 0 END
  + CASE WHEN has_client > 0     THEN 1 ELSE 0 END
  + CASE WHEN has_quote > 0      THEN 1 ELSE 0 END
  + CASE WHEN has_obra > 0       THEN 1 ELSE 0 END
  + CASE WHEN has_stickquote > 0 THEN 1 ELSE 0 END
  + CASE WHEN has_portal > 0     THEN 1 ELSE 0 END
  + CASE WHEN has_stickbrain > 0 THEN 1 ELSE 0 END
  + CASE WHEN has_measurement > 0 THEN 1 ELSE 0 END
  + CASE WHEN has_onboarding > 0 THEN 1 ELSE 0 END                         AS score,
  9                                                                         AS max_score,
  ROUND(
    (CASE WHEN has_company > 0      THEN 1 ELSE 0 END
    + CASE WHEN has_client > 0     THEN 1 ELSE 0 END
    + CASE WHEN has_quote > 0      THEN 1 ELSE 0 END
    + CASE WHEN has_obra > 0       THEN 1 ELSE 0 END
    + CASE WHEN has_stickquote > 0 THEN 1 ELSE 0 END
    + CASE WHEN has_portal > 0     THEN 1 ELSE 0 END
    + CASE WHEN has_stickbrain > 0 THEN 1 ELSE 0 END
    + CASE WHEN has_measurement > 0 THEN 1 ELSE 0 END
    + CASE WHEN has_onboarding > 0 THEN 1 ELSE 0 END)::numeric / 9 * 100, 1
  )                                                                        AS activation_pct,
  has_company > 0      AND has_client > 0   AND has_quote > 0              AS activated_minimum,
  has_onboarding > 0                                                       AS onboarding_complete,
  last_event_at
FROM events;

-- Trial health view: empresas ready for conversion
CREATE OR REPLACE VIEW public.vw_trial_health AS
SELECT
  e.id                                                                    AS empresa_id,
  e.nome                                                                  AS empresa_nome,
  e.plano,
  e.trial_ends_at,
  e.created_at                                                            AS registered_at,
  (e.trial_ends_at IS NOT NULL AND e.trial_ends_at > now())              AS trial_active,
  COALESCE(act.score, 0)                                                  AS activation_score,
  COALESCE(act.activation_pct, 0)                                         AS activation_pct,
  COALESCE(act.activated_minimum, false)                                  AS activated_minimum,
  COALESCE(act.onboarding_complete, false)                                AS onboarding_complete,
  act.last_event_at,
  (SELECT COUNT(*) FROM public.clientes   WHERE empresa_id = e.id)        AS total_clientes,
  (SELECT COUNT(*) FROM public.orcamentos WHERE empresa_id = e.id)        AS total_orcamentos,
  (SELECT COUNT(*) FROM public.obras      WHERE empresa_id = e.id)        AS total_obras,
  CASE
    WHEN e.trial_ends_at IS NULL THEN 'no_trial'
    WHEN e.trial_ends_at < now() THEN 'expired'
    WHEN e.trial_ends_at < now() + interval '7 days' THEN 'ending_soon'
    WHEN act.activation_pct >= 60 THEN 'ready_to_convert'
    ELSE 'active'
  END                                                                     AS trial_status
FROM public.empresas e
LEFT JOIN public.vw_activation_score act ON act.empresa_id = e.id
WHERE e.plano = 'free' OR e.trial_ends_at IS NOT NULL
ORDER BY e.trial_ends_at ASC NULLS LAST;

-- Index for growth queries on saas_events
CREATE INDEX IF NOT EXISTS idx_saas_events_type_empresa
  ON public.saas_events (event_type, empresa_id);
