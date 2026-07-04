/**
 * StickFEM™ — Engineering Diff: Matcher inteligente entre dois conjuntos de
 * elementos (DXF×DXF, revisão×revisão, revisão×DXF).
 *
 * NÃO compara por posição absoluta. Casa elementos por múltiplos critérios
 * (proximidade, comprimento, direção, layer, coincidência de extremidades) e
 * calcula um score de similaridade 0–1. Usa índice espacial em grade (hashing
 * geométrico) para candidatos → complexidade ~linear, sem O(n²).
 */

const TOL = 0.02; // 2 cm — coincidência de extremidades
const CELL_PADRAO = 1.0; // m — célula da grade espacial

const midpoint = (e) => {
  const g = e.geometria || {};
  return { x: ((g.x1 ?? 0) + (g.x2 ?? 0)) / 2, y: ((g.y1 ?? 0) + (g.y2 ?? 0)) / 2 };
};
const comprimento = (e) => {
  if (e.comprimento_m != null) return e.comprimento_m;
  const g = e.geometria || {};
  return Math.hypot((g.x2 ?? 0) - (g.x1 ?? 0), (g.y2 ?? 0) - (g.y1 ?? 0));
};
// ângulo não-orientado [0, π)
const angulo = (e) => {
  const g = e.geometria || {};
  const a = Math.atan2((g.y2 ?? 0) - (g.y1 ?? 0), (g.x2 ?? 0) - (g.x1 ?? 0));
  return ((a % Math.PI) + Math.PI) % Math.PI;
};
const coincide = (ax, ay, bx, by) => Math.abs(ax - bx) < TOL && Math.abs(ay - by) < TOL;

/** Fração de extremidades coincidentes (0, 0.5 ou 1), considerando inversão. */
export function coincidenciaExtremidades(a, b) {
  const ga = a.geometria || {}, gb = b.geometria || {};
  const n1 = coincide(ga.x1, ga.y1, gb.x1, gb.y1), n2 = coincide(ga.x2, ga.y2, gb.x2, gb.y2);
  const i1 = coincide(ga.x1, ga.y1, gb.x2, gb.y2), i2 = coincide(ga.x2, ga.y2, gb.x1, gb.y1);
  const normal = (n1 ? 0.5 : 0) + (n2 ? 0.5 : 0);
  const invert = (i1 ? 0.5 : 0) + (i2 ? 0.5 : 0);
  return Math.max(normal, invert);
}

/** Score de similaridade 0–1 + componentes (auditável). */
export function similaridade(a, b, { distMax = 2.0 } = {}) {
  const ma = midpoint(a), mb = midpoint(b);
  const d = Math.hypot(ma.x - mb.x, ma.y - mb.y);
  const proximidade = Math.max(0, 1 - d / distMax);

  const la = comprimento(a), lb = comprimento(b);
  const comprimentoScore = la === 0 && lb === 0 ? 1 : 1 - Math.abs(la - lb) / Math.max(la, lb, 1e-9);

  const direcao = (la === 0 || lb === 0) ? 0.5 : Math.abs(Math.cos(angulo(a) - angulo(b)));
  const layer = (a.layer_origem && a.layer_origem === b.layer_origem) ? 1 : 0;
  const extremidades = coincidenciaExtremidades(a, b);

  const componentes = { proximidade, comprimento: comprimentoScore, direcao, layer, extremidades };
  const score =
    0.35 * proximidade + 0.25 * comprimentoScore + 0.15 * direcao + 0.10 * layer + 0.15 * extremidades;
  return { score: +score.toFixed(4), componentes };
}

// ── Índice espacial em grade ─────────────────────────────────────────────────
function chaveCelula(x, y, cell) { return `${Math.floor(x / cell)}|${Math.floor(y / cell)}`; }

function construirIndice(elementos, cell) {
  const idx = new Map();
  elementos.forEach((e, i) => {
    const m = midpoint(e);
    const k = chaveCelula(m.x, m.y, cell);
    if (!idx.has(k)) idx.set(k, []);
    idx.get(k).push({ e, i });
  });
  return idx;
}

function candidatos(idx, e, cell) {
  const m = midpoint(e);
  const cx = Math.floor(m.x / cell), cy = Math.floor(m.y / cell);
  const out = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const bucket = idx.get(`${cx + dx}|${cy + dy}`);
    if (bucket) out.push(...bucket);
  }
  return out;
}

/**
 * Casa listaA (antes) com listaB (depois). Cada elemento de A é casado com o
 * melhor candidato de B acima do limiar; casamentos são exclusivos (1:1).
 * @returns {{ pares:Array<{a,b,score,componentes}>, somenteA:Array, somenteB:Array }}
 */
export function casarElementos(listaA = [], listaB = [], { limiar = 0.55, cell = CELL_PADRAO } = {}) {
  const idxB = construirIndice(listaB, cell);
  const usadoB = new Set();
  const pares = [];

  for (const a of listaA) {
    let melhor = null;
    for (const { e: b, i } of candidatos(idxB, a, cell)) {
      if (usadoB.has(i)) continue;
      const { score, componentes } = similaridade(a, b);
      if (score >= limiar && (!melhor || score > melhor.score)) melhor = { b, i, score, componentes };
    }
    if (melhor) { usadoB.add(melhor.i); pares.push({ a, b: melhor.b, score: melhor.score, componentes: melhor.componentes }); }
    else pares.push({ a, b: null, score: 0, componentes: null });
  }

  const somenteA = pares.filter((p) => !p.b).map((p) => p.a);
  const casadosA = pares.filter((p) => p.b);
  const somenteB = listaB.filter((_, i) => !usadoB.has(i));
  return { pares: casadosA, somenteA, somenteB };
}

export const _internals = { midpoint, comprimento, angulo, construirIndice, candidatos };
