# Relatório de Auditoria de Produto & Tecnologia — StickFrame SaaS

Este documento apresenta o diagnóstico profundo do **StickFrame SaaS** ("Central de comando inteligente da construção"), consolidado por uma equipe multidisciplinar formada por:
- **Head de Produto SaaS B2B**
- **CTO especialista em plataformas escaláveis**
- **Senior Product Designer & UX Researcher**
- **UX/UI Engineer**
- **Especialista em Construction Tech**
- **Auditor de Qualidade de Software**

A análise baseia-se estritamente no estado atual do repositório (versão junho/2026).

---

## ETAPA 1 — ENTENDER O ESTADO ATUAL (Inventário Geral)

### Mapeamento do Sistema
- **Páginas existentes**: 56 arquivos em `src/pages/`.
- **Padrão Visual**: Neutros quentes (tons osso/tijolo) definidos em `constants.js` e sobrescritos no `theme-stickframe.css`, com tipografia corporativa (*Hanken Grotesk* para o corpo e *Barlow Condensed* para números).
- **Integrações**: Supabase (Autenticação, Banco de Dados, Realtime e Storage), Asaas (Gateway de boleto), biblioteca Recharts (gráficos), SheetJS/XLSX (exportação Excel).

### Diagnóstico por Módulo

#### Módulo: CRM / Comercial (`CRM.jsx`, `Oportunidades.jsx`)
- **O que faz**: Capta leads, gerencia o funil comercial (Kanban), pontua leads (*Lead Scoring* com base em 6 critérios), gera sequências automáticas de tarefas de follow-up (D+3/7/15) e cria mensagens modelo para WhatsApp.
- **Estado atual**: Altamente funcional e integrado em tempo real com o Supabase. Possui barra de filtros avançados e suporte a visualizações salvas (*saved views*).
- **Problemas**: O disparo de WhatsApp é semi-manual (abre link `wa.me` para o usuário enviar). A importação via CSV exige que o arquivo esteja em formatação perfeita, gerando atritos se houver cabeçalhos em caixa alta ou acentuados.
- **Oportunidades**: Integrar API oficial do WhatsApp Business para follow-ups automatizados em segundo plano.

#### Módulo: Calculadora Construtiva (`Calculadora.jsx`, `CalculadoraPublica.jsx`)
- **O que faz**: Dimensiona materiais para Steel Frame, paredes e forros drywall. Inclui otimizador de cortes de barras de aço (algoritmo *First Fit Decreasing*) e controle do estoque de retalhos (sobras de aço).
- **Estado atual**: 100% implementada. O otimizador de corte roda em JavaScript em tempo real. Puxa valores de insumos do banco de dados com fallback local.
- **Problemas**: A atualização do CUB (Custo Unitário Básico) depende de uma Edge Function externa que pode falhar e travar o painel de KPIs. O cálculo de retalhos é manual.
- **Oportunidades**: Integrar com a API da tabela SINAPI regional para atualização de custos de mão de obra e insumos adicionais em tempo real.

#### Módulo: Visualizador & Gestão BIM (`BimSF.jsx`)
- **O que faz**: Armazena modelos 3D (.IFC ou .DAE), controla revisões de arquivos, gerencia apontamentos de não-conformidade vinculados a elementos 3D e gera o "Preview Kit".
- **Estado atual**: **Parcialmente falso (Mockado)**. O upload, a listagem e os apontamentos de texto salvam corretamente no banco. No entanto, a tela do visualizador 3D (`TabViewer`) e o `TabPreviewKit` são elementos estáticos desenhados com CSS e SVG, sem qualquer renderização real de arquivos 3D na tela.
- **Problemas**: A promessa de um visualizador 3D Three.js nativo não se cumpre no código atual. Isso frustrará clientes corporativos de alto valor (plano Premium/Enterprise) que subirem arquivos e não virem o modelo 3D.
- **Oportunidades**: Integrar de fato a biblioteca `@thatopen/components` (BIM) e `three` (instaladas no `package.json`) para carregar o modelo IFC no Canvas.

