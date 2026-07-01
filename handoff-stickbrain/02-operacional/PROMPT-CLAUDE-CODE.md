# PROMPT — Claude Code · StickBrain Operacional™ (Fase 3)

Cole na raiz do repositório do StickFrame™. **Referência visual obrigatória:** `stickbrain-operacional/StickBrain Operacional.html` (mockup hi-fi aprovado) — recrie no app, não copie o HTML. **Pré-requisito:** Fase 2 (StickBrain Analytics + views `vw_stickbrain_*`) já implementada.

---

Você é um **Arquiteto Full Stack + Product Engineer sênior**. Implemente a **Fase 3 — StickBrain Operacional™**: a camada onde a IA **age**, não apenas mede. Sobre os mesmos dados da Fase 2, transformar análise em **ação priorizada**: o que fazer agora, por quê, e com 1 clique.

> Diferença das fases: Analytics = *"onde está travando"*. Operacional = *"faça isto agora ou perde dinheiro"*. É um cockpit diário de próxima-melhor-ação.

## Antes de escrever código
- Reaproveitar tudo da Fase 2: cliente Supabase, store, rotas, componentes `src/components/stickbrain/`, `src/services/stickbrainAI.js` e as views `vw_stickbrain_funil` / `vw_stickbrain_kpis`.
- Validar campos REAIS (datas de último contato, status, responsável, valor) — **não assumir estrutura**.
- Tokens em `src/utils/constants.js` (`C`) e `globals.css` (`var(--cond)`).

## Regras inegociáveis
- Dados via **views/funções SQL**; React só consome. Sem Tailwind/styled-components. Sem paleta nova. Ícones SVG Lucide, **sem emoji**.
- **NÃO alterar** lógica de StickQuote, calculadora, PDF, regras de negócio, RLS, autenticação.
- **Nenhuma automação dispara sem trilha de auditoria nem sem respeitar permissões.** Toda ação automática deve ser registrada e reversível ("Ver"/desfazer).
- Responsivo desktop/mobile, AA, touch ≥44px.

## Execução por etapas — um item por commit `operacional(stickbrain): <item>`

### ITEM 1 — Scoring SQL
`supabase/analytics/002_operacional.sql`:
- **`vw_stickbrain_lead_score`** — por oportunidade: `lead_id, nome, valor, estagio, responsavel, dias_sem_contato, aberturas_proposta, temperatura (quente|morno|esfriando), score_prioridade (0-100)`.
- **`vw_stickbrain_prob_fechamento`** — `oportunidade_id, nome, valor, estagio, prob_fechamento (0-100)`.
- **`vw_stickbrain_origem_sinal`** — conversão por origem vs. média, flag `queimando` quando muito abaixo.
- Scores por **regras determinísticas** (recência, engajamento, estágio, valor) — documentar a fórmula em comentário SQL. Sem modelo de ML ainda.

### ITEM 2 — Motor de ações
`src/services/stickbrainActions.js` — gera a fila de ações a partir das views. Cada ação:
```
{ id, tipo, // ligar | follow_up | gerar_proposta | gerar_orcamento | agendar | recuperar_orfaos
  entidade:{id,nome,valor,estagio,responsavel},
  urgencia, // agora | hoje | semana
  score,    // 0-100
  motivos:[], // sinais que justificam (chips)
  acoes:[]  // CTAs disponíveis
}
```
Regras-base: lead esfriando + alto valor → ligar (agora); StickQuote órfão → recuperar; orçamento aprovado parado → gerar proposta; etc.

### ITEM 3 — Tela operacional
`src/pages/StickBrainOperacional.jsx`, rota `/stickbrain/operacional` (sub-item "Operacional" no menu StickBrain™, com indicador **LIVE**). Layout **conforme mockup**:
1. **Topbar** com pill "Monitorando N oportunidades" (live).
2. **Banda "o que fazer hoje"** — total de ações, R$ em jogo, contadores (esfriando / quentes p/ fechar / automações disparadas).
3. **Coluna principal — Fila de ações** agrupada em **Agora / Hoje / Esta semana**, e bloco **Feito pela IA hoje**. Cada card: ring de score, verbo + entidade, valor/estágio/responsável, **chips de motivo**, CTAs de 1 clique, "Por quê?" (explicabilidade) e dismiss (adiar).
4. **Coluna de sinais (direita):** Termômetro de leads (barras quente/morno/esfriando), Alta chance de fechar (probabilidade %), Sinal de origem ("X está queimando dinheiro" + diagnóstico).
5. Filtro de visão: Sugeridas / Automáticas / Todas.

### ITEM 4 — Componentes
`src/components/stickbrain/`: `ActionQueue.jsx`, `ActionCard.jsx`, `LeadThermometer.jsx`, `DealCloseList.jsx`, `OriginSignal.jsx`, `TodayBand.jsx`, `AutomationLog.jsx`.

### ITEM 5 — Ações & automações
- CTAs chamam **services existentes** (gerar proposta/orçamento, agendar na agenda, registrar follow-up). Não duplicar lógica.
- **Automações** (follow-up de reengajamento, criação de lembrete) atrás de toggle configurável; cada execução grava em tabela de auditoria `stickbrain_acoes_log` e aparece em "Feito pela IA hoje" com opção de desfazer.
- "Por quê?" abre os motivos/score que geraram a recomendação (explicabilidade).

### ITEM 6 — Segurança & escopo
Respeitar RLS e perfil: cada responsável vê suas oportunidades; diretor vê o todo. Nenhuma ação executa fora do escopo permitido.

## Critério de aceite
✅ `/stickbrain/operacional` funcionando · ✅ views de score criadas e validadas · ✅ fila priorizada real do Supabase · ✅ CTAs reutilizam services existentes · ✅ automações com auditoria + desfazer · ✅ explicabilidade ("Por quê?") · ✅ responsivo · ✅ `npm run build` limpo · ✅ nada existente quebrado.

## Entregável final
Arquivos criados/alterados · migrations SQL · fórmula de scoring documentada · queries principais · screenshots da tela · confirmação de build limpo.
