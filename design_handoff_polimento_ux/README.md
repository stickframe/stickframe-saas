# Handoff: Polimento UX/UI — StickFrame™

## Overview
Pacote de polimento **somente de camada visual** para a plataforma StickFrame™ (gestão de obras em Steel Frame). Seis itens priorizados que aumentam consistência, clareza de estados e responsividade — **sem criar módulos novos e sem alterar regras de negócio**. Cada item tem mock antes/depois em desktop e 390px no arquivo de design HTML.

## About the Design Files
Os arquivos deste bundle são **referências de design feitas em HTML** — protótipos que mostram a aparência e o comportamento pretendidos, **não código de produção para copiar diretamente**. A tarefa é **recriar estes designs no ambiente existente do StickFrame**:

> **Stack real:** React 18 + Vite (SPA), Supabase. Estilo via objetos `style` inline + classes utilitárias e `src/styles/*.css`. **Sem Tailwind, sem styled-components.** Navegação SPA com `activePage` (Zustand) + sidebar drawer em mobile.

Use os tokens e padrões já estabelecidos no repo. **Nada de cores ou fontes novas.**

## Fidelity
**High-fidelity (hifi).** Cores, tipografia, espaçamento e estados são finais e devem ser reproduzidos fielmente usando os tokens existentes (`C` em `src/utils/constants.js`, variáveis CSS em `src/styles/globals.css`).

## Regras de execução (do briefing original)
- Mudança **incremental e revisável**: um item por commit, com antes/depois.
- Reusar tokens `C` e `var(--cond)` — **nada de cores/fontes novas**.
- Acessibilidade: contraste AA, `title`/`aria-label` em ícones-botão, touch targets ≥44px.
- Verificar build (`npm run build`) e renderização a cada item.
- Português nas labels; microcopy curto e direto.
- **Intocável:** Calculadora pública, StickQuote BIM/PDF/DWG/AI Vision, funil comercial, StickBrain Analytics, geração de PDFs (`printHtml`), lógica de RLS, services, repositórios e store. **Só camada visual.**

---

## Design Tokens (use EXATAMENTE estes — `src/utils/constants.js` / `globals.css`)

### Cores
| Token | Hex | Uso |
|---|---|---|
| `red` / brick | `#981915` | acento primário (CTAs, refs) — usar com parcimônia |
| `redDark` | `#7d1411` | hover do primário |
| `brickSoft` | `#f3e7e5` | fundo de ícone em empty-states / banner |
| `surface` | `#ffffff` | superfície de card |
| `surface2` | `#faf8f4` | superfície secundária / inputs |
| `bg` | `#f4f1ec` | fundo da app |
| `border` | `#e7e1d8` | linha/borda |
| `text` | `#26231f` | texto principal |
| `muted` | `#8c847a` | labels/secundário |
| `graphite` | `#2b2b2e` (`#232225`/`#1a191c` variações) | superfícies escuras / modais |
| `success` | `#3f7a4b` | ganho/ok |
| `warning` | `#b07a1e` | atenção / borda de alerta |
| `danger` | `#a33327` | perda/erro |
| `steel` | `#3b6ea5` | dados neutros / acento DWG |
| `purple` | `#6d557e` | acento Vision |
| `ochre` | `#c0892d` | acento BIM |

### Tipografia
- **Barlow Condensed** (`var(--cond)`) → títulos e **números** (números grandes sempre peso **800**).
- **Hanken Grotesk** → corpo/UI (default do body).
- **JetBrains Mono** → IDs/códigos/refs.
- Labels: uppercase, 10px, `muted`, letter-spacing ~1px.

### Forma
- Raio: **8–12px** em cards, **16–20px** em modais.
- Sombra suave: `0 1px 3px rgba(40,30,20,.08), 0 1px 2px rgba(40,30,20,.05)`.

### Ícones
SVG inline estilo Lucide, `stroke-width:1.9`, `stroke="currentColor"`. **Sem emoji.**

---

## Itens (escopo, specs e arquivos)

### 1. Componente `<KpiCard>` unificado ⭐ prioridade alta
**Problema:** três estilos diferentes de "card de número" (Orçamentos, StickBrain, Dashboard/Inteligência).
**Solução:** um componente reutilizável aplicado nas três telas.

