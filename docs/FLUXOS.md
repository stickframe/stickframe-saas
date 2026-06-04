# Fluxos do StickFrame
*Documentação dos fluxos principais do sistema — atualizado junho/2026 (v2)*

---

## 1. Captação de Lead → Obra

```
/calcular (público)
  └─ Preenche área, padrão, cidade, WhatsApp
      └─ RPC captar_lead_publico()
          ├─ Cria registro em clientes (status: Lead, origem: Calculadora)
          ├─ Cria pré-orçamento em pre_orcamentos
          └─ Notifica via WhatsApp (número da empresa)

Orçamentos
  └─ Banner "X pré-orçamento(s) novo(s)"
      └─ Analisar → abre modal de orçamento técnico
          └─ Aprovado → Converter em Obra

CRM / Clientes
  └─ Lead aparece no Kanban (coluna "Lead")
      └─ Arrastar para "Em negociação" / "Proposta enviada" / "Fechado"
```

---

## 2. Orçamento → Proposta → Contrato → Obra

```
Orçamentos
  └─ + Novo orçamento (manual)
      ├─ PDF simples
      ├─ Proposta Comercial (PDF branded)
      ├─ Gerar proposta (link público /proposta/:token)
      ├─ Gerar Contrato (link público /contrato/:token)
      └─ Converter em Obra → cria obra em Gestão de Obras
```

---

## 3. Gestão de Obra (pós-contrato)

```
Gestão de Obras
  ├─ Cronograma      — fases, marcos, % avanço
  ├─ Diário de Obra  — RDO diário, fotos, equipe presente
  ├─ Medições        — medições por fase com datas
  ├─ Vistorias & FVS — vistorias com checklist e fotos
  ├─ BIM             — modelos IFC/DAE, apontamentos, revisões
  ├─ Quantitativos   — lista de materiais e quantidades
  ├─ Financeiro      — lançamentos, DRE, fluxo de caixa
  ├─ Contratos       — contratos e change orders (CO-001)
  ├─ Checklists      — checklists por etapa construtiva
  ├─ RFIs            — pedidos formais de informação
  └─ Portal do Cliente — link /portal/:token (sem login)
```

---

## 4. BIM

```
BIM
  ├─ Importar modelo (.IFC ou .DAE)
  │   └─ Upload para bucket Supabase Storage (bim/)
  ├─ Viewer 3D
  │   ├─ IFC → web-ifc (That Open Company)
  │   └─ DAE → Three.js + ColladaLoader
  ├─ Apontamentos
  │   ├─ Criar manualmente
  │   └─ Clicar no elemento 3D → Express ID capturado automaticamente
  ├─ Revisões — histórico de versões por nome base
  └─ Relatório PDF de apontamentos
```

---

## 5. Equipe & Compliance NR

```
Equipe
  ├─ Colaboradores (status: Ativo/Inativo/Afastado)
  │   ├─ Foto do colaborador (upload Supabase Storage)
  │   └─ Crachá impresso com QR Code + foto + badges NR
  ├─ Alocação em obras
  │   └─ Cada colaborador vinculado a uma ou mais obras ativas
  ├─ Registro de horas (manual + automático via ponto)
  └─ Certificações NR
      ├─ NR-01, NR-05, NR-06, NR-10, NR-12, NR-17, NR-18, NR-23, NR-35, ASO...
      ├─ Validade com alertas de vencimento
      ├─ Badge visual por colaborador (Válida / Vencendo / Vencida)
      └─ Símbolos NR impressos no crachá (Font Awesome icons)
```

---

## 6. Financeiro

```
Financeiro
  ├─ Lançamentos (receita / despesa)
  ├─ Categorias e centros de custo por obra
  ├─ DRE mensal
  ├─ Fluxo de caixa
  ├─ Exportar relatório PDF
  └─ Folha de Pagamento (RH)
      ├─ Seletor mês/ano
      ├─ Importa pontos automáticos do período
      ├─ Calcula dias trabalhados + horas totais por colaborador
      ├─ Cruza com salário base → valor a pagar por tipo de contrato
      │   ├─ CLT → salário integral lançado na obra de maior presença
      │   ├─ Horista → horas × valor/hora lançado na obra correspondente
      │   └─ Empreiteiro → "Via medição" (não aplica ponto)
      ├─ Marcar como pago → cria despesa "Mão de Obra" na obra automaticamente
      └─ Imprimir holerite individual
```

