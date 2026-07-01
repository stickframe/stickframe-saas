# PROMPT — StickFrame™ Growth Layer™ (Fase 13)

Você é um Growth Product Engineer + SaaS Product Manager + UX Engineer.

Sua missão é executar a fase:

## StickFrame Growth Layer™

Transformar o StickFrame™ de um SaaS tecnicamente maduro em um produto com maior:
- ativação
- conversão
- retenção
- percepção de valor

**O foco agora é crescimento de produto.**
- NÃO criar módulos de negócio
- NÃO alterar regras comerciais
- NÃO quebrar: StickQuote™, BIM, Calculadora, Orçamento Técnico, Portal Cliente, StickBrain Analytics™, StickBrain Operacional™, PWA, RLS, multi-tenancy

### Contexto atual

O StickFrame™ já possui:
- CRM
- Orçamentos
- Obras
- Financeiro
- Portal Cliente
- StickQuote
- StickBrain Analytics
- StickBrain Operacional
- Health Dashboard
- Sentry
- Métricas SaaS
- Onboarding inicial (checklist 5 passos)
- 62 testes passando

Agora o objetivo é melhorar: "primeiro contato → primeiro valor → uso recorrente"

### Antes de codificar

Analisar:
- onboarding existente
- Dashboard
- Pricing
- Landing
- Trial
- Cadastro
- Eventos saas_events
- productMetrics
- perfis de usuário

Mapear Personas:
- Diretor
- Comercial
- Engenheiro
- Financeiro
- Cliente final

### Regras

Toda alteração: Implementar → Testar → Build → Validar

Formato: `growth(product): <item>`

---

## FASE G.1 — Onboarding inteligente por perfil

Evoluir onboarding atual.

**Hoje:** Checklist genérico.

**Criar jornadas:**

**Diretor** — Objetivo: ver gestão.
Passos: cadastrar empresa → criar obra → acompanhar financeiro → abrir StickBrain

**Comercial** — Objetivo: vender.
Passos: criar lead → gerar orçamento → enviar proposta

**Engenharia** — Objetivo: calcular.
Passos: usar StickQuote → importar documento → gerar orçamento técnico

**Cliente final** — Objetivo: acompanhar obra.
Passos: acessar portal → aprovar medição

Não duplicar lógica. Usar perfil existente.

## FASE G.2 — Ativação SaaS

Criar conceito: "Momento de valor"

Eventos: company_created, first_client_created, first_quote_created, first_stickquote_created, first_portal_access, first_stickbrain_view

Adicionar métricas. Criar view `vw_activation_score`:
- empresa_id
- etapa_atual
- percentual_ativação

## FASE G.3 — Trial inteligente

Melhorar experiência trial.

Mostrar: "Você está em X% da ativação"

Exemplo:
```
Seu StickFrame está 60% configurado
✓ Empresa criada
✓ Cliente cadastrado
✓ Primeiro orçamento
Próximo: Criar primeira obra
```

## FASE G.4 — Dashboard de valor

Melhorar Dashboard inicial. Criar bloco "Seu progresso".

Mostrar: módulos usados, próximos passos, conquistas

Exemplo:
```
🏗 Primeira obra criada
💰 Primeiro orçamento enviado
🧠 StickBrain ativado
```

## FASE G.5 — Tour guiado

Criar tour contextual. Não mostrar tudo. Mostrar conforme ação:

- Ao abrir Orçamento: "Crie seu primeiro orçamento"
- Ao abrir StickQuote: "Extraia quantitativos automaticamente"
- Ao abrir Portal: "Envie para aprovação do cliente"

## FASE G.6 — Pricing / Conversão

Auditar: LandingPage, Pricing, CheckoutTrial

Melhorar comunicação: Não vender funcionalidades. Vender resultado.

Antes: "Gestão de obras"
Depois: "Controle custo, prazo e cliente em um único fluxo"

## FASE G.7 — Trial → Cliente

Criar sinais: Empresas prontas para conversão.

Critérios: criou orçamento, usou StickQuote, acessou StickBrain, cadastrou obra

Criar: `trial_health_score`

## FASE G.8 — Métricas Growth

Adicionar eventos: viewed_pricing, started_trial, completed_onboarding, created_first_quote, used_stickquote, opened_portal, converted_plan

Usar saas_events existente.

## FASE G.9 — Admin Growth

Criar /admin/growth com:
- trials ativos
- empresas ativadas
- empresas paradas
- conversão

### Critérios de aceite

Obrigatório:
- onboarding por perfil
- ativação mensurável
- trial com progresso
- eventos registrados
- dashboard de crescimento
- sem quebrar produto existente
- build: `npm run build` sem erros

### Entrega final

Informar:
- componentes criados
- tabelas/views criadas
- eventos adicionados
- telas alteradas
- impacto esperado
- confirmação build
