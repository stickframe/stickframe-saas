/**
 * StickFEM™ Benchmark Estrutural — indicadores + persistência.
 * Cada projeto vira um dado comparável (kg aço/m², custo/m², prazo), que
 * alimenta o benchmark do setor (StickPulse™).
 */
import { sb, getEmpresaId } from "../supabase";

/** Indicadores estruturais a partir do quantitativo + área construída. */
export function computeIndicadores({ pesoAco = 0, areaM2 = 0, custoEstrutura = 0, quantidadePerfis = 0, prazoEstimado = null, prazoReal = null }) {
  const kgAcoM2 = areaM2 > 0 ? +(pesoAco / areaM2).toFixed(1) : 0;
  const custoM2 = areaM2 > 0 ? +(custoEstrutura / areaM2).toFixed(0) : 0;
  const precisaoPrazo = (prazoEstimado && prazoReal)
    ? +(100 - Math.abs(prazoReal - prazoEstimado) / prazoEstimado * 100).toFixed(1) : null;
  return { kgAcoM2, custoM2, quantidadePerfis, pesoAco, areaM2, precisaoPrazo };
}

/**
 * Status vs. referência. menorMelhor=true → menor é melhor (aço, custo, prazo).
 * 🟢 abaixo (>5% melhor) · 🟡 na média (±5%) · 🔴 acima.
 */
export function statusVsRef(valor, media, { menorMelhor = true } = {}) {
  if (!valor || !media) return { nivel: "indefinido", emoji: "⚪", cor: "#8c847a", pct: 0, label: "sem referência" };
  const diff = (valor - media) / media; // >0 = acima da média
  const dentro = Math.abs(diff) <= 0.05;
  const bom = menorMelhor ? diff < 0 : diff > 0;
  const pct = Math.round(Math.abs(diff) * 100);
  if (dentro) return { nivel: "media", emoji: "🟡", cor: "#b07a1e", pct, label: "dentro da média" };
  if (bom) return { nivel: "bom", emoji: "🟢", cor: "#3f7a4b", pct, label: menorMelhor ? `${pct}% mais eficiente` : `${pct}% acima` };
  return { nivel: "ruim", emoji: "🔴", cor: "#981915", pct, label: `${pct}% ${menorMelhor ? "acima da média" : "abaixo"}` };
}

/** Registra um ponto de benchmark (chamado ao gerar orçamento estrutural). */
export async function registrarBenchmark({ projetoId, tipologia, areaM2, pesoAco, quantidadePerfis, custoEstrutura, prazoEstimado }) {
  const empresa_id = getEmpresaId();
  if (!empresa_id) return null;
  const ind = computeIndicadores({ pesoAco, areaM2, custoEstrutura, quantidadePerfis });
  const { data, error } = await sb.from("benchmark_estrutural").insert({
    empresa_id, projeto_id: projetoId || null, tipologia: tipologia || null,
    area_m2: areaM2 || null, peso_aco_total: pesoAco || null,
    kg_aco_m2: ind.kgAcoM2 || null, quantidade_perfis: quantidadePerfis || null,
    custo_estrutura: custoEstrutura || null, custo_m2: ind.custoM2 || null,
    prazo_estimado: prazoEstimado || null,
  }).select().single();
  if (error) { console.warn("[benchmark] registrar:", error.message); return null; }
  return data;
}

/** Carrega benchmarks da empresa + referência de mercado. */
export async function carregarBenchmarkEstrutural() {
  const [meus, ref] = await Promise.all([
    sb.from("benchmark_estrutural").select("*").order("data_analise", { ascending: false }).limit(50),
    sb.from("benchmark_referencia").select("*"),
  ]);
  return { itens: meus.data || [], referencia: ref.data || [] };
}
