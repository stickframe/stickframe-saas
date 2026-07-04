/**
 * StickFEM™ — Engineering Diff: impacto técnico e financeiro.
 *
 * Recalcula, para antes e depois, os indicadores (peso, montantes, guias,
 * perfis, StickScore, conflitos, custo) e o delta. Reutiliza o motor existente
 * (gerarQuantitativo, computeStickScore, detectarConflitos) — sem duplicar
 * lógica. Aceita indicadores já calculados (dos snapshots do Histórico) para
 * evitar recomputo quando disponíveis.
 */
import { gerarQuantitativo } from "../quantitativo";
import { computeStickScore } from "../score";
import { detectarConflitos } from "../conflicts";

const delta = (a, b) => (a == null || b == null ? null : +(Number(b) - Number(a)).toFixed(2));

/** Indicadores de um lado (antes ou depois). `pre` = valores já conhecidos. */
function indicadores(elementos, { perfis, projeto, precoKg, geometria, pre = {} }) {
  const quant = gerarQuantitativo(elementos || [], perfis || [], {
    espacMontanteMm: projeto?.espac_montante_mm, peDireitoM: projeto?.pe_direito_m,
  });
  const montante = (quant.itens || []).find((i) => i.tipo === "montante");
  const guia = (quant.itens || []).find((i) => i.tipo === "viga" || i.tipo === "guia");
  const peso = quant.resumo?.pesoTotal_kg ?? 0;

  const stickScore = pre.stickScore ?? (geometria ? computeStickScore({ elementos, geometria, conflitos: [] }).score : null);
  const conflitosTotal = pre.conflitosTotal ?? detectarConflitos({ elementos, geometria, perfis }).length;

  return {
    pesoTotal_kg: peso,
    montantes: quant.resumo?.montantes ?? (montante?.quantidade ?? 0),
    guias: guia?.quantidade ?? 0,
    perfis: (quant.itens || []).length,
    custo: +(peso * (Number(precoKg) || 0)).toFixed(2),
    stickScore,
    conflitos: conflitosTotal,
  };
}

/**
 * @param {Object} params { antes, depois, perfis, projeto, precoKg=12,
 *                          geometriaAntes, geometriaDepois, preAntes, preDepois }
 * @returns impacto com { antes, depois, delta } por indicador
 */
export function calcularImpacto({ antes = [], depois = [], perfis = [], projeto = {}, precoKg = 12, geometriaAntes = null, geometriaDepois = null, preAntes = {}, preDepois = {} }) {
  const a = indicadores(antes, { perfis, projeto, precoKg, geometria: geometriaAntes, pre: preAntes });
  const d = indicadores(depois, { perfis, projeto, precoKg, geometria: geometriaDepois, pre: preDepois });

  const linha = (k) => ({ antes: a[k], depois: d[k], delta: delta(a[k], d[k]) });
  return {
    peso_kg: linha("pesoTotal_kg"),
    montantes: linha("montantes"),
    guias: linha("guias"),
    perfis: linha("perfis"),
    custo: linha("custo"),
    stickScore: linha("stickScore"),
    conflitos: linha("conflitos"),
    precoKg,
  };
}
