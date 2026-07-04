/**
 * CalcSteelProvider — provedor complementar (análise estrutural + catálogo).
 *
 * ⚠️ STUB HONESTO. O corpo real depende de contrato de API AINDA NÃO CONFIRMADO:
 *   - URL base e versionamento;
 *   - autenticação (deve ser via Edge Function proxy — token NUNCA no cliente);
 *   - esquema exato de `project_data` (POST /analysis) e de `design_checks`;
 *   - licença de uso comercial em SaaS de terceiros;
 *   - suporte a perfis formados a frio / NBR 14762.
 *
 * Enquanto isso, `disponivel` é false e `analyze` lança ProviderNotConfiguredError
 * — o AnalysisProviderManager cai em fallback para o LocalSolverProvider. NÃO se
 * inventa aqui nenhum formato de request/response: os pontos de conversão abaixo
 * (toProjectData / fromResponse) ficam marcados como TODO com o contrato real.
 */
import { StructuralAnalysisProvider, ProviderNotConfiguredError } from "./StructuralAnalysisProvider";
import { calcSteelAnalysisDisponivel, CALCSTEEL_PROXY_URL } from "./config";

export class CalcSteelProvider extends StructuralAnalysisProvider {
  constructor({ proxyUrl = CALCSTEEL_PROXY_URL } = {}) {
    super();
    this._proxyUrl = proxyUrl; // Edge Function do Supabase (proxy seguro), quando existir.
  }
  get id() { return "calcsteel"; }
  get nome() { return "CalcSteel (API)"; }
  get externo() { return true; }
  // Feature flag: só disponível com contrato validado + proxy seguro configurado.
  get disponivel() { return calcSteelAnalysisDisponivel(); }

  /** StructuralModel (StickFEM) → payload da API. TODO: confirmar contrato real. */
  toProjectData(_model) {
    throw new ProviderNotConfiguredError(this.id, "Conversão StructuralModel→project_data pendente de contrato da API.");
  }

  /** Resposta da API → StructuralAnalysisResult normalizado. TODO: contrato real. */
  fromResponse(_resp) {
    throw new ProviderNotConfiguredError(this.id, "Conversão da resposta pendente de contrato da API.");
  }

  async analyze(_model) {
    throw new ProviderNotConfiguredError(
      this.id,
      "CalcSteel ainda não configurado (proxy seguro + contrato de API pendentes)."
    );
  }
}