---

## 7. Monitor de Preços (diferencial único)

```
Monitor de Preços
  └─ Feed de insumos Steel Frame
      ├─ Montante LSF, Guia LSF, OSB, Drywall...
      ├─ Variação % vs período anterior
      ├─ Histórico de preço por insumo
      └─ Alerta de alta > threshold configurado
```

---

## 8. Portal do Cliente (link WhatsApp)

```
/portal/:token  (sem login, sem cadastro)
  ├─ Fase atual da obra
  ├─ % de avanço
  ├─ Diário de obra (fotos + texto)
  ├─ Documentos e contratos
  └─ Linha do tempo de marcos
```

---

## 9. Calculadora Pública → CRM (funil de captação)

```
/calcular  (sem login)
  ├─ Área (m²)
  ├─ Padrão construtivo (Econômico / Médio / Alto / Luxo)
  ├─ Pavimentos
  ├─ Cidade
  └─ WhatsApp + Nome
      └─ Resultado: faixa de preço estimada
          └─ Lead entra no CRM + pré-orçamento em Orçamentos
              └─ Notificação WhatsApp para a construtora
```

---

## 10. API Pública

```
Bearer token: sf_live_xxx  (gerado em Configurações → API)

GET  /api/obras
GET  /api/obras/:id/diario
GET  /api/orcamentos
POST /api/webhooks  (eventos: obra.criada, orcamento.aprovado, lead.novo)
```

---

## 11. Ponto Eletrônico por QR Code

```
Crachá impresso (PDF gerado em Equipe)
  └─ QR Code único por colaborador (/ponto/:token)
      └─ Abre no celular (sem login, sem app)
          ├─ Tela: "Em qual obra você está?"
          │   ├─ Múltiplas obras → cards clicáveis (obras alocadas)
          │   └─ 1 obra → pula seleção, vai direto para check-in
          └─ Check-in / Check-out
              ├─ Botão verde: Registrar Entrada
              ├─ Botão vermelho: Registrar Saída
              ├─ GPS capturado (distância da obra calculada)
              └─ Registro salvo em pontos (colaborador_id + obra_id + tipo + hora)

Gestão de Obra → aba "Presença"
  └─ Filtros: Hoje / Semana / Mês
      ├─ Quem está na obra agora (badge "Em obra")
      ├─ Horário de entrada e saída
      └─ Total de horas por colaborador no período

Financeiro → aba "Folha"
  └─ Fechamento mensal com base nos pontos registrados
```

---

## 12. QR Code de Painel (rastreabilidade)

```
/qr/obra/:obraId  →  lista de painéis com QR
  └─ QR impresso no painel físico
      └─ Escanear → /painel/:token
          ├─ Dados do painel (dimensão, peso, fase)
          └─ Localização no modelo BIM (highlight do elemento)
```

---

## 13. Presença em Tempo Real

```
Supabase Realtime (canal: obra-{obraId})
  └─ Avatares de quem está visualizando a mesma obra agora
      └─ Tooltip: nome + "há X min"
```

---

## Resumo do Funil Completo

```
AQUISIÇÃO          CONVERSÃO             EXECUÇÃO                    ENTREGA
─────────────      ─────────────────     ──────────────────────────  ──────────────
/calcular          CRM Kanban            Cronograma / BIM            Portal Cliente
Lead público   →   Orçamento         →  Diário / Fotos / RFI    →   Garantias
                   Proposta              Equipe / NR / Crachá        Histórico
                   Contrato CO-001       Ponto Eletrônico (QR)
                   Obra criada           Presença por obra
                                         Financeiro / Folha RH
```
