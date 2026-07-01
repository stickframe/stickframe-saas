# 🏗️ Auditoria Completa — StickFrame™ SaaS v2.0.0

> Data: 27/06/2026
> Escopo: Código-fonte completo (frontend + banco + infra)
> Metodologia: Análise estática do repositório, sem execução

---

## 1. Resumo Executivo

StickFrame™ é um SaaS maduro de gestão para construtoras de steel frame, construído como SPA React 18 + Vite 5 + Supabase (PostgreSQL + Auth + Realtime). Contém ~30 módulos integrados (CRM, orçamentos, obras, financeiro, equipe, SST, BIM, suprimentos, etc.), PWA com suporte offline, notificações push e dezenas de integrações. O código é 100% JSX (sem TypeScript), utiliza Zustand para estado global e TanStack React Query para cache. O sistema está em produção (v2.0.0) e atende uma construtora real em Santo André/SP.

**Pontos fortes**: Maturidade funcional, arquitetura de segurança via RLS, cobertura de domínio profunda, Portal do Cliente, StickScore proprietário.

**Riscos**: Páginas monolíticas (até 3.1k linhas), zero testes unitários, vulnerabilidades de segurança (chaves hardcoded, CSP permissivo, tokens sem expiração, secrets em localStorage), bundle grande, ausência de TypeScript.

**Ação imediata**: Auditoria de segurança, quebra de componentes monolíticos, introdução de testes, remoção de credenciais do bundle.

---

## 2. Arquitetura Atual

### Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + JSX | 18.2 |
| Bundler | Vite | 5.x |
| Estado | Zustand + persist | 4.5.2 |
| Cache/Query | TanStack React Query | 5.101 |
| Roteamento | React Router DOM | 7.15 |
| Backend/Database | Supabase (PostgreSQL 15) | — |
| Auth | Supabase Auth (email/password) | — |
| PWA | vite-plugin-pwa + Workbox + idb | — |
| Monitoramento | Sentry | 10.55 |
| Testes E2E | Cypress + Playwright | — |
| Hospedagem | Vercel (static SPA) | — |
| 3D/BIM | ThatOpen + Three.js + web-ifc | — |
| PDF | jsPDF + jspdf-autotable + pdfjs-dist | — |
| Planilhas | xlsx | — |
| Gráficos | Recharts | — |
| Ícones | Lucide React | — |

### Estrutura de Diretórios

```
src/
├── main.jsx                    # Entry point: React 18, React Query, Sentry, PWA
├── App.jsx                     # Router + lazy-loaded pages + auth guards
├── sw.js                       # Service Worker (Workbox + push)
├── assets/
│   └── logo_branco.png
├── components/
│   ├── layout/                 # AppLayout, Sidebar, PresenceAvatars
│   ├── ui/                     # 30 reusable primitives (Btn, Input, Modal, Toast, etc.)
│   ├── Dashboard/              # DashboardKPIs, ComplianceNR
│   ├── obras/                  # 13 obra-specific subcomponents
│   ├── financeiro/
│   ├── equipe/
│   ├── fornecedores/
│   ├── orcamento/
│   ├── configuracoes/
│   └── notificacoes/
├── hooks/                      # 9 custom hooks
├── pages/                      # 56 lazy-loaded pages
├── services/
│   ├── supabase.js             # Supabase client singleton
│   ├── repositories/           # 33 data access files
│   ├── offlineDB.js            # IndexedDB wrapper
│   ├── pdfService.js, emailService.js, whatsappService.js
│   ├── pushService.js, webAuthnService.js
│   └── relatorioService.js, smartNotifications.js, alertasService.js
├── store/
│   ├── useAppStore.js          # Composed store (persisted)
│   ├── undoStore.js            # Global undo stack
│   └── slices/                 # 12 slices (auth, cliente, obra, financeiro, etc.)
├── styles/
│   ├── globals.css
│   ├── theme-stickframe.css
│   ├── responsive.css
│   ├── landing-c.css
│   └── sf-orcamento.css
└── utils/
    ├── constants.js            # Brand colors (C), NAV, PERFIS, PRECOS
    ├── format.js, date.js
    ├── stickScore.js           # Proprietary KPI algorithm
    ├── insumosSF.js            # 4163 lines — steel frame pricing engine
    ├── sf-orcamento.js
    ├── exportExcel.js, printHtml.js
    └── cdn.js, audio.js, leadOrigem.js
```

