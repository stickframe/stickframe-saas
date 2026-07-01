# PROMPT — Claude Code · Página `/pricing` reaproveitando a seção `#precos` da landing (padrão StickFrame™)

Cole na raiz do repositório do StickFrame™. **Referência visual:** `pricing/Planos e Preços.html` (réplica do bloco de planos da landing).

---

Você é um **Product Engineer sênior**. A landing já tem a seção de planos **no padrão da marca** em `#precos` (`/#precos`). A página dedicada `/pricing` ainda está no layout escuro antigo e divergente. **Padronize `/pricing` reaproveitando o MESMO componente/bloco de planos da landing** — nada de duplicar markup ou inventar variação.

## Antes de escrever código
- Localizar o componente que renderiza a seção `#precos` na landing (cards de planos: Essencial / Profissional / Construtora+).
- Localizar a rota/página atual `/pricing`.
- Confirmar onde ficam tokens de tema e a logo canônica já usados na landing.

## O que fazer
1. **Extrair o bloco de planos da landing para um componente reutilizável** (ex.: `PricingPlans`/`PlansSection`) caso ainda não seja, sem alterar a aparência na landing.
2. **Reutilizar esse componente na página `/pricing`**, eliminando o layout escuro antigo e qualquer markup/CSS duplicado de planos.
3. Manter na `/pricing` o cabeçalho, o FAQ "Dúvidas frequentes" e o "Voltar ao sistema" — mas os **cards de planos devem ser exatamente o componente da landing** (fonte única de verdade).
4. Remover estilos/arquivos órfãos do layout escuro antigo de pricing.

## Regras inegociáveis
- **Fonte única:** os planos vivem em UM componente, consumido pela landing e por `/pricing`. Editar preço/feature em um lugar reflete nos dois.
- **Sem paleta nova.** Padrão claro: fundo `#f4f1ec`, cards brancos, card "Profissional" em grafite `#232225` com selo "Mais escolhido" (tijolo) e CTA tijolo `#981915`.
- Tipografia: **Hanken Grotesk** (corpo) + **Barlow Condensed** (preços/títulos). Ícones **SVG Lucide** (check `stroke-width:1.9`). **Sem emoji.**
- **NÃO alterar** valores, nomes, taglines, features nem copy. Apenas unificar e padronizar o visual.
- Manter handlers/links de assinatura, trial e contato já existentes — **não quebrar checkout/contato**.
- Responsivo (3 col → 1 col, Profissional primeiro no mobile), AA, alvos ≥44px.

## Conteúdo canônico (igual à landing — manter)

**Essencial** · "Para quem está começando" · **R$ 97/mês** · CTA "Começar grátis"
Orçamentos & contratos ilimitados · Calculadora white-label · CRM & funil de vendas · 1 usuário · suporte por e-mail.

**Profissional** · selo "Mais escolhido" (card grafite) · "Para construtoras em crescimento" · **R$ 197/mês** · CTA "Testar 14 dias grátis" (tijolo)
Tudo do Essencial · Gestão de obras completa · Financeiro StickCash™ por obra · RDO mobile · 5 usuários · Suporte prioritário no WhatsApp.

**Construtora+** · "Para operações maiores" · **Sob consulta** · CTA "Falar com a equipe"
Tudo do Profissional · Linha Stick™ completa (IA) · Multiempresa & multiobra · Usuários ilimitados · Onboarding assistido & SLA.

Nota sob os cards: **Todos os planos incluem 14 dias grátis · Sem cartão de crédito**

**FAQ "Dúvidas frequentes"** (manter na `/pricing`):
1. Posso cancelar quando quiser? — Sim. Sem multa, sem fidelidade. Cancele a qualquer momento pelo painel.
2. O que acontece com meus dados se cancelar? — Seus dados ficam disponíveis por 30 dias após o cancelamento para exportação.
3. O plano Free é realmente grátis? — Sim, para sempre. Sem cartão de crédito para começar.
4. Posso mudar de plano depois? — Sim, upgrade ou downgrade a qualquer momento pelo painel de configurações.

## Execução
- Commit 1: `refactor(pricing): extrair PricingPlans reutilizável da landing`.
- Commit 2: `style(pricing): /pricing reaproveita PricingPlans (remove layout escuro)`.

## Critério de aceite
- `/#precos` e `/pricing` renderizam o **mesmo** bloco de planos (mesmo componente), idênticos em estilo e conteúdo, padrão claro da marca.
- Nenhuma duplicação de markup/CSS de planos. Sem emoji, sem paleta nova, fontes e logo corretas, responsivo, AA.
- Checkout/trial/contato e "Voltar ao sistema" funcionando.
