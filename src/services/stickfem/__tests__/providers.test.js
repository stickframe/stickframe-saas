import { describe, it, expect } from "vitest";
import { AnalysisProviderManager } from "../providers/AnalysisProviderManager";
import { LocalSolverProvider } from "../providers/LocalSolverProvider";
import { CalcSteelProvider } from "../providers/CalcSteelProvider";
import { StructuralAnalysisProvider, ProviderNotConfiguredError, normalizarResultado } from "../providers/StructuralAnalysisProvider";
import { compararResultados } from "../providers/comparar";

const UE90 = { nome: "Montante Ue 90×40×12×1,25", area_mm2: 204, inercia_x_mm4: 254000, inercia_y_mm4: 52000, peso_kg_m: 1.6 };
const model = {
  design: {
    perfil: UE90, material: { fy_mpa: 250, e_mpa: 200000 },
    peDireitoM: 2.8, espacMontanteM: 0.4, larguraTributariaM: 2.5,
    gPerm_kNm2: 1.5, qSobre_kNm2: 2.0, v0_ms: 40,
  },
};

// Provider externo fake DISPONÍVEL para exercitar o caminho de sucesso e o de erro.
class FakeExterno extends StructuralAnalysisProvider {
  constructor(id, { falha = false, util = 0.4 } = {}) { super(); this._id = id; this._falha = falha; this._util = util; }
  get id() { return this._id; }
  get nome() { return this._id; }
  get externo() { return true; }
  get disponivel() { return true; }
  async analyze() {
    if (this._falha) throw new Error("boom externo");
    return normalizarResultado(this._id, { maxUtilization: this._util, pass: this._util <= 1 });
  }
}

describe("LocalSolverProvider", () => {
  it("produz resultado normalizado com utilização real (~0,41)", async () => {
    const r = await new LocalSolverProvider().analyze(model);
    expect(r.provider).toBe("local");
    expect(r.status).toBe("ok");
    expect(r.maxUtilization).toBeCloseTo(0.4117, 3);
    expect(r.designChecks.length).toBeGreaterThanOrEqual(2);
  });

  it("sem bloco design → status pendente", async () => {
    const r = await new LocalSolverProvider().analyze({});
    expect(r.status).toBe("pendente");
  });
});

describe("CalcSteelProvider (stub honesto)", () => {
  it("é indisponível e analyze() lança ProviderNotConfiguredError", async () => {
    const p = new CalcSteelProvider();
    expect(p.disponivel).toBe(false);
    await expect(p.analyze(model)).rejects.toBeInstanceOf(ProviderNotConfiguredError);
  });
});

describe("AnalysisProviderManager", () => {
  it("modo local usa o provider local", async () => {
    const { resultado, auditoria } = await new AnalysisProviderManager().analyze(model, { modo: "local" });
    expect(auditoria.providerUsado).toBe("local");
    expect(auditoria.fallbackUsado).toBe(false);
    expect(resultado.provider).toBe("local");
  });

  it("provider externo indisponível → fallback automático para local", async () => {
    const { resultado, auditoria } = await new AnalysisProviderManager().analyze(model, { modo: "calcsteel" });
    expect(auditoria.providerSolicitado).toBe("calcsteel");
    expect(auditoria.providerUsado).toBe("local");
    expect(auditoria.fallbackUsado).toBe(true);
    expect(resultado.provider).toBe("local");
  });

  it("provider externo que falha em runtime → fallback e registra erro", async () => {
    const mgr = new AnalysisProviderManager([new LocalSolverProvider(), new FakeExterno("calcsteel", { falha: true })]);
    const { auditoria } = await mgr.analyze(model, { modo: "calcsteel" });
    expect(auditoria.fallbackUsado).toBe(true);
    expect(auditoria.erro).toMatch(/boom/);
  });

  it("modo automático com externo disponível → local + comparação (validação cruzada)", async () => {
    const mgr = new AnalysisProviderManager([new LocalSolverProvider(), new FakeExterno("calcsteel", { util: 0.4117 })]);
    const { resultado, comparacao, auditoria } = await mgr.analyze(model, { modo: "automatico" });
    expect(resultado.provider).toBe("local");
    expect(auditoria.validacaoExterna).toBe(true);
    expect(comparacao.nivel).toBe("excelente");
  });

  it("list() expõe os providers e sua disponibilidade", () => {
    const ids = new AnalysisProviderManager().list().map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(["local", "calcsteel", "opensees", "rfem", "sap2000"]));
  });
});

describe("compararResultados (validação cruzada)", () => {
  it("classifica <2% como excelente e >5% como revisar", () => {
    const a = normalizarResultado("local", { maxUtilization: 0.82, pass: true });
    expect(compararResultados(a, normalizarResultado("x", { maxUtilization: 0.80, pass: true })).nivel).toBe("boa");
    expect(compararResultados(a, normalizarResultado("x", { maxUtilization: 0.815, pass: true })).nivel).toBe("excelente");
    expect(compararResultados(a, normalizarResultado("x", { maxUtilization: 0.60, pass: true })).nivel).toBe("revisar");
  });
});
