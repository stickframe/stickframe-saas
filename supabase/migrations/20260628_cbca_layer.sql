-- ═══════════════════════════════════════════════════════════════════════════
-- STICK FRAME SAAS — CBCA Layer (2026-06-28)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. PORTFÓLIO DE OBRAS PÚBLICAS (Extensões na tabela public.obras)
ALTER TABLE public.obras 
ADD COLUMN IF NOT EXISTS publicada boolean default false,
ADD COLUMN IF NOT EXISTS descricao_publica text,
ADD COLUMN IF NOT EXISTS fotos_publicas jsonb default '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tipologia text,
ADD COLUMN IF NOT EXISTS destaque boolean default false,
ADD COLUMN IF NOT EXISTS cidade_publica text,
ADD COLUMN IF NOT EXISTS uf_publica text,
ADD COLUMN IF NOT EXISTS prazo_dias integer;

-- RLS Policy pública para visualização de obras publicadas
DROP POLICY IF EXISTS obras_publicas_select ON public.obras;
CREATE POLICY obras_publicas_select ON public.obras
  FOR SELECT TO anon, authenticated USING (publicada = true);

-- 2. BLOG / CONTEÚDO TÉCNICO
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  slug text unique not null,
  conteudo text not null,
  resumo text,
  categoria text,
  tags text[] default '{}',
  imagem_capa text,
  autor text,
  publicado_em timestamptz,
  criado_em timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_posts_public_select ON public.blog_posts;
CREATE POLICY blog_posts_public_select ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (publicado_em IS NOT NULL AND publicado_em <= now());

DROP POLICY IF EXISTS blog_posts_admin_all ON public.blog_posts;
CREATE POLICY blog_posts_admin_all ON public.blog_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true); -- Permitir que usuários autenticados gerenciem posts no sandbox

-- 3. BIBLIOTECA TÉCNICA
CREATE TABLE IF NOT EXISTS public.biblioteca_docs (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descricao text,
  categoria text not null, -- Composições, Normas NR, Manuais de Montagem, Especificações
  file_url text not null,
  thumbnail_url text,
  plano_minimo text default 'essencial', -- essencial | profissional | Construtora+
  created_at timestamptz default now()
);

ALTER TABLE public.biblioteca_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS biblioteca_docs_select ON public.biblioteca_docs;
CREATE POLICY biblioteca_docs_select ON public.biblioteca_docs
  FOR SELECT TO authenticated USING (true);

