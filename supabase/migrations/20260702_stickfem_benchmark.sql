-- StickFEM™ Benchmark Estrutural — base proprietária de inteligência construtiva.
-- Fase 1 (dados) + Fase 8 (RLS): dados da empresa isolados; referência é pública
-- (agregada/anonimizada).

CREATE TABLE IF NOT EXISTS public.benchmark_estrutural (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id         uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  projeto_id         uuid REFERENCES public.projeto_estrutural(id) ON DELETE SET NULL,
  tipologia          text,
  area_m2            numeric,
  sistema_construtivo text DEFAULT 'Light Steel Frame',
  peso_aco_total     numeric,
  kg_aco_m2          numeric,
  quantidade_perfis  integer,
  custo_estrutura    numeric,
  custo_m2           numeric,
  prazo_estimado     integer,   -- dias de montagem estimados
  prazo_real         integer,   -- dias de montagem reais (RDO)
  data_analise       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.benchmark_referencia (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria          text,
  regiao             text,
  tipologia          text NOT NULL,
  media_custo_m2     numeric,
  media_kg_aco_m2    numeric,
  media_prazo        integer,
  quantidade_amostras integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bench_estr_empresa ON public.benchmark_estrutural(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bench_estr_projeto ON public.benchmark_estrutural(projeto_id);

ALTER TABLE public.benchmark_estrutural ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_referencia ENABLE ROW LEVEL SECURITY;

-- Dados da empresa: tenant estrito.
CREATE POLICY t_bench_estr ON public.benchmark_estrutural FOR ALL
  USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());

-- Referência: leitura pública (dados agregados/anonimizados).
CREATE POLICY bench_ref_read ON public.benchmark_referencia FOR SELECT USING (true);

-- Seed de referência de mercado (Light Steel Frame).
INSERT INTO public.benchmark_referencia (categoria, regiao, tipologia, media_custo_m2, media_kg_aco_m2, media_prazo, quantidade_amostras)
SELECT v.cat, v.reg, v.tip, v.custo, v.kg, v.prazo, v.n
FROM (VALUES
  ('Residencial', 'Nacional', 'Residencial Térreo',      3100, 14.5, 35, 22),
  ('Residencial', 'Nacional', 'Residencial Alto Padrão',  4500, 16.0, 45, 14),
  ('Comercial',   'Nacional', 'Comercial / Loja',         3800, 15.0, 40, 8)
) AS v(cat, reg, tip, custo, kg, prazo, n)
WHERE NOT EXISTS (SELECT 1 FROM public.benchmark_referencia WHERE tipologia = v.tip);
