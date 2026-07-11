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

  //  1. CRONOGRAMA (25%) 
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

  //  2. FINANCEIRO (30%) 
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

  //  3. COMPRAS / MEDIÇÕES (20%) 
  let compScore = 68;
  if (medicoes.length > 0) {
    const aprovadas = medicoes.filter(m => m.status === "Aprovada").length;
    compScore = 55 + (aprovadas / medicoes.length) * 45;
  }
  scores.compras = clamp(Math.round(compScore));

  //  4. EQUIPE (15%) 
  const nMembros = membros.length;
  const equipeScore =
    nMembros >= 6 ? 100 :
    nMembros >= 4 ? 88  :
    nMembros >= 2 ? 72  :
    nMembros >= 1 ? 55  : 30;
  scores.equipe = clamp(Math.round(equipeScore));

  //  5. QUALIDADE / DIÁRIO (10%) 
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

  //  TOTAL ponderado 
  let total = clamp(Math.round(
    scores.cronograma * PESOS.cronograma +
    scores.financeiro * PESOS.financeiro +
    scores.compras    * PESOS.compras    +
    scores.equipe     * PESOS.equipe     +
    scores.qualidade  * PESOS.qualidade
  ));

  //  Penalidades críticas (cap por dimensão em colapso) 
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
  if (total >= 80) return { nivel: "Excelente", cor: "#3f7a4b" };
  if (total >= 70) return { nivel: "Bom",       cor: "#3b6ea5" };
  if (total >= 60) return { nivel: "Atenção",   cor: "#b07a1e" };
  return             { nivel: "Crítico",         cor: "#981915" };
}

function clamp(v) { return Math.min(100, Math.max(0, v)); }

//  Histórico de score (localStorage, granularidade mensal) 

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

//  Insights automáticos 

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

//  StickScore™ Executivo 
// Score consolidado da empresa, voltado para donos e diretores.
// Mede saúde financeira do negócio, não execução de obra individual.

export const STICK_SCORE_EXEC_DIMENSOES = [
  { key: "rentabilidade",   label: "Rentabilidade",        peso: "35%" },
  { key: "fluxo",           label: "Fluxo de Caixa",       peso: "30%" },
  { key: "recebimento",     label: "Prazo de Recebimento", peso: "20%" },
  { key: "carteira",        label: "Carteira de Obras",    peso: "15%" },
];

/**
 * @param {Array} obras — todas as obras da empresa
 * @param {Object} financeiroPorObra — { obraId: { lancamentos: [] } }
 */