-- 4. GUIA DE BOAS PRÁTICAS (Checklists de Qualidade)
CREATE TABLE IF NOT EXISTS public.guias (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  fase_obra text not null,
  versao text not null,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.guias_itens (
  id uuid default gen_random_uuid() primary key,
  guia_id uuid references public.guias(id) on delete cascade not null,
  ordem integer not null,
  titulo text not null,
  descricao text,
  foto_referencia_url text,
  obrigatorio boolean default true
);

CREATE TABLE IF NOT EXISTS public.obra_conformidade (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references public.obras(id) on delete cascade not null,
  guia_item_id uuid references public.guias_itens(id) on delete cascade not null,
  conferido_em timestamptz default now(),
  conferido_por uuid,
  foto_registro_url text,
  observacao text,
  unique (obra_id, guia_item_id)
);

ALTER TABLE public.guias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guias_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_conformidade ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guias_select ON public.guias;
CREATE POLICY guias_select ON public.guias FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS guias_itens_select ON public.guias_itens;
CREATE POLICY guias_itens_select ON public.guias_itens FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS obra_conformidade_all ON public.obra_conformidade;
CREATE POLICY obra_conformidade_all ON public.obra_conformidade
  FOR ALL TO authenticated USING (
    exists (select 1 from public.obras o where o.id = obra_id and o.empresa_id = public.get_empresa_id())
  );

-- 5. CURSOS ONLINE (LMS)
CREATE TABLE IF NOT EXISTS public.cursos (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descricao_curta text,
  descricao_longa text,
  imagem_capa text,
  preco numeric default 0,
  plano_incluso text default 'profissional',
  gratuito boolean default false,
  carga_horaria integer,
  ativo boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.curso_modulos (
  id uuid default gen_random_uuid() primary key,
  curso_id uuid references public.cursos(id) on delete cascade not null,
  titulo text not null,
  ordem integer not null
);

CREATE TABLE IF NOT EXISTS public.curso_aulas (
  id uuid default gen_random_uuid() primary key,
  modulo_id uuid references public.curso_modulos(id) on delete cascade not null,
  titulo text not null,
  video_url text,
  material_url text,
  duracao_min integer default 10,
  ordem integer not null
);

CREATE TABLE IF NOT EXISTS public.curso_progresso (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid not null,
  aula_id uuid references public.curso_aulas(id) on delete cascade not null,
  concluido boolean default false,
  concluido_em timestamptz default now(),
  unique (usuario_id, aula_id)
);

CREATE TABLE IF NOT EXISTS public.curso_certificados (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid not null,
  curso_id uuid references public.cursos(id) on delete cascade not null,
  emitido_em timestamptz default now(),
  codigo_verificacao text unique not null
);

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_certificados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cursos_select ON public.cursos;
CREATE POLICY cursos_select ON public.cursos FOR SELECT TO authenticated USING (ativo = true);

DROP POLICY IF EXISTS curso_modulos_select ON public.curso_modulos;
CREATE POLICY curso_modulos_select ON public.curso_modulos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS curso_aulas_select ON public.curso_aulas;
CREATE POLICY curso_aulas_select ON public.curso_aulas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS curso_progresso_all ON public.curso_progresso;
CREATE POLICY curso_progresso_all ON public.curso_progresso
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS curso_certificados_select ON public.curso_certificados;
CREATE POLICY curso_certificados_select ON public.curso_certificados
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());

-- 6. VIEWS DE BENCHMARKS DO SETOR (Agregador)
CREATE OR REPLACE VIEW public.vw_benchmark_m2 AS
  SELECT 
    tipologia,
    uf_publica as uf,
    count(id) as total_obras,
    round(avg(contrato / nullif(area_m2, 0)), 2) as custo_medio_m2
  FROM public.obras
  WHERE publicada = true AND area_m2 > 0 AND contrato > 0 AND tipologia IS NOT NULL
  GROUP BY tipologia, uf_publica
  HAVING count(id) >= 1; -- Mínimo 1 obra para permitir visualização no ambiente de homologação/demo

CREATE OR REPLACE VIEW public.vw_benchmark_prazo AS
  SELECT 
    tipologia,
    round(avg(prazo_dias), 1) as prazo_medio_dias,
    count(id) as total_obras
  FROM public.obras
  WHERE publicada = true AND prazo_dias > 0 AND tipologia IS NOT NULL
  GROUP BY tipologia
  HAVING count(id) >= 1;

CREATE OR REPLACE VIEW public.vw_benchmark_distribuicao AS
  SELECT 
    tipologia,
    round(avg(case when categoria = 'Materiais' then percentual else null end), 1) as materials_pct,
    round(avg(case when categoria = 'Mão de obra' then percentual else null end), 1) as labor_pct,
    round(avg(case when categoria = 'Outros' then percentual else null end), 1) as other_pct
  FROM (
    SELECT 
      o.tipologia,
      l.categoria,
      (sum(l.valor) / nullif(o.contrato, 0)) * 100 as percentual
    FROM public.financeiro l
    JOIN public.obras o ON l.obra_id = o.id
    WHERE o.publicada = true AND o.contrato > 0 AND l.categoria IN ('Materiais', 'Mão de obra', 'Outros')
    GROUP BY o.id, o.tipologia, o.contrato, l.categoria
  ) t
  GROUP BY tipologia;

-- 7. SEED INITIAL DATA (Biblioteca, Cursos, Blog, Guias)
-- Seed: Biblioteca Técnica
INSERT INTO public.biblioteca_docs (titulo, descricao, categoria, file_url, thumbnail_url, plano_minimo)
VALUES 
  ('Manual CBCA — Estruturas em Light Steel Framing', 'Guia oficial do Centro Brasileiro da Construção em Aço com diretrizes completas de dimensionamento e projeto de LSF.', 'Manuais de Montagem', 'https://www.cbca-acobrasil.org.br/site/arquivos/downloads/livro-light-steel-framing.pdf', 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=200', 'essencial'),
  ('Manual de Detalhes Construtivos LSF', 'Detalhamento técnico de ligações, interfaces de fundação, contraventamento e painéis.', 'Especificações', 'https://www.cbca-acobrasil.org.br/site/arquivos/downloads/detalhes-lsf.pdf', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200', 'profissional'),
  ('NR-18 — Segurança e Saúde no Trabalho na Indústria da Construção', 'Norma Regulamentadora completa aplicada à construção de estruturas metálicas e Steel Frame.', 'Normas NR', 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/normas-regulamentadoras/nr-18.pdf', 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=200', 'essencial'),
  ('Diretrizes SINAT 003 — Sistemas Construtivos em Perfis Leves de Aço', 'Diretrizes nacionais para avaliação técnica de sistemas construtivos inovadores de LSF.', 'Especificações', 'https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/pbqp-h/documentos-sinat/diretriz-sinat-003.pdf', 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=200', 'Construtora+');

-- Seed: Cursos LMS
INSERT INTO public.cursos (id, titulo, descricao_curta, descricao_longa, imagem_capa, preco, plano_incluso, gratuito, carga_horaria)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Introdução ao Light Steel Framing', 'Entenda o básico do sistema construtivo a seco: montagem, perfis e materiais.', 'O Light Steel Framing (LSF) é um sistema construtivo de concepção estrutural (autoportante), composto por perfis formados a frio de aço galvanizado. Neste curso gratuito, você aprenderá as bases técnicas necessárias para começar a atuar e gerenciar obras em LSF.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600', 0, 'essencial', true, 8),
  ('c0000000-0000-0000-0000-000000000002', 'Orçamento e Planejamento de Steel Frame', 'Aprenda a levantar quantitativos, calcular custos de insumos e margens de lucro.', 'Dominar o orçamento de LSF é essencial para garantir a rentabilidade da sua construtora. Este treinamento abordará o cálculo de perfis de aço por m², fechamento em placas OSB/gesso, modulação e estimativa de mão de obra usando o StickQuote™.', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600', 297, 'profissional', false, 16);

-- Seed: Curso Modulos
INSERT INTO public.curso_modulos (id, curso_id, titulo, ordem)
VALUES
  ('b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'Módulo 1: Fundamentos do Aço', 1),
  ('b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'Módulo 2: Fechamentos e Isolamento', 2),
  ('b0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000002', 'Módulo 1: Levantamento de Aço (StickQuote)', 1);

-- Seed: Curso Aulas
INSERT INTO public.curso_aulas (modulo_id, titulo, video_url, material_url, duracao_min, ordem)
VALUES
  ('b0000000-0000-0000-0000-000000000011', 'Aula 1.1 — O que é LSF e histórico', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://pdfobject.com/pdf/sample.pdf', 12, 1),
  ('b0000000-0000-0000-0000-000000000011', 'Aula 1.2 — Tipos de perfis (U e Ue) e normatização', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://pdfobject.com/pdf/sample.pdf', 15, 2),
  ('b0000000-0000-0000-0000-000000000012', 'Aula 2.1 — Placas OSB e Gesso Acartonado', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://pdfobject.com/pdf/sample.pdf', 20, 1),
  ('b0000000-0000-0000-0000-000000000021', 'Aula 1.1 — Integração de projetos BIM', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://pdfobject.com/pdf/sample.pdf', 25, 1);

-- Seed: Blog Posts
INSERT INTO public.blog_posts (titulo, slug, conteudo, resumo, categoria, tags, imagem_capa, autor, publicado_em)
VALUES
  ('Como Calcular o Preço do m² em Obras de Steel Frame', 'como-calcular-preco-m2-steel-frame', '# Guia Completo de Orçamento em LSF
  
  Orçar uma obra de Steel Frame exige atenção a detalhes que diferem da alvenaria tradicional.
  
  ## Principais Insumos:
  1. **Aço Estrutural Galvanizado**: A estrutura consome em média 18kg a 25kg de aço por m².
  2. **Fechamento Externo**: Placas cimentícias ou sistema EIFS (mais moderno).
  3. **Isolamento Térmico/Acústico**: Lã de vidro ou PET é fundamental.
  
  Use ferramentas como o **StickQuote™** para agilizar o cálculo!', 'Entenda os principais fatores de custos no LSF e como estimar o preço de m² com precisão.', 'Gestão de Obras', ARRAY['Cálculos', 'Steel Frame', 'Orçamentos'], 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800', 'Eng. André Queiroz', now()),
  ('Vantagens do Light Steel Framing versus Alvenaria', 'vantagens-light-steel-framing-vs-alvenaria', '# LSF vs Alvenaria Convencional
  
  A construção industrializada vem crescendo exponencialmente no Brasil. A sustentabilidade e velocidade são os maiores argumentos de vendas.
  
  ## Vantagens:
  * **Velocidade**: Obra entregue até 3x mais rápido.
  * **Sustentabilidade**: Menor desperdício de água e descarte de entulho.
  * **Precisão**: Desvio milimétrico no canteiro.', 'Compare prazos, custos e sustentabilidade do sistema LSF com a alvenaria convencional.', 'Tecnologia', ARRAY['Diferenciais', 'Mercado'], 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800', 'Eng. André Queiroz', now());

-- Seed: Guias Técnicos
INSERT INTO public.guias (id, titulo, fase_obra, versao)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Guia de Fundação — Radier', 'Fundação', '1.0'),
  ('f0000000-0000-0000-0000-000000000002', 'Guia de Estrutura — Montagem de Painéis', 'Estrutura Steel Frame', '1.0');

-- Seed: Itens de Guias
INSERT INTO public.guias_itens (guia_id, ordem, titulo, descricao, foto_referencia_url)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 1, 'Nivelamento e gabarito', 'Verificar se o nível da fôrma do radier está rigorosamente plano antes da concretagem. Desvios maiores que 5mm devem ser corrigidos.', 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=300'),
  ('f0000000-0000-0000-0000-000000000001', 2, 'Posicionamento de tubulações (hidráulica/elétrica)', 'Garantir que todas as esperas de instalações estejam fixadas antes da concretagem, já que o radier não aceita rasgos posteriores.', 'https://images.unsplash.com/photo-1542060748-10c28b629f6f?w=300'),
  ('f0000000-0000-0000-0000-000000000002', 1, 'Prumo e contraventamento de paredes', 'Instalar prumo temporário e fitas metálicas de contraventamento X conforme projeto de engenharia.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300'),
  ('f0000000-0000-0000-0000-000000000002', 2, 'Instalação de chumbadores (ancoragem)', 'Verificar espaçamento de chumbadores mecânicos ou químicos que fixam a guia inferior ao concreto.', 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300');
