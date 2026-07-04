/**
 * Validação cruzada — compara dois StructuralAnalysisResult (ex.: local × externo)
 * e classifica a concordância. Ferramenta para ganhar confiança no solver próprio
 * ao longo do tempo, sem depender de um único motor.
 */
export function compararResultados(a, b) {
  const ua = a?.maxUtilization, ub = b?.maxUtilization;
  const temAmbos = Number.isFinite(ua) && Number.isFinite(ub) && ub !== 0;
  const diffPct = temAmbos ? Math.abs(ua - ub) / Math.abs(ub) * 100 : null;

  let nivel = "indefinido", rotulo = "sem dados suficientes", emoji = "⚪";
  if (diffPct != null) {
    if (diffPct < 2) { nivel = "excelente"; rotulo = "concordância excelente"; emoji = "🟢"; }
    else if (diffPct < 5) { nivel = "boa"; rotulo = "concordância boa"; emoji = "🟢"; }
    else { nivel = "revisar"; rotulo = "divergência — revisar"; emoji = "⚠"; }
  }

  return {
    providers: [a?.provider, b?.provider],
    utilizacao: { a: ua ?? null, b: ub ?? null, diffPct: diffPct != null ? +diffPct.toFixed(1) : null },
    passConcorda: a?.pass != null && b?.pass != null ? a.pass === b.pass : null,
    nivel, rotulo, emoji,
  };
}
