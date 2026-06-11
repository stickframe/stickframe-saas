/**
 * StickScore™ — Índice de Saúde da Obra
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
    finScore = 68; // sem dados — neutro levemente negativo
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
  let equipeScore =
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
  const total = clamp(Math.round(
    scores.cronograma * PESOS.cronograma +
    scores.financeiro * PESOS.financeiro +
    scores.compras    * PESOS.compras    +
    scores.equipe     * PESOS.equipe     +
    scores.qualidade  * PESOS.qualidade
  ));

  const nivel =
    total >= 90 ? "Excelente" :
    total >= 75 ? "Saudável"  :
    total >= 60 ? "Atenção"   : "Crítico";

  const cor =
    total >= 90 ? "#2e9e5b" :
    total >= 75 ? "#3b6ea5" :
    total >= 60 ? "#b07a1e" : "#981915";

  return { total, scores, nivel, cor };
}

function clamp(v) { return Math.min(100, Math.max(0, v)); }

export const STICK_SCORE_DIMENSOES = [
  { key: "cronograma", label: "Cronograma", peso: "25%" },
  { key: "financeiro", label: "Financeiro",  peso: "30%" },
  { key: "compras",    label: "Compras",     peso: "20%" },
  { key: "equipe",     label: "Equipe",      peso: "15%" },
  { key: "qualidade",  label: "Qualidade",   peso: "10%" },
];