- **Props:** `label` (string), `value` (string|number), `sub?` (string), `accent?` (cor token, default `red`), `icon?` (componente/ícone), `alerta?` (`'warning'|'danger'` → adiciona borda esquerda colorida).
- **Variação aprovada: A — borda no topo** (`border-top: 3px solid {accent}`). É a já documentada no Design System ("KPI — borda superior por acento"). As variações B (tile de ícone à esquerda) e C (minimal) existem no mock apenas para comparação — **implementar a A**.
- **Specs (var. A):**
  - Card: `background:#fff; border:1px solid #e7e1d8; border-radius:12px; padding:15px 16px; box-shadow:var(--sh1); border-top:3px solid {accent}; position:relative`.
  - Label: `font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#8c847a`.
  - Value: `font-family:var(--cond); font-weight:800; font-size:30px; line-height:1; color:#26231f; margin-top:7px`.
  - Sub: `font-size:11px; margin-top:6px` — verde (`#3f7a4b`) se positivo, danger se negativo, warning se alerta.
  - Ícone: top-right `26×26`, `border-radius:7px`, fundo `color-mix(accent 12%, #fff)`, stroke = accent.
  - `alerta` → `border-left:3px solid #b07a1e` (mantém o border-top do accent).
  - **Grid container:** `display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px`. Em 390px reflui sozinho para 2 colunas.
- **Arquivos:** `src/components/KpiCard.jsx` (novo componente), e aplicar em `src/pages/Orcamentos.jsx` (mini-dashboard), `src/components/inteligencia/StickBrainAnalytics.jsx` (Mini), `src/pages/Inteligencia.jsx` (KpiCard).

### 2. Banner "Ativar notificações"
**Problema:** barra fixa full-width no rodapé cobre conteúdo/CTAs em todas as telas e reaparece a cada navegação.
**Solução:** card flutuante dispensável.

- Posição: `position:fixed; left:12px; right:12px; bottom:12px` (margem em todos os lados, **não** full-width).
- Estilo: `background:#fff; border:1px solid #e7e1d8; border-radius:12px; padding:12px 14px; box-shadow:var(--sh2)`; ícone `34×34` em `brickSoft`; título 12.5px/700, sub 11px muted.
- Botões: "Ativar" (primário) e um **×** com `aria-label="Dispensar"`.
- **Comportamento:** ao dispensar OU ativar → recolher e gravar `localStorage.setItem('sf_notif_dismissed', sessionId/true)`. **Não reaparecer na mesma sessão.** Ler na montagem; se setado, não renderizar.
- Mobile: respeitar `env(safe-area-inset-bottom)` no `bottom`.
- **Arquivos:** `src/components/NotifBanner.jsx`, layout raiz da App, `localStorage`.

### 3. Estados vazios padronizados
**Problema:** alguns lugares têm só texto solto ("Nenhum orçamento encontrado.").
**Solução:** componente `<EmptyState>` único.

- Estrutura: container centralizado `padding:34px 24px; display:flex; flex-direction:column; align-items:center`.
  - Ilustração: círculo `60×60`, `background:#f3e7e5`, ícone Lucide `27px` stroke `#981915` (1.8).
  - Título: `var(--cond)` 700, 18px, `#26231f`.
  - Texto: 12.5px `#8c847a`, `max-width:280px`, centralizado.
  - CTA primário (ou ghost em contextos secundários).
- **Props sugeridas:** `icon`, `title`, `description`, `action` ({label, onClick}, opcional).
- **Aplicar em:** listas de orçamentos, medições, documentos, StickBrain sem dados.
- **Arquivos:** `src/components/EmptyState.jsx` + os call-sites acima.

### 4. Estados de carregamento & erro
**Problema:** spinners onde o layout é previsível; mensagens de erro técnicas.
**Solução:** skeletons + erro acionável (replicar padrão do AI Vision/StickBrain).

