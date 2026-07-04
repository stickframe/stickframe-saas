/**
 * StickAI — Confiança explicável (IA Explicável).
 *
 * Substitui o "alta/média/baixa" por um índice NUMÉRICO 0–100, mostrando quais
 * fatores aumentaram ou reduziram a confiança e com que PESO. Determinístico e
 * auditável — nada de caixa-preta.
 *
 * Fatores (peso máximo somando 1,00):
 *   geometria_valida      0,15  — extremidades presentes e comprimento > 0
 *   layer_reconhecido     0,40  — nome do layer casa com um tipo estrutural
 *   comprimento_plausivel 0,30  — comprimento típico de parede (graduado)
 *   confirmado_engenheiro 0,15  — o engenheiro fixou o tipo (override)
 */
export const PESOS_CONFIANCA = {
  geometria_valida: 0.15,
  layer_reconhecido: 0.40,
  comprimento_plausivel: 0.30,
  confirmado_engenheiro: 0.15,
};

export function nivelDeConfianca(score) {
  if (score >= 70) return "alta";
  if (score >= 45) return "media";
  return "baixa";
}

/**
 * @param {Object} sinais
 * @param {boolean} sinais.geometriaValida
 * @param {boolean} sinais.layerReconhecido
 * @param {number}  sinais.comprimento_m
 * @param {boolean} sinais.confirmadoEngenheiro
 * @returns {{ score:number, nivel:string, fatores:Array }}
 */
export function computarConfianca({ geometriaValida = true, layerReconhecido = false, comprimento_m = 0, confirmadoEngenheiro = false } = {}) {
  // ativação de cada fator em [0,1]
  const compAtiv = comprimento_m >= 1.0 ? 1 : comprimento_m >= 0.3 ? 0.5 : 0;
  const ativacoes = {
    geometria_valida: geometriaValida ? 1 : 0,
    layer_reconhecido: layerReconhecido ? 1 : 0,
    comprimento_plausivel: compAtiv,
    confirmado_engenheiro: confirmadoEngenheiro ? 1 : 0,
  };

  const fatores = Object.keys(PESOS_CONFIANCA).map((id) => {
    const peso = PESOS_CONFIANCA[id];
    const ativacao = ativacoes[id];
    const contribuicao = Math.round(peso * ativacao * 100);
    return { id, label: LABELS[id], peso, ativacao, contribuicao, efeito: ativacao > 0 ? "aumenta" : "reduz" };
  });

  const score = Math.max(0, Math.min(100, Math.round(fatores.reduce((s, f) => s + f.contribuicao, 0))));
  return { score, nivel: nivelDeConfianca(score), fatores };
}

const LABELS = {
  geometria_valida: "Geometria válida",
  layer_reconhecido: "Layer reconhecido",
  comprimento_plausivel: "Comprimento plausível",
  confirmado_engenheiro: "Confirmado pelo engenheiro",
};
