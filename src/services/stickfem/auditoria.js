/**
 * StickFEM™ — Memória de cálculo auditável (Modo Auditoria).
 *
 * Reproduz a MESMA cadeia de cálculo do pré-dimensionamento de produção
 * (cargas → combinações → solicitação → resistência → utilização) e devolve
 * cada etapa com fórmula, substituição numérica, valor, unidade e a norma de
 * referência. Onde o modelo é simplificado, o passo é marcado (`simplificado`)
 * e o motivo é explicitado — a auditoria nunca maquia o que o motor não faz.
 *
 * Fonte única de verdade: usa combinarCargas/pressaoVento (cargas.js) e
 * preDimensionar (preDimensionamento.js). Não há recomputação divergente.
 */
import { ENGINE_VERSION, ENGINE_STAGE } from "./engine/version";
import { pressaoVento, combinarCargas } from "./cargas";
import { preDimensionar, statusDe } from "./preDimensionamento";

const r = (v, d = 2) => (Number.isFinite(v) ? +v.toFixed(d) : v);

const MOTIVO_STATUS = {
  aprovado: "Utilização ≤ 0,85 — folga adequada para anteprojeto.",
  atencao: "Utilização entre 0,85 e 1,00 — sem folga; revisar na etapa de projeto.",
  revisar: "Utilização > 1,00 — solicitação supera a resistência de cálculo; aumentar perfil, reduzir espaçamento ou revisar cargas.",
  indefinido: "Perfil sem propriedades suficientes para o cálculo.",
};

/**
 * @param {object} inputs
 * @param {object} inputs.perfil            perfil de montante (com area_mm2, inercia_x_mm4, inercia_y_mm4)
 * @param {object} [inputs.material]        { fy_mpa, e_mpa }
 * @param {number} inputs.peDireitoM        altura / comprimento de flambagem (m)
 * @param {number} inputs.espacMontanteM    espaçamento entre montantes (m)
 * @param {number} inputs.larguraTributariaM largura tributária da laje (m)
 * @param {number} inputs.gPerm_kNm2        carga permanente (kN/m²)
 * @param {number} inputs.qSobre_kNm2       sobrecarga de utilização (kN/m²)
 * @param {number} [inputs.v0_ms]           velocidade básica do vento (m/s)
 * @param {object} [inputs.meta]            { projeto, tipologia }
 * @returns memória de cálculo estruturada
 */
