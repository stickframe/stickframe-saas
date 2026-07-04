/**
 * StickFEM™ — Camada de Providers de análise estrutural (Strategy + Adapter).
 *
 *   StickFEM Core → StructuralAnalysisProvider (interface) → { Local, CalcSteel,
 *                   OpenSees, RFEM, SAP2000, … }
 *
 * O núcleo (parser DXF, quantitativo, orçamento, BIM, memorial) NUNCA conhece um
 * provedor concreto. Trocar/adicionar motor de cálculo não altera a UI nem a
 * lógica principal — só se registra um novo provider aqui.
 *
 * Entrada e saída são NORMALIZADAS pelo StickFEM (não pelo formato de nenhum
 * fornecedor). Cada adapter concreto traduz de/para o formato do seu motor.
 */

/**
 * @typedef {Object} StructuralAnalysisResult  (formato normalizado do StickFEM)
 * @property {string}  provider        id do provider que produziu o resultado
 * @property {'ok'|'pendente'|'erro'} status
 * @property {number|null} maxUtilization  índice de utilização máximo (η)
 * @property {boolean|null} pass          aprovado (η ≤ 1 e sem falha)
 * @property {Array}   porElemento       [{ elementId, utilizacao, status }]
 * @property {Array}   designChecks      verificações ([{ nome, valor, limite, ok, norma }])
 * @property {Object|null} diagramas     diagramas (quando o provider os fornece)
 * @property {Object}  memoria           memória de cálculo (quando disponível)
 * @property {string}  mensagem
 * @property {Object}  meta              { normaVersao, tempoMs, ... }
 */

/** Erro sinalizando que um provider existe mas não está configurado/credenciado. */
export class ProviderNotConfiguredError extends Error {
  constructor(provider, motivo = "Provider não configurado.") {
    super(`[${provider}] ${motivo}`);
    this.name = "ProviderNotConfiguredError";
    this.provider = provider;
  }
}

/** Erro de indisponibilidade (timeout, rede, 5xx) — dispara o fallback. */
export class ProviderUnavailableError extends Error {
  constructor(provider, motivo = "Provider indisponível.") {
    super(`[${provider}] ${motivo}`);
    this.name = "ProviderUnavailableError";
    this.provider = provider;
  }
}

/** Contrato base — todo provider concreto estende esta classe. */
export class StructuralAnalysisProvider {
  /** id curto e estável (ex.: "local", "calcsteel"). */
  get id() { return "abstract"; }
  /** rótulo para a UI. */
  get nome() { return "Abstract"; }
  /** true quando pronto para uso (credenciais/dependências presentes). */
  get disponivel() { return false; }
  /** true se o provider chama serviço externo (afeta fallback/auditoria). */
  get externo() { return false; }

  /**
   * @param {Object} _model  StructuralModel normalizado (+ bloco `design`)
   * @returns {Promise<StructuralAnalysisResult>}
   */
  async analyze(_model) {
    throw new ProviderNotConfiguredError(this.id, "analyze() não implementado.");
  }
}

/** Normaliza qualquer retorno parcial num StructuralAnalysisResult completo. */
export function normalizarResultado(provider, parcial = {}) {
  return {
    provider,
    status: parcial.status || "ok",
    maxUtilization: parcial.maxUtilization ?? null,
    pass: parcial.pass ?? null,
    porElemento: parcial.porElemento || [],
    designChecks: parcial.designChecks || [],
    diagramas: parcial.diagramas || null,
    memoria: parcial.memoria || null,
    mensagem: parcial.mensagem || "",
    meta: parcial.meta || {},
  };
}
