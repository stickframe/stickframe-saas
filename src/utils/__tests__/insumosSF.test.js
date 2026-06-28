import { describe, it, expect } from "vitest";
import { CUB_ESTADOS, PADROES_SF, SISTEMAS_SF, CATALOGO_PRODUTOS } from "../insumosSF";

describe("CUB_ESTADOS", () => {
  it("deve conter todos os 27 estados + DF", () => {
    const siglas = Object.keys(CUB_ESTADOS);
    expect(siglas).toHaveLength(27);
    expect(siglas).toContain("SP");
    expect(siglas).toContain("RJ");
    expect(siglas).toContain("DF");
    expect(siglas).toContain("AC");
  });

  it("cada estado deve ter nome e cub", () => {
    for (const info of Object.values(CUB_ESTADOS)) {
      expect(info).toHaveProperty("nome");
      expect(info).toHaveProperty("cub");
      expect(typeof info.cub).toBe("number");
      expect(info.cub).toBeGreaterThan(0);
    }
  });

  it("valores de CUB devem estar entre 1500 e 3000", () => {
    for (const info of Object.values(CUB_ESTADOS)) {
      expect(info.cub).toBeGreaterThanOrEqual(1500);
      expect(info.cub).toBeLessThanOrEqual(3000);
    }
  });
});

describe("PADROES_SF", () => {
  it("deve conter Econômico, Padrão, Alto Padrão e Luxo", () => {
    expect(Object.keys(PADROES_SF)).toEqual(["Econômico", "Padrão", "Alto Padrão", "Luxo"]);
  });

  it("Padrão deve ter fator 1.0", () => {
    expect(PADROES_SF["Padrão"].fator).toBe(1.0);
  });

  it("Econômico deve ter fator menor que Padrão", () => {
    expect(PADROES_SF["Econômico"].fator).toBeLessThan(PADROES_SF["Padrão"].fator);
  });

  it("cada padrão deve ter desc", () => {
    for (const info of Object.values(PADROES_SF)) {
      expect(info).toHaveProperty("desc");
      expect(info.desc.length).toBeGreaterThan(0);
    }
  });
});

describe("SISTEMAS_SF", () => {
  it("deve ser um array com sistemas", () => {
    expect(Array.isArray(SISTEMAS_SF)).toBe(true);
    expect(SISTEMAS_SF.length).toBeGreaterThan(0);
  });

  it("cada sistema deve ter id e label", () => {
    for (const sistema of SISTEMAS_SF) {
      expect(sistema).toHaveProperty("id");
      expect(sistema).toHaveProperty("label");
    }
  });

  it("deve conter fundacao, estrutura, eletrica, hidraulica", () => {
    const ids = SISTEMAS_SF.map((s) => s.id);
    expect(ids).toContain("fundacao");
    expect(ids).toContain("estrutura");
    expect(ids).toContain("eletrica");
    expect(ids).toContain("hidraulica");
  });

  it("fundacao deve ter mao_obra_cub definido", () => {
    const fundacao = SISTEMAS_SF.find((s) => s.id === "fundacao");
    expect(fundacao).toBeDefined();
    expect(typeof fundacao.mao_obra_cub).toBe("number");
    expect(fundacao.mao_obra_cub).toBeGreaterThan(0);
  });
});

describe("CATALOGO_PRODUTOS", () => {
  it("deve ser um array com produtos", () => {
    expect(Array.isArray(CATALOGO_PRODUTOS)).toBe(true);
    expect(CATALOGO_PRODUTOS.length).toBeGreaterThan(0);
  });

  it("cada produto deve ter id, nome, preco, categoria", () => {
    for (const produto of CATALOGO_PRODUTOS) {
      expect(produto).toHaveProperty("id");
      expect(produto).toHaveProperty("nome");
      expect(produto).toHaveProperty("preco");
      expect(produto).toHaveProperty("categoria");
      expect(typeof produto.preco).toBe("number");
    }
  });

  it("nenhum produto deve ter preco negativo ou zero", () => {
    for (const produto of CATALOGO_PRODUTOS) {
      expect(produto.preco).toBeGreaterThan(0);
    }
  });

  it("deve conter produtos de Drywall", () => {
    const drywall = CATALOGO_PRODUTOS.filter((p) => p.categoria === "Drywall");
    expect(drywall.length).toBeGreaterThan(0);
  });

  it("cada produto deve ter fabricante", () => {
    for (const produto of CATALOGO_PRODUTOS) {
      expect(produto).toHaveProperty("fabricante");
      expect(produto.fabricante.length).toBeGreaterThan(0);
    }
  });

  it("produtos devem ter unidade definida", () => {
    for (const produto of CATALOGO_PRODUTOS) {
      expect(produto).toHaveProperty("un");
    }
  });
});
