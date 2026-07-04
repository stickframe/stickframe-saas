import { describe, it, expect } from "vitest";
import { preDimensionar } from "../preDimensionamento";

/**
 * Suíte de regressão do motor de pré-dimensionamento (StickFEM™ engine).
 *
 * Trava valores conhecidos e verificados à mão + invariantes físicos. Qualquer
 * alteração no motor que mude esses resultados quebra o CI e exige revisão
 * consciente (e bump de ENGINE_VERSION). Não substitui validação de engenheiro.
 *
 * Perfis: propriedades reais da base perfil_estrutural (Supabase).
 */
const UE90 = { nome: "Montante Ue 90×40×12×1,25", area_mm2: 204, inercia_x_mm4: 254000, inercia_y_mm4: 52000, peso_kg_m: 1.60 };
const UE140 = { nome: "Montante Ue 140×40×12×1,25", area_mm2: 266, inercia_x_mm4: 770000, inercia_y_mm4: 57000, peso_kg_m: 2.09 };
const MATERIAL = { fy_mpa: 250, e_mpa: 200000 };

// Combinação ELU gravitacional (1,4G + 1,4Q) a partir de cargas de superfície.
const fdELU = ({ g = 1.5, q = 2.0, bTrib = 2.5 }) => 1.4 * (g * bTrib) + 1.4 * (q * bTrib);

const rodar = (over = {}) => {
  const { perfil = UE90, peDireitoM = 2.8, espacMontanteM = 0.4, g = 1.5, q = 2.0, bTrib = 2.5, comprimento_m = 4.0 } = over;
  return preDimensionar({
    paredes: [{ nome: "P1", comprimento_m }],
    perfil, material: MATERIAL, peDireitoM, espacMontanteM,
    qParedeUlt_kN_m: fdELU({ g, q, bTrib }),
  });
};

describe("preDimensionar — casos conhecidos", () => {
  it("Caso 001 — Ue90, L=2,80 m, s=400 mm, Q=2,0 → utilização ≈ 0,41", () => {
    const { calc, resumo } = rodar({ q: 2.0 });
    expect(calc.ratio).toBeCloseTo(0.4117, 3);
    expect(resumo.ratioMax).toBe(0.41);
    expect(resumo.statusGlobal).toBe("aprovado");
    expect(resumo.modoGovernante).toBe("flambagem (Euler)");
  });

  it("Caso 002 — mesmo perfil, Q=13,3 → utilização ≈ 1,74 (revisar)", () => {
    const { calc, resumo } = rodar({ q: 13.3 });
    expect(calc.ratio).toBeCloseTo(1.741, 2);
    expect(resumo.statusGlobal).toBe("revisar");
  });

  it("esbeltez do Ue90 a 2,80 m ≈ 175 e dentro do limite 200", () => {
    const { resumo } = rodar({});
    expect(resumo.esbeltez).toBe(175);
    expect(resumo.esbeltezOk).toBe(true);
  });

  it("perfil sem propriedades retorna status indefinido", () => {
    const pd = preDimensionar({ paredes: [], perfil: { nome: "x" }, material: MATERIAL });
    expect(pd.resumo.statusGlobal).toBe("indefinido");
    expect(pd.calc).toBeNull();
  });
});

describe("preDimensionar — invariantes físicos", () => {
  it("Invariante 1 — aumentar a sobrecarga Q nunca reduz a utilização", () => {
    let anterior = -Infinity;
    for (const q of [0, 2, 5, 8, 13.3]) {
      const atual = rodar({ q }).calc.ratio;
      expect(atual).toBeGreaterThanOrEqual(anterior - 1e-9);
      anterior = atual;
    }
  });

  it("Invariante 2 — reduzir o espaçamento dos montantes não aumenta a utilização", () => {
    const largo = rodar({ espacMontanteM: 0.6 }).calc.ratio;
    const estreito = rodar({ espacMontanteM: 0.3 }).calc.ratio;
    expect(estreito).toBeLessThanOrEqual(largo + 1e-9);
  });

  it("Invariante 3 — perfil de maior seção resistente reduz (ou mantém) a utilização", () => {
    const pequeno = rodar({ perfil: UE90 }).calc.ratio;
    const grande = rodar({ perfil: UE140 }).calc.ratio;
    expect(grande).toBeLessThanOrEqual(pequeno + 1e-9);
  });

  it("Invariante 4 — aumentar o comprimento livre aumenta (ou mantém) a esbeltez", () => {
    let anterior = -Infinity;
    for (const peDireitoM of [2.4, 2.8, 3.2, 4.0]) {
      const atual = rodar({ peDireitoM }).calc.lambda;
      expect(atual).toBeGreaterThanOrEqual(anterior - 1e-9);
      anterior = atual;
    }
  });

  it("Invariante 5 — aumentar o comprimento livre reduz N_cr e não reduz a utilização", () => {
    const curto = rodar({ peDireitoM: 2.4 }).calc;
    const longo = rodar({ peDireitoM: 4.0 }).calc;
    expect(longo.nEuler).toBeLessThan(curto.nEuler);
    expect(longo.ratio).toBeGreaterThanOrEqual(curto.ratio - 1e-9);
  });
});
