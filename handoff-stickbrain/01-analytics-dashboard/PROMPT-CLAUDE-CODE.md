# PROMPT — Claude Code · StickBrain Analytics Dashboard™ (Fase 2)

Cole na raiz do repositório do StickFrame™. **Referência visual obrigatória:** `stickbrain-dashboard/StickBrain Analytics Dashboard.html` (mockup hi-fi aprovado) — recrie-o no app, não copie o HTML.

---

Você é um **Arquiteto Full Stack + Product Engineer sênior**. Implemente a **Fase 2 — StickBrain Analytics Dashboard™**: uma camada de inteligência comercial/operacional sobre os dados já existentes, transformando o fluxo **Lead → StickQuote™ → Orçamento → Proposta → Negociação → Fechamento** num painel de decisão estilo BI, integrado ao ecossistema atual.

> O dashboard responde em 5 segundos: **"de onde vem dinheiro, onde está travando e o que precisa ser feito?"** — é painel de decisão, não relatório.

## Antes de escrever código
- Leia a arquitetura: estrutura React, padrão de componentes, rotas, autenticação, cliente Supabase, services e store (Zustand) existentes.
- Mapeie os tokens visuais em `src/utils/constants.js` (`C`) e `src/styles/globals.css` (`var(--cond)`).
- **Valide os nomes/campos REAIS** das tabelas antes de qualquer SQL — `leads`, `clientes`, `stickquote_versoes`, `orcamentos`, `propostas`, negociações, fechamentos. **Não assuma estrutura.**

## Regras inegociáveis
- Fonte de dados: **Supabase/Postgres**; analytics via **views SQL**; React apenas consome.
- Manter o padrão atual (estilos inline + classes utilitárias + `src/styles/*.css`. **Sem Tailwind, sem styled-components.**).
- **NÃO alterar:** calculadora pública, StickQuote BIM/PDF/DWG/AI Vision (lógica), geração de PDF, funil comercial existente, regras de negócio, RLS, autenticação.
- **Nada de paleta/design system novos** — usar tokens existentes. Ícones SVG inline estilo Lucide. **Sem emoji.**
- Responsivo desktop/mobile. Acessibilidade AA, touch targets ≥44px.

## Execução por etapas — um item por commit
Cada item: implementar → testar → `npm run build` → validar → commit `analytics(stickbrain): <item>`.

### ITEM 1 — Camada SQL Analytics
Pasta `supabase/analytics/`. Migration `001_funil_dashboard.sql` com **`vw_stickbrain_funil`**, retornando por lead:
`lead_id, origem, temperatura, stickquote_id, stickquote_created_at, stickquote_vinculado, orcamento_id, orcamento_status, orcamento_valor, proposta_status, fechamento_status, valor_ganho, tempo_lead_orcamento, tempo_orcamento_fechamento`.

### ITEM 2 — KPIs executivo
**`vw_stickbrain_kpis`** retornando:
- **Volume:** total leads, StickQuotes, orçamentos, fechamentos.
- **Conversão:** lead→StickQuote, StickQuote→orçamento, orçamento→fechamento.
- **Receita:** valor vendido, ticket médio.
- **Pipeline:** valor em aberto + por estágio (qualificação / proposta enviada / em negociação). *(novo — ver ajuste 2)*
- **Eficiência:** tempo médio de fechamento.

### ITEM 3 — Dashboard React
`src/pages/StickBrainDashboard.jsx`, rota `/stickbrain`. Layout **conforme o mockup** (de cima para baixo):
1. **Header** "StickBrain Analytics™" + subtítulo + ações (atualizar/exportar).
2. **Filtros:** Período (7d/30d/90d/12m) · Origem · Status · **Responsável** *(novo — ajuste 3)*.
3. **Pipeline em aberto** (card-herói): valor total + variação + breakdown por estágio *(novo — ajuste 2)*.
4. **KPIs:** Leads · StickQuotes · Orçamentos · Fechamentos (com % de conversão de cada etapa).
5. **Métricas secundárias:** Receita vendida · Ticket médio · Conversão lead→venda · Tempo médio fechamento.
6. **Funil comercial:** Lead → StickQuote → Orçamento → Venda (com taxas entre etapas).
7. **Origem dos leads:** volume + conversão para venda por canal (Google, Indicação, Calculadora, PDF, DWG, AI Vision).
8. **Evolução mensal:** linha — leads · vendas · receita.
9. **Alertas inteligentes:** StickQuotes órfãos (com **R$ em potencial parado** + ação Recuperar), leads parados, conversão abaixo da média.
10. **StickBrain™ diz:** insights quantificados com ações (ex.: [Gerar lista] [Enviar follow-up]).

### ITEM 4 — Componentes
`src/components/stickbrain/`: `KpiAnalyticsCard.jsx`, `ConversionFunnel.jsx`, `OriginPerformanceChart.jsx`, `AnalyticsAlerts.jsx`, `StickBrainInsights.jsx`, `PipelineSummary.jsx` *(novo)*.

### ITEM 5 — Visual
Seguir tokens e componentes existentes. KPI usa a variação **borda no topo** (consistente com o `<KpiCard>` do polimento). Não criar paleta/Tailwind/styled-components.

### ITEM 6 — Gráficos
Usar a lib de gráficos já existente; se não houver, adicionar **recharts**. Funil (barras decrescentes), conversão por origem (barras), evolução mensal (linha: leads/vendas/receita).

### ITEM 7 — StickBrain IA (preparação)
`src/services/stickbrainAI.js`. Entrada `{leads, stickquotes, orcamentos, vendas, origem, conversao, tempo_medio}` → saída `{alertas:[], oportunidades:[], recomendacoes:[]}`. **Sem modelo de IA ainda** — só a camada que prepara/estrutura os dados (regras determinísticas: órfãos, leads parados, origem abaixo da média).

### ITEM 8 — Segurança
Usuários só veem dados permitidos; respeitar a RLS existente; nenhuma tabela operacional exposta sem proteção. Filtro "Responsável" deve respeitar o perfil/escopo do usuário.

## Ajustes do review (já refletidos no mockup — aplicar)
1. **Menu "StickBrain"** como produto (não "IA"): grupo com sub-itens **Analytics · Recomendações · Alertas**.
2. **KPI "Pipeline em aberto"** (venda futura) em destaque, com breakdown por estágio.
3. **Filtro "Responsável"** (vendedor/equipe).
4. **Alertas com valor em R$** (ex.: "12 StickQuotes órfãos · R$ 540 mil parados" + Recuperar).
5. **Área IA acionável:** "StickBrain™ diz:" com estimativa quantificada + botões de ação.

## Critério de aceite
✅ `/stickbrain` funcionando · ✅ views SQL criadas e validadas contra o schema real · ✅ KPIs reais do Supabase · ✅ gráficos funcionando · ✅ responsivo desktop/mobile · ✅ `npm run build` sem erros · ✅ nenhuma funcionalidade existente quebrada.

## Entregável final
Arquivos criados/alterados · migrations SQL aplicadas · queries principais · screenshots do dashboard · confirmação de build limpo.
