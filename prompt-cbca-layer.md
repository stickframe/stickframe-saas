# PROMPT — StickFrame™ CBCA Layer™ (Fase 14)

Você é um Growth Product Engineer + SaaS Product Manager + UX Engineer + Content Strategist.

Sua missão é executar a fase:

## StickFrame™ CBCA Layer™

Inspirado pelo Centro Brasileiro da Construção em Aço (CBCA), o objetivo é transformar o StickFrame™ em uma **plataforma de conhecimento + inteligência + prova social** para o mercado de Steel Frame, indo além de ferramenta de gestão.

**O foco agora é autoridade, diferenciação e ecossistema.**
- NÃO criar módulos de gestão (CRM, Obras, Financeiro — já existem)
- NÃO alterar regras comerciais
- NÃO quebrar: StickQuote™, BIM, Calculadora, Orçamento Técnico, Portal Cliente, StickBrain™, PWA, RLS, multi-tenancy
- Conteúdo público gera leads; conteúdo interno gera stickiness

### Contexto atual

O StickFrame™ já possui Growth Layer™ implementada (9 fases):
- Onboarding inteligente por perfil (diretor, comercial, engenheiro, financeiro)
- Ativação mensurável (vw_activation_score, vw_trial_health)
- Trial inteligente com progresso
- Dashboard de valor (SeuProgresso, TrialProgress)
- Tour contextual (TourPopover)
- Pricing vendendo resultado
- Métricas growth (12 eventos em saas_events)
- Admin growth (/admin/growth)

### Antes de codificar

Analisar:
- LandingPage, Pricing — posicionamento atual
- fluxo de leads (calculadora pública → cadastro → trial)
- Dashboard existente e SeuProgresso
- eventos saas_events existentes
- Supabase schema (tabelas obras, empresas, leads)
- constantes e utils de formato
- perfis de usuário e planos (Essencial R$97, Profissional R$197, Construtora+ sob consulta)

---

## FASE C.1 — Banco de Obras (Galeria Pública)

**O que:** Página pública `/obras` com portfólio de projetos executados por clientes StickFrame.

**Por que:** Prova social, SEO, geração de leads qualificados.

**Funcionalidades:**
- Nova tabela ou flag `publicada` na tabela `obras` existente
- Admin toggle na obra: "Publicar no Banco de Obras"
- Campos opcionais: fotos (upload múltiplo), descrição, área, tipologia, cidade/UF, prazo, destaque
- Página pública `/obras` com grid filtrado (tipologia, cidade, área mínima/máxima)
- Página individual `/obra/:slug` com galeria de fotos + dados + CTA "Quero um orçamento para minha obra"
- Banner na LandingPage: "Conheça obras feitas com StickFrame" → link `/obras`
- SEO: slugs amigáveis, meta tags, Open Graph

**Considerações técnicas:**
- Reaproveitar upload de fotos já existente (storage Supabase)
- RLS: obras_públicas são view somente leitura para anon
- CTA da obra individual redireciona para calculadora pública com contexto pré-preenchido
- Ordem: destaque primeiro, depois mais recentes

## FASE C.2 — Blog / Conteúdo Técnico

**O que:** Seção `/blog` com artigos sobre Steel Frame, construção a seco, gestão de obras, cases.

**Por que:** SEO de longo prazo, nutrição de leads, autoridade de mercado.

**Funcionalidades:**
- Admin de posts: editor (Markdown simples ou rich text), categorias, tags, slug, meta description, imagem de capa, autor
- Página pública `/blog` com listagem, busca, categorias, paginação
- Página individual `/blog/:slug` com conteúdo + CTA contextual (final do post: "Quer ajuda para orçar? Calcule grátis" → calculadora)
- Conteúdo gated (opcional): posts premium exigem e-mail ou login para ler completo
- Feed RSS + sitemap XML
- Compartilhamento (WhatsApp, LinkedIn)
- Posts podem ser usados em e-mail marketing automatizado

**Considerações técnicas:**
- Tabela `blog_posts` (id, titulo, slug, conteudo, resumo, categoria, tags[], imagem_capa, autor, publicado_em, criado_em, atualizado_em)
- Tabela `blog_categorias` (id, nome, slug)
- Admin acessível via menu para usuários admin
- Versão pública sem autenticação (anon pode ler)
- SEO: gerar sitemap.xml programaticamente

## FASE C.3 — Biblioteca Técnica

**O que:** Acervo de manuais, guias, composições e normas técnicas dentro do sistema.

**Por que:** Aumenta stickiness, reduz churn, justifica upgrade de plano.

**Funcionalidades:**
- Seção no menu lateral: "Biblioteca Técnica" (dentro do app logado)
- Upload de PDFs com categoria, descrição, thumbnail
- Categorias: Composições Steel Frame, Normas NR, Manuais de Montagem, Especificações Técnicas, Guias Rápidos
- Visualizador de PDF integrado (embed ou modal)
- Busca full-text nos títulos e descrições
- Controle por plano: Essencial vê amostras (3 docs), Profissional vê acervo completo, Construtora+ vê acervo + downloads
- Badge "NOVO" em documentos recentes
- Data de atualização visível

