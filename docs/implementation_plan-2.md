# Plano de Implementação: Melhorias e Novas Funcionalidades

Este plano propõe a implementação de três novas funcionalidades de alto impacto e a verificação/otimização de duas outras já presentes no ecossistema StickFrame:

---

## Proposed Changes

### 1. Exportação de Relatório Diário de Obra (RDO) em PDF

Permitir a exportação de um registro diário individual (RDO) em formato PDF timbrado e estruturado para que a construtora possa enviar relatórios profissionais assinados diretamente para seus clientes.

#### [MODIFY] [pdfService.js](file:///c:/dev/stickframe-saas/src/services/pdfService.js)
- Adicionar a função exportada `gerarSingleRdoPDF(obra, registro)` que formata os dados do RDO (clima, turno, equipe, materiais, equipamentos, atividades e ocorrências) e gera um arquivo HTML para download/impressão com layout profissional em A4 e campos para assinatura.

#### [MODIFY] [DiarioObra.jsx](file:///c:/dev/stickframe-saas/src/pages/DiarioObra.jsx)
- Importar `gerarSingleRdoPDF` de `../services/pdfService`.
- Atualizar a assinatura do componente `ModalDetalhes` para receber `obra`:
  ```jsx
  function ModalDetalhes({ reg, obra, onClose }) {
  ```
- Adicionar o botão **"📄 Exportar RDO PDF"** no rodapé do `ModalDetalhes` ao lado de fechar.
- Passar a prop `obra` na renderização de `<ModalDetalhes reg={verReg} obra={obra} onClose={() => setVerReg(null)} />`.

---

### 2. Módulo ESG / Sustentabilidade no Painel de BI

Exibir o impacto ecológico positivo das construções de Steel Frame em comparação com a alvenaria convencional no painel de Business Intelligence (BI).

#### [MODIFY] [BI.jsx](file:///c:/dev/stickframe-saas/src/pages/BI.jsx)
- Adicionar uma nova seção com o título **"🌱 Sustentabilidade (ESG)"**.
- Computar dinamicamente os indicadores baseados na área total (`totalM2`) de obras filtradas:
  - **Água economizada**: `1000 litros` por m² (construção seca vs alvenaria).
  - **Redução de Carbono**: `150 kg de CO2` por m².
  - **Resíduos/Entulho evitados**: `120 kg` por m² (perda de aço < 1% vs 20% alvenaria).
  - **Aço Reciclado**: `24 kg` por m² (perfis estruturais contendo ~60% de material reciclado).
- Renderizar esses dados com um design premium, ícones específicos e barras de progresso que comparam o Steel Frame à alvenaria tradicional.

---

### 3. Notificações em Tempo Real com Som de Alerta

Implementar feedback sonoro e visual imediato no sistema para alertar novos Leads vindos da calculadora pública ou novos comentários em obras.

#### [MODIFY] [Sidebar.jsx](file:///c:/dev/stickframe-saas/src/components/layout/Sidebar.jsx)
- Adicionar a biblioteca Web Audio API para tocar um sinal sonoro (dois tons sintetizados limpos) toda vez que uma nova notificação/lead for inserido em tempo real.
- Criar uma assinatura com canal do Supabase Realtime (`pre-orcs-notif`) para atualizar a contagem do badge de leads (`preOrcCount`) na barra lateral instantaneamente assim que novos orçamentos forem calculados de forma pública.

#### [MODIFY] [NotificacaoDropdown.jsx](file:///c:/dev/stickframe-saas/src/components/notificacoes/NotificacaoDropdown.jsx)
- Adicionar uma assinatura Realtime na tabela de `comentarios` para atualizar e empurrar uma notificação visual imediata ao usuário logado se um novo comentário for adicionado a uma de suas obras, disparando o mesmo sinal sonoro sintetizado de atenção.

---

### 4. WhatsApp & Fluxo de Caixa (Verificados)

Durante a auditoria das rotas e componentes:
- **WhatsApp**: Confirmamos que o menu de ações em `Orçamentos.jsx` já fornece de forma nativa botões como `💬 WhatsApp (Link)` e `📱 WhatsApp (Texto)` integrados aos contatos do cliente.
- **Fluxo de Caixa Projetado**: Verificamos que a aba `Fluxo de Caixa` em `Financeiro.jsx` já possui o gráfico SVG de projeção acumulada de 60 dias e alertas inteligentes de saldo negativo futuro. Não requer alterações estruturais.

---

## Verification Plan

### Automated Tests
- Executar `npm run build` após as alterações de dependências e código para garantir que o projeto compila sem problemas.

### Manual Verification
1. Abrir a tela de **Diário de Obra**, abrir os detalhes de um RDO e clicar em **Exportar RDO PDF** para testar a geração do arquivo.
2. Acessar a página de **Business Intelligence (BI)** (como Diretor) e validar os cálculos dinâmicos exibidos no card de Sustentabilidade (ESG).
3. Testar a sintetização sonora de alerta de leads simulando uma inserção de comentário ou lead na calculadora e ouvindo o retorno sonoro no navegador.