export function calcularStickScoreExecutivo(obras, financeiroPorObra = {}) {
  const obrasAtivas    = obras.filter(o => o.status === "Em andamento");
  const todasObras     = obras.filter(o => o.status !== "Planejamento");
  const scores = {};

  //  1. RENTABILIDADE (35%) 
  // Margem média ponderada pelo contrato das obras ativas
  let rentScore = 65;
  const obrasComContrato = obrasAtivas.filter(o => o.contrato > 0);
  if (obrasComContrato.length > 0) {
    const totalContrato = obrasComContrato.reduce((s, o) => s + o.contrato, 0);
    let margemPonderada = 0;
    obrasComContrato.forEach(o => {
      const fins = financeiroPorObra[o.id]?.lancamentos || [];
      const rec  = fins.filter(f => f.tipo === "receita").reduce((s, f) => s + (Number(f.valor) || 0), 0);
      const desp = fins.filter(f => f.tipo === "despesa").reduce((s, f) => s + (Number(f.valor) || 0), 0);
      const margem = rec > 0 ? (rec - desp) / rec : 0;
      margemPonderada += margem * (o.contrato / totalContrato);
    });
    rentScore =
      margemPonderada > 0.30 ? 100 :
      margemPonderada > 0.20 ? 90  :
      margemPonderada > 0.12 ? 78  :
      margemPonderada > 0.05 ? 62  :
      margemPonderada > 0    ? 45  : 25;
  }
  scores.rentabilidade = clamp(Math.round(rentScore));

  //  2. FLUXO DE CAIXA (30%) 
  // Saldo total (receitas - despesas) vs. volume total de contratos
  let fluxoScore = 65;
  const totalRec  = todasObras.reduce((s, o) => {
    const fins = financeiroPorObra[o.id]?.lancamentos || [];
    return s + fins.filter(f => f.tipo === "receita").reduce((a, f) => a + (Number(f.valor) || 0), 0);
  }, 0);
  const totalDesp = todasObras.reduce((s, o) => {
    const fins = financeiroPorObra[o.id]?.lancamentos || [];
    return s + fins.filter(f => f.tipo === "despesa").reduce((a, f) => a + (Number(f.valor) || 0), 0);
  }, 0);
  const totalContrato = todasObras.reduce((s, o) => s + (o.contrato || 0), 0);
  if (totalContrato > 0) {
    const saldoPct = (totalRec - totalDesp) / totalContrato;
    fluxoScore =
      saldoPct > 0.20 ? 100 :
      saldoPct > 0.10 ? 88  :
      saldoPct > 0.02 ? 72  :
      saldoPct > -0.05 ? 55 :
      saldoPct > -0.15 ? 35 : 15;
  }
  scores.fluxo = clamp(Math.round(fluxoScore));

  //  3. PRAZO DE RECEBIMENTO (20%) 
  // Gap médio entre progresso físico e % recebido do contrato
  // Gap pequeno = cliente pagando no ritmo da obra = score alto
  let recScore = 70;
  const obrasParaGap = obrasAtivas.filter(o => o.contrato > 0 && o.progresso != null);
  if (obrasParaGap.length > 0) {
    const gaps = obrasParaGap.map(o => {
      const fins = financeiroPorObra[o.id]?.lancamentos || [];
      const rec  = fins.filter(f => f.tipo === "receita").reduce((s, f) => s + (Number(f.valor) || 0), 0);
      const pctRecebido = (rec / o.contrato) * 100;
      return (o.progresso || 0) - pctRecebido; // positivo = obra adiantada do recebimento
    });
    const gapMedio = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    recScore =
      gapMedio <= 5   ? 100 :
      gapMedio <= 15  ? 85  :
      gapMedio <= 25  ? 68  :
      gapMedio <= 40  ? 48  : 25;
  }
  scores.recebimento = clamp(Math.round(recScore));

  //  4. CARTEIRA DE OBRAS (15%) 
  // Volume e diversificação: qtd de obras ativas + valor de carteira
  let carteiraScore = 55;
  const n = obrasAtivas.length;
  const vgv = obrasAtivas.reduce((s, o) => s + (o.contrato || 0), 0);
  if      (n >= 5 && vgv > 500000)  carteiraScore = 100;
  else if (n >= 3 && vgv > 200000)  carteiraScore = 85;
  else if (n >= 2 && vgv > 80000)   carteiraScore = 72;
  else if (n >= 1 && vgv > 20000)   carteiraScore = 58;
  else if (n >= 1)                   carteiraScore = 45;
  scores.carteira = clamp(Math.round(carteiraScore));

  //  TOTAL ponderado 
  const total = clamp(Math.round(
    scores.rentabilidade * 0.35 +
    scores.fluxo         * 0.30 +
    scores.recebimento   * 0.20 +
    scores.carteira      * 0.15
  ));

  const { nivel, cor } = classificar(total);
  return { total, scores, nivel, cor };
}

/**
 * calcularStickScoreEngenharia
 * 
 * Calcula o score ponderado (0-100) da engenharia para um StickFlow.
 * 
 * Eixos:
 * 1. Desvio Financeiro (35%)
 * 2. Desvio de Quantitativos BIM (20%)
 * 3. Atraso Cronograma (15%)
 * 4. Compras (10%)
 * 5. Produtividade (10%)
 * 6. Qualidade (10%)
 */
