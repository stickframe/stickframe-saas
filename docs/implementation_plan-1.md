# Planejamento 4D (Linha do Tempo + 3D)

Implementar uma visualização interativa em 3D passo a passo da construção integrado à aba do **Cronograma** na página de **Gestão de Obras**. 

Ao selecionar ou reproduzir as fases da obra, o modelo 3D é montado dinamicamente na tela representando o progresso físico real da estrutura em Steel Frame.

## User Review Required

> [!IMPORTANT]
> A visualização em 3D será integrada de forma responsiva diretamente na aba de **Cronograma**. Em telas grandes, será exibida lado a lado com a lista de fases (timeline), e em telas menores (celulares) será empilhada abaixo.

## Proposed Changes

### [Component: Planejamento 4D]

#### [NEW] [Planejamento4D.jsx](file:///c:/dev/stickframe-saas/src/components/obras/Planejamento4D.jsx)
Criar um componente autônomo baseado em Three.js que renderiza a animação da obra conforme as fases de construção:
1. **Projeto Executivo**: Terreno limpo com gabarito demarcado em linhas pontilhadas.
2. **Fundação**: Concretagem da laje de fundação (radier) com textura de concreto.
3. **Estrutura Steel Frame**: Laje de concreto + montagem dos perfis de aço galvanizado (estudado detalhadamente com montantes e guias metálicos brilhantes).
4. **Fechamentos**: Aplicação de placas externas (OSB/cimento) e internas, cobrindo a estrutura metálica de forma semi-translúcida para evidenciar o sanduíche estrutural.
5. **Instalações**: Adiciona tubulações de hidráulica (tubos vermelhos e azuis) e conduítes elétricos correndo pelas paredes, além de portas e esquadrias de janelas.
6. **Acabamento**: Pintura final das paredes, colocação de vidros refletores e telhado completo (duas águas).
7. **Entrega**: Adiciona elementos paisagísticos (grama aparada, arvoredo ou pequenos arbustos) e iluminação interna acolhedora brilhando pelas janelas.

Inclui controles interativos:
- **Timeline Slider**: Slider para avançar/retroceder manualmente entre as 7 fases.
- **Auto-Play**: Botão "Play" para reproduzir a montagem completa de forma automática com micro-animações suaves de subida dos elementos.
- **Câmera Inteligente**: Rotação orbital e posicionamento da câmera que se move para dar o melhor ângulo dependendo da fase ativa (ex: foca na fundação de perto, sobe para o telhado).

### [Page: Gestão de Obras]

#### [MODIFY] [GestaoObras.jsx](file:///c:/dev/stickframe-saas/src/pages/GestaoObras.jsx)
- Importar e renderizar o componente `<Planejamento4D>` dentro da aba de Cronograma.
- Configurar layout responsivo (grid de duas colunas em desktop: Timeline à esquerda e Animação 3D à direita).
- Passar a fase ativa da obra como estado inicial para o visualizador 4D, permitindo que o usuário interaja para simular as outras fases.

## Verification Plan

### Automated Tests
- Executar o build de produção com `npm run build` para garantir que o Three.js seja empacotado corretamente.

### Manual Verification
1. Abrir a aba **Cronograma** em uma obra.
2. Interagir com o slider de fases e verificar se o modelo 3D atualiza correspondendo exatamente à etapa selecionada.
3. Clicar no botão **Play** e observar a transição fluida entre as fases.
4. Mover a câmera (orbitar, dar zoom, pan) para testar os controles orbitais.
5. Verificar o comportamento responsivo em telas mobile.
