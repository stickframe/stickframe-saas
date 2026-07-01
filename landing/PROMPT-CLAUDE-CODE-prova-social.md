# PROMPT — Claude Code · Seção "Prova Social" na landing (StickFrame™)

Cole na raiz do repositório do StickFrame™. **Referência visual obrigatória:** `landing/Prova Social.html` + `landing/ProvaSocial.jsx` (mockup hi-fi aprovado) — recrie no app como componente real, **não copie o HTML do mockup nem importe como arquivo estático**.

---

Você é um **Product Engineer sênior**. Crie a seção **"Prova Social / Resultado"** na landing page do StickFrame, posicionada conforme indicação do time (ex.: após o herói / antes do CTA final). O objetivo é **vender resultado, não lista de funções**.

## Antes de escrever código
- Localizar o componente da landing e o ponto onde a seção será inserida.
- Reaproveitar **tokens de tema, fontes e logo** já existentes no projeto. Não criar paleta nova.
- Confirmar a âncora do CTA (a calculadora pública — provavelmente `#calculadora` ou rota equivalente).

## Regras inegociáveis
- **Sem libs externas** (sem framer-motion, sem ícones de pacote): React + CSS puro, animação com IntersectionObserver + requestAnimationFrame.
- **Sem paleta nova.** Primário tijolo `#981915`; fundo branco `#fff`; faixa de métricas em `#f7f4f0`; bordas `#e7e1d8`; texto `#232225` / `#57514a`.
- Tipografia: títulos/números **Barlow Condensed** (700); corpo **Hanken Grotesk** (o projeto NÃO usa Inter — seguir o padrão da marca). Nunca Inter/Roboto/Arial.
- Ícones **SVG Lucide inline**, `stroke-width:1.9`, `stroke="currentColor"`. **Sem emoji.**
- Estilos encapsulados no componente. **Mobile-first.** Seção com `padding: 96px 0`. Contraste AA, alvos de toque ≥44px.
- Respeitar `prefers-reduced-motion`: sem count-up, mostrar o número final direto.

## Estrutura (manter conteúdo exatamente)

**Cabeçalho** (centralizado): kicker "RESULTADOS REAIS" (tijolo) · H2 "Menos retrabalho. Mais obras fechadas." · subtítulo "Construtoras em Steel Frame usam o StickFrame para sair do orçamento à entrega num fluxo só."

**Bloco 1 — Faixa de métricas** (card claro `#f7f4f0`, 3 números grandes Barlow Condensed em tijolo, **count-up** ao entrar na viewport, formatação pt-BR, divisores verticais):
- **12.500** m² — simulados na calculadora pública
- **+20** — simulações de obra
- **18** — orçamentos técnicos gerados

**Bloco 2 — 4 cards de diferencial** (cada um = um RESULTADO; ícone em chip `#f3e7e5` que inverte para tijolo no hover; título Barlow Condensed + 1 linha):
1. **Orçamento técnico em minutos** — Composição Steel Frame pronta, não uma planilha do zero.
2. **Cliente acompanha pelo portal** — Menos ligações, mais confiança em cada etapa da obra.
3. **Decisão com dados (StickBrain™)** — Pergunte sobre a obra e receba a resposta na hora.
4. **Do lead à chave num fluxo só** — Calculadora → orçamento → obra → entrega.

**CTA final** (centralizado): botão primário sólido tijolo **"Calcular minha obra"** → âncora da calculadora pública.

## Responsivo
- Cards: 4 colunas → 2 (≤900px) → 1 (≤540px).
- Faixa de métricas: linha → coluna empilhada (≤760px), divisores viram horizontais.

## Execução
- Um commit: `feat(landing): seção Prova Social (métricas + diferenciais + CTA)`.
- Os números (12.500 / +20 / 18) devem ser **props/constantes fáceis de atualizar** — idealmente vindas de config, não hardcoded no meio do JSX.
- CTA mantém o handler/scroll já usado pelos outros CTAs da landing.

## Critério de aceite
- Seção renderiza pixel-fiel ao mockup `landing/Prova Social.html`, padrão claro da marca.
- Count-up dispara só ao entrar na viewport e respeita reduced-motion.
- Sem libs externas, sem emoji, sem paleta nova, fontes corretas, responsivo, AA.
- CTA leva à calculadora pública.