- **Skeleton:** blocos `background:linear-gradient(90deg,#efeae2 25%,#f6f2ec 50%,#efeae2 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px`. Reproduzir a **forma** do conteúdo (avatar 34×34 + 2 linhas + valor à direita por item de lista).
- **Erro:** card `background:#fbeeec; border:1px solid #ecccc7; border-radius:12px; padding:16px 18px`; ícone alerta em tile `#f6dad6` stroke danger; título 13.5px/700; texto 12px `#57514a`; botão ghost "↻ Tentar novamente". Mensagem em PT, amigável e com ação.
- **Arquivos:** `src/components/Skeleton.jsx`, `src/components/ErrorState.jsx`.

### 5. Consistência dos 4 modais StickQuote™ (PDF / DWG / Vision / BIM)
**Problema:** header, stepper, espaçamento e raios variam entre os modais.
**Solução:** um shell de modal único; a **cor de acento** é a única variável por tipo.

- **Acentos:** PDF=`#981915` · DWG=`#3b6ea5` · Vision=`#6d557e` · BIM=`#c0892d`.
- **Shell (fundo escuro `#16151a`, borda `rgba(255,255,255,.09)`, raio 16):**
  1. **Header:** badge `StickQuote™ <TIPO>` (TIPO na cor de acento), nome do arquivo em mono 11px à direita, botão `×`; linha de descrição 12px `rgba(255,255,255,.4)`.
  2. **Stepper unificado:** passos Upload → Revisar → Gerar; bolha `24×24` (concluído/ativo preenchido com o accent, futuro com borda `rgba(255,255,255,.16)`); barras conectoras finas.
  3. **Corpo:** padding `16px 18px`; barra de detalção (stats detectados) com fundo `color-mix(accent 14%, #16151a)`; campos em grid `1fr 1fr`; linhas de sistema com swatch de cor.
  4. **Ações:** rodapé com borda superior, "Cancelar" (ghost) + "Gerar StickQuote™ →" (preenchido com accent).
- Manter toda a lógica existente (parse IFC/PDF/DWG/Vision, `calcMotorComposicao`, `salvarStickQuote`, `gerarStickQuotePDF`). **Só a casca visual muda.**
- **Arquivos:** `src/components/bim/StickQuotePDFModal.jsx`, `StickQuoteDWGModal.jsx`, `StickQuoteVisionModal.jsx`, `StickQuoteBIMModal.jsx` + novo `src/components/bim/QuoteModalShell.jsx` (header+stepper+ações reutilizáveis).

### 6. Responsividade — revisão em 390px
**Problema:** KPIs/pipelines em `overflow-x:auto` cortam conteúdo sem indicação.
**Solução:**
- **KPIs:** trocar linha única por grade que reflui (`repeat(auto-fit,minmax(150px,1fr))`) — em 390px vira 2 colunas, sem corte.
- **Funil comercial:** manter scroll-x, mas adicionar **dica visual** ("→ arraste para ver as fases") abaixo.
- Garantir touch targets ≥44px (já há regra global).
- **Arquivos:** `src/styles/responsive.css`, `src/pages/Inteligencia.jsx`, funil/pipeline, KPIs.

---

## Critério de aceite
- ✅ `<KpiCard>` único usado nas 3 telas (variação A).
- ✅ Banner de notificações não reaparece após dispensar (sessão).
- ✅ Empty / loading / erro consistentes.
- ✅ 4 modais StickQuote com estrutura unificada (acento por tipo).
- ✅ Sem overflow em 390px nas telas tocadas.
- ✅ Build limpo (`npm run build`), nenhuma regra de negócio alterada.

## Assets
- `assets/logo-stickframe-mark.png` — marca isolada (já existe no repo em `src/`/`assets`). Nenhum asset novo é necessário; todos os ícones são SVG inline estilo Lucide.

## Files (referências de design neste bundle)
- `Polimento UX-UI StickFrame.html` — protótipo interativo antes/depois (6 itens, desktop + 390px, picker de variação do KpiCard, dispensar banner). **Fonte de verdade visual.**
- `screenshots/` — capturas de cada item para referência rápida sem abrir o HTML:
  - `00-visao-geral.png`, `01-kpicard.png`, `02-banner.png`, `03-empty-states.png`, `04-loading-erro.png`, `05-modais-stickquote.png`, `06-responsividade-390.png`.
- `assets/logo-stickframe-mark.png` — logo usada no protótipo.
- `StickQuoteBIMModal.jsx` — modal real existente, incluído como referência da lógica intocável que o shell unificado deve preservar.