#### Módulo: Gestão de Obras (`GestaoObras.jsx`, `Cronograma.jsx`, `Medicoes.jsx`, `DiarioObra.jsx`, `Vistorias.jsx`)
- **O que faz**: Controla o cronograma (fases e marcos), RDO (Diário de Obra com fotos e clima), medições financeiras de contrato, vistorias de qualidade (checklists), chat da obra em tempo real e controle de equipamentos.
- **Estado atual**: Extremamente completo e denso. É a tela principal de uso da construtora.
- **Problemas**: Arquivo `GestaoObras.jsx` é um monólito de **211 KB e mais de 3.300 linhas**. O carregamento inicial é pesado e o código é difícil de manter devido ao acúmulo de sub-modais inline.
- **Oportunidades**: Dividir o arquivo monolítico em componentes independentes por aba e otimizar re-renders.

#### Módulo: Equipe e Compliance de Segurança (`Equipe.jsx`, `SST.jsx`, `PontoColaborador.jsx`)
- **O que faz**: Cadastro de equipe, alocação em obras, controle de exames e cursos de NRs (NR-35, NR-18, etc.), crachá com QR Code, ponto eletrônico via GPS com checagem de distância da obra e gestão de SST (DDS, Incidentes e EPIs).
- **Estado atual**: Funcional com RLS ativo. O cálculo de horas do ponto eletrônico é consolidado na folha de pagamento do financeiro.
- **Problemas**: A tela de ponto pelo celular `/ponto/:token` depende de sinal de internet. Se o canteiro estiver sem sinal, o ponto não é salvo (falta suporte offline/PWA).
- **Oportunidades**: Adicionar suporte a Service Worker e armazenamento temporário em IndexedDB para bater ponto offline.

#### Módulo: Financeiro (`Financeiro.jsx`, `Rentabilidade.jsx`)
- **O que faz**: Fluxo de caixa de receitas e despesas por obra, DRE detalhado, rentabilidade real por projeto (margem orçada vs executada) e folha de pagamento automática via ponto eletrônico.
- **Estado atual**: Robustamente implementado. A folha de pagamento calcula valores CLT e Horista com precisão.
- **Problemas**: Totalmente dependente de lançamentos manuais no canteiro e no escritório. Notas fiscais de fornecedores precisam ser inseridas uma a uma.
- **Oportunidades**: Conexão com notas fiscais automáticas das prefeituras brasileiras (OCR de PDFs e importação XML de NFe).

#### Módulo: Inteligência Artificial (`Inteligencia.jsx`)
- **O que faz**: Calcula o custo histórico geral por m², custo projetado em andamento, tendência de custos de obra e prazo médio de entrega. Gera insights de texto.
- **Estado atual**: **Lógica básica**. A IA ("StickBrain™") é composta de fórmulas matemáticas simples em JavaScript no próprio frontend.
- **Problemas**: O marketing de IA no produto cria expectativa de machine learning avançado ou processamento semântico, mas são apenas médias aritméticas.
- **Oportunidades**: Integrar APIs de Large Language Models (LLM) no backend para ler relatórios diários de obras e identificar riscos qualitativos de atraso de forma semântica.

---

## ETAPA 2 — AUDITORIA DE PRODUTO

> **O StickFrame hoje parece: C) SaaS moderno premium.**

### Justificativa
O StickFrame vai muito além de um "ERP tradicional" engessado ou de um "sistema comum" de tarefas de obra. A sua proposta de valor é extremamente calibrada para a vertical de **construção a seco (Steel Frame e Drywall)**. 