### Padrão Arquitetural

- **Frontend**: SPA com lazy loading de páginas. Store Zustand composta por slices (composição > inheritance). Repositories como camada de dados. RLS no Supabase como única fonte de autorização.
- **Backend**: Supabase PostgreSQL com ~50 tabelas, RLS ativo em todas, ~20 functions RPC (SECURITY DEFINER), triggers de auto-numbering, 1 view (`pontos`).
- **Multi-tenancy**: Isolamento por `empresa_id` via RLS + `get_empresa_id()` function.
- **Offline**: Service Worker com NetworkFirst para Supabase, StaleWhileRevalidate para assets, IndexedDB para cache de plantas e entradas pendentes do diário.
- **Tema**: Sistema de cores centralizado no objeto `C` (constants.js) + CSS classes `.sf-*` sobrescritas por `theme-stickframe.css`.

---

## 3. Pontos Fortes

### 🟢 Arquitetura e Segurança

- **RLS ativo em TODAS as tabelas** — nenhuma tabela pública sem policy (`supabase-schema.sql:1537-1585`)
- **SECURITY DEFINER** em todas as RPCs com `search_path = public` → previne search-path injection
- **Append-only no histórico** — policies `historico_no_update` e `historico_no_delete` usam `using (false)` (`sql:1696-1697`)
- **Portal público via token** — obras, propostas, contratos usam tokens UUID como acesso, não auth
- **lazyWithRetry** — trata chunk fetch failure pós-deploy com reload automático (`App.jsx:27-34`)
- **Prefetch inteligente** — 5 páginas mais acessadas carregadas via `requestIdleCallback` após login (`App.jsx:126-138`)
- **Undo (Ctrl+Z)** global via Zustand + react-hotkeys-hook
- **PWA com NetworkFirst** para Supabase, StaleWhileRevalidate para assets, IndexedDB para cache offline de plantas
- **GPS check no ponto eletrônico** — distância >500m da obra é flagged (`sql:1037-1039`)
- **HSTS + CSP + X-Frame-Options** configurados no Vercel (`vercel.json`)
- **Rate limiting function** — `check_rate_limit` com bucket por IP (`sql:826-845`)

### 🟢 Produto

- Cobertura de domínio profunda: CRM → Orçamento → Obra → Financeiro → Pós-obra
- Integrações: Asaas (cobranças), WhatsApp, Supabase Realtime, BIM (IFC), QR codes
- Portal do cliente com aprovação de medições, chat, garantias
- Onboarding wizard e tour para novos usuários
- StickScore — algoritmo proprietário de saúde da obra
- Smart notifications e alertas automáticos
- Perfis de acesso (`diretor`, `comercial`, `engenheiro`, `financeiro`) + perfis customizados
- Sistema de trial com upgrade para PRO

### 🟢 Código

- Composição de slices no Zustand (pattern limpo e testável)
- Repositories desacoplados do Supabase
- Lazy loading de todas as páginas (56)
- Separação clara entre UI components, pages, services, hooks

---

## 4. Riscos

### 🔴 Risco Alto

| Risco | Evidência | Impacto |
|-------|-----------|---------|
| **Chave do Supabase exposta no bundle** | `supabase.js` carrega `VITE_SUPABASE_KEY` — padrão Supabase, mas qualquer XSS permite acesso ao banco | Vazamento de dados multi-tenant |
| **Admin emails hardcoded** | `App.jsx:190` — `["andrequeirozcandido@gmail.com", "andre@stickframe.com.br"]` visível no source map | Exposição de identidade, vetor de ataque social |
| **CSP permissivo** | `'unsafe-inline'` e `'unsafe-eval'` em `vercel.json` | Permite XSS mesmo com CSP |
| **Sem TypeScript** | Código 100% JSX. Erros de tipo só aparecem em runtime | Bugs silenciosos, refatoração arriscada |
| **Zero testes unitários** | `test:e2e` só roda Cypress. Nenhum teste de repositório, store, util ou hook | Qualquer regressão passa despercebida |
| **Páginas monolíticas** | GestaoObras.jsx: 3126 linhas, OrcamentoTecnico.jsx: 1907, insumosSF.js: 4163 linhas | Impossível testar, entender ou manter |

### 🟡 Risco Médio

