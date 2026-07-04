/**
 * StickFEM™ Fase 5 — Pré-dimensionamento (verificação preliminar de compressão
 * dos montantes de parede). Modelo simplificado de anteprojeto:
 *
 *   N_sd  = carga vertical na parede (ELU, kN/m) × espaçamento (m)
 *   N_rd  = min(A·fy , π²·E·I_min/(K·L)²) / γ         [esmagamento vs Euler]
 *   ratio = N_sd / N_rd
 *
 * NÃO é o dimensionamento da NBR 14762 (não há interação flexo-compressão,
 * flambagem distorcional/local, nem contraventamento pelas placas). É triagem
 * de anteprojeto — a verificação final é do engenheiro habilitado (ART/RRT).
 *
 * O retorno inclui `calc` (todos os valores intermediários, em unidades-base)
 * para que a memória de cálculo auditável (auditoria.js) use exatamente os
 * mesmos números do cálculo — sem recomputar de forma divergente.
 */

const GAMMA = 1.1;      // coeficiente de resistência (preliminar)
const K = 1.0;          // comprimento de flambagem (birrotulado)

const statusDe = (r) => (r <= 0.85 ? "aprovado" : r <= 1.0 ? "atencao" : "revisar");

export function preDimensionar({ paredes, perfil, material, peDireitoM = 2.8, espacMontanteM = 0.4, qParedeUlt_kN_m = 0 }) {
  if (!perfil || !perfil.area_mm2) {
    return { porParede: [], resumo: { statusGlobal: "indefinido", motivo: "Perfil de montante sem propriedades." }, premissas: {}, calc: null };
  }
  const A = perfil.area_mm2;                       // mm²
  const fy = material?.fy_mpa || 250;              // N/mm²
  const E = material?.e_mpa || 200000;             // N/mm²
  const Imin = Math.max(1, Math.min(perfil.inercia_x_mm4 || 0, perfil.inercia_y_mm4 || 0)); // mm⁴
  const eixoCritico = (perfil.inercia_y_mm4 || Infinity) <= (perfil.inercia_x_mm4 || Infinity) ? "y" : "x";
  const L = peDireitoM * 1000;                     // mm
  const i = Math.sqrt(Imin / A);                   // raio de giração (mm)
  const lambda = (K * L) / i;                      // esbeltez

  const nSquash = A * fy;                           // N
  const nEuler = (Math.PI ** 2 * E * Imin) / ((K * L) ** 2); // N
  const nRd = Math.min(nSquash, nEuler) / GAMMA;    // N

  const nSdPorMontante = qParedeUlt_kN_m * espacMontanteM * 1000; // N (kN/m × m × 1000)
  const ratio = nRd > 0 ? nSdPorMontante / nRd : Infinity;
  const modoGovernante = nEuler < nSquash ? "flambagem (Euler)" : "esmagamento";

  const porParede = (paredes || []).map((p) => {
    const nMont = Math.ceil((p.comprimento_m || 0) / espacMontanteM) + 1;
    return {
      nome: p.nome, comprimento_m: p.comprimento_m, montantes: nMont,
      nSd_kN: +(nSdPorMontante / 1000).toFixed(2),
      nRd_kN: +(nRd / 1000).toFixed(2),
      ratio: +ratio.toFixed(2),
      status: statusDe(ratio),
    };
  });

  const ratioMax = porParede.reduce((m, p) => Math.max(m, p.ratio), 0);
  const criticos = porParede.filter((p) => p.status === "revisar").map((p) => p.nome);
  const statusGlobal = statusDe(ratioMax);

  return {
    porParede,
    resumo: {
      statusGlobal, ratioMax: +ratioMax.toFixed(2),
      esbeltez: +lambda.toFixed(0), esbeltezOk: lambda <= 200,
      criticos,
      nRd_kN: +(nRd / 1000).toFixed(2), nSd_kN: +(nSdPorMontante / 1000).toFixed(2),
      modoGovernante,
    },
    premissas: {
      perfil: perfil.nome, fy_mpa: fy, e_mpa: E, area_mm2: A, imin_mm4: Imin,
      k: K, gamma: GAMMA, peDireitoM, espacMontanteM, qParedeUlt_kN_m,
      nota: "Modelo de anteprojeto (esmagamento vs Euler). Não substitui NBR 14762.",
    },
    // Valores intermediários em unidades-base (N, mm, N/mm²) para auditoria.
    calc: {
      A, fy, E, Imin, eixoCritico, K, L, i, lambda, gamma: GAMMA,
      nSquash, nEuler, nRd, nSdPorMontante, ratio, modoGovernante,
      qParedeUlt_kN_m, espacMontanteM, peDireitoM,
    },
  };
}

// Reexport para consumidores que só querem a regra de status.
export { statusDe, GAMMA, K };
