-- StickFEM™ — enriquecimento do catálogo de perfis (preparação p/ ProfileCatalogSync).
--
-- ADITIVA e não destrutiva: só adiciona colunas nullable. NÃO altera nem apaga
-- dados existentes. Popular via sincronização de catálogo (quando houver contrato
-- de API confirmado) ou manualmente. Ainda NÃO aplicada em produção — revisar antes.
--
-- Propriedades estruturais completas para dimensionamento (flexão, torção,
-- flexo-torção): Sx/Sy (módulos elásticos), Zx/Zy (plásticos), J (torção),
-- Cw (empenamento), rx/ry (raios de giração), além de metadados de catálogo.

ALTER TABLE public.perfil_estrutural
  ADD COLUMN IF NOT EXISTS codigo               text,      -- código do fornecedor/catálogo
  ADD COLUMN IF NOT EXISTS familia              text,      -- W/I/H, C, U, RHS, SHS, CHS, L, Cartola, Ue...
  ADD COLUMN IF NOT EXISTS categoria            text,      -- laminado, dobrado (formado a frio), alumínio, inox
  ADD COLUMN IF NOT EXISTS norma                text,      -- NBR 8800, NBR 14762, AISC, EN, IS, BS...
  ADD COLUMN IF NOT EXISTS raio_mm              numeric,   -- raio de concordância / dobra
  ADD COLUMN IF NOT EXISTS diametro_mm          numeric,   -- para tubos circulares (CHS)
  ADD COLUMN IF NOT EXISTS modulo_wy_mm3        numeric,   -- Sy — módulo elástico em y
  ADD COLUMN IF NOT EXISTS modulo_zx_mm3        numeric,   -- Zx — módulo plástico em x
  ADD COLUMN IF NOT EXISTS modulo_zy_mm3        numeric,   -- Zy — módulo plástico em y
  ADD COLUMN IF NOT EXISTS raio_giracao_x_mm    numeric,   -- rx
  ADD COLUMN IF NOT EXISTS raio_giracao_y_mm    numeric,   -- ry
  ADD COLUMN IF NOT EXISTS constante_torcao_mm4 numeric,   -- J — constante de torção
  ADD COLUMN IF NOT EXISTS constante_empenamento_mm6 numeric, -- Cw — constante de empenamento
  ADD COLUMN IF NOT EXISTS fonte                text,      -- 'manual' | 'calcsteel' | ...
  ADD COLUMN IF NOT EXISTS versao_catalogo      text,
  ADD COLUMN IF NOT EXISTS ultima_sincronizacao timestamptz;

-- Log de sincronizações de catálogo (cache inteligente: só novos/alterados).
CREATE TABLE IF NOT EXISTS public.perfil_catalogo_sync (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  fonte             text NOT NULL,
  versao_catalogo   text,
  quantidade_total  integer,
  quantidade_novos  integer,
  quantidade_alterados integer,
  tempo_ms          integer,
  erros             text,
  executado_em      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.perfil_catalogo_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY t_perfil_sync ON public.perfil_catalogo_sync FOR ALL
  USING (empresa_id = get_empresa_id() OR empresa_id IS NULL)
  WITH CHECK (empresa_id = get_empresa_id() OR empresa_id IS NULL);