| Risco | Evidência | Impacto |
|-------|-----------|---------|
| **RPCs não sanitizam entrada** | `ponto_registrar` (sql:990-1078) calcula Haversine sem validar bounds de lat/lng | Potencial crash ou dados inválidos |
| **Rate limiting frágil** | `check_rate_limit` sem índice em `created_at`. `REVOKE EXECUTE FROM anon, authenticated` impede chamada pública | Pode ser bypassado por usuários autenticados |
| **Tokens sem expiração** | `token_portal`, `token_publico`, `contrato_token` são UUIDs permanentes | Vazamento de URL dá acesso permanente |
| **API key em texto plano** | `empresas.api_key` sem hash | Se banco vazar, API keys comprometidas |
| **Webhooks sem retry** | `webhook_logs` registra erro mas não faz retry automático | Perda de eventos |
| **localStorage com dados sensíveis** | `supabase.js:23-27` e `AppLayout.jsx:41-42` — `empresaId` e `userId` em localStorage | Exposição via XSS |

---

## 5. Dívida Técnica

| Item | Arquivo | Linhas | Impacto | Prioridade |
|------|---------|--------|---------|------------|
| `insumosSF.js` — motor de precificação steel frame | `src/utils/insumosSF.js` | 4163 | Manutenibilidade 🔴 | 🔴 Alta |
| `GestaoObras.jsx` — componente monolítico | `src/pages/GestaoObras.jsx` | 3126 | Manutenibilidade 🔴 | 🔴 Alta |
| `OrcamentoTecnico.jsx` — lógica de precificação | `src/pages/OrcamentoTecnico.jsx` | 1907 | Manutenibilidade 🔴 | 🔴 Alta |
| `Orcamentos.jsx` | `src/pages/Orcamentos.jsx` | 1854 | Manutenibilidade 🔴 | 🔴 Alta |
| `Calculadora.jsx` | `src/pages/Calculadora.jsx` | 1784 | Manutenibilidade 🔴 | 🔴 Alta |
| `Configuracoes.jsx` | `src/pages/Configuracoes.jsx` | 1492 | Manutenibilidade 🟡 | 🟡 Média |
| `CRM.jsx` | `src/pages/CRM.jsx` | 1226 | Manutenibilidade 🟡 | 🟡 Média |
| `Financeiro.jsx` | `src/pages/Financeiro.jsx` | 1202 | Manutenibilidade 🟡 | 🟡 Média |
| `Dashboard.jsx` | `src/pages/Dashboard.jsx` | 1142 | Manutenibilidade 🟡 | 🟡 Média |
| Inline SVGs repetidos no Dashboard | `Dashboard.jsx:22-93` | 71 | Duplicação 🟢 | 🟢 Baixa |
| Estado `loading` manual para 13 módulos | `useAppStore.js:25-31` | — | Boilerplate 🟢 | 🟢 Baixa |
| `getEmpresaId()` lê localStorage como fallback | `supabase.js:30-41` | — | Acoplamento 🟡 | 🟡 Média |
| `listarArquivos` gera URL pública item por item | `obraRepository.js:58-64` | — | Performance 🟡 | 🟡 Média |
| `catch(() => {})` silencioso em vários lugares | `authSlice.js:35-39` | — | Estabilidade 🟡 | 🟡 Média |
| `pdfService.js` HTML → canvas → imagem → PDF (sem texto real) | `pdfService.js:8-50` | — | Qualidade 🟡 | 🟡 Média |
| `darkMode` não persiste entre sessões | `useAppStore.js:22` | 1 | UX 🟢 | 🟢 Baixa |

---

## 6. Segurança — Análise Detalhada

### ✅ Funcionando Corretamente

- RLS ativo em todas as 35+ tabelas
- Políticas `historico_no_update` e `historico_no_delete` com `using (false)`
- SECURITY DEFINER nas RPCs com `set search_path = public`
- HSTS (2 anos, preload), X-Frame-Options (SAMEORIGIN), X-Content-Type-Options (nosniff)
- Referrer-Policy: `strict-origin-when-cross-origin`
- Permissions-Policy restritiva (câmera, geolocalização apenas para self)
- Form-action: `'self'`

### ❌ Problemas Encontrados

