import { describe, it, expect } from "vitest";
import { SF_COMP, SF_PRECOS, SF_LABELS, SF_UNIDADES, SF_CATS, SF_COMP_COR, calcPainel, calcAmbiente, calcProjeto, gerarId, fmtR, fmtN } from "../sf-orcamento";

describe("SF_COMP (composições)", () => {
  it("deve ser um array com composições", () => {
    expect(Array.isArray(SF_COMP)).toBe(true);
    expect(SF_COMP.length).toBeGreaterThan(0);
  });

  it("cada composição deve ter id, nome, tipo, esp", () => {
    for (const comp of SF_COMP) {
      expect(comp).toHaveProperty("id");
      expect(comp).toHaveProperty("nome");
      expect(comp).toHaveProperty("tipo");
      expect(comp).toHaveProperty("esp");
    }
  });

  it("deve conter paredes e forros", () => {
    const tipos = SF_COMP.map((c) => c.tipo);
    expect(tipos).toContain("parede");
    expect(tipos).toContain("forro");
  });
});

describe("SF_PRECOS", () => {
  it("deve conter precos como objeto com chaves", () => {
    expect(typeof SF_PRECOS).toBe("object");
    expect(Object.keys(SF_PRECOS).length).toBeGreaterThan(0);
  });

  it("cada preco deve ser número positivo", () => {
    for (const v of Object.values(SF_PRECOS)) {
      expect(typeof v).toBe("number");
      expect(v).toBeGreaterThan(0);
    }
  });
});

describe("SF_LABELS", () => {
  it("deve conter labels como objeto", () => {
    expect(typeof SF_LABELS).toBe("object");
    expect(Object.keys(SF_LABELS).length).toBeGreaterThan(0);
  });
});

describe("SF_UNIDADES", () => {
  it("deve conter unidades como objeto", () => {
    expect(typeof SF_UNIDADES).toBe("object");
    expect(Object.keys(SF_UNIDADES).length).toBeGreaterThan(0);
  });
});

describe("SF_CATS", () => {
  it("deve conter categorias como objeto", () => {
    expect(typeof SF_CATS).toBe("object");
    expect(Object.keys(SF_CATS).length).toBeGreaterThan(0);
  });

  it("cada categoria deve conter array de chaves", () => {
    for (const chaves of Object.values(SF_CATS)) {
      expect(Array.isArray(chaves)).toBe(true);
      expect(chaves.length).toBeGreaterThan(0);
    }
  });
});

describe("SF_COMP_COR", () => {
  it("deve conter cores hex", () => {
    expect(typeof SF_COMP_COR).toBe("object");
    for (const cor of Object.values(SF_COMP_COR)) {
      expect(cor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("calcPainel", () => {
  it("deve calcular painel com largura e altura", () => {
    const painel = { largura: 1.22, altura: 2.44 };
    const comp = SF_COMP[0];
    const resultado = calcPainel(painel, comp);
    expect(resultado).toHaveProperty("area");
    expect(resultado).toHaveProperty("mats");
    expect(resultado.area).toBeCloseTo(1.22 * 2.44, 1);
  });

  it("largura/altura zero deve retornar area zero", () => {
    expect(calcPainel({ largura: 0, altura: 0 }, SF_COMP[0]).area).toBe(0);
  });
});

describe("calcAmbiente", () => {
  it("deve calcular ambiente com paineis", () => {
    const amb = { id: "sala", nome: "Sala", paineis: [{ composicaoId: SF_COMP[0].id, largura: 1.22, altura: 2.44 }] };
    const compMap = Object.fromEntries(SF_COMP.map((c) => [c.id, c]));
    const resultado = calcAmbiente(amb, compMap);
    expect(resultado).toHaveProperty("area");
    expect(resultado).toHaveProperty("mats");
    expect(resultado.area).toBeGreaterThan(0);
  });

  it("ambiente sem paineis deve retornar area zero", () => {
    expect(calcAmbiente({ paineis: [] }, {}).area).toBe(0);
  });
});

describe("calcProjeto", () => {
  it("deve calcular projeto completo", () => {
    const proj = {
      ambientes: [
        { id: "sala", nome: "Sala", paineis: [{ composicaoId: SF_COMP[0].id, largura: 1.22, altura: 2.44 }] },
      ],
    };
    const resultado = calcProjeto(proj, SF_COMP, SF_PRECOS, 0.3);
    expect(resultado).toHaveProperty("totalArea");
    expect(resultado).toHaveProperty("totalMats");
    expect(resultado).toHaveProperty("porAmbiente");
    expect(resultado).toHaveProperty("totCusto");
    expect(resultado).toHaveProperty("totVenda");
    expect(resultado.totalArea).toBeGreaterThan(0);
    expect(resultado.totVenda).toBeGreaterThan(resultado.totCusto);
  });
});

describe("gerarId", () => {
  it("deve gerar strings únicas", () => {
    const id1 = gerarId();
    const id2 = gerarId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(0);
  });
});

describe("fmtR", () => {
  it("deve formatar como moeda BR", () => {
    expect(fmtR(1234.5)).toContain("R$");
    expect(fmtR(0)).toContain("0,00");
    expect(fmtR(null)).toContain("0,00");
  });
});

describe("fmtN", () => {
  it("deve formatar número no padrão BR", () => {
    expect(fmtN(1234.5)).toContain(",");
    expect(fmtN(0)).toBeDefined();
    expect(fmtN(null)).toBeDefined();
  });
});
