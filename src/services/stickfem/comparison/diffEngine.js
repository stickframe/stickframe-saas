/**
 * StickFEM™ — Engineering Diff: classificação das diferenças.
 *
 * A partir do matcher, classifica cada elemento em:
 *   🟢 novo · 🔴 removido · 🟡 modificado · 🔵 igual · 🟣 movido
 * e lista exatamente os campos alterados (perfil, tipo, comprimento, layer).
 * Puro e testável — sem dependência de UI.
 */
import { casarElementos, coincidenciaExtremidades } from "./matcher";

const CAMPOS = [
  { id: "tipo", label: "Tipo" },
  { id: "perfil_id", label: "Perfil" },
  { id: "comprimento_m", label: "Comprimento", num: true },
  { id: "layer_origem", label: "Layer" },
];

const norm = (v, num) => (num ? (v == null ? null : +Number(v).toFixed(2)) : (v ?? null));

function mudancas(a, b, perfisById) {
  const out = [];
  for (const c of CAMPOS) {
    const de = norm(a[c.id], c.num), para = norm(b[c.id], c.num);
    if (de !== para) {
      const rotDe = c.id === "perfil_id" ? (perfisById?.[de]?.nome ?? de ?? "—") : de;
      const rotPara = c.id === "perfil_id" ? (perfisById?.[para]?.nome ?? para ?? "—") : para;
      out.push({ campo: c.id, label: c.label, de, para, rotuloDe: rotDe, rotuloPara: rotPara });
    }
  }
  return out;
}

/**
 * Compara dois conjuntos de elementos (antes → depois).
 * @param {Array} antes @param {Array} depois
 * @param {Object} [opts] { perfis:[], limiar, cell }
 * @returns {{ itens:Array, resumo:Object }}
 */
export function compararModelos(antes = [], depois = [], opts = {}) {
  const perfisById = Object.fromEntries((opts.perfis || []).map((p) => [p.id, p]));
  const { pares, somenteA, somenteB } = casarElementos(antes, depois, opts);

  const itens = [];

  for (const { a, b, score } of pares) {
    const difs = mudancas(a, b, perfisById);
    const moveu = coincidenciaExtremidades(a, b) < 1;
    let status;
    if (difs.length) status = "modificado";
    else if (moveu) status = "movido";
    else status = "igual";
    itens.push({ status, nome: b.nome, nomeAntes: a.nome, a, b, score, mudancas: difs, moveu });
  }
  for (const a of somenteA) itens.push({ status: "removido", nome: a.nome, a, b: null, mudancas: [] });
  for (const b of somenteB) itens.push({ status: "novo", nome: b.nome, a: null, b, mudancas: [] });

  const resumo = { novo: 0, removido: 0, modificado: 0, movido: 0, igual: 0 };
  for (const it of itens) resumo[it.status]++;

  // ordena por relevância: modificações e novidades primeiro
  const ordem = { modificado: 0, novo: 1, removido: 2, movido: 3, igual: 4 };
  itens.sort((x, y) => ordem[x.status] - ordem[y.status]);

  return { itens, resumo };
}

export const STATUS_META = {
  novo: { label: "Novo", cor: "#22c55e", emoji: "🟢" },
  removido: { label: "Removido", cor: "#ef4444", emoji: "🔴" },
  modificado: { label: "Modificado", cor: "#f59e0b", emoji: "🟡" },
  movido: { label: "Movido", cor: "#8b5cf6", emoji: "🟣" },
  igual: { label: "Igual", cor: "#6b7280", emoji: "🔵" },
};
