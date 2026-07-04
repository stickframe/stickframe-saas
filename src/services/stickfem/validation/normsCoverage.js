/**
 * StickFEM™ Validation Framework™ — cobertura de normas (mapa HONESTO do que o
 * motor v0.1.0 realmente implementa). Evita falsas expectativas: declara o que
 * é completo, parcial (simplificado) e ainda não implementado.
 */
export const COBERTURA_NORMAS = [
  { norma: "NBR 6120", titulo: "Cargas para o cálculo de estruturas", status: "parcial", nota: "Cargas G/Q informadas pelo usuário; sem tabelas automáticas por uso." },
  { norma: "NBR 6123", titulo: "Forças devidas ao vento", status: "parcial", nota: "Vk e pressão dinâmica simplificadas (S2/S3=1); sem Cpe/Cpi, rugosidade ou topografia." },
  { norma: "NBR 8681", titulo: "Ações e segurança nas estruturas", status: "parcial", nota: "Combinações ELU/ELS simplificadas (γ=1,4); sem combinação de vento como ação principal." },
  { norma: "NBR 14762", titulo: "Dimensionamento de perfis formados a frio", status: "parcial", nota: "Compressão axial (escoamento vs. Euler) e esbeltez; SEM flambagem local/distorcional nem flexo-compressão." },
  { norma: "NBR 8800", titulo: "Estruturas de aço (laminados)", status: "nao_implementado", nota: "Fora do escopo do motor atual (foco em formado a frio)." },
];

export const STATUS_NORMA = {
  completo: { label: "Completo", icone: "✔", cor: "#3f7a4b" },
  parcial: { label: "Parcial (simplificado)", icone: "◑", cor: "#b07a1e" },
  nao_implementado: { label: "Não implementado", icone: "—", cor: "#8c847a" },
};

/** % de cobertura ponderada (completo=1, parcial=0,5, não=0). */
export function coberturaNormasPct() {
  const peso = { completo: 1, parcial: 0.5, nao_implementado: 0 };
  const soma = COBERTURA_NORMAS.reduce((s, n) => s + peso[n.status], 0);
  return Math.round((soma / COBERTURA_NORMAS.length) * 100);
}
