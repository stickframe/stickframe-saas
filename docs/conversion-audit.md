# StickFrame Conversion Layer™ — Auditoria do Funil (C.1)

Mapa do funil de conversão **como está** + lacunas + o que a Conversion Layer™ adicionou.
Sem novos módulos de negócio; nada de regra comercial alterada.

```
Visitante → Interesse → Lead → Trial → Ativação → Cliente
```

## 1. Entradas (topo de funil)

| Entrada | Onde | Estado |
|---|---|---|
| Landing | `src/pages/LandingPage.jsx` | Hero já focado em resultado: *"Controle custo, prazo e cliente em um único fluxo"* |
| Calculadora pública | `src/pages/CalculadoraPublica.jsx` (`/calcular`) | Principal porta de entrada; estima custo R$/m² |
| Pricing | `src/pages/Pricing.jsx` (`/pricing`) | Evento `viewed_pricing` (saas_events) |
| SEO / OG | `index.html` | OG/Twitter presentes; **+ JSON-LD schema.org (C.8)** |
| Blog / Portfólio | — | Não existe ainda (estrutura SEO preparada via schema.org) |

## 2. Ações rastreadas

| Ação | GA4 | saas_events |
|---|---|---|
| Ver landing | `landing_view` *(novo)* | — |
| Iniciar calculadora | `calculator_started` *(novo)* | — |
| Concluir cálculo | `calculator_completed` *(novo)* | — |
| Clicar CTA | `cta_clicked` *(novo)* | — |
| Criar lead (calculadora) | `lead_created` *(novo)* + `lead_gerado` (legado dataLayer) | RPC `inserir_lead_publico` |
| Ver planos | `pricing_viewed` *(novo)* | `viewed_pricing` |
| Iniciar trial | `trial_started` *(novo)* | `started_trial` |
| Cadastro | `signup_started` / `signup_completed` | — |
| 1º cliente / 1º orçamento | — | `created_first_client` / `created_first_quote` |
| Interesse StickQuote | `stickquote_interest` / `quote_requested` *(novos)* | — |

> Dois sistemas: **GA4** (`src/utils/analytics.js`, marketing/funil) e **saas_events**
> (`src/services/health/saasEvents.js` + `productMetrics.js`, produto/persistente).
> Nomes novos não duplicam os equivalentes de produto (`trial_started`↔`started_trial`,
> `pricing_viewed`↔`viewed_pricing`).

## 3. Saídas (fundo de funil)

| Saída | Destino |
|---|---|
| Lead criado | RPC `inserir_lead_publico` → tabela de captação; alerta WhatsApp + e-mail |
| Cliente no CRM | tabela `clientes` (campo `origem`), `clienteRepository.criarCliente` |
| Orçamento criado | `created_first_quote` |
| Ativação / conversão | `vw_trial_health`, `vw_activation_score`, `converted_plan` |

## 4. Lead Intelligence (C.5)

`src/utils/leadOrigem.js` — first-touch:
- `sf_lead_origem` (string): utm_source ou referrer mapeado (google/instagram/facebook/whatsapp/linkedin/youtube).
- `sf_lead_intel` (objeto): `{ origem, campanha, pagina, referrer, ts }` via `obterLeadIntel()`.

## 5. Lacunas remanescentes (próximos passos)

- Campos **Empresa** e **Tipo de obra** no formulário da calculadora (hoje: nome, whatsapp, cidade, email + área/padrão do simulador). Não alterados para não mexer na assinatura do RPC `inserir_lead_publico`.
- Páginas de **blog/portfólio/intenção** (SEO) — só a base schema.org foi preparada.
- Prova social com **obras reais** depende de `PublicObras` (futuro).

## 6. Dashboard

`/admin/conversion` (`src/pages/AdminConversion.jsx`) — funil de produto (saas_events 30d) +
estágio de trials (`vw_trial_health`). Topo de funil (visitantes/calculadora/leads) no GA4.