Os fatores que consolidam sua posição como **SaaS Moderno Premium** são:
1. **A Calculadora Pública (`/calcular`)**: Age como um ímã de geração de leads. Transforma o processo de orçamento em um funil ativo de marketing e captação automática de clientes.
2. **Foco e Especialização**: O otimizador de corte de barras de aço estrutural e o controle de retalhos de perfis metálicos resolvem uma dor financeira real de canteiros Steel Frame que concorrentes genéricos ignoram.
3. **Experiência do Cliente de Alto Nível**: O portal do cliente simplificado por token de link único (sem fricção de cadastro de senha) aproxima o cliente da obra de maneira premium.
4. **Infraestrutura SaaS Consistente**: Integração em tempo real, suporte multitenancy via RLS (Row Level Security) nativo no Supabase e estrutura de permissões clara por perfil de usuário.

---

## ETAPA 3 — AUDITORIA DE UX/UI

### Análise Crítica

#### Navegação & Menu
O menu lateral segmentado por grupos lógicos ajudou a organizar as mais de 50 telas. No entanto, há redundâncias: o menu lista "CRM", "Oportunidades" e "Orçamentos" como itens separados que poderiam estar mais integrados na mesma jornada comercial. O excesso de badges (NOVO, PRO, IA) na barra lateral gera ruído visual desnecessário após o onboarding do usuário.

#### Dashboard
O Dashboard central do Diretor entrega bons KPIs (VGV, Margem, Obras Ativas), mas o funil comercial e as fotos de RDO no mesmo local poluem a área de tomadas de decisões. Deveria haver uma clara distinção entre o Dashboard de Negócios (Dono), de Engenharia (Canteiro) e o Comercial.

#### Telas Internas
A UI brilha na nova paleta de neutros quentes e no uso da Barlow Condensed para números. A hierarquia de tabelas e formulários é limpa. No entanto, há inconsistências de espaçamento e o uso excessivo de modais customizados com CSS inline dificulta a consistência em diferentes resoluções. Existem estados vazios (*empty states*) bem desenhados (ex: BIM, Inteligência), o que evita que o usuário se sinta perdido em uma conta nova.

#### Mobile
A responsividade do ponto de equipe e do portal do cliente é excelente. Todavia, a gestão de obras principal (`GestaoObras.jsx`) falha no mobile. Visualizar cronogramas Gantt complexos e planilhas de quantitativos em celulares de canteiro é impraticável.

### Avaliação de Notas

* **UX: 8.0/10** — A jornada é extremamente inovadora (ponto QR, portal sem login), mas sofre com a dispersão de telas (56 páginas no total) e redundâncias no menu.
* **UI: 8.5/10** — A estética neutro-quente transmite robustez industrial e sobriedade financeira, mas a existência de páginas estáticas e inacabadas (BIM Viewer 3D e Preview Kit) prejudica a percepção de produto pronto.

---

## ETAPA 4 — AUDITORIA DE FUNCIONALIDADES

### Análise de Forças, Fraquezas e Oportunidades

* **Funcionalidades Fortes**:
  - **Calculadora LSF + Otimizador de Corte**: O algoritmo *First Fit Decreasing* entrega valor prático imediato de engenharia.
  - **Ponto Eletrônico por QR Code**: Simples, rápido, com checagem de geolocalização e cálculo de distância por raio de metros.
  - **Mapeamento de NRs da Equipe**: A visualização de crachás com ícones de validade de normas de segurança.
  - **Folha de Pagamento com Ponto**: Automação real da folha de horistas e CLT cruzando presença em obra.
  - **Monitor de Preços Sparkline**: Excelente painel de variação de insumos estruturais em tempo real.

* **Funcionalidades Fracas**:
  - **BIM Viewer 3D**: Não funciona de fato no código frontend (estático).
  - **Envio de WhatsApp comercial**: Limita-se a gerar links `api.whatsapp.com` com texto padrão.
  - **Chat de Obra**: Faltam recursos básicos como upload de mídias/arquivos de áudio e indicação de leitura.