1. **CSP permissivo**: `'unsafe-inline'` + `'unsafe-eval'` habilitados — permite execução de scripts inline e eval
2. **Chave anon key exposta no bundle**: Padrão do Supabase, mas agrava qualquer vulnerabilidade XSS
3. **Admin emails hardcoded**: Dois emails literais em `App.jsx:190` — visíveis em source maps de produção
4. **localStorage com dados sensíveis**: `empresa_id`, `user_id` armazenados em texto plano
5. **Rate limit removido para autenticados**: `REVOKE EXECUTE ON FUNCTION check_rate_limit FROM anon, authenticated` — a função só funciona para `service_role`
6. **Tokens sem expiração**: `token_portal` (obras), `token_publico` (orcamentos), `contrato_token` (contratos), `token_ponto` (colaboradores) — UUIDs permanentes sem data de expiração
7. **Storage bucket público**: `sb.storage.from("arquivos").getPublicUrl()` gera URLs públicas sem autenticação (`obraRepository.js:61`)
8. **Refresh token retornado para o frontend**: `authSlice.js:56` expõe `data.session?.refresh_token`
9. **Sem validação de input em RPCs**: Nenhuma function valida formato/types antes de processar
10. **Sem audit logging de ações sensíveis**: Exclusões e alterações não são logadas (exceto via histórico que é insert-only)

### Recomendações de Segurança Imediatas

1. Substituir storage público por signed URLs (Supabase Signed URLs)
2. Remover admin emails hardcoded → configurar em tabela `configuracoes` ou env var
3. Adicionar expiração (ex: 30 dias) para todos os tokens públicos
4. Implementar rate limiting via Edge Function (não PL/pgSQL)
5. Mover `empresa_id` e `user_id` do localStorage para memória (Zustand já gerencia)
6. Endurecer CSP: remover `'unsafe-eval'`, usar nonces para scripts inline
7. Adicionar validação de input em todas as RPCs

---

## 7. Performance — Top 10 Melhorias

| # | Problema | Impacto | Solução |
|---|----------|---------|---------|
| 1 | Bundle ~3MB+ (GestaoObras + BIM + Three.js) | Carregamento lento | Dynamic import de módulos BIM + split de chunks maiores |
| 2 | GestaoObras.jsx (3.1k linhas) renderiza tudo | Hydration/paint lento | Quebrar em sub-componentes com lazy loading próprio |
| 3 | Re-renders excessivos via Zustand | Performance UI | Já usa seletores específicos parcialmente — aplicar em todos os componentes |
| 4 | Imagens sem `loading="lazy"` | Paint lento | Adicionar atributo em fotos do diário, galerias |
| 5 | RPC `get_portal_data` faz 7 queries sequenciais | Latência no portal | Unificar em 1 query com JOINs ou view materializada |
| 6 | `listarArquivos` gera URL pública N vezes | Overhead de CPU | Gerar URL no backend ou cachear no store |
| 7 | `ponto_registrar` calcula Haversine em PL/pgSQL | CPU no banco | Mover cálculo para o frontend ou Edge Function |
| 8 | Índice ausente em `rate_limit_hits.created_at` | Queries lentas | Adicionar `idx_rate_limit_created_at` |
| 9 | Service Worker sem cache de páginas internas | Offline limitado | Adicionar NetworkFirst para rotas SPA |
| 10 | Google Fonts sem `display=swap` | CLS (layout shift) | Adicionar `&display=swap` na URL |

### Bundle Analysis

- `bim-engine` chunk: ~800KB (ThatOpen + web-ifc)
- `three` chunk: ~600KB (Three.js)
- `chunkSizeWarningLimit`: 1500KB (configurado acima do padrão 500KB)
- Total estimado: ~3MB+ inicial

---

## 8. Produto — Análise

### Mapa de Módulos (por grupo)

```
Comercial
 ├ Oportunidades (StickLead™)
 ├ CRM / Clientes
 ├ Orçamentos
 └ Propostas (públicas via token)

Engenharia
 ├ Calculadora SF
 ├ Orçamento Técnico
 ├ Orçamento SF
 ├ Checklist SF
 └ BIM + Quantitativos (ThatOpen + Three.js + IFC)

Obras
 ├ Gestão de Obras
 ├ Cronograma (StickPlan™)
 ├ Medições
 ├ Diário de Obra (StickField™)
 ├ Vistorias / FVS (StickInspect™)
 ├ Contratos
 ├ Equipe (StickTeam™)
 ├ Equipe SF
 ├ SST (DDS, Incidentes, EPIs)
 ├ Suprimentos / Almoxarifado (StickSupply™)
 └ Equipamentos

Financeiro
 ├ Financeiro (StickCash™)
 ├ Rentabilidade
 ├ Medições (com Asaas integration)
 └ Histórico

Compras
 ├ Fornecedores
 ├ Almoxarifado
 ├ Cotação Inteligente (Monitor de Preços)
 └ Equipamentos

Gestão
 ├ Analytics (StickPulse™) [PRO]
 ├ Inteligência (StickBrain™)
 └ Ecossistema Stick™

Pós-Obra
 ├ Garantias
 ├ Chamados de Garantia
 └ Change Orders

Público / Portal
 ├ Portal Online (cliente)
 ├ Proposta Online
 ├ Contrato Online
 ├ Concorrência Online (bidding fornecedores)
 ├ Ponto Colaborador
 ├ Portal Colaborador
 ├ Calculadora Pública
 └ QR Codes (obra, ambientes, painel)

Admin
 ├ Admin (desktop)
 └ Admin Mobile
```

