import { describe, it, expect } from "vitest";
import { criarSnapshot, diffElementos, diffSnapshots } from "../revisao/historico";

const el = (nome, over = {}) => ({ nome, tipo: "parede", perfil_id: "m1", comprimento_m: 4, validado: false, incluir_calculo: true, layer_origem: "PAREDES", confiancaScore: 75, ...over });

describe("criarSnapshot", () => {
  it("captura elementos enxutos + metadados", () => {
    const snap = criarSnapshot({ elementos: [el("P1"), el("P2")], stickScore: 84, conflitos: [{}, {}], pesoTotal_kg: 120, calcHash: "abcd1234", engineVersion: "0.1.0" });
    expect(snap.elementos).toHaveLength(2);
    expect(snap.elementos[0]).toHaveProperty("perfil_id");
    expect(snap.stickScore).toBe(84);
    expect(snap.conflitosTotal).toBe(2);
    expect(snap.pesoTotal_kg).toBe(120);
    expect(snap.engineVersion).toBe("0.1.0");
  });
});

describe("diffElementos", () => {
  it("detecta adicionados, removidos e alterados por nome", () => {
    const ant = [el("P1"), el("P2"), el("P3")];
    const atu = [el("P1"), el("P2", { perfil_id: "m2", comprimento_m: 5 }), el("P4")];
    const d = diffElementos(ant, atu);
    expect(d.adicionados).toEqual(["P4"]);
    expect(d.removidos).toEqual(["P3"]);
    expect(d.alterados).toHaveLength(1);
    expect(d.alterados[0].nome).toBe("P2");
    const campos = d.alterados[0].mudancas.map((m) => m.campo);
    expect(campos).toEqual(expect.arrayContaining(["perfil_id", "comprimento_m"]));
    const perfil = d.alterados[0].mudancas.find((m) => m.campo === "perfil_id");
    expect(perfil).toEqual({ campo: "perfil_id", de: "m1", para: "m2" });
  });

  it("sem mudanças → alterados vazio", () => {
    const els = [el("P1"), el("P2")];
    expect(diffElementos(els, els).alterados).toHaveLength(0);
  });
});

describe("diffSnapshots", () => {
  it("calcula deltas de score, conflitos e peso", () => {
    const a = criarSnapshot({ elementos: [el("P1")], stickScore: 74, conflitos: [{}, {}, {}], pesoTotal_kg: 100 });
    const b = criarSnapshot({ elementos: [el("P1"), el("P2")], stickScore: 83, conflitos: [{}], pesoTotal_kg: 130 });
    const d = diffSnapshots(a, b);
    expect(d.stickScore).toMatchObject({ antes: 74, depois: 83, delta: 9 });
    expect(d.conflitos.delta).toBe(-2);
    expect(d.peso_kg.delta).toBe(30);
    expect(d.resumo.adicionados).toBe(1);
    expect(d.primeiraRevisao).toBe(false);
  });

  it("anterior null → primeiraRevisao true e deltas null", () => {
    const b = criarSnapshot({ elementos: [el("P1")], stickScore: 80 });
    const d = diffSnapshots(null, b);
    expect(d.primeiraRevisao).toBe(true);
    expect(d.stickScore.delta).toBeNull();
    expect(d.resumo.adicionados).toBe(1);
  });
});
