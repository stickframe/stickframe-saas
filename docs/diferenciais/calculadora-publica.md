# Diferencial: Calculadora Pública de Steel Frame

## O que é
Ferramenta pública acessível em `/calcular` — sem login — que permite a qualquer
visitante do site calcular um pré-orçamento de Steel Frame em segundos. Os dados
preenchidos geram um lead automaticamente no CRM da construtora.

## Campos do formulário
| Campo | Tipo | Exemplo |
|---|---|---|
| Padrão construtivo | Seleção | Econômico / Intermediário / Alto padrão |
| Área construída (m²) | Numérico | 120 m² |
| Número de pavimentos | Seleção | Térrea / 2 pavimentos / 3+ |
| CEP / Região | Texto | 01310-100 (SP) |
| Nome e e-mail | Texto | Para envio do orçamento |

## Cálculo e resultado
- Sistema aplica tabela de preço/m² por padrão construtivo
- Exibe faixa estimada: **R$ 288.000 — R$ 336.000** (±15%)
- Gera PDF de pré-orçamento para download imediato
- Botão "Falar com especialista" redireciona para WhatsApp

## Integração com CRM
- Lead criado automaticamente com nome, e-mail, área e padrão selecionados
- Tag automática: `lead-calculadora`
- Tarefa de follow-up criada para o responsável comercial (prazo: 24h)
- Funil iniciado na etapa "Pré-orçamento enviado"

## Por que é um diferencial vs. Procore / concorrentes nacionais
- Procore e concorrentes são sistemas B2B: não têm ferramentas públicas de captação
- Nenhum outro sistema nacional integra captação de leads ao CRM interno
- Calculadora pública gera tráfego orgânico (SEO) e converte visitantes em leads
  qualificados sem intervenção humana
- Construtora recebe o lead já segmentado por área, padrão e região

## Onde aparece no sistema
- URL pública: `app.stickframe.com.br/calcular` (sem autenticação)
- CRM → Leads → filtro "Origem: Calculadora"
- Configurações → Calculadora (ajuste de tabela de preço/m² por padrão)

## Uso em pitch / apresentação
> "Enquanto a construtora dorme, a calculadora capta leads. O visitante informa
> a área e o padrão, recebe um pré-orçamento em segundos e o comercial acorda
> com uma tarefa de follow-up já criada no CRM. Nenhum concorrente faz isso
> porque eles são ferramentas de gestão, não de crescimento."