### Diferenciais Competitivos

1. **Verticalização steel frame**: calculadora por m² com padrões (Econômico/Padrão/Alto Padrão), insumos SF completos
2. **StickScore**: algoritmo proprietário de saúde da obra (financeiro + prazo + qualidade)
3. **Portal do cliente**: aprovação de medições, chat, garantias, assinatura digital
4. **Ponto eletrônico com verificação GPS**: trava de distância >500m da obra
5. **Ecossistema de marcas**: StickHub™, StickCash™, StickField™ — posicionamento premium
6. **BIM com IFC**: visualização 3D de modelos com anotações
7. **Concorrências (bidding)**: sistema completo de cotação com fornecedores

### Módulos por Valor Percebido (estimado)

1. **Orçamento Técnico/SF** — coração do negócio (steel frame pricing engine), maior diferencial
2. **Gestão de Obras** — timeline, fases, documentos, fotos — uso diário
3. **Financeiro + Rentabilidade** — controle de margem real, essencial para gestão
4. **Portal do Cliente** — reduz atrito, dá transparência, diferencia dos concorrentes
5. **StickScore** — valor consultivo, auxilia decisão

### Riscos de Complexidade

- **BIM + Three.js + ThatOpen**: adiciona ~1.5MB ao bundle, funcionalidade de nicho (poucos clientes usam)
- **insumosSF.js (4163 linhas)**: base de conhecimento steel frame — critical business logic sem testes
- **Orçamento Técnico (1907 linhas)**: lógica de precificação complexa, um bug = prejuízo real
- **Monitor de Preços**: depende de scraping de URLs externas — frágil e sem fallback

### O Que Evitar Criar Agora

- App mobile nativo (React Native / Flutter) — PWA já cobre 80% dos casos
- AI generativa avançada — StickBrain já existe e cobre
- Marketplace de fornecedores — concorrências já cobre bidding
- Plugin/App store — complexidade alta para base pequena de clientes
- Chat interno em tempo real — notificações + comentários já existem

---

## 9. Preparação para Escala

### Estimativas por Cenário

| Aspecto | 100 clientes (~300 usuários) | 500 clientes (~1500 usuários) | 5000 clientes (~15000 usuários) |
|---------|------------------------------|-------------------------------|----------------------------------|
| **Banco (PostgreSQL)** | ✅ Tranquilo (~5GB) | ⚠️ Índices em `created_at` necessários, RPCs lentas | 🔴 Read replicas + connection pooling + partition tables |
| **Auth (Supabase Auth)** | ✅ | ⚠️ Rate limiting de login necessário | 🔴 SSO/SAML ou MFA obrigatório |
| **Storage (Supabase)** | ✅ | ⚠️ Bucket público precisa de signed URLs | 🔴 CDN + cache layer + cleanup de arquivos órfãos |
| **Realtime** | ✅ | ⚠️ 9 tabelas publicadas sem filtro por empresa | 🔴 Filtrar por `empresa_id` ou usar filas |
| **Frontend (Vercel)** | ✅ | ⚠️ Build time ~2-3min | 🔴 ISR, incremental build, ou monorepo com turbo |
| **Custo Vercel** | ~$20/mês (Pro) | ~$100/mês (Pro) | 🔴 $500+ (Enterprise) |
| **Custo Supabase** | ~$25/mês (Pro) | ~$100/mês (Team) | 🔴 $1500+ (Enterprise) |
| **Manutenibilidade** | ⚠️ Já com dívida técnica | 🔴 Monolitos de 3k linhas inviabilizam time | 🔴 Requer reescrita parcial |