export function auditarPreDimensionamento(inputs) {
  const {
    perfil, material = { fy_mpa: 250, e_mpa: 200000 },
    peDireitoM = 2.8, espacMontanteM = 0.4, larguraTributariaM = 2.5,
    gPerm_kNm2 = 1.5, qSobre_kNm2 = 2.0, v0_ms = 40, s1 = 1, s2 = 1, s3 = 1,
    meta = {},
  } = inputs;

  const entradas = {
    projeto: meta.projeto || "—",
    tipologia: meta.tipologia || "—",
    perfil: perfil?.nome || "—",
    area_mm2: perfil?.area_mm2 ?? null,
    inercia_x_mm4: perfil?.inercia_x_mm4 ?? null,
    inercia_y_mm4: perfil?.inercia_y_mm4 ?? null,
    fy_mpa: material.fy_mpa, e_mpa: material.e_mpa,
    peDireitoM, espacMontanteM, larguraTributariaM,
    gPerm_kNm2, qSobre_kNm2, v0_ms, s1, s2, s3,
  };

  if (!perfil || !perfil.area_mm2) {
    return {
      versao: ENGINE_VERSION, estagio: ENGINE_STAGE, geradoEm: new Date().toISOString(),
      entradas, memoria: [], resultado: { status: "indefinido" },
      motivo: MOTIVO_STATUS.indefinido, avisos: ["Perfil de montante sem propriedades de seção."],
    };
  }

  // ── cadeia de cálculo (idêntica ao caminho de produção do hook) ──────────
  const vento = pressaoVento({ v0: v0_ms, s1, s2, s3 });
  const gLine = gPerm_kNm2 * larguraTributariaM;   // kN/m
  const qLine = qSobre_kNm2 * larguraTributariaM;  // kN/m
  const comb = combinarCargas({ g: gLine, q: qLine, w: 0 }); // vento NÃO aplicado ao eixo (ver aviso)
  const pd = preDimensionar({
    paredes: [{ nome: "montante representativo", comprimento_m: espacMontanteM }],
    perfil, material, peDireitoM, espacMontanteM,
    qParedeUlt_kN_m: comb.elu.gravitacional,
  });
  const c = pd.calc;

  const step = (o) => ({ simplificado: false, ...o });
  const memoria = [
    step({
      id: "vento_vk", grupo: "Cargas", etapa: "Velocidade característica do vento",
      formula: "Vk = V0 · S1 · S2 · S3",
      substituicao: `${v0_ms} · ${s1} · ${s2} · ${s3}`,
      valor: vento.vk, unidade: "m/s", norma: "NBR 6123",
    }),
    step({
      id: "vento_q", grupo: "Cargas", etapa: "Pressão dinâmica do vento",
      formula: "q = 0,613 · Vk²",
      substituicao: `0,613 · ${vento.vk}²`,
      valor: vento.q_kN_m2, unidade: "kN/m²", norma: "NBR 6123",
      simplificado: true,
      nota: "S2/S3 default = 1,0; não inclui Cpe/Cpi, rugosidade nem topografia. Pressão informativa: NÃO é aplicada ao montante no modelo axial atual (ver avisos).",
    }),
    step({
      id: "g_line", grupo: "Cargas", etapa: "Carga permanente linear na parede",
      formula: "g = G · b_trib",
      substituicao: `${r(gPerm_kNm2)} · ${r(larguraTributariaM)}`,
      valor: r(gLine, 3), unidade: "kN/m", norma: "NBR 6120",
    }),
    step({
      id: "q_line", grupo: "Cargas", etapa: "Sobrecarga linear na parede",
      formula: "q = Q · b_trib",
      substituicao: `${r(qSobre_kNm2)} · ${r(larguraTributariaM)}`,
      valor: r(qLine, 3), unidade: "kN/m", norma: "NBR 6120",
    }),
    step({
      id: "comb_elu", grupo: "Combinações", etapa: "Combinação última (ELU) — gravitacional",
      formula: "F_d = 1,4·g + 1,4·q",
      substituicao: `1,4·${r(gLine, 3)} + 1,4·${r(qLine, 3)}`,
      valor: comb.elu.gravitacional, unidade: "kN/m", norma: "NBR 8681",
      simplificado: true,
      nota: "Combinação gravitacional simplificada (γg = γq = 1,4). Não inclui a combinação com vento como ação principal.",
    }),
    step({
      id: "comb_els", grupo: "Combinações", etapa: "Combinação de serviço (ELS) — característica",
      formula: "F_serv = g + q",
      substituicao: `${r(gLine, 3)} + ${r(qLine, 3)}`,
      valor: comb.els.caracteristica, unidade: "kN/m", norma: "NBR 8681",
    }),
    step({
      id: "n_sd", grupo: "Esforços", etapa: "Esforço axial de cálculo por montante",
      formula: "N_Sd = F_d · s",
      substituicao: `${comb.elu.gravitacional} kN/m · ${r(espacMontanteM)} m`,
      valor: r(c.nSdPorMontante / 1000, 2), unidade: "kN", norma: "NBR 14762",
      simplificado: true,
      nota: "Montante tratado como área de influência (espaçamento). Carga axial pura, sem excentricidade nem momento de vento.",
    }),
    step({
      id: "raio_giracao", grupo: "Estabilidade", etapa: "Raio de giração (eixo crítico)",
      formula: "i = √(I_min / A)",
      substituicao: `√(${r(c.Imin, 0)} / ${r(c.A, 0)})`,
      valor: r(c.i, 2), unidade: "mm", norma: "NBR 14762",
      nota: `Eixo crítico: ${c.eixoCritico} (menor inércia).`,
    }),
    step({
      id: "esbeltez", grupo: "Estabilidade", etapa: "Índice de esbeltez",
      formula: "λ = K · L / i   (limite 200)",
      substituicao: `${c.K} · ${r(c.L, 0)} / ${r(c.i, 2)}`,
      valor: r(c.lambda, 0), unidade: "—", norma: "NBR 14762",
      simplificado: true,
      nota: "Comprimento de flambagem = pé-direito integral (K=1). NÃO considera travamento pelas placas/OSB — resultado conservador.",
    }),
    step({
      id: "n_squash", grupo: "Resistência", etapa: "Resistência ao escoamento (esmagamento)",
      formula: "N_squash = A · fy",
      substituicao: `${r(c.A, 0)} · ${r(c.fy, 0)}`,
      valor: r(c.nSquash / 1000, 2), unidade: "kN", norma: "NBR 14762",
    }),
    step({
      id: "n_euler", grupo: "Resistência", etapa: "Carga crítica de flambagem (Euler)",
      formula: "N_cr = π²·E·I_min / (K·L)²",
      substituicao: `π²·${r(c.E, 0)}·${r(c.Imin, 0)} / (${c.K}·${r(c.L, 0)})²`,
      valor: r(c.nEuler / 1000, 2), unidade: "kN", norma: "NBR 14762",
      simplificado: true,
      nota: "Flambagem global elástica de Euler. NÃO cobre flambagem local nem distorcional (largura efetiva / MRD da NBR 14762).",
    }),
    step({
      id: "n_rd", grupo: "Resistência", etapa: "Resistência axial de cálculo",
      formula: "N_Rd = min(N_squash, N_cr) / γ",
      substituicao: `min(${r(c.nSquash / 1000, 2)}, ${r(c.nEuler / 1000, 2)}) / ${c.gamma}`,
      valor: r(c.nRd / 1000, 2), unidade: "kN", norma: "NBR 14762",
      nota: `Modo governante: ${c.modoGovernante}. γ = ${c.gamma} (preliminar).`,
    }),
    step({
      id: "utilizacao", grupo: "Verificação", etapa: "Índice de utilização",
      formula: "η = N_Sd / N_Rd",
      substituicao: `${r(c.nSdPorMontante / 1000, 2)} / ${r(c.nRd / 1000, 2)}`,
      valor: r(c.ratio, 4), unidade: "—", norma: "NBR 14762",
    }),
  ];

  const status = statusDe(c.ratio);
  const resultado = {
    nSd_kN: r(c.nSdPorMontante / 1000, 2),
    nRd_kN: r(c.nRd / 1000, 2),
    utilizacao: r(c.ratio, 4),
    esbeltez: r(c.lambda, 0),
    esbeltezOk: c.lambda <= 200,
    modoGovernante: c.modoGovernante,
    status,
  };

  const avisos = [
    "Modelo de anteprojeto (v" + ENGINE_VERSION + "): compressão axial pura do montante. NÃO substitui a NBR 14762 completa.",
    "Vento calculado apenas de forma informativa — a flexão do montante sob vento (flexo-compressão) não é verificada neste modelo.",
    "Flambagem local e distorcional (largura efetiva) não são consideradas — apenas escoamento e flambagem global de Euler.",
    "Comprimento de flambagem = pé-direito integral; contraventamento pelas placas não é considerado (conservador).",
  ];
  if (!resultado.esbeltezOk) avisos.push(`Esbeltez λ = ${resultado.esbeltez} excede o limite 200 (NBR 14762).`);

  return {
    versao: ENGINE_VERSION, estagio: ENGINE_STAGE, geradoEm: new Date().toISOString(),
    entradas, memoria, resultado, motivo: MOTIVO_STATUS[status], avisos,
  };
}
