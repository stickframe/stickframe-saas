/**
 * Versão do motor de cálculo estrutural do StickFEM™.
 *
 * Semântica: MAJOR.MINOR.PATCH do *algoritmo* (não do app). Qualquer mudança
 * que altere resultados numéricos deve incrementar a versão E atualizar os
 * casos da suíte de regressão (src/services/stickfem/__tests__).
 *
 * 0.1.0 — Pré-dimensionamento de anteprojeto: compressão axial do montante
 *         (esmagamento A·fy vs. flambagem de Euler π²EI/(KL)²), esbeltez e
 *         índice de utilização. Modelo SIMPLIFICADO: não cobre flexo-compressão,
 *         flambagem distorcional/local, largura efetiva nem contraventamento
 *         pelas placas (NBR 14762 completa). Não substitui o projeto do
 *         engenheiro habilitado (ART/RRT).
 */
export const ENGINE_VERSION = "0.1.0";

/** Rótulo do estágio de maturidade do motor (exibido na auditoria). */
export const ENGINE_STAGE = "pré-dimensionamento (anteprojeto)";
