/**
 * Feature flags dos providers externos de análise.
 *
 * A análise via CalcSteel (/analysis) fica DESLIGADA por padrão e só liga quando
 * (1) houver credenciais/contrato oficiais e (2) o proxy seguro (Edge Function)
 * estiver configurado. Até lá, o AnalysisProviderManager usa o motor local.
 *
 * O catálogo de perfis NÃO depende dessa flag: ele é importado, validado e
 * salvo no Supabase (cópia local) — os cálculos usam sempre a cópia local.
 */
const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

export const CALCSTEEL_ANALYSIS_ENABLED = String(env.VITE_CALCSTEEL_ANALYSIS_ENABLED || "") === "true";
export const CALCSTEEL_PROXY_URL = env.VITE_CALCSTEEL_PROXY_URL || null;

/** Só liga quando explicitamente habilitado E com proxy seguro presente. */
export function calcSteelAnalysisDisponivel() {
  return CALCSTEEL_ANALYSIS_ENABLED && !!CALCSTEEL_PROXY_URL;
}
