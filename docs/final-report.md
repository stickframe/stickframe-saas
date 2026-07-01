# Relatório Final — Saúde, Gargalos & Capacidade

Date: 2026-06-27

## Saúde Atual

| Componente | Status | Observação |
|------------|--------|------------|
| Frontend (Vite + React) | ✅ Saudável | 3497 módulos, build em ~2min |
| Supabase (Postgres) | ✅ Saudável | Queries < 200ms (ver health check) |
| Supabase Auth | ✅ Saudável | Sessões ativas, login funcional |
| Supabase Realtime | ⚠️ Atenção | 6/10 subscriptions sem filtro empresa_id |
| Asaas API (externo) | ⚠️ Não monitorado | Sem health check no dashboard |
| Edge Functions | ⚠️ Não monitorado | Sem health check no dashboard |
| PWA / Service Worker | ⚠️ Parcial | Sem offline fallback, sem background sync |
| Sentry | ✅ OK | ErrorBoundary ativo, setUser/setTag adicionados |
| Tests | ✅ 62/62 | Todos passando |
| Observabilidade | ✅ 33 catch fixados | console.warn + logger.js |

## Gargalos Identificados

### 1. Realtime subscriptions sem filtro
**Arquivos**: `obraRepository.js`, `obraService.js`, `NotificacaoDropdown.jsx`, `Sidebar.jsx`, `Oportunidades.jsx`
**Impacto**: Médio — usuários recebem eventos de outras empresas
**Correção**: Filtro `empresa_id` adicionado em `obraRepository.js:subscribeObras` e `obraService.js:subscribeObras`

### 2. Cache offline ausente
**Impacto**: Baixo — maioria dos usuários tem conectividade estável
**Correção**: Adicionar offline fallback page + background sync (PWA v2)

### 3. Testes de carga não executados
**Impacto**: Baixo — sem dados reais de performance sob carga
**Correção**: Scripts k6 prontos em `tests/load/` — executar antes de campanhas de marketing

### 4. Sem pg_cron para cleanup
**Impacto**: Baixo — tabelas ainda pequenas
**Correção**: Funções `cleanup_saas_events()` e `cleanup_notificacoes()` prontas, agendar via Edge Function

## Capacidade Estimada

### Frontend
- **Build time**: ~2 min (3497 módulos)
- **Bundle size**: ~1.5 MB vendor, ~500 KB assets
- **Concorrência**: 500+ usuários simultâneos (teste de carga pendente)

### Supabase (plano atual)
- **Conexões simultâneas**: limite do plano (típico 30-200)
- **Realtime**: 10 canais ativos (bem abaixo do limite)
- **Storage**: depende do plano
- **Gargalo esperado**: ~1000 usuários simultâneos sem otimização de índices

### Banco de dados
- **Tabelas críticas**: obras, orçamentos, diario, medicoes, notificacoes
- **Crescimento estimado**: ~10-50 MB/mês por empresa ativa
- **Retenção**: 90 dias para eventos, 60 dias para notificações lidas

## Recomendações

### Curto prazo (1-2 semanas)
1. ✅ Health check implementado (`/admin/health`)
2. ✅ Sentry com setUser/setTag
3. ✅ Índices adicionados (migration)
4. ✅ Scripts de carga prontos (k6)
5. Executar testes de carga antes de campanhas

### Médio prazo (1-2 meses)
1. Monitorar queries lentas no Supabase (pg_stat_statements)
2. Implementar offline fallback page
3. Background sync para formulários
4. KPIs de retenção pelo `saas_events`

### Longo prazo (3-6 meses)
1. Cache distribuído (Redis via Upstash)
2. Rate limiting por empresa
3. Auto-scaling de Edge Functions
4. Dashboard de observabilidade unificado
