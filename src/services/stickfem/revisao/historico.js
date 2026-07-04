/**
 * StickFEM™ — Histórico de Revisões ("Git do projeto estrutural").
 *
 * Cada revisão guarda um SNAPSHOT do modelo + metadados (StickScore, conflitos,
 * hash do cálculo, versão do engine). A comparação entre snapshots produz um
 * DIFF (elementos adicionados/removidos/alterados + deltas de score/conflitos/
 * peso). Esta camada é PURA e testável — a persistência fica no repositório.
 */

// Campos comparados no diff (relevantes à engenharia). O snapshot guarda o
// elemento COMPLETO (inclusive geometria) para permitir restauração sem perda.
const CAMPOS_DIFF = ["tipo", "perfil_id", "comprimento_m", "validado", "incluir_calculo"];

/**
 * Cria um snapshot normalizado do estado atual do modelo.
 */
export function criarSnapshot({ elementos = [], stickScore = null, conflitos = [], perfMont = null, perfGuia = null, cargas = null, pesoTotal_kg = null, calcHash = null, engineVersion = null } = {}) {
  return {
    elementos: elementos.map((e) => ({ ...e })),
    stickScore,
    conflitosTotal: conflitos.length,
    perfMont, perfGuia, cargas,
    pesoTotal_kg,
    calcHash, engineVersion,
    geradoEm: new Date().toISOString(),
  };
}

/**
 * Diff entre duas listas de elementos (casadas por nome).
 * @returns {{ adicionados:string[], removidos:string[], alterados:Array }}
 */
export function diffElementos(anterior = [], atual = []) {
  const idxAnt = new Map(anterior.map((e) => [e.nome, e]));
  const idxAtu = new Map(atual.map((e) => [e.nome, e]));

  const adicionados = atual.filter((e) => !idxAnt.has(e.nome)).map((e) => e.nome);
  const removidos = anterior.filter((e) => !idxAtu.has(e.nome)).map((e) => e.nome);

  const alterados = [];
  for (const [nome, a] of idxAtu) {
    const b = idxAnt.get(nome);
    if (!b) continue;
    const mudancas = CAMPOS_DIFF
      .filter((c) => (a[c] ?? null) !== (b[c] ?? null))
      .map((c) => ({ campo: c, de: b[c] ?? null, para: a[c] ?? null }));
    if (mudancas.length) alterados.push({ nome, mudancas });
  }
  return { adicionados, removidos, alterados };
}

/**
 * Diff completo entre dois snapshots (elementos + deltas de score/conflitos/peso).
 * `anterior` pode ser null (primeira revisão).
 */
export function diffSnapshots(anterior, atual) {
  const els = diffElementos(anterior?.elementos || [], atual?.elementos || []);
  const num = (v) => (v == null ? null : Number(v));
  const delta = (a, b) => (a == null || b == null ? null : +(Number(b) - Number(a)).toFixed(2));

  return {
    elementos: els,
    resumo: {
      adicionados: els.adicionados.length,
      removidos: els.removidos.length,
      alterados: els.alterados.length,
    },
    stickScore: { antes: num(anterior?.stickScore), depois: num(atual?.stickScore), delta: delta(anterior?.stickScore, atual?.stickScore) },
    conflitos: { antes: num(anterior?.conflitosTotal), depois: num(atual?.conflitosTotal), delta: delta(anterior?.conflitosTotal, atual?.conflitosTotal) },
    peso_kg: { antes: num(anterior?.pesoTotal_kg), depois: num(atual?.pesoTotal_kg), delta: delta(anterior?.pesoTotal_kg, atual?.pesoTotal_kg) },
    primeiraRevisao: !anterior,
  };
}