export function calcularStickScoreEngenharia(stickflow, {
  financeiro = [],
  orcamento = null,
  bimModelos = [],
  tarefas = [],
  compras = [],
  pontos = [],
  vistorias = []
} = {}) {
  const scores = {};

  // 1. DESVIO FINANCEIRO (35%)
  let finScore = 100;
  if (orcamento && Number(orcamento.valor) > 0) {
    const despesas = financeiro.filter(f => f.tipo === "despesa").reduce((s, f) => s + (Number(f.valor) || 0), 0);
    const orcado = Number(orcamento.valor);
    const desvio = (despesas - orcado) / orcado;
    if (desvio > 0) {
      finScore = Math.max(0, 100 - (desvio * 100 * 2.5));
    }
  }
  scores.financeiro = clamp(Math.round(finScore));

  // 2. DESVIO QUANTITATIVOS BIM (20%)
  let bimScore = 100;
  if (bimModelos && bimModelos.length > 0) {
    // Se há um desvio quantitativo registrado no metadados do StickFlow
    const desvioBim = Number(stickflow?.metadados?.desvio_quantitativos) || 0;
    if (desvioBim > 0) {
      bimScore = Math.max(0, 100 - (desvioBim * 100 * 3));
    } else {
      bimScore = 95; // Padrão base se há modelo mas sem desvio calculado
    }
  }
  scores.bim = clamp(Math.round(bimScore));

  // 3. ATRASO CRONOGRAMA (15%)
  let cronScore = 100;
  if (tarefas && tarefas.length > 0) {
    const hoje = new Date();
    const criticas = tarefas.filter(t => t.critica || t.prioridade === "alta" || t.prioridade === "crítica");
    const baseTarefas = criticas.length > 0 ? criticas : tarefas;
    const vencidas = baseTarefas.filter(t => t.status !== "concluido" && t.status !== "Feito" && t.data_fim && new Date(t.data_fim) < hoje);
    cronScore = Math.max(0, 100 - (vencidas.length / baseTarefas.length) * 100);
  }
  scores.cronograma = clamp(Math.round(cronScore));

  // 4. COMPRAS (10%)
  let compScore = 100;
  if (compras && compras.length > 0) {
    // Compara valor real vs planejado nos itens de compra
    const itensAcima = compras.filter(c => c.valor_unitario && c.valor_planejado && Number(c.valor_unitario) > Number(c.valor_planejado)).length;
    compScore = Math.max(0, 100 - (itensAcima / compras.length * 50));
  }
  scores.compras = clamp(Math.round(compScore));

  // 5. PRODUTIVIDADE (10%)
  let prodScore = 100;
  if (pontos && pontos.length > 0 && stickflow?.progresso > 0) {
    // Total de horas registradas no ponto
    const totalHoras = pontos.reduce((s, p) => s + (Number(p.horas_trabalhadas) || 8), 0);
    const progresso = stickflow.progresso;
    const horasPorProgresso = totalHoras / progresso;
    if (horasPorProgresso > 10) {
      prodScore = Math.max(0, 100 - Math.min(80, (horasPorProgresso - 10) * 4));
    }
  }
  scores.produtividade = clamp(Math.round(prodScore));

  // 6. QUALIDADE (10%)
  let qualScore = 100;
  if (vistorias && vistorias.length > 0) {
    const ncAtivas = vistorias.filter(v => v.status === "aberta" || v.status === "pendente" || v.status === "não-conforme").length;
    qualScore = Math.max(0, 100 - (ncAtivas * 15));
  }
  scores.qualidade = clamp(Math.round(qualScore));

  // Cálculo ponderado
  const total = clamp(Math.round(
    scores.financeiro * 0.35 +
    scores.bim * 0.20 +
    scores.cronograma * 0.15 +
    scores.compras * 0.10 +
    scores.produtividade * 0.10 +
    scores.qualidade * 0.10
  ));

  const { nivel, cor } = classificar(total);
  return { total, scores, nivel, cor };
}

