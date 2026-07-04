import { describe, it, expect } from "vitest";
import { similaridade, casarElementos, coincidenciaExtremidades } from "../comparison/matcher";
import { compararModelos } from "../comparison/diffEngine";
import { calcularImpacto } from "../comparison/impactCalculator";

const P = (nome, x1, y1, x2, y2, over = {}) => ({
  nome, tipo: "parede", perfil_id: "m1", layer_origem: "PAREDES",
  comprimento_m: +Math.hypot(x2 - x1, y2 - y1).toFixed(2),
  geometria: { x1, y1, x2, y2 }, ...over,
});
const status = (r, nome) => r.itens.find((i) => i.nome === nome)?.status;

describe("matcher — similaridade", () => {
  it("elementos idênticos → score ~1", () => {
    const a = P("P1", 0, 0, 4, 0);
    expect(similaridade(a, { ...a }).score).toBeGreaterThan(0.98);
  });
  it("coincidência de extremidades detecta inversão", () => {
    expect(coincidenciaExtremidades(P("A", 0, 0, 4, 0), P("B", 4, 0, 0, 0))).toBe(1);
  });
  it("elementos distantes e diferentes → score baixo", () => {
    expect(similaridade(P("A", 0, 0, 4, 0), P("B", 50, 50, 51, 50)).score).toBeLessThan(0.4);
  });
});

describe("diffEngine — classificação (casos exigidos)", () => {
  const base = [P("P1", 0, 0, 4, 0), P("P2", 4, 0, 4, 3), P("P3", 4, 3, 0, 3)];

  it("DXFs idênticos → tudo igual", () => {
    const r = compararModelos(base, base.map((e) => ({ ...e })));
    expect(r.resumo).toMatchObject({ igual: 3, novo: 0, removido: 0, modificado: 0, movido: 0 });
  });

  it("apenas elementos novos", () => {
    const r = compararModelos(base, [...base, P("P9", 0, 3, 0, 0)]);
    expect(r.resumo.novo).toBe(1);
    expect(status(r, "P9")).toBe("novo");
  });

  it("apenas removidos", () => {
    const r = compararModelos(base, [base[0], base[1]]);
    expect(r.resumo.removido).toBe(1);
  });

  it("elemento movido (mesma geometria deslocada)", () => {
    const movido = base.map((e) => (e.nome === "P2" ? P("P2", 4.5, 0, 4.5, 3) : { ...e }));
    const r = compararModelos(base, movido);
    expect(status(r, "P2")).toBe("movido");
  });

  it("alteração de perfil → modificado com de→para", () => {
    const perfis = [{ id: "m1", nome: "Ue 90" }, { id: "m2", nome: "Ue 140" }];
    const depois = base.map((e) => (e.nome === "P1" ? { ...e, perfil_id: "m2" } : { ...e }));
    const r = compararModelos(base, depois, { perfis });
    const it1 = r.itens.find((i) => i.nome === "P1");
    expect(it1.status).toBe("modificado");
    const mp = it1.mudancas.find((m) => m.campo === "perfil_id");
    expect(mp).toMatchObject({ rotuloDe: "Ue 90", rotuloPara: "Ue 140" });
  });

  it("alteração de comprimento", () => {
    const depois = base.map((e) => (e.nome === "P1" ? P("P1", 0, 0, 4.5, 0) : { ...e }));
    const r = compararModelos(base, depois);
    const it1 = r.itens.find((i) => i.nome === "P1");
    expect(it1.status).toBe("modificado");
    expect(it1.mudancas.some((m) => m.campo === "comprimento_m")).toBe(true);
  });

  it("alteração de layer", () => {
    const depois = base.map((e) => (e.nome === "P1" ? { ...e, layer_origem: "ESTRUTURA" } : { ...e }));
    const r = compararModelos(base, depois);
    expect(r.itens.find((i) => i.nome === "P1").mudancas.some((m) => m.campo === "layer_origem")).toBe(true);
  });

  it("alteração de abertura (ponto)", () => {
    const a = [{ nome: "A1", tipo: "abertura", geometria: { x1: 2, y1: 0, x2: 2, y2: 0 }, layer_origem: "ABERT" }];
    const b = [{ nome: "A1", tipo: "abertura", geometria: { x1: 2.6, y1: 0, x2: 2.6, y2: 0 }, layer_origem: "ABERT" }];
    const r = compararModelos(a, b);
    expect(["movido", "modificado"]).toContain(r.itens[0].status);
  });
});

describe("impactCalculator — técnico e financeiro", () => {
  const perfis = [
    { id: "m1", tipo: "montante", nome: "Ue 90", peso_kg_m: 1.6, area_mm2: 204, comprimento_mm: 6000 },
    { id: "m2", tipo: "montante", nome: "Ue 140", peso_kg_m: 2.09, area_mm2: 266 },
  ];
  const projeto = { pe_direito_m: 2.8, espac_montante_mm: 400 };

  it("adicionar parede aumenta peso e custo (delta positivo)", () => {
    const antes = [P("P1", 0, 0, 4, 0)];
    const depois = [P("P1", 0, 0, 4, 0), P("P2", 0, 0, 0, 4)];
    const imp = calcularImpacto({ antes, depois, perfis, projeto, precoKg: 12 });
    expect(imp.peso_kg.delta).toBeGreaterThan(0);
    expect(imp.custo.delta).toBeGreaterThan(0);
    expect(imp.custo.antes).toBeCloseTo(imp.peso_kg.antes * 12, 1);
  });

  it("usa indicadores pré-calculados (snapshots) sem recomputar", () => {
    const imp = calcularImpacto({
      antes: [P("P1", 0, 0, 4, 0)], depois: [P("P1", 0, 0, 4, 0)],
      perfis, projeto, preAntes: { stickScore: 74, conflitosTotal: 3 }, preDepois: { stickScore: 83, conflitosTotal: 1 },
    });
    expect(imp.stickScore).toMatchObject({ antes: 74, depois: 83, delta: 9 });
    expect(imp.conflitos.delta).toBe(-2);
  });
});

describe("performance — índice espacial (sem O(n²))", () => {
  it("compara 2.000 elementos rapidamente e classifica corretamente", () => {
    const antes = Array.from({ length: 2000 }, (_, i) => P(`P${i}`, i, 0, i + 0.9, 0));
    const depois = antes.map((e) => ({ ...e })); // idênticos
    depois.push(P("NOVO", 5000, 5000, 5000.9, 5000));
    const t0 = Date.now();
    const r = compararModelos(antes, depois);
    expect(Date.now() - t0).toBeLessThan(3000);
    expect(r.resumo.novo).toBe(1);
    expect(r.resumo.igual).toBe(2000);
  });
});
