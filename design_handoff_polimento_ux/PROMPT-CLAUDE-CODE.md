# PROMPT — Claude Code · Polimento UX/UI StickFrame™

Cole este prompt no Claude Code, na raiz do repositório do StickFrame, com a pasta `design_handoff_polimento_ux/` presente.

---

Você é um **Product Designer + Front-end sênior**. Sua tarefa é **executar um polimento de UX/UI somente visual** no StickFrame™, seguindo **fielmente** o pacote em `design_handoff_polimento_ux/`.

## Antes de escrever código
1. Leia `design_handoff_polimento_ux/README.md` por completo — é a fonte de verdade.
2. Abra os screenshots em `design_handoff_polimento_ux/screenshots/` para ver o antes/depois de cada item.
3. Abra `design_handoff_polimento_ux/Polimento UX-UI StickFrame.html` se precisar inspecionar valores exatos de CSS.
4. Mapeie os tokens reais em `src/utils/constants.js` (objeto `C`) e `src/styles/globals.css` (`var(--cond)`, etc). **Não use o HTML como código de produção** — recrie no padrão do repo (React 18 + Vite, estilos inline + classes utilitárias + `src/styles/*.css`. Sem Tailwind, sem styled-components).

## Regras inegociáveis
- **Só camada visual.** NÃO altere regras de negócio, services, repositórios, store (Zustand), RLS, nem a geração de PDFs (`printHtml`).
- **Intocável (não quebrar):** Calculadora pública, StickQuote BIM/PDF/DWG/AI Vision (lógica), funil comercial, StickBrain Analytics.
- **Nada de cores ou fontes novas** — apenas tokens `C` e `var(--cond)`.
- Acessibilidade: contraste AA, `title`/`aria-label` em ícones-botão, touch targets ≥44px.
- Ícones: SVG inline estilo Lucide (`stroke-width:1.9`, `stroke="currentColor"`). **Sem emoji.**
- Microcopy em **português**, curto e direto.

## Execução — um item por commit (nesta ordem)
Para CADA item: implemente → rode `npm run build` (precisa passar limpo) → confira a renderização → commit com mensagem `polish(ux): <item>` e descreva o antes/depois.

1. **`<KpiCard>` unificado (prioridade alta)** — criar `src/components/KpiCard.jsx` (variação **A — borda no topo**, props `label/value/sub/accent/icon/alerta`) e aplicar em `src/pages/Orcamentos.jsx`, `src/components/inteligencia/StickBrainAnalytics.jsx`, `src/pages/Inteligencia.jsx`. Specs no README §1.
2. **Banner "Ativar notificações"** — card flutuante dispensável; persistir dispensa em `localStorage` (`sf_notif_dismissed`), não reaparecer na sessão; respeitar `safe-area`. README §2.
3. **Empty states** — `src/components/EmptyState.jsx` e aplicar em orçamentos/medições/documentos/StickBrain. README §3.
4. **Loading/erro** — `src/components/Skeleton.jsx` + `src/components/ErrorState.jsx`; skeletons no lugar de spinners onde o layout é previsível. README §4.
5. **Modais StickQuote** — extrair `src/components/bim/QuoteModalShell.jsx` (header + stepper + ações) e aplicar nos 4 modais mantendo o acento por tipo (PDF=`#981915`, DWG=`#3b6ea5`, Vision=`#6d557e`, BIM=`#c0892d`). Preservar 100% da lógica existente (ver `StickQuoteBIMModal.jsx` de referência). README §5.
6. **Responsividade 390px** — KPIs em grade que reflui (`repeat(auto-fit,minmax(150px,1fr))`), funil com scroll-x + dica visual; ajustes em `src/styles/responsive.css`. README §6.

## Entregável por item
Arquivos alterados + 1 linha de racional + confirmação de build limpo. **Nenhum módulo novo além dos componentes de UI listados.** Pare e pergunte se encontrar qualquer ambiguidade que exija decisão de produto.

## Critério de aceite
- `<KpiCard>` único (var. A) nas 3 telas · banner não reaparece após dispensar · empty/loading/erro consistentes · 4 modais com estrutura unificada · sem overflow em 390px · `npm run build` limpo, nenhuma regra de negócio alterada.
