import { describe, it, expect } from "vitest";
import { detectarConflitos } from "../conflicts";

const parede = (nome, x1, y1, x2, y2, extra = {}) => ({ tipo: "parede", nome, geometria: { x1, y1, x2, y2 }, comprimento_m: Math.hypot(x2 - x1, y2 - y1), ...extra });
const tipos = (data) => detectarConflitos(data).map((c) => c.tipo);

describe("detectarConflitos", () => {
  it("retorna vazio para modelo sem elementos", () => {
    expect(detectarConflitos({ elementos: [] })).toEqual([]);
  });

  it("parede_duplicada: mesma geometria (inclusive invertida)", () => {
    const els = [parede("P1", 0, 0, 4, 0), parede("P2", 4, 0, 0, 0)];
    expect(tipos({ elementos: els })).toContain("parede_duplicada");
  });

  it("linha_sobreposta: colineares com sobreposição parcial", () => {
    const els = [parede("P1", 0, 0, 4, 0), parede("P2", 2, 0, 6, 0)];
    expect(tipos({ elementos: els })).toContain("linha_sobreposta");
  });

  it("elemento_isolado: parede sem conexão nas duas pontas", () => {
    // quadrado conectado + uma parede solta longe
    const quad = [parede("P1", 0, 0, 4, 0), parede("P2", 4, 0, 4, 4), parede("P3", 4, 4, 0, 4), parede("P4", 0, 4, 0, 0)];
    const solta = parede("P9", 20, 20, 24, 20);
    const t = tipos({ elementos: [...quad, solta] });
    expect(t).toContain("elemento_isolado");
  });

  it("viga_sem_apoio: viga cujas pontas não tocam paredes", () => {
    const els = [parede("P1", 0, 0, 4, 0), { tipo: "viga", nome: "V1", geometria: { x1: 10, y1: 10, x2: 14, y2: 10 } }];
    expect(tipos({ elementos: els })).toContain("viga_sem_apoio");
  });

  it("perfil_incompativel: parede com perfil de guia", () => {
    const perfis = [{ id: "g1", tipo: "guia", nome: "Guia U" }, { id: "m1", tipo: "montante", nome: "Ue 90" }];
    const els = [parede("P1", 0, 0, 4, 0, { perfil_id: "g1" })];
    expect(tipos({ elementos: els, perfis })).toContain("perfil_incompativel");
  });

  it("abertura_fora_parede: bloco de abertura longe de qualquer parede", () => {
    const els = [parede("P1", 0, 0, 4, 0), { tipo: "abertura", nome: "A1", geometria: { x1: 20, y1: 20, x2: 20, y2: 20 } }];
    expect(tipos({ elementos: els })).toContain("abertura_fora_parede");
  });

  it("layer_vazio: layer declarado no DXF sem entidades", () => {
    const geometria = { layers: [{ nome: "PAREDES" }, { nome: "COTAS_VAZIO" }], lines: [{ layer: "PAREDES" }], polylines: [], blocks: [], texts: [] };
    const els = [parede("P1", 0, 0, 4, 0, { layer_origem: "PAREDES" })];
    expect(tipos({ elementos: els, geometria })).toContain("layer_vazio");
  });

  it("ordena por severidade (alta primeiro) e atribui id", () => {
    const perfis = [{ id: "g1", tipo: "guia", nome: "Guia" }];
    const els = [parede("P1", 0, 0, 4, 0, { perfil_id: "g1" }), parede("P2", 2, 0, 6, 0)];
    const conf = detectarConflitos({ elementos: els, perfis });
    expect(conf[0].severidade).toBe("alta");
    expect(conf.every((c) => c.id && c.regra && c.recomendacao)).toBe(true);
  });
});
