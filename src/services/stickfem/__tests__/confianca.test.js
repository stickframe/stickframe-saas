import { describe, it, expect } from "vitest";
import { computarConfianca, nivelDeConfianca, PESOS_CONFIANCA } from "../parser/confianca";

describe("computarConfianca (IA Explicável)", () => {
  it("pesos somam 1,00", () => {
    expect(Object.values(PESOS_CONFIANCA).reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 6);
  });

  it("layer reconhecido + comprimento longo → alta (~85)", () => {
    const r = computarConfianca({ layerReconhecido: true, comprimento_m: 4 });
    expect(r.score).toBe(85);
    expect(r.nivel).toBe("alta");
  });

  it("layer não reconhecido + comprimento curto → baixa", () => {
    const r = computarConfianca({ layerReconhecido: false, comprimento_m: 0.4 });
    expect(r.nivel).toBe("baixa");
  });

  it("confirmação do engenheiro aumenta o score", () => {
    const sem = computarConfianca({ layerReconhecido: true, comprimento_m: 4 }).score;
    const com = computarConfianca({ layerReconhecido: true, comprimento_m: 4, confirmadoEngenheiro: true }).score;
    expect(com).toBeGreaterThan(sem);
    expect(com).toBe(100);
  });

  it("expõe fatores com peso, ativação e contribuição", () => {
    const { fatores } = computarConfianca({ layerReconhecido: true, comprimento_m: 4 });
    const layer = fatores.find((f) => f.id === "layer_reconhecido");
    expect(layer.peso).toBe(0.4);
    expect(layer.contribuicao).toBe(40);
    expect(layer.efeito).toBe("aumenta");
    const confirm = fatores.find((f) => f.id === "confirmado_engenheiro");
    expect(confirm.efeito).toBe("reduz"); // não ativado neste caso
  });

  it("nivelDeConfianca respeita os limiares 45/70", () => {
    expect(nivelDeConfianca(70)).toBe("alta");
    expect(nivelDeConfianca(45)).toBe("media");
    expect(nivelDeConfianca(44)).toBe("baixa");
  });
});
