# Diferencial: Portal Online do Cliente

## O que é
Área exclusiva do cliente acessível via link com token único (`/portal/:token`),
sem necessidade de login no sistema principal. O cliente visualiza o andamento
da obra em tempo real, acessa documentos e troca mensagens com a construtora.

## Funcionalidades do portal
| Seção | O que o cliente vê / faz |
|---|---|
| Fases da obra | Progresso visual de cada etapa com percentual de conclusão |
| Financeiro | Parcelas, vencimentos, status de pagamento, valor contratual |
| Diário de obra | Registros diários com fotos, texto e condições do dia |
| Documentos | Download de contratos, plantas, laudos; upload pelo cliente |
| Mensagens | Canal direto com o gestor da obra (histórico persistente) |
| Change Orders | Aprovação ou rejeição formal de aditivos (CO-001, CO-002…) |

## Modelo de acesso
- Token único por obra gerado automaticamente
- Link enviado por e-mail / WhatsApp direto do sistema
- Sem expiração durante a vigência da obra
- Sem necessidade de criar conta ou senha

## Por que é um diferencial vs. Procore / concorrentes nacionais
- Procore tem portal do cliente, mas requer que o cliente crie login e seja
  adicionado como usuário pago
- Concorrentes nacionais não oferecem portal: transparência ao cliente é feita
  por PDFs enviados manualmente ou grupos de WhatsApp
- Token único elimina fricção de onboarding do cliente (zero cadastro)
- Transparência ativa reduz chamadas de suporte e aumenta satisfação

## Onde aparece no sistema
- Obras → [Obra] → Portal do Cliente (gerar/copiar link)
- Configurações → Portal (personalização de logo e cores por construtora)

## Uso em pitch / apresentação
> "O cliente da construtora não quer aprender um software novo. Com o StickFrame,
> a construtora manda um link e o cliente abre no celular e vê tudo — fotos,
> financeiro, fases. Sem login, sem app para instalar, sem confusão."
