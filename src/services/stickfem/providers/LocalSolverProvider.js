/**
 * LocalSolverProvider — motor local do StickFEM™ (pré-dimensionamento de
 * anteprojeto). É o único provider REAL e sempre disponível hoje. Serve também
 * de fallback quando um provider externo falha.
 */
import { StructuralAnalysisProvider, normalizarResultado } from "./StructuralAnalysisProvider";
import { auditarPreDimensionamento } from "../auditoria";
import { ENGINE_VERSION } from "../engine/version";

export class LocalSolverProvider extends StructuralAnalysisProvider {
  get id() { return "local"; }
  get nome() { return "Stick Solver (local)"; }
  get disponivel() { return true; }
  get externo() { return false; }

  /**
   * Espera `model.design` = { perfil, material, peDireitoM, espacMontanteM,
   * larguraTributariaM, gPerm_kNm2, qSobre_kNm2, v0_ms, meta }.
   */
  async analyze(model) {
    const t0 = (typeof performance !== "undefined" ? performance.now() : Date.now());
    const design = model?.design;
    if (!design || !design.perfil) {
      return normalizarResultado(this.id, {
        status: "pendente",
        mensagem: "Modelo sem bloco de dimensionamento (design). Nada a calcular no motor local.",
        meta: { engineVersion: ENGINE_VERSION },
      });
    }

    const aud = auditarPreDimensionamento(design);
    const t1 = (typeof performance !== "undefined" ? performance.now() : Date.now());
    const eta = aud.resultado.utilizacao;

    return normalizarResultado(this.id, {
      status: aud.resultado.status === "indefinido" ? "pendente" : "ok",
      maxUtilization: eta,
      pass: aud.resultado.status !== "revisar" && aud.resultado.esbeltezOk,
      porElemento: [{ elementId: "montante-repr", utilizacao: eta, status: aud.resultado.status }],
      designChecks: [
        { nome: "Compressão axial (η)", valor: eta, limite: 1.0, ok: eta <= 1.0, norma: "NBR 14762 (simplificado)" },
        { nome: "Esbeltez (λ)", valor: aud.resultado.esbeltez, limite: 200, ok: aud.resultado.esbeltezOk, norma: "NBR 14762" },
      ],
      memoria: aud,
      mensagem: aud.motivo,
      meta: { engineVersion: ENGINE_VERSION, tempoMs: Math.round(t1 - t0), modoGovernante: aud.resultado.modoGovernante },
    });
  }
}
