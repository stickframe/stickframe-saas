import { describe, it, expect } from "vitest";
import { pressaoVento, combinarCargas, REGIOES_VENTO } from "../cargas";

describe("pressaoVento (NBR 6123, simplificado)", () => {
  it("Vk = V0·S1·S2·S3 e q = 0,613·Vk²", () => {
    const { vk, q_kN_m2 } = pressaoVento({ v0: 40 });
    expect(vk).toBe(40);
    // 0,613 · 40² = 980,8 N/m² = 0,9808 kN/m²
    expect(q_kN_m2).toBeCloseTo(0.981, 3);
  });

  it("Invariante — aumentar V0 nunca reduz a pressão do vento", () => {
    let anterior = -Infinity;
    for (const v0 of Object.values(REGIOES_VENTO).sort((a, b) => a - b)) {
      const atual = pressaoVento({ v0 }).q_kN_m2;
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });
});

describe("combinarCargas (NBR 8681, simplificado)", () => {
  it("ELU gravitacional = 1,4G + 1,4Q", () => {
    const c = combinarCargas({ g: 3.75, q: 5.0 });
    expect(c.elu.gravitacional).toBeCloseTo(12.25, 3);
  });

  it("ELS característica = G + Q", () => {
    const c = combinarCargas({ g: 3.75, q: 5.0 });
    expect(c.els.caracteristica).toBeCloseTo(8.75, 3);
  });

  it("Invariante — aumentar o vento W nunca reduz a combinação com vento", () => {
    let anterior = -Infinity;
    for (const w of [0, 0.5, 1.0, 2.0]) {
      const atual = combinarCargas({ g: 3, q: 4, w }).elu.vento;
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });
});
