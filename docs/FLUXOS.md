# Fluxos do StickFrame
*Documentação dos fluxos principais do sistema — atualizado junho/2026*

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
  ├─ Alocação em obras
  ├─ Registro de horas
  └─ Certificações NR
      ├─ NR-18, NR-35, NR-10, NR-12, NR-06, NR-33...
      ├─ Validade com alertas de vencimento
      └─ Badge visual por colaborador (Válida / Vencendo / Vencida)
```

---

## 6. Financeiro

```
Financeiro
  ├─ Lançamentos (receita / despesa)
  ├─ Categorias e centros de custo por obra
  ├─ DRE mensal
  ├─ Fluxo de caixa
  └─ Exportar relatório PDF
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

## 11. QR Code de Painel (rastreabilidade)

```
/qr/obra/:obraId  →  lista de painéis com QR
  └─ QR impresso no painel físico
      └─ Escanear → /painel/:token
          ├─ Dados do painel (dimensão, peso, fase)
          └─ Localização no modelo BIM (highlight do elemento)
```

---

## 12. Presença em Tempo Real

```
Supabase Realtime (canal: obra-{obraId})
  └─ Avatares de quem está visualizando a mesma obra agora
      └─ Tooltip: nome + "há X min"
```

---

## Resumo do Funil Completo

```
AQUISIÇÃO          CONVERSÃO             EXECUÇÃO              ENTREGA
─────────────      ─────────────────     ────────────────────  ──────────────
/calcular          CRM Kanban            Cronograma            Portal Cliente
Lead público   →   Orçamento         →  Diário / BIM      →   Garantias
                   Proposta              Equipe / NR           Histórico
                   Contrato CO-001       Financeiro
                   Obra criada           Vistorias / RFI
```
