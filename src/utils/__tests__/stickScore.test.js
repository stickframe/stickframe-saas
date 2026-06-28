import { describe, it, expect } from "vitest";
import { calcularStickScore, gerarInsights, calcularStickScoreExecutivo, STICK_SCORE_DIMENSOES } from "../stickScore";

describe("calcularStickScore", () => {
  const obraBase = {
    progresso: 50,
    prazo_inicio: "2026-01-01",
    prazo_fim: "2026-12-31",
  };

  it("deve retornar { total, scores, nivel, cor }", () => {
    const resultado = calcularStickScore(obraBase);
    expect(resultado).toHaveProperty("total");
    expect(resultado).toHaveProperty("scores");
    expect(resultado).toHaveProperty("nivel");
    expect(resultado).toHaveProperty("cor");
    expect(resultado.total).toBeGreaterThanOrEqual(0);
    expect(resultado.total).toBeLessThanOrEqual(100);
  });

  it("scores deve conter as 5 dimensões", () => {
    const resultado = calcularStickScore(obraBase);
    const scores = resultado.scores;
    expect(scores).toHaveProperty("cronograma");
    expect(scores).toHaveProperty("financeiro");
    expect(scores).toHaveProperty("compras");
    expect(scores).toHaveProperty("equipe");
    expect(scores).toHaveProperty("qualidade");
  });

  it("cada dimensão deve ser número entre 0 e 100", () => {
    const resultado = calcularStickScore(obraBase);
    for (const v of Object.values(resultado.scores)) {
      expect(typeof v).toBe("number");
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("obra concluída (100%) deve ter score >= 60", () => {
    expect(calcularStickScore({ ...obraBase, progresso: 100 }).total).toBeGreaterThanOrEqual(60);
  });

  it("obra sem prazo deve funcionar", () => {
    expect(calcularStickScore({ progresso: 50 }).total).toBeGreaterThanOrEqual(0);
  });

  it("deve aceitar financeiro como parâmetro", () => {
    const r = calcularStickScore(obraBase, {
      financeiro: [{ tipo: "receita", valor: 50000 }, { tipo: "despesa", valor: 30000 }],
    });
    expect(r.scores.financeiro).toBeGreaterThanOrEqual(0);
  });

  it("deve aceitar membros como parâmetro", () => {
    const r = calcularStickScore(obraBase, { membros: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    expect(r.scores.equipe).toBeGreaterThanOrEqual(0);
  });
});

describe("gerarInsights", () => {
  it("deve retornar array", () => {
    const score = { total: 65, scores: { cronograma: 50, financeiro: 70, compras: 60, equipe: 80, qualidade: 90 } };
    expect(Array.isArray(gerarInsights(score, []))).toBe(true);
  });

  it("deve retornar array vazio se scoreAtual for null", () => {
    expect(gerarInsights(null, [])).toEqual([]);
  });

  it("cada insight deve ter tipo e texto", () => {
    const score = { total: 30, scores: { cronograma: 20, financeiro: 40, compras: 60, equipe: 80, qualidade: 90 } };
    for (const i of gerarInsights(score, [])) {
      expect(i).toHaveProperty("tipo");
      expect(i).toHaveProperty("texto");
      expect(["positivo", "negativo", "alerta", "dica"]).toContain(i.tipo);
    }
  });
});

describe("calcularStickScoreExecutivo", () => {
  it("deve retornar { total, scores, nivel, cor }", () => {
    const resultado = calcularStickScoreExecutivo([{ status: "Em andamento", contrato: 100000, progresso: 50 }]);
    expect(resultado).toHaveProperty("total");
    expect(resultado).toHaveProperty("scores");
    expect(resultado).toHaveProperty("nivel");
    expect(resultado).toHaveProperty("cor");
    expect(resultado.total).toBeGreaterThanOrEqual(0);
    expect(resultado.total).toBeLessThanOrEqual(100);
  });

  it("scores deve conter as 4 dimensões executivas", () => {
    const resultado = calcularStickScoreExecutivo([]);
    expect(resultado.scores).toHaveProperty("rentabilidade");
    expect(resultado.scores).toHaveProperty("fluxo");
    expect(resultado.scores).toHaveProperty("recebimento");
    expect(resultado.scores).toHaveProperty("carteira");
  });
});

describe("STICK_SCORE_DIMENSOES", () => {
  it("deve conter 5 dimensões", () => {
    expect(STICK_SCORE_DIMENSOES).toHaveLength(5);
  });

  it("cada dimensão deve ter key, label, peso (string)", () => {
    for (const d of STICK_SCORE_DIMENSOES) {
      expect(d).toHaveProperty("key");
      expect(d).toHaveProperty("label");
      expect(d).toHaveProperty("peso");
    }
  });

  it("peso deve ser string no formato '25%'", () => {
    for (const d of STICK_SCORE_DIMENSOES) {
      expect(typeof d.peso).toBe("string");
      expect(d.peso).toMatch(/^\d+%$/);
    }
  });
});
