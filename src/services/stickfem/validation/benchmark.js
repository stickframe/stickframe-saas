/**
 * StickFEM™ Validation Framework™ — Benchmark contra softwares comerciais.
 *
 * ⚠️ HONESTIDADE: NÃO há números fabricados. As colunas de SAP2000, RFEM, CYPE,
 * TQS e CalcSteel ficam VAZIAS ("aguardando validação externa") até existirem
 * rodadas reais desses softwares para os mesmos modelos de referência. A coluna
 * StickFEM é preenchida pelo próprio motor (validationRunner). Quando houver
 * dados oficiais, basta preencher `referencias[caso][software]`.
 */
export const SOFTWARES_BENCHMARK = ["SAP2000", "RFEM", "CYPE", "TQS", "CalcSteel"];

/**
 * Monta a tabela de benchmark. `resultadosStick` = saída de rodarSuite().resultados.
 * `referencias` = { [casoId]: { [software]: utilizacao } } — real, quando houver.
 */
export function montarBenchmark(resultadosStick = [], referencias = {}) {
  return resultadosStick.map((r) => {
    const stick = r.resultado?.utilizacao ?? null;
    const linha = { id: r.id, nome: r.nome, stickfem: stick, comparacoes: {} };
    for (const sw of SOFTWARES_BENCHMARK) {
      const ref = referencias?.[r.id]?.[sw];
      linha.comparacoes[sw] = ref == null ? { valor: null, difPct: null, estado: "pendente" }
        : { valor: ref, difPct: stick != null && ref ? +(((stick - ref) / ref) * 100).toFixed(1) : null, estado: "ok" };
    }
    return linha;
  });
}

/** true se ainda não há nenhum dado externo (tudo pendente). */
export function benchmarkVazio(referencias = {}) {
  return Object.keys(referencias || {}).length === 0;
}
