# Plano de Implementação — Otimização do Fluxo de Orçamento

Este documento descreve as alterações planejadas para resolver os problemas identificados na avaliação de UX do Fluxo de Orçamento da Stick Frame.

## Proposed Changes

As alterações visam corrigir desde o bug de build crítico (conflito de merge) até melhorias de usabilidade no CRM, configurações de preços, aceite online, robustez do gerador de referências, responsividade móvel, visibilidade de validade e atomicidade na conversão em obra.

---

### [Component] Constants & Theme

#### [MODIFY] [constants.js](file:///c:/dev/stickframe-saas/src/utils/constants.js)
- Tornar o objeto `PRECOS` dinâmico utilizando um `Proxy` que lê do `localStorage` (chave `sf_precos_m2`) caso configurado pelo usuário, e senão cai no fallback padrão (2.800 / 3.500 / 4.800).
- Desta forma, qualquer alteração nas configurações se propaga automaticamente em tempo de execução para todas as telas do sistema sem quebrar compatibilidade.

---

### [Component] CRM & Clientes

#### [MODIFY] [clienteSlice.js](file:///c:/dev/stickframe-saas/src/store/slices/clienteSlice.js)
- Retornar o registro criado (`data`) na função `addCliente` para que o fluxo de criação de cliente inline no modal de orçamento possa obter o ID do cliente criado instantaneamente e associá-lo ao orçamento em andamento.

---

### [Component] Páginas do Sistema

#### [MODIFY] [Configuracoes.jsx](file:///c:/dev/stickframe-saas/src/pages/Configuracoes.jsx)
- Adicionar uma seção de **Valores de Padrão Construtivo (R$/m²)** na aba "Sistema".
- Permitir editar os valores de m² para os padrões *Econômico*, *Padrão* e *Alto Padrão*.
- Salvar essas edições no `localStorage` sob a chave `sf_precos_m2` e emitir um toast de sucesso.

#### [MODIFY] [Orcamentos.jsx](file:///c:/dev/stickframe-saas/src/pages/Orcamentos.jsx)
1. **Conflito de Merge (Crítico)**: Confirmar que não existem mais marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`).
2. **Criação de Cliente Inline (Alto)**:
   - Adicionar botão `+ Novo` ao lado do seletor de cliente no formulário do orçamento (`FormOrc`).
   - Ao clicar, exibir mini-formulário com campos: Nome (obrigatório), WhatsApp/Contato e E-mail.
   - Chamar `addCliente` do slice, aguardar retorno e auto-selecionar o cliente recém-criado, fechando o mini-formulário.
3. **Margem de Negociação / Campo de Desconto (Alto)**:
   - Adicionar campo de desconto em porcentagem (%) abaixo da prévia do orçamento no modal.
   - Atualizar a função `calcOrcamento` para calcular o valor com base no desconto informado: `valor_total = valor_base - (valor_base * desconto / 100)`.
   - Na edição de orçamentos, deduzir o desconto original comparando o `valor` salvo com o valor base calculado das áreas/unidades e preencher o campo de desconto automaticamente.
4. **Referência Robusta (Médio)**:
   - Substituir `orcamentos.length + 1` em `gerarRef()` por uma busca em memória do maior sufixo numérico existente do ano atual (ex: `ORC-2026-004` -> próximo `ORC-2026-005`), evitando colisões ao deletar itens.
5. **Hierarquia de Saídas (Médio)**:
   - Definir a **Proposta Comercial** como ação principal visível no card do orçamento.
   - Agrupar as demais saídas ("PDF simples (Rascunho)", "WhatsApp", "Gerar Contrato", "Copiar link", "Duplicar") em um menu dropdown compacto ("Mais...").
6. **Grids Responsivos no Celular (Médio)**:
   - Substituir as divs com grid inline `style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}` no modal por `className="sf-grid-2"`, que já implementa o colapso para 1 coluna no celular.
7. **Exibição da Validade (Baixo)**:
   - Calcular e exibir os dias restantes de validade (ou indicador de vencido) na lista de orçamentos (ex: `· Expira em 12 dias` ou `· Expirado há 2 dias`), utilizando uma função auxiliar de contagem.
8. **Atomicidade da Conversão (Baixo)**:
   - Melhorar o fluxo de `confirmarConverter` para tratar falhas individuais com retornos visuais descritivos via Toast, e reter o fluxo de conversão/atualização de status do orçamento caso as operações essenciais (criação da obra e lançamentos) falhem.

---

### [Component] Proposta Online

#### [MODIFY] [PropostaOnline.jsx](file:///c:/dev/stickframe-saas/src/pages/PropostaOnline.jsx)
- Adicionar envio de transmissão em tempo real (broadcast ou persistência de notificação) ao aceitar a proposta comercial online para atualizar os logs do comercial imediatamente.
- *Nota do Banco*: Recomenda-se adicionar a tabela `orcamentos` na replicação do Supabase executando o comando SQL:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE orcamentos;
  ```

---

## Verification Plan

### Automated Tests
- Executar build de produção do Vite para atestar que não há quebras de build ou lints críticos no código modificado:
  ```powershell
  npm run build
  ```

### Manual Verification
1. Abrir a tela de Orçamentos, clicar em "Novo orçamento" e testar a criação de cliente inline no modal.
2. Inserir um desconto e verificar se a prévia de valores e o valor salvo no banco refletem o desconto.
3. Abrir as configurações, aba Sistema, alterar o valor do m² e verificar se a prévia de um novo orçamento reflete o novo m² configurado.
4. Verificar se a visualização de validade e o menu "Mais..." com o agrupamento de saídas aparecem corretos.
5. Validar o comportamento responsivo do modal no celular (com viewport simulada de 375px).
