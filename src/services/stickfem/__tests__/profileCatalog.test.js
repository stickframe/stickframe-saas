import { describe, it, expect } from "vitest";
import { validarPerfil, perfilMudou, planejarSync } from "../catalogo/profileCatalog";

describe("validarPerfil", () => {
  it("aceita perfil válido e converte números (vírgula → ponto)", () => {
    const v = validarPerfil({ nome: "Ue 90×40×1,25", tipo: "montante", area_mm2: "204", inercia_x_mm4: "254000", peso_kg_m: "1,60" });
    expect(v.ok).toBe(true);
    expect(v.perfil.area_mm2).toBe(204);
    expect(v.perfil.peso_kg_m).toBe(1.6);
    expect(v.perfil._chave).toBe("ue 90×40×1,25");
  });

  it("rejeita perfil sem nome", () => {
    expect(validarPerfil({ area_mm2: 100 }).ok).toBe(false);
  });

  it("rejeita número inválido e área não-positiva", () => {
    expect(validarPerfil({ nome: "x", area_mm2: "abc" }).ok).toBe(false);
    expect(validarPerfil({ nome: "y", area_mm2: 0 }).ok).toBe(false);
  });

  it("usa código como chave quando presente", () => {
    expect(validarPerfil({ nome: "W200x46", codigo: "AISC-W200x46" }).perfil._chave).toBe("aisc-w200x46");
  });
});

describe("perfilMudou", () => {
  it("detecta mudança numérica e de texto", () => {
    expect(perfilMudou({ nome: "a", area_mm2: 100 }, { nome: "a", area_mm2: 120 })).toBe(true);
    expect(perfilMudou({ nome: "a", norma: "AISC" }, { nome: "a", norma: "EN" })).toBe(true);
  });
  it("igual não muda", () => {
    expect(perfilMudou({ nome: "a", area_mm2: 100 }, { nome: "a", area_mm2: 100 })).toBe(false);
  });
});

describe("planejarSync (nunca remove)", () => {
  const existentes = [
    { id: "1", nome: "Ue 90", codigo: null, area_mm2: 204 },
    { id: "2", nome: "Ue 140", codigo: null, area_mm2: 266 },
  ];

  it("classifica novos, alterados e inválidos sem tocar nos ausentes", () => {
    const brutos = [
      { nome: "Ue 90", area_mm2: 204 },        // igual → nada
      { nome: "Ue 140", area_mm2: 300 },        // alterado
      { nome: "Ue 200", area_mm2: 350 },        // novo
      { area_mm2: 999 },                        // inválido (sem nome)
    ];
    const plano = planejarSync(brutos, existentes);
    expect(plano.novos.map((p) => p.nome)).toEqual(["Ue 200"]);
    expect(plano.alterados.map((a) => a.id)).toEqual(["2"]);
    expect(plano.invalidos).toHaveLength(1);
    expect(plano.total).toBe(4);
  });

  it("catálogo vazio não gera novos nem alterados (nunca apaga existentes)", () => {
    const plano = planejarSync([], existentes);
    expect(plano.novos).toHaveLength(0);
    expect(plano.alterados).toHaveLength(0);
  });
});
