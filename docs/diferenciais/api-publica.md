# Diferencial: API Pública REST

## O que é
API REST pública com autenticação Bearer (prefixo `sf_live_xxx`) que expõe os
principais recursos do StickFrame para integrações externas — ERPs, planilhas,
dashboards customizados e sistemas de terceiros.

## Endpoints disponíveis
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/obras` | Lista todas as obras da conta |
| GET | `/api/v1/obras/:id` | Detalhe de uma obra |
| GET | `/api/v1/clientes` | Lista clientes |
| GET | `/api/v1/financeiro` | Resumo financeiro consolidado |
| POST | `/api/v1/obras` | Cria nova obra |

## Exemplo de uso (curl)
```bash
curl -H "Authorization: Bearer sf_live_abc123" \
     https://app.stickframe.com.br/api/v1/obras
```

Resposta:
```json
[
  { "id": "obra-001", "nome": "Residência Silva", "status": "em_andamento", "valor_contrato": 280000 },
  { "id": "obra-002", "nome": "Comercial Teresópolis", "status": "concluida", "valor_contrato": 640000 }
]
```

## Por que é um diferencial vs. Procore / concorrentes nacionais
- Procore oferece API, mas apenas no tier Enterprise (a partir de US$ 800/mês)
- Nenhum concorrente nacional (Sienge, Obra Fácil, BuildPro) disponibiliza API pública
- Permite ao cliente conectar StickFrame ao seu ERP sem desenvolvimento adicional
- Tokens gerenciáveis por conta: revogação imediata, sem exposição de credenciais principais

## Onde aparece no sistema
- Configurações → Integrações → API Keys (geração e revogação de tokens)
- Documentação inline acessível em `/docs/api`

## Uso em pitch / apresentação
> "Nossos clientes corporativos já integram o StickFrame ao ERP deles via API REST —
> algo que no Procore só está disponível no plano Enterprise. Aqui, vem no plano
> profissional, pronto para usar."
