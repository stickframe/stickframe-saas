import { describe, it, expect, beforeEach, vi } from "vitest";
import { analytics } from "../analytics";
import { resolveStage, SMART_CTA_VARIANTS } from "../../components/growth/SmartCTA";

// Mock mínimo de browser (ambiente de teste é node)
function mockBrowser() {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  globalThis.window = globalThis.window || {};
  globalThis.window.location = { search: "", pathname: "/" };
  globalThis.document = { referrer: "" };
  return store;
}

describe("Conversion Layer — analytics wrappers (C.2)", () => {
  it("expõe todos os wrappers de conversão esperados", () => {
    const esperados = [
      "landingView", "calculatorStarted", "calculatorCompleted", "leadCreated",
      "trialStarted", "pricingViewed", "ctaClicked", "quoteRequested", "stickquoteInterest",
    ];
    for (const fn of esperados) {
      expect(typeof analytics[fn], `analytics.${fn}`).toBe("function");
    }
  });

  it("os wrappers não quebram quando o GA não está disponível (no-op)", () => {
    globalThis.window = { /* sem gtag */ };
    expect(() => {
      analytics.landingView();
      analytics.calculatorStarted("calc");
      analytics.calculatorCompleted({ area: 100 });
      analytics.leadCreated({ source: "calc", valor: 1000 });
      analytics.ctaClicked("Calcular minha obra", "landing-hero");
    }).not.toThrow();
  });
});

describe("Conversion Layer — SmartCTA (C.6)", () => {
  it("resolve o estágio por prioridade: stage > trial > retornando > novo", () => {
    expect(resolveStage({ stage: "trial" })).toBe("trial");
    expect(resolveStage({ isTrial: true })).toBe("trial");
    expect(resolveStage({ isReturning: true })).toBe("retornando");
    expect(resolveStage({})).toBe("novo");
    // stage inválido cai no fluxo de inferência
    expect(resolveStage({ stage: "xpto", isReturning: true })).toBe("retornando");
  });

  it("cada variante tem label e href", () => {
    for (const k of ["novo", "retornando", "trial"]) {
      expect(SMART_CTA_VARIANTS[k].label).toBeTruthy();
      expect(SMART_CTA_VARIANTS[k].href).toMatch(/^\//);
    }
    expect(SMART_CTA_VARIANTS.novo.href).toBe("/calcular");
  });
});

describe("Conversion Layer — Lead Intelligence (C.5)", () => {
  beforeEach(() => { vi.resetModules(); });

  it("salva campanha + página no primeiro toque e lê via obterLeadIntel", async () => {
    mockBrowser();
    globalThis.window.location = { search: "?utm_source=google&utm_campaign=steelframe2026", pathname: "/calcular" };
    const { salvarOrigemLead, obterLeadIntel, obterOrigemLead } = await import("../leadOrigem");
    salvarOrigemLead();
    const intel = obterLeadIntel();
    expect(intel.origem).toBe("google");
    expect(intel.campanha).toBe("steelframe2026");
    expect(intel.pagina).toBe("/calcular");
    expect(obterOrigemLead()).toBe("google");
  });

  it("retorna 'direto' quando não há origem", async () => {
    mockBrowser();
    const { obterLeadIntel } = await import("../leadOrigem");
    expect(obterLeadIntel().origem).toBe("direto");
  });
});
