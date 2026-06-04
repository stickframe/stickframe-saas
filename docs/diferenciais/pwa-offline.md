# Diferencial: PWA Instalável com Notificações Push

## O que é
O StickFrame é uma Progressive Web App (PWA) completa: instalável no celular
como se fosse um app nativo, com ícones na tela inicial, tela de splash,
funcionamento offline e notificações push — sem passar pela App Store ou Play Store.

## Componentes técnicos
| Componente | Descrição |
|---|---|
| `manifest.json` | Define nome, ícones, cor de tema e modo standalone |
| Service Worker | Cache de assets e dados para funcionamento offline |
| Ícones | 192×192 e 512×512 px (iOS e Android) |
| Push API | Notificações mesmo com o app fechado |

## Notificações push configuradas
- Garantias vencendo (alerta 30 e 7 dias antes)
- Follow-ups de CRM atrasados (reuniões e tarefas)
- Certificações NR vencendo por colaborador
- Change Orders aguardando aprovação do cliente
- Pagamentos em atraso

## Experiência de instalação
1. Usuário acessa `app.stickframe.com.br` no Chrome/Safari
2. Banner "Adicionar à tela inicial" aparece automaticamente
3. App instalado com ícone, abre em tela cheia (sem barra de URL)
4. Notificações push solicitadas na primeira abertura

## Por que é um diferencial vs. Procore / concorrentes nacionais
- Procore possui app nativo (iOS e Android), mas com custo embutido no plano
  e processo de atualização dependente das stores
- Concorrentes nacionais oferecem apenas versão mobile responsiva, sem instalação
  nem notificações push
- PWA atualiza instantaneamente no servidor, sem aprovação de store
- Zero custo de distribuição: o link do sistema já é o "app"

## Onde aparece no sistema
- Banner de instalação automático no primeiro acesso mobile
- Configurações → Notificações (gerenciar quais alertas receber)
- `/manifest.json` e `/sw.js` servidos pelo Next.js

## Uso em pitch / apresentação
> "Gestor de obra está sempre no canteiro, com o celular. O StickFrame instala
> como app, notifica quando tem aditivo para aprovar ou NR vencendo — sem
> precisar de app na Play Store. O Procore tem app nativo mas cobra por isso;
> aqui já vem incluso, e atualiza instantaneamente."