* **Funcionalidades Faltantes**:
  - **Assinatura Eletrônica Registrada**: O canvas de desenho livre no portal não garante validade legal no Brasil. É necessária uma integração com o Gov.br ou ZapSign/Clicksign.
  - **Open Finance / Conciliação Bancária**: Faltam integrações automáticas para sincronizar lançamentos de despesas com a conta PJ da construtora.
  - **Ponto & Diário de Obras Offline**: Essencial para canteiros em subsolos ou áreas rurais sem cobertura de dados.

---

## ETAPA 5 — ANÁLISE DE VALOR SaaS

### Avaliação dos Planos de Assinatura

1. **Plano Inicial (R$197/mês)**: Justificado para engenheiros autônomos. Entrega a calculadora, funil de vendas básico e controle de RDOs simples.
2. **Plano Profissional (R$497/mês)**: Construtoras médias. Justificado pela automação de folha de pagamento via Ponto QR Code e compliance de segurança da equipe, poupando horas de contabilidade.
3. **Plano Premium/Enterprise (R$997+/mês)**: Justificado para médias e grandes construtoras LSF. Promete BIM, inteligência histórica de custos (StickBrain™) e concorrências de preços automáticas com fornecedores.

### O cliente pagaria por isso hoje?
**Parcialmente**. O cliente do plano Inicial e Profissional tem valor garantido pelas funcionalidades que estão 100% implementadas (CRM, Ponto, RDO, Folha). No entanto, o cliente corporativo de **R$ 997+/mês** se sentirá frustrado ao tentar subir um arquivo IFC no BIM e notar que o visualizador 3D é estático, ou que os "Insights de IA" são médias aritméticas em JavaScript.

> [!WARNING]
> **Para sustentar o plano de R$ 997+/mês**, é prioritário implementar a renderização real em 3D dos modelos BIM e automatizar as cotações com fornecedores.

---

## ETAPA 6 — AUDITORIA DE EXPERIÊNCIA POR PERFIL

### 1. Dono da Construtora
- **Objetivo**: Controle de custos, fluxo de caixa, rentabilidade de projetos e acompanhamento macro de prazos.
- **Jornada**: O dono inicia no Dashboard central. Ele busca a aba de "Rentabilidade" para comparar o custo orçado vs executado.
- **Pontos de Fricção**: Se os lançamentos financeiros não forem feitos pelo engenheiro no canteiro, os relatórios de rentabilidade e projeções do StickBrain™ exibem dados incompletos ou mentirosos.
- **Oportunidades**: Criar relatórios de fechamento de obras automatizados em PDF enviados mensalmente ao e-mail do Dono.

### 2. Engenheiro de Campo
- **Objetivo**: Gestão diária de tarefas, preenchimento de diário de obras (RDO), registro de ponto da equipe, solicitação de suprimentos e inspeções de qualidade.
- **Jornada**: Utiliza o celular diretamente no canteiro de obras.
- **Pontos de Fricção**: A tela de preenchimento do RDO e checklists de vistoria possui campos densos que quebram o layout em telas de smartphones. A falta de internet impede o salvamento de fotos do canteiro.
- **Oportunidades**: Simplificar a interface móvel do engenheiro em formato de chat ou cards de respostas rápidas de sim/não.

### 3. Cliente Final
- **Objetivo**: Acompanhar o progresso da casa, ver fotos semanais e aprovar financeiro/assinatura de aditivos.
- **Jornada**: Acessa a URL `/portal/:token` pelo celular, enviada via WhatsApp.
- **Pontos de Fricção**: Nenhum fluxo de login é ótimo. Porém, o cliente não recebe alertas quando o engenheiro sobe novas fotos ou responde ao chat interno, forçando-o a atualizar o link manualmente.
- **Oportunidades**: Integração com notificações de WhatsApp automatizadas informando sobre atualizações no portal.

---

## ETAPA 7 — INTELIGÊNCIA ARTIFICIAL (StickBrain™)

Propostas de evolução com inteligência artificial real:

