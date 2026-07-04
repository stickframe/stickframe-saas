import { describe, it, expect } from "vitest";
import { montarMemorial, hashCalculo } from "../memorial";
import { ENGINE_VERSION } from "../engine/version";

const UE90 = { nome: "Montante Ue 90×40×12×1,25", area_mm2: 204, inercia_x_mm4: 254000, inercia_y_mm4: 52000, peso_kg_m: 1.6 };
const design = {
  perfil: UE90, material: { fy_mpa: 250, e_mpa: 200000 },
  peDireitoM: 2.8, espacMontanteM: 0.4, larguraTributariaM: 2.5,
  gPerm_kNm2: 1.5, qSobre_kNm2: 2.0, v0_ms: 40, meta: { projeto: "Casa X", tipologia: "Residencial Térreo" },
};

describe("Memorial de Engenharia", () => {
  it("monta memorial com auditoria, hash e versão do engine", () => {
    const m = montarMemorial({ design, projeto: { nome: "Casa X" } });
    expect(m.engineVersion).toBe(ENGINE_VERSION);
    expect(m.auditoria.resultado.utilizacao).toBeCloseTo(0.4117, 3);
    expect(m.hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("hash é determinístico para as mesmas entradas", () => {
    const a = montarMemorial({ design, projeto: { nome: "Casa X" } });
    const b = montarMemorial({ design, projeto: { nome: "Casa X" } });
    expect(a.hash).toBe(b.hash);
  });

  it("hash muda quando uma entrada muda (reprodutibilidade rastreável)", () => {
    const base = hashCalculo(montarMemorial({ design }).auditoria);
    const outro = hashCalculo(montarMemorial({ design: { ...design, qSobre_kNm2: 5 } }).auditoria);
    expect(outro).not.toBe(base);
  });

  it("inclui aprovações quando fornecidas", () => {
    const m = montarMemorial({ design, aprovacoes: [{ status: "aprovado", engenheiro_nome: "Eng. Ana" }] });
    expect(m.aprovacoes).toHaveLength(1);
  });

  it("registra a proveniência do perfil (catálogo utilizado)", () => {
    const perfil = { ...UE90, norma: "NBR 14762:2010", fonte: "calcsteel", codigo: "BR_UE90" };
    const m = montarMemorial({ design: { ...design, perfil } });
    expect(m.catalogo.nome).toBe(perfil.nome);
    expect(m.catalogo.norma).toBe("NBR 14762:2010");
    expect(m.catalogo.fonte).toBe("calcsteel");
    expect(m.catalogo.area_mm2).toBe(204);
  });
});
