-- Migration: Index Audit & Retention Policies
-- Created: 2026-06-27
-- Purpose: Add missing indexes for high-growth tables and retention policies

-- 1. Missing indexes identified by query analysis

CREATE INDEX IF NOT EXISTS idx_obras_empresa_id_status ON public.obras (empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_obras_created_at ON public.obras (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orcamentos_empresa_id_created ON public.orcamentos (empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON public.orcamentos (cliente_id);

CREATE INDEX IF NOT EXISTS idx_diario_obra_id_created ON public.diario (obra_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diario_created_at ON public.diario (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medicoes_obra_id ON public.medicoes (obra_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_equipe_obra_id ON public.equipe (obra_id);

CREATE INDEX IF NOT EXISTS idx_quantitativos_obra_id ON public.quantitativos (obra_id);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON public.notificacoes (usuario_id, lida, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contratos_obra_id ON public.contratos (obra_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_empresas_created_at ON public.empresas (created_at DESC);

-- 2. Retention: auto-cleanup for high-growth tables
-- Keep last 90 days of saas_events, 60 days of notificacoes lidas

CREATE OR REPLACE FUNCTION public.cleanup_saas_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.saas_events WHERE created_at < now() - interval '90 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_notificacoes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notificacoes WHERE lida = true AND created_at < now() - interval '60 days';
END;
$$;

-- Schedule via pg_cron if available (or run manually via cron job / edge function)
-- SELECT cron.schedule('cleanup-saas-events',    '0 3 * * 0', $$SELECT public.cleanup_saas_events()$$);
-- SELECT cron.schedule('cleanup-notificacoes',   '0 4 * * 0', $$SELECT public.cleanup_notificacoes()$$);
-- NOTE: pg_cron requires superuser; alternative: schedule via Supabase Edge Function cron

-- 3. Analyze tables for query planner
ANALYZE public.obras;
ANALYZE public.orcamentos;
ANALYZE public.diario;
ANALYZE public.medicoes;
ANALYZE public.saas_events;
ANALYZE public.notificacoes;