| Idéia de Funcionalidade | Descrição | Impacto | Dificuldade | Prioridade |
| :--- | :--- | :---: | :---: | :---: |
| **OCR de Notas e Recibos** | Leitura de fotos de notas de canteiro, categorização automática de custos e lançamento direto no financeiro da obra. | **Alto** (Aumenta retenção do engenheiro) | Média | **Alta** |
| **Análise Preditiva de Cronograma** | Análise semântica dos diários de obra (RDOs) para prever atrasos futuros baseados em clima e intercorrências passadas. | **Alto** (Aumenta valor percebido para o Dono) | Alta | **Média** |
| **Copiloto de Compras & Cotação** | Cruzamento de propostas de fornecedores no bidding com monitoramento de preços de mercado para sugerir a compra ideal. | **Alto** (Gera economia direta de receita) | Média | **Alta** |
| **Auditoria Visual de Checklists** | Visão computacional para certificar montagens de aço em fotos de vistorias de qualidade (FVS). | Média | Alta | **Baixa** |

---

## ETAPA 8 — DIFERENCIAÇÃO DE MERCADO

### Posicionamento Comparativo

- **Procore / Autodesk Construction Cloud**: Ferramentas corporativas globais de altíssimo custo e extrema complexidade. O StickFrame diferencia-se pela simplicidade e pela verticalização focada na tecnologia LSF (Steel Frame), fornecendo ferramentas de corte e insumos LSF prontas para uso.
- **Sienge / Mega**: Gigantes de mercado no Brasil, focados em conformidade fiscal e contabilidade. Possuem UX defasada e implantação demorada. O StickFrame diferencia-se por ser uma plataforma moderna com foco operacional e comercial leve, implantada em menos de 24 horas.
- **Vobi / Obra Prima / Gestor Obras**: Focados em reformas e pequenas construtoras genéricas. O StickFrame os supera ao entregar otimização de canteiro específica para Steel Frame (otimizador de corte de aço e retalhos), compliance de NRs de equipes e página pública de leads comercial com calculadora integrada.

### Por que escolher o StickFrame?
Uma construtora escolhe o StickFrame porque ele fala a linguagem da construção a seco. Em vez de gastar meses configurando planilhas de insumos em softwares genéricos, o StickFrame entrega quantitativos, controle de NRs de montadores de canteiro e otimizador de corte de montantes metálicos prontos no primeiro acesso, reduzindo o desperdício de aço em até 8% no canteiro de obras.

---

## ETAPA 9 — AUDITORIA TÉCNICA & ESCALABILIDADE

### Estrutura do Código
A combinação de **React + Vite + Supabase + Zustand** garante uma SPA responsiva e escalável. A divisão de dados do banco de dados está bem estruturada, utilizando relações de chave estrangeira corretas.

No entanto, o CTO e o QA Auditor apontam sérios riscos de manutenção e performance:
1. **O Monólito `GestaoObras.jsx`**: Arquivo de 211 KB contendo a lógica de quase 15 sub-módulos. Qualquer alteração em diários de obras pode quebrar o Gantt ou a folha de pagamento, além de dificultar o trabalho simultâneo de múltiplos desenvolvedores.
2. **Recursividade no RLS do Supabase**: A função `get_empresa_id()` executa uma consulta na tabela `usuarios` para validar o tenant. Como as regras de RLS (Row Level Security) avaliam essa função para cada linha filtrada nas tabelas transacionais (ex: lançamentos financeiros), a performance do banco cairá exponencialmente à medida que a base de dados crescer.
3. **Viewer BIM Falso**: O visualizador BIM estático cria inconsistência no repositório. O código possui as dependências do SDK `@thatopen/components` no `package.json`, mas elas não são utilizadas de fato no canvas da tela de visualização.

---

## ETAPA 10 — TABELA DE CORREÇÕES E MELHORIAS

### 🔴 CRÍTICO

