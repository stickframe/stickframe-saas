/**
 * StickFEM™ Validation Framework™ — Digital Twin (previsto × executado).
 *
 * Compara o que o motor previu com o que a obra realmente consumiu/levou, para
 * o sistema aprender ao longo do tempo. É apenas o COMPARADOR (puro); os valores
 * executados vêm de dados reais da obra (RDO/medições) — nunca inventados.
 */
const num = (v) => (v == null || v === "" ? null : Number(v));

/** Precisão % = 100 − |erro relativo|. */
export function precisao(previsto, executado) {
  const p = num(previsto), e = num(executado);
  if (p == null || e == null || p === 0) return null;
  return +(100 - Math.abs(e - p) / Math.abs(p) * 100).toFixed(1);
}

/**
 * @param {Object} dados { peso:{previsto,executado}, prazo:{...}, consumo:{...} }
 * @returns comparação por métrica + precisão média
 */
export function compararPrevistoExecutado(dados = {}) {
  const metricas = ["peso", "prazo", "consumo"];
  const saida = {};
  const precisoes = [];
  for (const m of metricas) {
    const d = dados[m] || {};
    const p = num(d.previsto), e = num(d.executado);
    const pr = precisao(p, e);
    if (pr != null) precisoes.push(pr);
    saida[m] = { previsto: p, executado: e, delta: p != null && e != null ? +(e - p).toFixed(2) : null, precisao: pr };
  }
  saida.precisaoMedia = precisoes.length ? Math.round(precisoes.reduce((a, b) => a + b, 0) / precisoes.length) : null;
  saida.temDados = precisoes.length > 0;
  return saida;
}
