-- StickFEM™ — Linha do Tempo da Engenharia (caixa-preta de rastreabilidade).
-- Todos os eventos técnicos do projeto, cronológicos. RLS por empresa + índices
-- para projetos com milhares de eventos.

CREATE TABLE IF NOT EXISTS public.engineering_timeline (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  projeto_id     uuid NOT NULL REFERENCES public.projeto_estrutural(id) ON DELETE CASCADE,
  revisao_id     uuid REFERENCES public.stickfem_revisao(id) ON DELETE SET NULL,
  usuario_id     uuid,
  usuario_nome   text,
  tipo           text NOT NULL,
  modulo         text NOT NULL,
  severidade     text NOT NULL DEFAULT 'info',
  descricao      text,
  payload_json   jsonb DEFAULT '{}'::jsonb,
  hash           text,
  engine_version text,
  data           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eng_timeline_projeto ON public.engineering_timeline(projeto_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_eng_timeline_modulo  ON public.engineering_timeline(projeto_id, modulo);
CREATE INDEX IF NOT EXISTS idx_eng_timeline_tipo    ON public.engineering_timeline(projeto_id, tipo);

ALTER TABLE public.engineering_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY t_eng_timeline ON public.engineering_timeline FOR ALL
  USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());