### O Que Quebra Primeiro

1. **RPC `get_portal_data`**: 7 queries separadas — com 500 clientes acessando simultaneamente, latência explode
2. **Storage público**: bucket `arquivos` sem signed URLs — qualquer pessoa com URL acessa + sem controle de quota
3. **Ponto eletrônico**: tabela `registros_ponto` sem índice em `(empresa_id, created_at)` — queries ficam lentas
4. **Notificações Realtime**: `notificacoes` tabela pública sem filtro por empresa — todos recebem eventos de todos
5. **Build time**: 56 páginas lazy-loaded sem granularidade — Vite precisa de optimização
6. **Conexões Supabase**: sem pooler configurado — 15k usuários excedem limite de conexões
7. **Storage de arquivos**: sem política de limpeza de arquivos órfãos

### Ações Preventivas para Escala

- Adicionar pooler de conexão (Supabase + PgBouncer)
- Implementar soft-delete com TTL para arquivos e registros
- Criar job de limpeza de `rate_limit_hits` (dados velhos)
- Filtrar Realtime subscriptions por `empresa_id`
- Otimizar queries com índices compostos (já existem parciais)

---

## 10. Roadmap Prioritário

### Agora (0-30 dias) — Correções Críticas 🔴

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Substituir storage público por signed URLs (Supabase) | 2 dias | Segurança |
| 2 | Remover admin emails hardcoded → tabela ou env var | 1 dia | Segurança |
| 3 | Adicionar expiração para tokens públicos (portal, proposta, ponto) | 3 dias | Segurança |
| 4 | Implementar rate limiting funcional via Edge Function | 2 dias | Segurança |
| 5 | Criar testes unitários para `insumosSF.js` (lógica crítica) | 3 dias | Qualidade |
| 6 | Endurecer CSP: remover `'unsafe-eval'`, usar nonces | 2 dias | Segurança |
| 7 | Adicionar índices em `created_at` para tabelas de alta frequência | 1 dia | Performance |
| 8 | Corrigir `catch(() => {})` silenciosos com logging | 1 dia | Estabilidade |

### Próximo (30-90 dias) — Melhorias Importantes 🟡

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Quebrar GestaoObras.jsx em componentes de ~300 linhas | 5 dias | Manutenibilidade |
| 2 | Modularizar insumosSF.js por categoria (perfis, drywall, etc.) | 3 dias | Manutenibilidade |
| 3 | Adicionar TypeScript progressivo (começar por repositories) | 10 dias | Qualidade |
| 4 | Testes unitários para repositories + stores + utils | 5 dias | Qualidade |
| 5 | Otimizar `get_portal_data` com query única ou view | 2 dias | Performance |
| 6 | Adicionar `loading="lazy"` em imagens do diário e galerias | 1 dia | Performance |
| 7 | Implementar cache de queries com React Query (já parcial) | 2 dias | Performance |
| 8 | Criar CLI de seed + fixtures para testes E2E | 3 dias | Qualidade |
| 9 | Adicionar mute/unsubscribe em notificações | 2 dias | UX |
| 10 | Dashboard de uso/métricas internas (admin) | 3 dias | Produto |

### Futuro (90+ dias) — Escala e Diferenciais 🔵

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Migração completa para TypeScript | 20+ dias | Qualidade |
| 2 | Edge Functions para lógica pesada (RPCs de alta frequência) | 10 dias | Escala |
| 3 | Sistema de filas para webhooks + notificações + emails | 5 dias | Escala |
| 4 | Auditoria de queries + slow query monitoring | 3 dias | Observabilidade |
| 5 | API pública versionada (REST fora do SPA) | 10 dias | Produto |
| 6 | Onboarding automático com wizard + tour completo | 3 dias | UX |
| 7 | Testes de carga com k6 nas rotas críticas | 5 dias | Escala |
| 8 | Implementar reset de senha self-service | 2 dias | UX |
| 9 | Múltiplos idiomas (i18n) — pelo menos EN | 10 dias | Produto |
| 10 | Dark mode completo (já parcial) | 2 dias | UX |

---

## Apêndice A — Arquivos por Tamanho (Top 20)

