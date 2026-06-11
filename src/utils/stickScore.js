/**
 * StickScore™ — Índice Inteligente de Performance de Obras
 * Pontuação 0–100 composta por 5 dimensões ponderadas.
 */

const PESOS = {
  cronograma: 0.25,
  financeiro: 0.30,
  compras:    0.20,
  equipe:     0.15,
  qualidade:  0.10,
};

export function calcularStickScore(obra, { financeiro = [], medicoes = [], diario = [], membros = [] } = {}) {
  const scores = {};

  // ── 1. CRONOGRAMA (25%) ───────────────────────────────────────────────────
  let cronScore = 70;
  if (obra.prazo_inicio && obra.prazo_fim) {
    const inicio = new Date(obra.prazo_inicio);
    const fim    = new Date(obra.prazo_fim);
    const hoje   = new Date();
    const totalDias   = Math.max(1, (fim - inicio) / 86400000);
    const diasPassados = Math.max(0, (hoje - inicio) / 86400000);
    const progressoEsperado = Math.min(100, (diasPassados / totalDias) * 100);
    const progressoReal = obra.progresso ?? 0;
    const delta = progressoReal - progressoEsperado;

    if (delta >= 10)        cronScore = 100;
    else if (delta >= 0)    cronScore = 85 + (delta / 10) * 15;
    else if (delta >= -15)  cronScore = 65 + ((delta + 15) / 15) * 20;
    else if (delta >= -30)  cronScore = 40 + ((delta + 30) / 15) * 25;
    else                    cronScore = Math.max(20, 40 + ((delta + 30) / 30) * 20);
  } else if (obra.progresso != null) {
    cronScore = Math.min(95, 55 + obra.progresso * 0.40);
  }
  scores.cronograma = clamp(Math.round(cronScore));

  // ── 2. FINANCEIRO (30%) ───────────────────────────────────────────────────
  let finScore = 72;
  const receitas  = financeiro.filter(f => f.tipo === "receita").reduce((s, f) => s + (Number(f.valor) || 0), 0);
  const despesas  = financeiro.filter(f => f.tipo === "despesa").reduce((s, f) => s + (Number(f.valor) || 0), 0);
  const contrato  = Number(obra.contrato) || 0;

  if (contrato > 0 && despesas > 0) {
    const margemReal = (receitas - despesas) / contrato;
    if      (margemReal > 0.25) finScore = 100;
    else if (margemReal > 0.15) finScore = 90;
    else if (margemReal > 0.05) finScore = 76;
    else if (margemReal > 0)    finScore = 60;
    else if (margemReal > -0.1) finScore = 40;
    else                        finScore = 20;
  } else if (financeiro.length === 0) {
    finScore = 68;
  }
  scores.financeiro = clamp(Math.round(finScore));

  // ── 3. COMPRAS / MEDIÇÕES (20%) ───────────────────────────────────────────
  let compScore = 68;
  if (medicoes.length > 0) {
    const aprovadas = medicoes.filter(m => m.status === "Aprovada").length;
    compScore = 55 + (aprovadas / medicoes.length) * 45;
  }
  scores.compras = clamp(Math.round(compScore));

  // ── 4. EQUIPE (15%) ───────────────────────────────────────────────────────
  const nMembros = membros.length;
  const equipeScore =
    nMembros >= 6 ? 100 :
    nMembros >= 4 ? 88  :
    nMembros >= 2 ? 72  :
    nMembros >= 1 ? 55  : 30;
  scores.equipe = clamp(Math.round(equipeScore));

  // ── 5. QUALIDADE / DIÁRIO (10%) ───────────────────────────────────────────
  let qualScore = 68;
  if (diario.length > 0) {
    const hoje = new Date();
    const ultimos30 = diario.filter(d => {
      const dt = new Date(d.created_at || d.data);
      return (hoje - dt) / 86400000 <= 30;
    }).length;
    qualScore =
      ultimos30 >= 22 ? 100 :
      ultimos30 >= 14 ? 90  :
      ultimos30 >= 8  ? 78  :
      ultimos30 >= 3  ? 62  :
      ultimos30 >= 1  ? 48  : 30;
  }
  scores.qualidade = clamp(Math.round(qualScore));

  // ── TOTAL ponderado ───────────────────────────────────────────────────────
  let total = clamp(Math.round(
    scores.cronograma * PESOS.cronograma +
    scores.financeiro * PESOS.financeiro +
    scores.compras    * PESOS.compras    +
    scores.equipe     * PESOS.equipe     +
    scores.qualidade  * PESOS.qualidade
  ));

  // ── Penalidades críticas (cap por dimensão em colapso) ────────────────────
  // Impede que bons indicadores mascarem um setor crítico.
  const penalidade = aplicarPenalidades(scores);
  total = Math.min(total, penalidade.cap);

  const { nivel, cor } = classificar(total);
  return { total, scores, nivel, cor, penalidade: penalidade.motivo };
}

