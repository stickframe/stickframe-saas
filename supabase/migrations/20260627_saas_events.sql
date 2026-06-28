-- Migration: saas_events table
-- Created: 2026-06-27
-- Purpose: Track SaaS-wide events for observability, engagement, and retention analysis

CREATE TABLE IF NOT EXISTS public.saas_events (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type TEXT        NOT NULL,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  empresa_id UUID,
  payload    JSONB       DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_saas_events_type      ON public.saas_events (event_type);
CREATE INDEX IF NOT EXISTS idx_saas_events_empresa    ON public.saas_events (empresa_id);
CREATE INDEX IF NOT EXISTS idx_saas_events_created_at ON public.saas_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saas_events_user       ON public.saas_events (user_id);

-- RLS: empresa can see own events; admin sees all
ALTER TABLE public.saas_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_events' AND policyname = 'saas_events_insert_own') THEN
    CREATE POLICY saas_events_insert_own ON public.saas_events
      FOR INSERT TO authenticated
      WITH CHECK (empresa_id = (SELECT raw_user_meta_data->>'empresa_id'::uuid FROM auth.users WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_events' AND policyname = 'saas_events_select_own') THEN
    CREATE POLICY saas_events_select_own ON public.saas_events
      FOR SELECT TO authenticated
      USING (
        empresa_id = (SELECT raw_user_meta_data->>'empresa_id'::uuid FROM auth.users WHERE id = auth.uid())
        OR
        -- admin access (email-based for now)
        auth.email() = 'admin@stickframe.com.br'
      );
  END IF;
END $$;

-- Auto-cleanup: keep 90 days
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron not available; auto-cleanup not configured';
  END IF;
END $$;
