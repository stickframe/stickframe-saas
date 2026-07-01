# Realtime Subscriptions Audit — StickFrame™ SaaS

Date: 2026-06-27

## Summary

| Status | Count |
|--------|-------|
| Channels with empresa_id filter | 4 |
| Channels WITHOUT filter (needs review) | 6 |
| Total channels | 10 |

## Channels with empresa_id filter (OK)

| File | Channel | Filter |
|------|---------|--------|
| `src/hooks/usePresence.js:16` | `empresa:{id}:presence` | Scoped by empresa_id in name |
| `src/pages/Orcamentos.jsx:1083` | `orcamentos-changes:{empId}` | Scoped by empId in name |
| `src/pages/Orcamentos.jsx:1090` | `orcamentos-public:{empId}` | Scoped by empId in name |
| `src/pages/PortalOnline.jsx:71` | `portal-msgs-{obra.id}` | Scoped by obra id |

## Channels WITHOUT empresa_id filter (needs review)

| File | Channel | Risk | Recommendation |
|------|---------|------|----------------|
| `src/services/repositories/obraRepository.js:151` | `obras-rt` | **HIGH** — listens to ALL obras changes | Add `filter: empresa_id=eq.{id}` |
| `src/components/notificacoes/NotificacaoDropdown.jsx:21` | `pre-orcs-notif` | MEDIUM — shared channel name | Use empresa-scoped channel name |
| `src/components/notificacoes/NotificacaoDropdown.jsx:39` | `portal-msgs-notif` | MEDIUM — shared channel name | Use empresa-scoped channel name |
| `src/components/notificacoes/NotificacaoDropdown.jsx:56` | `orcamentos-aceite-notif` | MEDIUM — shared channel name | Use empresa-scoped channel name |
| `src/components/notificacoes/NotificacaoDropdown.jsx:83` | `comentarios-notif` | MEDIUM — shared channel name | Use empresa-scoped channel name |
| `src/components/layout/Sidebar.jsx:144` | `sidebar-leads-realtime` | MEDIUM — shared channel name | Use empresa-scoped channel name |
| `src/pages/Oportunidades.jsx:261` | `leads_captacao_realtime` | MEDIUM — shared channel name | Use empresa-scoped channel name |
| `src/services/obraService.js:108` | `obras-changes` | **HIGH** — listens to ALL obras changes | Add filter |

## Critical fixes applied

### `src/services/repositories/obraRepository.js`
- `subscribeObras`: Added postgres_changes filter for `empresa_id`

## Recommendations

1. Add empresa_id filter to ALL postgres_changes subscriptions
2. Use empresa-scoped channel names for broadcast channels
3. Review all channels monthly for security compliance
4. Consider moving notification channels server-side via Edge Functions
