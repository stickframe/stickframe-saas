/**
 * StickFEM™ Fase 5 — Cargas (modelo simplificado, preliminar).
 *
 * ATENÇÃO: simplificações de anteprojeto. NÃO substituem a análise de vento
 * completa da NBR 6123 (topografia, rugosidade, dimensões, Cpe/Cpi) nem a
 * combinação completa da NBR 8681. Servem para pré-dimensionamento assistido;
 * a responsabilidade técnica é do engenheiro habilitado.
 */

// Velocidade básica do vento V0 (m/s) — referência aproximada por região (NBR 6123, isopletas).
export const REGIOES_VENTO = {
  "Sul":            45,
  "Sudeste":        40,
  "Centro-Oeste":   38,
  "Nordeste litoral": 35,
  "Nordeste interior": 30,
  "Norte":          30,
};

/**
 * Pressão dinâmica do vento. Vk = V0·S1·S2·S3; q = 0,613·Vk² (N/m²).
 * @returns { vk, q_kN_m2 }
 */
export function pressaoVento({ v0 = 40, s1 = 1.0, s2 = 1.0, s3 = 1.0 }) {
  const vk = v0 * s1 * s2 * s3;
  const q_Nm2 = 0.613 * vk * vk;
  return { vk: +vk.toFixed(1), q_kN_m2: +(q_Nm2 / 1000).toFixed(3) };
}

/**
 * Combinações de ações (simplificadas, NBR 8681).
 * G = permanente, Q = sobrecarga de utilização, W = vento (kN/m² ou kN/m — coerente com o uso).
 * @returns { elu:{gravitacional, vento}, els:{caracteristica} }
 */
export function combinarCargas({ g = 0, q = 0, w = 0 }) {
  return {
    elu: {
      // gravitacional: 1,4·G + 1,4·Q
      gravitacional: +(1.4 * g + 1.4 * q).toFixed(3),
      // vento como ação principal: 1,0·G + 1,4·W + 1,4·0,7·Q
      vento: +(1.0 * g + 1.4 * w + 1.4 * 0.7 * q).toFixed(3),
    },
    els: {
      // combinação característica (para flechas)
      caracteristica: +(g + q).toFixed(3),
    },
    coeficientes: { gamma_g: 1.4, gamma_q: 1.4, gamma_w: 1.4, psi0_q: 0.7 },
  };
}
