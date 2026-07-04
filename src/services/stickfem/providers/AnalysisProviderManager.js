/**
 * AnalysisProviderManager — decide qual provider usa e garante robustez.
 *
 * Modos (config por empresa):
 *   • "local"      → só o Stick Solver local.
 *   • "calcsteel"  → CalcSteel; se falhar/indisponível → fallback local.
 *   • "automatico" → pré-dimensionamento local SEMPRE + validação externa quando
 *                    disponível (retorna ambos p/ validação cruzada).
 *
 * Toda análise retorna metadados de auditoria (provider, tempo, fallback, erro).
 * O núcleo do StickFEM só fala com este manager — nunca com um provider concreto.
 */
import { LocalSolverProvider } from "./LocalSolverProvider";
import { CalcSteelProvider } from "./CalcSteelProvider";
import { OpenSeesProvider, RFEMProvider, SAP2000Provider } from "./ExternalStubProviders";
import { compararResultados } from "./comparar";

export class AnalysisProviderManager {
  constructor(providers) {
    this._providers = new Map();
    (providers || [
      new LocalSolverProvider(),
      new CalcSteelProvider(),
      new OpenSeesProvider(),
      new RFEMProvider(),
      new SAP2000Provider(),
    ]).forEach((p) => this._providers.set(p.id, p));
    this._local = this._providers.get("local");
  }

  get(id) { return this._providers.get(id); }
  list() {
    return [...this._providers.values()].map((p) => ({ id: p.id, nome: p.nome, disponivel: p.disponivel, externo: p.externo }));
  }

  /**
   * @param {Object} model  StructuralModel (+ design)
   * @param {Object} [opts] { modo:"local"|"calcsteel"|"automatico", provider?, usuario? }
   * @returns {Promise<{ resultado, comparacao?, auditoria }>}
   */
  async analyze(model, opts = {}) {
    const modo = opts.modo || "local";
    const inicio = new Date().toISOString();

    if (modo === "automatico") return this._automatico(model, opts, inicio);

    const alvoId = modo === "local" ? "local" : (opts.provider || "calcsteel");
    const { resultado, auditoria } = await this._runComFallback(alvoId, model, opts);
    auditoria.modo = modo; auditoria.inicio = inicio;
    return { resultado, auditoria };
  }

  /** Roda o provider alvo; em falha de provider EXTERNO, cai para o local. */
  async _runComFallback(alvoId, model, opts) {
    const alvo = this._providers.get(alvoId) || this._local;
    const t0 = Date.now();
    const audit = { providerSolicitado: alvoId, providerUsado: alvo.id, fallbackUsado: false, erro: null, tempoMs: 0, usuario: opts.usuario || null };
    try {
      if (!alvo.disponivel) throw new Error("indisponível");
      const resultado = await alvo.analyze(model);
      audit.tempoMs = Date.now() - t0;
      return { resultado, auditoria: audit };
    } catch (err) {
      audit.erro = String(err?.message || err);
      // Fallback só faz sentido saindo de um provider externo para o local.
      if (alvo.id !== "local") {
        const resultado = await this._local.analyze(model);
        audit.providerUsado = "local";
        audit.fallbackUsado = true;
        audit.tempoMs = Date.now() - t0;
        return { resultado, auditoria: audit };
      }
      audit.tempoMs = Date.now() - t0;
      throw err; // local falhou de verdade — propaga
    }
  }

  /** Local sempre + validação externa quando disponível (validação cruzada). */
  async _automatico(model, opts, inicio) {
    const t0 = Date.now();
    const local = await this._local.analyze(model);
    const externoId = opts.provider || "calcsteel";
    const externo = this._providers.get(externoId);

    const auditoria = {
      modo: "automatico", inicio, providerSolicitado: externoId,
      providerUsado: "local", validacaoExterna: false, fallbackUsado: false,
      erro: null, tempoMs: 0, usuario: opts.usuario || null,
    };

    if (externo && externo.disponivel) {
      try {
        const externoRes = await externo.analyze(model);
        auditoria.validacaoExterna = true;
        auditoria.tempoMs = Date.now() - t0;
        return { resultado: local, comparacao: compararResultados(local, externoRes), auditoria };
      } catch (err) {
        auditoria.erro = String(err?.message || err);
        auditoria.fallbackUsado = true;
      }
    } else {
      auditoria.erro = externo ? "provider externo indisponível" : "provider externo inexistente";
    }
    auditoria.tempoMs = Date.now() - t0;
    return { resultado: local, auditoria };
  }
}

/** Instância padrão (registra local + stubs). */
export const providerManager = new AnalysisProviderManager();
