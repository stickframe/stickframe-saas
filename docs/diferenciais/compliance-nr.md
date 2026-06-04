# Diferencial: Compliance de Certificações NR

## O que é
Módulo de gestão de Normas Regulamentadoras (NR) por colaborador, integrado
ao cadastro de equipe. Exibe badges coloridos nos cards de funcionários e
dispara alertas automáticos antes do vencimento das certificações.

## Lógica de status visual
| Badge | Cor | Critério |
|---|---|---|
| Vigente | Verde | Validade > 30 dias |
| Vencendo | Amarelo | Validade entre 1 e 30 dias |
| Vencida | Vermelho | Data de validade ultrapassada |

## NRs suportadas (multi-seleção)
- NR-10 (Segurança em Instalações Elétricas)
- NR-12 (Segurança em Máquinas e Equipamentos)
- NR-18 (Segurança no Trabalho na Indústria da Construção)
- NR-35 (Trabalho em Altura)
- NR-33 (Espaços Confinados)
- Campos customizáveis para outras certificações

## Alertas automáticos
- E-mail / notificação push 30 dias antes do vencimento
- Segunda notificação 7 dias antes
- Alerta crítico no dia do vencimento
- Registro de quem foi notificado e quando

## Por que é um diferencial vs. Procore / concorrentes nacionais
- Nenhum concorrente nacional (Sienge, Obra Fácil, BuildPro) possui compliance de NR
  integrado ao módulo de RH/equipe
- Procore tem módulo de segurança, mas sem aderência à legislação brasileira de NRs
- Reduz risco de multas do Ministério do Trabalho por colaborador desatualizado em obra
- Gestor de segurança tem visão consolidada de toda a equipe em uma única tela

## Onde aparece no sistema
- Equipe → [Colaborador] → aba "Certificações NR"
- Equipe → visão de cards com badges coloridos por colaborador
- Dashboard → card "Alertas de Certificação" (vencimentos próximos)
- Notificações push via PWA

## Uso em pitch / apresentação
> "Construtora que usa Steel Frame tem equipe especializada com certificações caras.
> O StickFrame controla automaticamente quem pode subir em altura e quem está com
> NR vencida — algo que nenhum outro sistema nacional oferece integrado ao RH."
