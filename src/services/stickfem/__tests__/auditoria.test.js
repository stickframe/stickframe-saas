import { describe, it, expect } from "vitest";
import { auditarPreDimensionamento } from "../auditoria";
import { ENGINE_VERSION } from "../engine/version";

const UE90 = { nome: "Montante Ue 90×40×12×1,25", area_mm2: 204, inercia_x_mm4: 254000, inercia_y_mm4: 52000, peso_kg_m: 1.60 };

const base = {
  perfil: UE90, material: { fy_mpa: 250, e_mpa: 200000 },
  peDireitoM: 2.8, espacMontanteM: 0.4, larguraTributariaM: 2.5,
  gPerm_kNm2: 1.5, qSobre_kNm2: 2.0, v0_ms: 30,
};

describe("auditarPreDimensionamento — memória de cálculo", () => {
  it("carrega a versão do motor e a data de geração", () => {
    const aud = auditarPreDimensionamento(base);
    expect(aud.versao).toBe(ENGINE_VERSION);
    expect(typeof aud.geradoEm).toBe("string");
  });

  it("a memória reproduz o mesmo resultado do motor (utilização ≈ 0,41)", () => {
    const aud = auditarPreDimensionamento(base);
    expect(aud.resultado.utilizacao).toBeCloseTo(0.4117, 3);
    expect(aud.resultado.status).toBe("aprovado");
  });

  it("cada passo tem fórmula, valor, unidade e norma", () => {
    const { memoria } = auditarPreDimensionamento(base);
    expect(memoria.length).toBeGreaterThanOrEqual(12);
    for (const p of memoria) {
      expect(p).toHaveProperty("formula");
      expect(p).toHaveProperty("valor");
      expect(p).toHaveProperty("unidade");
      expect(p.norma).toMatch(/NBR/);
    }
  });

  it("a cadeia cobre cargas → combinações → esforços → resistência → utilização", () => {
    const ids = auditarPreDimensionamento(base).memoria.map((p) => p.id);
    for (const id of ["vento_q", "comb_elu", "n_sd", "esbeltez", "n_euler", "n_rd", "utilizacao"]) {
      expect(ids).toContain(id);
    }
  });

  it("é honesta sobre as simplificações (avisos + passos marcados)", () => {
    const aud = auditarPreDimensionamento(base);
    expect(aud.avisos.some((a) => /não substitui a NBR 14762/i.test(a))).toBe(true);
    expect(aud.avisos.some((a) => /vento/i.test(a))).toBe(true);
    // Pelo menos os passos de Euler e esbeltez são marcados como simplificados.
    const simplificados = aud.memoria.filter((p) => p.simplificado).map((p) => p.id);
    expect(simplificados).toContain("n_euler");
    expect(simplificados).toContain("esbeltez");
  });

  it("perfil sem propriedades → status indefinido e aviso", () => {
    const aud = auditarPreDimensionamento({ ...base, perfil: { nome: "x" } });
    expect(aud.resultado.status).toBe("indefinido");
    expect(aud.memoria).toHaveLength(0);
  });
});
