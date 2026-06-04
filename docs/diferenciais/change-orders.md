# Diferencial: Change Orders Formais (Aditivos de Contrato)

## O que é
Módulo de Change Orders com fluxo formal de aprovação, numeração automática
(CO-001, CO-002…) e impacto direto no valor contratual e prazo da obra.
Cada aditivo percorre os estágios: **Rascunho → Pendente → Aprovado / Rejeitado**.

## Fluxo de um Change Order
```
[Rascunho]  →  [Pendente de aprovação]  →  [Aprovado]
                                         ↘  [Rejeitado]
```

1. Gestor cria CO com descrição, valor extra e dias adicionais
2. Sistema gera número sequencial automático (CO-001)
3. Cliente recebe notificação via Portal do Cliente
4. Aprovação/rejeição registrada com carimbo de data e usuário
5. Valor contratual e data de conclusão atualizados automaticamente

## Campos do Change Order
| Campo | Exemplo |
|---|---|
| Número | CO-003 |
| Descrição | Ampliação do deck externo (+12 m²) |
| Valor adicional | R$ 14.800,00 |
| Dias adicionais | 8 dias |
| Status | Aprovado |
| Aprovado por | João Silva (cliente) — 02/06/2026 |

## Por que é um diferencial vs. Procore / concorrentes nacionais
- Procore tem o módulo de Change Orders, mas ele faz parte do pacote mais caro
- Nenhum concorrente nacional possui fluxo formal de aditivo: usam apenas notas
  avulsas em planilhas ou e-mail, sem rastreabilidade
- Impacto automático no contrato elimina retrabalho manual e conflitos com cliente
- Histórico auditável protege a construtora em disputas contratuais

## Onde aparece no sistema
- Obras → [Obra] → Change Orders (lista com status colorido)
- Dashboard → alerta de COs pendentes de aprovação
- Portal do Cliente → seção "Aditivos" com botão de aprovação/rejeição online

## Uso em pitch / apresentação
> "Toda obra tem imprevisto. Com o StickFrame o aditivo vira um processo formal:
> o cliente aprova pelo portal, o contrato atualiza sozinho e ninguém briga no fim
> da obra. Isso é o que o Procore cobra como módulo premium — aqui já vem incluso."
