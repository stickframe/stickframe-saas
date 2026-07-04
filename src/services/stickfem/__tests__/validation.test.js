import { describe, it, expect } from "vitest";
import { CASOS_REFERENCIA } from "../../../validation/index";
import { rodarModelo, compararComEsperado, rodarSuite } from "../validation/validationRunner";
import { coberturaNormasPct, COBERTURA_NORMAS } from "../validation/normsCoverage";
import { engineeringHealth } from "../validation/healthScore";
import { montarBenchmark, benchmarkVazio } from "../validation/benchmark";
import { compararPrevistoExecutado, precisao } from "../validation/digitalTwin";

describe("Validation Framework — regressão dos modelos de referência", () => {
  // Cada modelo de referência deve bater com o resultado esperado (golden).
  // Se o motor mudar e alterar qualquer valor, ESTE teste quebra o CI.
  it.each(CASOS_REFERENCIA)("$model.id bate com o esperado", ({ model, expected }) => {
    const resultado = rodarModelo(model);
    const cmp = compararComEsperado(resultado, expected);
    if (!cmp.pass) console.error(model.id, cmp.diferencas);
    expect(cmp.pass).toBe(true);
  });

  it("rodarSuite reporta cobertura 100% na baseline", () => {
    const s = rodarSuite(CASOS_REFERENCIA);
    expect(s.total).toBe(5);
    expect(s.aprovados).toBe(5);
    expect(s.cobertura).toBe(100);
  });

  it("detecta divergência quando o esperado muda", () => {
    const cmp = compararComEsperado(rodarModelo(CASOS_REFERENCIA[0].model), { ...CASOS_REFERENCIA[0].expected, utilizacao: 0.9 });
    expect(cmp.pass).toBe(false);
    expect(cmp.diferencas[0].campo).toBe("utilizacao");
  });
});

describe("cobertura de normas (mapa honesto)", () => {
  it("lista as NBR relevantes e calcula % ponderado", () => {
    expect(COBERTURA_NORMAS.map((n) => n.norma)).toEqual(expect.arrayContaining(["NBR 6120", "NBR 6123", "NBR 8681", "NBR 14762", "NBR 8800"]));
    const pct = coberturaNormasPct();
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100); // honesto: nada 100% (tudo parcial ou não-implementado)
  });
});

describe("Engineering Health (só sinais reais)", () => {
  it("média dos componentes disponíveis; marca pendências", () => {
    const h = engineeringHealth({ validacaoPct: 100, regressaoAprovados: 173, regressaoTotal: 173 });
    expect(h.componentes.validacao).toBe(100);
    expect(h.componentes.regressao).toBe(100);
    expect(h.health).toBeGreaterThan(0);
    expect(h.pendente.length).toBeGreaterThan(0);
  });
});

describe("benchmark (sem números fabricados)", () => {
  it("colunas de software ficam pendentes quando não há referência real", () => {
    const s = rodarSuite(CASOS_REFERENCIA);
    const tab = montarBenchmark(s.resultados, {});
    expect(benchmarkVazio({})).toBe(true);
    expect(tab[0].stickfem).toBeTypeOf("number");
    expect(tab[0].comparacoes.SAP2000.estado).toBe("pendente");
    expect(tab[0].comparacoes.SAP2000.valor).toBeNull();
  });

  it("calcula diferença % quando existe dado externo real", () => {
    const s = rodarSuite(CASOS_REFERENCIA);
    const tab = montarBenchmark(s.resultados, { parede_3m: { CalcSteel: 0.40 } });
    const linha = tab.find((l) => l.id === "parede_3m");
    expect(linha.comparacoes.CalcSteel.estado).toBe("ok");
    expect(linha.comparacoes.CalcSteel.difPct).not.toBeNull();
  });
});

describe("Digital Twin (previsto × executado)", () => {
  it("precisão = 100 − erro relativo", () => {
    expect(precisao(100, 110)).toBe(90);
    expect(precisao(1000, 1000)).toBe(100);
  });
  it("compara métricas e média; sem dados → temDados false", () => {
    const c = compararPrevistoExecutado({ peso: { previsto: 1240, executado: 1380 }, prazo: { previsto: 40, executado: 44 } });
    expect(c.peso.delta).toBe(140);
    expect(c.temDados).toBe(true);
    expect(compararPrevistoExecutado({}).temDados).toBe(false);
  });
});