const CAPS = [
  // [ dimensão, limiar, cap máximo, motivo ]
  ["financeiro",  25, 59, "Financeiro crítico impede score acima de Atenção"],
  ["cronograma",  25, 64, "Cronograma crítico limita o score"],
  ["qualidade",   40, 79, "Qualidade crítica impede classificação Excelente ou superior"],
  ["compras",     35, 74, "Compras/medições críticas limitam o score"],
  ["equipe",      35, 74, "Equipe crítica limita o score"],
];

function aplicarPenalidades(scores) {
  let cap = 100;
  let motivo = null;
  for (const [dim, limiar, dimCap, msg] of CAPS) {
    if ((scores[dim] ?? 100) < limiar && dimCap < cap) {
      cap = dimCap;
      motivo = msg;
    }
  }
  return { cap, motivo };
}

function classificar(total) {
  if (total >= 90) return { nivel: "Elite",     cor: "#059669" };
  if (total >= 80) return { nivel: "Excelente", cor: "#2e9e5b" };
  if (total >= 70) return { nivel: "Bom",       cor: "#3b6ea5" };
  if (total >= 60) return { nivel: "Atenção",   cor: "#b07a1e" };
  return             { nivel: "Crítico",         cor: "#981915" };
}

function clamp(v) { return Math.min(100, Math.max(0, v)); }

// ── Histórico de score (localStorage, granularidade mensal) ──────────────────

export function salvarSnapshotScore(empresaId, obraId, score) {
  if (!empresaId || !obraId) return;
  const mes = new Date().toISOString().slice(0, 7);
  try {
    const key = `stickscore-${empresaId}`;
    const hist = JSON.parse(localStorage.getItem(key) || "{}");
    if (!hist[obraId]) hist[obraId] = [];
    const idx = hist[obraId].findIndex(s => s.mes === mes);
    const snap = { mes, total: score.total, scores: score.scores };
    if (idx >= 0) hist[obraId][idx] = snap;
    else hist[obraId].push(snap);
    hist[obraId] = hist[obraId].sort((a, b) => a.mes.localeCompare(b.mes)).slice(-12);
    localStorage.setItem(key, JSON.stringify(hist));
  } catch (_) {}
}

export function carregarHistoricoScore(empresaId, obraId) {
  if (!empresaId || !obraId) return [];
  try {
    const hist = JSON.parse(localStorage.getItem(`stickscore-${empresaId}`) || "{}");
    return hist[obraId] || [];
  } catch (_) { return []; }
}

// ── Insights automáticos ─────────────────────────────────────────────────────

const DIM_LABEL = {
  cronograma: "cronograma",
  financeiro:  "financeiro",
  compras:     "compras / medições",
  equipe:      "equipe",
  qualidade:   "registros de diário",
};

export function gerarInsights(scoreAtual, historico) {
  const insights = [];
  if (!scoreAtual) return insights;

  const prev = historico?.length >= 2 ? historico[historico.length - 2] : null;
  const curr = historico?.length >= 1 ? historico[historico.length - 1] : null;

  if (prev && curr) {
    const delta = curr.total - prev.total;
    const dims = Object.keys(DIM_LABEL);
    const movers = dims
      .map(d => ({ d, delta: (curr.scores?.[d] ?? 0) - (prev.scores?.[d] ?? 0) }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const top = movers[0];
    if (Math.abs(delta) >= 2) {
      if (delta > 0 && top.delta > 0) {
        insights.push({
          tipo: "positivo",
          texto: `Score subiu ${delta} pontos — impulsionado pelo avanço em ${DIM_LABEL[top.d]}.`,
        });
      } else if (delta < 0 && top.delta < 0) {
        insights.push({
          tipo: "negativo",
          texto: `Score caiu ${Math.abs(delta)} pontos devido a quedas em ${DIM_LABEL[top.d]}.`,
        });
      }
    }

    // Alertas por dimensão
    movers.filter(m => m.delta <= -10).forEach(m => {
      insights.push({
        tipo: "alerta",
        texto: `${capitalize(DIM_LABEL[m.d])} caiu ${Math.abs(m.delta)} pontos — requer atenção.`,
      });
    });
  }

  // Alertas estáticos baseados no score atual
  if (scoreAtual.scores.cronograma < 60) {
    insights.push({ tipo: "alerta", texto: "Cronograma em atraso — revise prazos e progresso da obra." });
  }
  if (scoreAtual.scores.financeiro < 60) {
    insights.push({ tipo: "alerta", texto: "Margem financeira baixa — verifique despesas e recebimentos." });
  }
  if (scoreAtual.scores.qualidade < 50) {
    insights.push({ tipo: "dica", texto: "Diário de obra com poucos registros nos últimos 30 dias." });
  }

  return insights.slice(0, 3);
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export const STICK_SCORE_DIMENSOES = [
  { key: "cronograma", label: "Cronograma", peso: "25%" },
  { key: "financeiro", label: "Financeiro",  peso: "30%" },
  { key: "compras",    label: "Compras",     peso: "20%" },
  { key: "equipe",     label: "Equipe",      peso: "15%" },
  { key: "qualidade",  label: "Qualidade",   peso: "10%" },
];