**Considerações técnicas:**
- PDFs armazenados no Supabase Storage (bucket `biblioteca`)
- Tabela `biblioteca_docs` (id, titulo, descricao, categoria, file_url, thumbnail_url, plano_minimo, created_at)
- Visualizador: usar iframe com URL do storage (anon ou signed URL conforme plano)
- RLS por plano usando claim `raw_user_meta_data->>'plano'`

## FASE C.4 — Benchmarks do Setor

**O que:** Painel interno (e relatório público) com estatísticas anonimizadas do ecossistema StickFrame.

**Por que:** Diferencial absoluto — nenhum concorrente tem dados reais do mercado Steel Frame brasileiro.

**Funcionalidades:**
- View `vw_benchmark_m2`: custo médio por m² por tipologia, região, porte
- View `vw_benchmark_prazo`: prazo médio por tipologia e área
- View `vw_benchmark_distribuicao`: % custo material vs mão de obra vs administrativo
- Dashboard interno `/benchmarks` com gráficos (Chart.js ou Recharts)
- Comparativo: "Sua obra está X% acima/abaixo da média"
- Garantia de privacidade: mínimo N=10 obras por bucket; abaixo disso não exibe
- Relatório público em PDF (lead magnet: "Relatório de Mercado Steel Frame 2026")
- Selo no Dashboard: "Sua margem está X% acima da média"

**Considerações técnicas:**
- Dados vão das tabelas existentes: `obras`, `orcamentos`, `financeiro_lancamentos`
- Anonimização: nunca expor empresa_id, nomes, dados individuais
- Materialized views com refresh periódico (cron job ou manual)
- RLS: view de benchmark é pública (anon) para dados agregados; dashboard detalhado só para assinantes
- PDF gerado server-side (jsPDF ou API externa)

## FASE C.5 — Guia de Boas Práticas Interativo

**O que:** Checklist por fase da obra com instruções, fotos de referência e registro de conformidade.

**Por que:** Diferencia de ERPs genéricos, reduz retrabalho, integra com qualidade.

**Funcionalidades:**
- Aba "Boas Práticas" dentro de cada obra (no app)
- Estrutura: guias por fase (fundação, estrutura, fechamento, instalações, acabamento)
- Cada guia tem itens com: título, descrição, foto de referência, campo para foto do registro, checkbox de conferido, campo de observação
- Engenheiro marca itens como conferidos e tira foto no celular
- Relatório de conformidade por fase (PDF exportável)
- Versão: permite atualizar guias sem afetar obras em andamento

**Considerações técnicas:**
- Tabelas: `guias` (id, titulo, fase_obra, versao), `guias_itens` (id, guia_id, ordem, titulo, descricao, foto_referencia_url, obrigatorio)
- Tabela `obra_conformidade` (id, obra_id, guia_item_id, conferido_em, conferido_por, foto_registro_url, observacao)
- Reaproveitar upload de fotos já existente
- Mobile-first (usado no canteiro)
- Seed inicial com guias baseados em normas técnicas (NBR, CBCA)

## FASE C.6 — Treinamentos / Cursos Online (LMS)

**O que:** Plataforma de cursos sobre Steel Frame dentro do StickFrame.

**Por que:** Novo revenue stream, upsell, diferenciação, redução de churn.

**Funcionalidades:**
- Vitrine pública `/cursos` com lista de cursos disponíveis
- Curso gratuito: "Steel Frame Básico" — para leads e trial users
- Cursos pagos: avulsos (R$197–497) ou inclusos no plano Construtora+
- Estrutura: curso → módulos → aulas (vídeo embed + material PDF + descrição)
- Progresso do aluno por curso (% concluído)
- Quiz ao final de cada módulo (opcional)
- Certificado PDF com nome, curso, carga horária, data
- Admin: cadastro de cursos, módulos, aulas, ordem
- Integração com checkout existente

**Considerações técnicas:**
- Tabelas: `cursos` (id, titulo, descricao_curta, descricao_longa, imagem_capa, preco, plano_incluso, gratuito boolean, carga_horaria, ativo boolean)
- `curso_modulos` (id, curso_id, titulo, ordem)
- `curso_aulas` (id, modulo_id, titulo, video_url, material_url, duracao_min, ordem)
- `curso_progresso` (id, usuario_id, aula_id, concluido boolean, concluido_em)
- `curso_certificados` (id, usuario_id, curso_id, emitido_em, codigo_verificacao)
- Vídeos hospedados no YouTube (não privado) ou Vimeo (privado por domínio)
- Certificado: jsPDF com template bonito e código de verificação

---

### Critérios de aceite

Obrigatório:
- Banco de Obras público com grid e filtros funcionando
- Blog com admin de posts e página pública
- Biblioteca Técnica acessível dentro do app
- Benchmarks com dados reais anonimizados
- Guia de Boas Práticas interativo por obra
- Cursos com progresso e certificado
- Tudo seguindo padrão de código existente
- `npm run build` sem erros
- Não quebrar funcionalidades existentes

### Formato de commits

`cbca-layer: <fase> — <descrição>`

### Entrega final

Informar:
- componentes criados e alterados
- tabelas/views criadas
- rotas adicionadas
- telas alteradas
- impacto esperado (SEO, leads, retenção, receita)
- confirmação build
- seeds iniciais criados (guias, docs, curso gratuito, posts exemplo)
