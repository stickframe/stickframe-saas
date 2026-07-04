-- StickFEM™ — Histórico de Revisões ("Git do projeto estrutural").
-- Cada revisão guarda um snapshot do modelo + diff vs. anterior + metadados de
-- rastreabilidade (StickScore, conflitos, hash do cálculo, versão do engine,
-- memorial associado, usuário, data). Aditiva; RLS por empresa.

CREATE TABLE IF NOT EXISTS public.stickfem_revisao (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id         uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  projeto_id         uuid NOT NULL REFERENCES public.projeto_estrutural(id) ON DELETE CASCADE,
  numero             integer NOT NULL,               -- sequencial por projeto
  snapshot           jsonb NOT NULL,                 -- estado completo do modelo
  diff               jsonb,                          -- diff vs. revisão anterior
  stickscore         integer,
  stickscore_anterior integer,
  conflitos_total    integer,
  conflitos_anterior integer,
  peso_total_kg      numeric,
  memorial           jsonb,                          -- hash + engine + resultado + catálogo
  calc_hash          text,
  engine_version     text,
  motivo             text,                           -- por que a revisão foi criada
  criado_por         uuid,                           -- auth.users
  usuario_nome       text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sf_revisao_projeto ON public.stickfem_revisao(projeto_id, numero DESC);

ALTER TABLE public.stickfem_revisao ENABLE ROW LEVEL SECURITY;
CREATE POLICY t_sf_revisao ON public.stickfem_revisao FOR ALL
  USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());
