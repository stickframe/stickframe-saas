/**
 * StickFEM™ Validation Framework™ — Engineering Health Score.
 *
 * Indicador COMPOSTO calculado só de sinais REAIS e mensuráveis:
 *   • validação   — % de modelos de referência que batem com o esperado.
 *   • normas      — % de cobertura ponderada das NBR (mapa honesto).
 *   • regressão   — 100 se todos os testes de regressão passam, senão proporcional.
 *
 * NÃO inclui "confiança de cálculo vs. software comercial" — isso depende de
 * benchmark externo real (ver benchmark.js) e permanece "aguardando validação".
 */
import { coberturaNormasPct } from "./normsCoverage";

/**
 * @param {Object} sinais { validacaoPct, regressaoAprovados, regressaoTotal }
 * @returns { health, componentes, pendente }
 */
export function engineeringHealth({ validacaoPct = null, regressaoAprovados = null, regressaoTotal = null } = {}) {
  const normasPct = coberturaNormasPct();
  const regressaoPct = regressaoTotal ? Math.round((regressaoAprovados / regressaoTotal) * 100) : null;

  const componentes = {
    validacao: validacaoPct,
    normas: normasPct,
    regressao: regressaoPct,
  };

  // média dos componentes disponíveis (ignora os que ainda não têm sinal)
  const disponiveis = Object.values(componentes).filter((v) => v != null);
  const health = disponiveis.length ? Math.round(disponiveis.reduce((a, b) => a + b, 0) / disponiveis.length) : null;

  return {
    health,
    componentes,
    // itens que ainda não entram no score por falta de dados reais
    pendente: ["confiança de cálculo vs. software comercial (benchmark externo)", "digital twin previsto × executado"],
  };
}