| Arquivo | Linhas |
|---------|--------|
| `src/utils/insumosSF.js` | 4163 |
| `src/pages/GestaoObras.jsx` | 3126 |
| `src/pages/OrcamentoTecnico.jsx` | 1907 |
| `src/pages/Orcamentos.jsx` | 1854 |
| `src/pages/Calculadora.jsx` | 1784 |
| `src/pages/Configuracoes.jsx` | 1492 |
| `src/pages/CRM.jsx` | 1226 |
| `src/pages/Financeiro.jsx` | 1202 |
| `src/pages/Equipe.jsx` | 1163 |
| `src/pages/Dashboard.jsx` | 1142 |
| `src/pages/CalculadoraPublica.jsx` | 1011 |
| `src/pages/Quantitativos.jsx` | 815 |
| `src/pages/Fornecedores.jsx` | 753 |
| `src/pages/PortalOnline.jsx` | 713 |
| `src/pages/LandingPage.jsx` | 667 |
| `src/pages/EquipeSF.jsx` | 651 |
| `src/pages/Agenda.jsx` | 602 |
| `src/pages/DiarioObra.jsx` | 584 |
| `src/pages/Oportunidades.jsx` | 581 |
| `src/pages/QRObra.jsx` | 575 |

## Apêndice B — Tabelas do Banco (~50)

| Grupo | Tabelas |
|-------|---------|
| Core | empresas, usuarios, clientes, obras, orcamentos, contratos |
| Financeiro | financeiro, medicoes |
| Obras | diario, arquivos, eventos, historico, notificacoes |
| Equipe | colaboradores, alocacoes, horas_trabalhadas, registros_ponto, certificacoes |
| SST | sst_dds, sst_dds_assinaturas, sst_incidentes, sst_epis |
| Suprimentos | suprimentos_pedidos, suprimentos_estoque, suprimentos_movimentos, estoque_retalhos |
| BIM | bim_modelos, bim_apontamentos |
| Qualidade | nao_conformidades, vistorias, checklists_sf, rfis |
| Concorrências | concorrencias, concorrencia_itens, concorrencia_participantes, concorrencia_propostas |
| Portal | portal_mensagens, chamados_garantia, garantias |
| Outros | comentarios, anotacoes, webhooks, webhook_logs, perfis_customizados, change_orders, equipamentos, monitoramento_precos, historico_precos, saved_views, rate_limit_hits |

## Apêndice C — RPCs do Banco (20 functions)

| Function | Tipo | Descrição |
|----------|------|-----------|
| `get_empresa_id()` | SECURITY DEFINER | Retorna empresa_id do usuário autenticado |
| `is_funcionario()` | SECURITY DEFINER | Verifica se perfil é funcionário |
| `is_diretor()` | SECURITY DEFINER | Verifica se perfil é diretor |
| `generate_api_key()` | SECURITY DEFINER | Gera chave de API |
| `check_rate_limit()` | SECURITY DEFINER | Rate limiting por bucket + IP |
| `get_obra_nivel()` | SECURITY DEFINER | Nível de acesso do usuário na obra |
| `incrementar_estoque()` | SECURITY DEFINER | Atualiza saldo de estoque |
| `apurar_empreiteiro()` | SECURITY DEFINER | Calcula produção de empreiteiro |
| `ponto_get_colaborador()` | SECURITY DEFINER | Dados do colaborador + obras + pontos do dia |
| `ponto_registrar()` | SECURITY DEFINER | Registra ponto com verificação GPS |
| `concorrencia_get_dados()` | SECURITY DEFINER | Dados da concorrência + itens + propostas |
| `concorrencia_enviar_proposta()` | SECURITY DEFINER | Envia proposta de fornecedor |
| `concorrencia_get_resultado()` | SECURITY DEFINER | Resultado consolidado da concorrência |
| `get_portal_data()` | SECURITY DEFINER | Dados completos do portal do cliente (7 queries) |
| `portal_enviar_mensagem()` | SECURITY DEFINER | Envia mensagem do cliente no portal |
| `portal_responder_mensagem()` | SECURITY DEFINER | Responde mensagem do cliente |
| `portal_aprovar_medicao()` | SECURITY DEFINER | Cliente aprova medição |
| `portal_abrir_chamado()` | SECURITY DEFINER | Cliente abre chamado de garantia |
| `portal_listar_chamados()` | SECURITY DEFINER | Lista chamados do cliente |
| `portal_assinar()` | SECURITY DEFINER | Assinatura digital do contrato |

---

*Relatório gerado em 27/06/2026. Nenhum código foi alterado. Todas as evidências foram extraídas diretamente do repositório `stickframe-saas`.*
