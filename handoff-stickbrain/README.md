# Handoff StickFrame™ — Pacote completo (3 fases)

Pacote único de design + prompts para implementação via **Claude Code**. Tudo em HTML é **referência visual** (protótipo hi-fi), não código de produção — a tarefa é recriar no app real (React 18 + Vite + Supabase, estilos inline + classes + `src/styles/*.css`, **sem Tailwind/styled-components**), reusando os tokens existentes.

## Como usar
1. Descompacte esta pasta na **raiz do repositório** do StickFrame.
2. Faça **uma fase por vez**, na ordem abaixo.
3. Em cada fase: abra a pasta, cole o conteúdo de `PROMPT-CLAUDE-CODE.md` no Claude Code, e deixe os arquivos HTML/assets acessíveis como referência visual.
4. Regra geral em todas as fases: **só o que o prompt pede**, um item por commit, `npm run build` limpo a cada item, **nada de regra de negócio alterada**.

## Ordem recomendada

### 00 · Polimento UX/UI  → `00-polimento-ux/`
Base de consistência. Unifica `<KpiCard>`, empty/loading/error states, banner de notificações, os 4 modais StickQuote e responsividade 390px. **Faça primeiro** — as fases 01/02 reusam o `<KpiCard>` e o padrão visual definidos aqui.
- `README.md` — spec detalhado por item (tokens, CSS, props, arquivos).
- `PROMPT-CLAUDE-CODE.md` — prompt de execução.
- `Polimento UX-UI StickFrame.html` — mockup antes/depois.
- `screenshots/` — 1 imagem por item. `StickQuoteBIMModal.jsx` — referência da lógica intocável.

### 01 · StickBrain Analytics™  → `01-analytics-dashboard/`
Camada de inteligência (views SQL + dashboard `/stickbrain`): KPIs, pipeline em aberto, funil Lead→StickQuote→Orçamento→Venda, origem dos leads, evolução mensal, alertas e insights. **Painel de decisão.**
- `PROMPT-CLAUDE-CODE.md` + `StickBrain Analytics Dashboard.html`.

### 02 · StickBrain Operacional™  → `02-operacional/`
A IA agindo (`/stickbrain/operacional`): fila de ações priorizadas (Agora/Hoje/Semana), scoring de leads, probabilidade de fechamento, sinais de origem e automações com auditoria + desfazer. **Pré-requisito: Fase 01.**
- `PROMPT-CLAUDE-CODE.md` + `StickBrain Operacional.html`.

## Tokens (válidos para as 3 fases)
Fonte: `src/utils/constants.js` (`C`) e `src/styles/globals.css`.
- **Cores:** brick `#981915` · brickSoft `#f3e7e5` · surface `#fff` · surface2 `#faf8f4` · bg `#f4f1ec` · border `#e7e1d8` · text `#26231f` · muted `#8c847a` · graphite `#232225`. Dados/semânticas: success `#3f7a4b` · warning `#b07a1e` · danger `#a33327` · steel `#3b6ea5` · purple `#6d557e` · ochre `#c0892d` · sage `#4f7d57`.
- **Tipografia:** Barlow Condensed (`var(--cond)`) para títulos/números (números grandes peso 800); Hanken Grotesk para corpo/UI; JetBrains Mono para IDs/refs.
- **Forma:** raio 8–12px em cards, 16–20px em modais. Ícones SVG estilo Lucide (`stroke-width:1.9`). **Sem emoji.**
- **Menu:** grupo **StickBrain™** com sub-itens Analytics · Operacional (LIVE) · Recomendações.

## Intocável (todas as fases)
Calculadora pública, StickQuote BIM/PDF/DWG/AI Vision (lógica), geração de PDF (`printHtml`), funil comercial existente, regras de negócio, RLS e autenticação. **Camada visual + views SQL de leitura apenas.**
