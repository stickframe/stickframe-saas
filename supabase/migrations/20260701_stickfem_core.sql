-- ─────────────────────────────────────────────────────────────────────────────
-- StickFEM™ — modelo de dados estrutural (Slice 1)
-- Fundação preparada para FEM futuro (OpenSees/CalculiX) sem retrabalho.
-- Entidades: material, perfil_estrutural, projeto_estrutural, arquivo_cad,
--            elemento_estrutural, analise, aprovacao_tecnica, relatorio.
-- RLS: empresa_id = get_empresa_id(); catálogo (material/perfil) também aceita
--      linhas globais (empresa_id IS NULL) — o "sistema" seeda; a empresa customiza.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. MATERIAL ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.material (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid REFERENCES public.empresas(id) ON DELETE CASCADE,  -- NULL = global
  nome           text NOT NULL,
  tipo           text NOT NULL DEFAULT 'aco_galvanizado',
  fy_mpa         numeric,        -- tensão de escoamento
  fu_mpa         numeric,        -- tensão de ruptura
  e_mpa          numeric DEFAULT 200000,  -- módulo de elasticidade
  densidade_kg_m3 numeric DEFAULT 7850,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. PERFIL_ESTRUTURAL ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perfil_estrutural (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid REFERENCES public.empresas(id) ON DELETE CASCADE,  -- NULL = global
  material_id    uuid REFERENCES public.material(id) ON DELETE SET NULL,
  nome           text NOT NULL,
  tipo           text NOT NULL DEFAULT 'montante',  -- U | Ue | montante | guia | viga | trelica
  largura_mm     numeric,        -- bf (mesa)
  altura_mm      numeric,        -- d  (alma)
  espessura_mm   numeric,        -- t
  aba_mm         numeric,        -- lip (enrijecedor, perfis Ue)
  area_mm2       numeric,
  inercia_x_mm4  numeric,        -- Ix
  inercia_y_mm4  numeric,        -- Iy
  modulo_wx_mm3  numeric,        -- Wx
  peso_kg_m      numeric,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 3. PROJETO_ESTRUTURAL ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projeto_estrutural (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id         uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  obra_id            uuid REFERENCES public.obras(id) ON DELETE SET NULL,
  nome               text NOT NULL,
  descricao          text,
  status             text NOT NULL DEFAULT 'rascunho',  -- rascunho | analisado | aprovado
  pe_direito_m       numeric DEFAULT 2.80,
  espac_montante_mm  numeric DEFAULT 400,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- 4. ARQUIVO_CAD ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.arquivo_cad (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  projeto_id    uuid NOT NULL REFERENCES public.projeto_estrutural(id) ON DELETE CASCADE,
  nome_arquivo  text NOT NULL,
  formato       text NOT NULL DEFAULT 'dxf',  -- dxf | dwg | ifc
  storage_path  text,
  url           text,
  hash          text,
  layers        jsonb DEFAULT '[]'::jsonb,
  geometria     jsonb DEFAULT '{}'::jsonb,   -- geometria normalizada do parser
  stats         jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 5. ELEMENTO_ESTRUTURAL ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.elemento_estrutural (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  projeto_id     uuid NOT NULL REFERENCES public.projeto_estrutural(id) ON DELETE CASCADE,
  arquivo_id     uuid REFERENCES public.arquivo_cad(id) ON DELETE SET NULL,
  tipo           text NOT NULL,   -- parede | montante | viga | trelica | abertura | eixo
  nome           text,            -- rótulo (ex.: P12)
  geometria      jsonb DEFAULT '{}'::jsonb,  -- {x1,y1,x2,y2,...} em metros
  comprimento_m  numeric,
  altura_m       numeric,
  layer_origem   text,
  perfil_id      uuid REFERENCES public.perfil_estrutural(id) ON DELETE SET NULL,
  quantidade     numeric DEFAULT 1,
  confianca      text DEFAULT 'media',  -- alta | media | baixa
  propriedades   jsonb DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 6. ANALISE ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analise (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  projeto_id        uuid NOT NULL REFERENCES public.projeto_estrutural(id) ON DELETE CASCADE,
  solver            text,            -- null | js | opensees | calculix (SolverAdapter)
  status            text NOT NULL DEFAULT 'pendente', -- pendente | rodando | concluida | erro
  modelo_analitico  jsonb DEFAULT '{}'::jsonb,  -- nós, elementos, apoios, ligações (FEM-ready)
  cargas            jsonb DEFAULT '{}'::jsonb,
  combinacoes       jsonb DEFAULT '{}'::jsonb,  -- ELU / ELS
  resultado         jsonb DEFAULT '{}'::jsonb,
  deslocamento_max  numeric,
  tensao_max        numeric,
  fator_seguranca   numeric,
  status_estrutural text,            -- aprovado | atencao | revisar
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- 7. APROVACAO_TECNICA ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aprovacao_tecnica (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  projeto_id       uuid NOT NULL REFERENCES public.projeto_estrutural(id) ON DELETE CASCADE,
  analise_id       uuid REFERENCES public.analise(id) ON DELETE SET NULL,
  engenheiro_nome  text,
  engenheiro_crea  text,
  status           text NOT NULL DEFAULT 'pendente', -- pendente | aprovado | reprovado
  observacoes      text,
  aprovado_em      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 8. RELATORIO ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.relatorio (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  projeto_id   uuid NOT NULL REFERENCES public.projeto_estrutural(id) ON DELETE CASCADE,
  analise_id   uuid REFERENCES public.analise(id) ON DELETE SET NULL,
  tipo         text NOT NULL DEFAULT 'stickfem',
  conteudo     jsonb DEFAULT '{}'::jsonb,
  pdf_url      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_arquivo_cad_projeto        ON public.arquivo_cad(projeto_id);
CREATE INDEX IF NOT EXISTS idx_elemento_projeto           ON public.elemento_estrutural(projeto_id);
CREATE INDEX IF NOT EXISTS idx_analise_projeto            ON public.analise(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_empresa            ON public.projeto_estrutural(empresa_id);
CREATE INDEX IF NOT EXISTS idx_perfil_empresa             ON public.perfil_estrutural(empresa_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.material            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_estrutural   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_estrutural  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivo_cad         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elemento_estrutural ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analise             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aprovacao_tecnica   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio           ENABLE ROW LEVEL SECURITY;

-- Catálogo (material/perfil): leitura da empresa OU global; escrita só da empresa.
CREATE POLICY cat_material_select ON public.material FOR SELECT
  USING (empresa_id = get_empresa_id() OR empresa_id IS NULL);
CREATE POLICY cat_material_write ON public.material FOR ALL
  USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());

CREATE POLICY cat_perfil_select ON public.perfil_estrutural FOR SELECT
  USING (empresa_id = get_empresa_id() OR empresa_id IS NULL);
CREATE POLICY cat_perfil_write ON public.perfil_estrutural FOR ALL
  USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());

-- Demais entidades: tenant estrito por empresa.
CREATE POLICY t_projeto  ON public.projeto_estrutural  FOR ALL USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());
CREATE POLICY t_arquivo  ON public.arquivo_cad         FOR ALL USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());
CREATE POLICY t_elemento ON public.elemento_estrutural FOR ALL USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());
CREATE POLICY t_analise  ON public.analise             FOR ALL USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());
CREATE POLICY t_aprov    ON public.aprovacao_tecnica   FOR ALL USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());
CREATE POLICY t_relat    ON public.relatorio           FOR ALL USING (empresa_id = get_empresa_id()) WITH CHECK (empresa_id = get_empresa_id());

-- ── Seed do catálogo (global, empresa_id NULL) ───────────────────────────────
-- Material padrão Steel Frame (aço estrutural galvanizado ZAR).
INSERT INTO public.material (empresa_id, nome, tipo, fy_mpa, fu_mpa, e_mpa, densidade_kg_m3)
SELECT NULL, v.nome, 'aco_galvanizado', v.fy, v.fu, 200000, 7850
FROM (VALUES
  ('Aço ZAR 230 (Grau 230)', 230, 310),
  ('Aço ZAR 250 (Grau 250)', 250, 330),
  ('Aço ZAR 280 (Grau 280)', 280, 360)
) AS v(nome, fy, fu)
WHERE NOT EXISTS (SELECT 1 FROM public.material WHERE empresa_id IS NULL AND nome = v.nome);

-- Perfis Steel Frame típicos (montantes Ue, guias U). Propriedades aproximadas.
INSERT INTO public.perfil_estrutural
  (empresa_id, material_id, nome, tipo, largura_mm, altura_mm, espessura_mm, aba_mm, area_mm2, inercia_x_mm4, inercia_y_mm4, modulo_wx_mm3, peso_kg_m)
SELECT NULL,
  (SELECT id FROM public.material WHERE empresa_id IS NULL AND nome = 'Aço ZAR 250 (Grau 250)' LIMIT 1),
  v.nome, v.tipo, v.bf, v.d, v.t, v.lip, v.area, v.ix, v.iy, v.wx, v.peso
FROM (VALUES
  ('Montante Ue 90×40×12×0,95',  'montante', 40, 90,  0.95, 12, 156.0,  195000.0, 40000.0,  4333.0, 1.22),
  ('Montante Ue 90×40×12×1,25',  'montante', 40, 90,  1.25, 12, 204.0,  254000.0, 52000.0,  5644.0, 1.60),
  ('Montante Ue 140×40×12×0,95', 'montante', 40, 140, 0.95, 12, 203.0,  590000.0, 44000.0,  8428.0, 1.59),
  ('Montante Ue 140×40×12×1,25', 'montante', 40, 140, 1.25, 12, 266.0,  770000.0, 57000.0, 11000.0, 2.09),
  ('Guia U 92×40×0,95',          'guia',     40, 92,  0.95, 0,  144.0,  185000.0, 34000.0,  4021.0, 1.13),
  ('Guia U 92×40×1,25',          'guia',     40, 92,  1.25, 0,  189.0,  241000.0, 44000.0,  5239.0, 1.48),
  ('Guia U 142×40×1,25',         'guia',     40, 142, 1.25, 0,  251.0,  740000.0, 47000.0, 10422.0, 1.97)
) AS v(nome, tipo, bf, d, t, lip, area, ix, iy, wx, peso)
WHERE NOT EXISTS (SELECT 1 FROM public.perfil_estrutural WHERE empresa_id IS NULL AND nome = v.nome);
