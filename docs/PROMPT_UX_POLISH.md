# PROMPT — Polimento de UX/UI do StickFrame™ (para Claude design)

Você é um **Product Designer + Front-end sênior** especializado em SaaS B2B de
engenharia/construção. Sua tarefa é **polir a experiência das telas existentes**
do StickFrame™ — **sem criar módulos novos, sem mudar regras de negócio e sem
quebrar nada**. Foco em consistência visual, hierarquia, estados (vazio/carregando/
erro), responsividade e microcopy.

---

## CONTEXTO DO PRODUTO

StickFrame™ é uma plataforma de gestão para construção em **Steel Frame**: do
projeto (BIM/IFC, PDF, DWG, AI Vision) ao orçamento técnico (StickQuote™), funil
comercial, obra, financeiro e inteligência de conversão (StickBrain™).

- **Stack:** React 18 + Vite (SPA), Supabase. Estilo via objetos `style` inline +
  classes utilitárias e `src/styles/*.css`. Sem Tailwind, sem styled-components.
- **Navegação:** SPA com `activePage` (store Zustand) + sidebar drawer em mobile.

## DESIGN SYSTEM (tokens REAIS — use exatamente estes)

Constante `C` em `src/utils/constants.js`:

```
red:#981915  redDark:#7d1411  brickSoft:#f3e7e5
surface:#ffffff  surface2:#faf8f4  bg:#f4f1ec  border:#e7e1d8
text:#26231f  muted:#8c847a  graphite:#2b2b2e
success:#3f7a4b  warning:#b07a1e  danger:#a33327  steel:#3b6ea5
```

Tipografia (`src/styles/globals.css`):
- **Barlow Condensed** → títulos/números (variável CSS `var(--cond)`)
- **Hanken Grotesk** → corpo (default do body)
- **JetBrains Mono** → IDs/códigos/refs

Regras de marca:
- Vermelho tijolo (`#981915`) é o acento primário; usar com parcimônia (CTAs, refs).
- Números grandes sempre em Barlow Condensed (`var(--cond)`), peso 800.
- Cantos: 8–12px em cards, 16–20px em modais.
- Cores semânticas: verde=ganho/ok, âmbar=atenção, vermelho-danger=perda/erro.

## NÃO QUEBRAR (intocável)

- Calculadora pública, StickQuote BIM/PDF/DWG/AI Vision, funil comercial,
  StickBrain Analytics, geração de PDFs (`printHtml`).
- Lógica de RLS, services, repositórios e store. **Só camada visual.**

---

## ESCOPO DO POLIMENTO (punch-list priorizado)

### 1. Componente `<KpiCard>` unificado  ⭐ prioridade alta
Hoje há 3 estilos diferentes de "card de número" (Orçamentos, StickBrain,
Dashboard/Inteligência). Criar **um** componente reutilizável e aplicá-lo nos três.
- Props: `label`, `value`, `sub?`, `accent?` (cor), `icon?`, `alerta?` (borda âmbar/danger).
- Número em `var(--cond)` 800; label uppercase 10px `muted`; grid `repeat(auto-fit,minmax(150px,1fr))`.
- Arquivos: `src/pages/Orcamentos.jsx` (mini-dashboard), `src/components/inteligencia/StickBrainAnalytics.jsx` (Mini), `src/pages/Inteligencia.jsx` (KpiCard).

### 2. Banner "Ativar notificações"
Fica fixo no rodapé cobrindo conteúdo em todas as telas. Ajustar:
- Recolher ao dispensar e **não reaparecer na mesma sessão** (persistir em `localStorage`).
- Não sobrepor ações; respeitar `safe-area` no mobile.

### 3. Estados vazios padronizados
Unificar o padrão de empty-state (ícone em `brickSoft` + título + texto `muted` +
CTA primário). Aplicar onde hoje só há texto solto (ex.: listas de orçamentos,
medições, documentos, StickBrain sem dados).

### 4. Estados de carregamento/erro
Skeletons sutis (não spinners onde houver layout previsível). Mensagens de erro
amigáveis e acionáveis (já existe o padrão no AI Vision/StickBrain — replicar).

### 5. Consistência dos 4 modais StickQuote (PDF/DWG/Vision/BIM)
Mesmo header, mesmo stepper, mesmo espaçamento e mesma família de cores de acento
(PDF=vermelho, DWG=azul, Vision=violeta) — manter o acento mas unificar a estrutura.
Arquivos em `src/components/bim/StickQuote*Modal.jsx`.

### 6. Responsividade (revisar em 390px)
Tabelas com scroll horizontal já existem (`src/styles/responsive.css`). Revisar
pipelines/KPIs que usam `overflow-x:auto` para não cortar conteúdo; garantir
touch targets ≥44px (já há regra global).

---

## REGRAS DE EXECUÇÃO

- Mudança **incremental e revisável**: um item por commit, com antes/depois.
- Reusar tokens `C` e `var(--cond)` — **nada de cores/fontes novas**.
- Manter acessibilidade: contraste AA, `title`/`aria-label` em ícones-botão.
- Verificar build (`npm run build`) e renderização a cada item.
- Português nas labels; microcopy curto e direto.

## CRITÉRIO DE ACEITE

✅ `<KpiCard>` único usado nas 3 telas
✅ Banner de notificações não reaparece após dispensar
✅ Empty/loading/error states consistentes
✅ 4 modais StickQuote com estrutura unificada
✅ Sem overflow em 390px nas telas tocadas
✅ Build limpo, nenhuma regra de negócio alterada

## ENTREGÁVEL

Para cada item: arquivos alterados, screenshot antes/depois (desktop + 390px) e
1 linha de racional. Nenhum módulo novo — só polimento.