| Problema | Impacto | Correção Recomendada |
| :--- | :--- | :--- |
| **BIM Viewer Estático** | Quebra a promessa comercial do plano premium; gera frustração e perda de receita. | Desenvolver a integração do visualizador de arquivos IFC utilizando as bibliotecas `@thatopen/components` e `three` instaladas. |
| **Código Monolítico em `GestaoObras.jsx`** | Elevado risco de regressão de bugs; lentidão de manutenção; dificulta colaboração de desenvolvedores. | Separar as abas da página em componentes isolados no diretório `src/components/obras/`. |
| **Recursividade no RLS do Supabase** | Perda severa de performance no banco com o crescimento do volume de dados transacionais. | Armazenar o `empresa_id` nas claims customizadas do JWT no Supabase Auth e acessá-lo via `auth.jwt() -> empresa_id` nas políticas RLS, eliminando queries redundantes. |

### 🟡 IMPORTANTE

| Problema | Impacto | Correção Recomendada |
| :--- | :--- | :--- |
| **Ausência de Funcionamento Offline no Ponto** | Colaboradores não conseguem bater ponto em canteiros sem sinal, gerando furos na folha de pagamento. | Configurar Service Worker para cachear a rota `/ponto/:token` e salvar registros de check-in em IndexedDB para sincronização posterior. |
| **Envio de WhatsApp Comercial Manual** | Limita a escalabilidade operacional da equipe comercial das construtoras no acompanhamento de propostas. | Integrar com gateway de API oficial do WhatsApp para automatizar disparos de follow-ups em segundo plano. |
| **Falta de Suíte de Testes Críticos** | Risco de novas atualizações introduzirem bugs na geração de folhas financeiras ou orçamentos. | Implementar testes básicos com Cypress nos fluxos de: Calculadora pública -> CRM -> Geração de Proposta. |

### 🟢 DIFERENCIAL

| Melhoria | Benefício Gerado |
| :--- | :--- |
| **Conectar Módulo de Concorrências** | Automatizar cotações com fornecedores cadastrados na base, permitindo envio de propostas diretas por links. |
| **OCR de Notas Fiscais no RDO** | Eliminar 80% do trabalho administrativo do engenheiro ao digitar despesas de materiais de canteiro. |
| **Integração com Assinatura Gov.br** | Conferir validade jurídica brasileira inquestionável aos contratos assinados no portal do cliente. |

---

## ETAPA 11 — VISÃO DE FUTURO & ROADMAP (12 Meses)

### 📅 Plano de 30 Dias (Estabilização e Limpeza)
* **Modularização**: Desmembrar `GestaoObras.jsx` nas abas de componentes correspondentes em `src/components/obras/`.
* **Segurança & Performance**: Implementar custom claims no Supabase Auth para a chave `empresa_id` e atualizar políticas RLS para evitar o gargalo da função recursiva.
* **Correção do BIM**: Criar MVP funcional de renderização 3D de arquivos IFC com `@thatopen/components`.

### 📅 Plano de 90 Dias (Mobilidade e Automação Comercial)
* **PWA de Canteiro**: Implementar funcionamento offline completo na folha de ponto eletrônico e no Diário de Obra (RDO).
* **WhatsApp API**: Integrar gateway oficial do WhatsApp comercial para follow-up automatizado de CRM.
* **OCR de Compras**: Lançar MVP de importação de gastos via leitura de foto de cupons fiscais.

### 📅 Plano de 180 Dias (Inteligência Real & Ecossistema)
* **StickBrain™ Real**: Integração de LLM para análise qualitativa de riscos de cronograma via leitura semântica de RDOs e alertas automáticos de desvio financeiro.
* **Portal de Fornecedores**: Interface aberta para fornecedores cotarem e responderem concorrências diretamente no StickFrame.
* **Assinatura Gov.br**: Autenticação oficial de assinaturas eletrônicas integradas ao portal de propostas e contratos.
