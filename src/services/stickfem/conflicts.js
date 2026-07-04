/**
 * StickFEM™ — Detecção de Conflitos (Fase 3).
 *
 * Analisa o modelo estrutural em busca de inconsistências que afetam a análise
 * ou o orçamento. Cada conflito carrega REGRA (o que foi verificado), SEVERIDADE
 * e RECOMENDAÇÃO técnica, além dos elementos envolvidos (clicáveis na UI).
 *
 * Conflitos:
 *  [x] parede_duplicada       [x] linha_sobreposta     [x] elemento_desconectado
 *  [x] layer_vazio            [x] perfil_incompativel  [x] abertura_fora_parede
 *  [x] viga_sem_apoio         [x] elemento_isolado
 */

const TOL = 0.02;                 // 2 cm — tolerância de coincidência de nós
const mesmaCoord = (ax, ay, bx, by) => Math.abs(ax - bx) < TOL && Math.abs(ay - by) < TOL;
const nodeKey = (x, y) => `${Math.round(x / TOL)}|${Math.round(y / TOL)}`;
const temGeo = (e) => e.geometria && e.geometria.x1 != null && e.geometria.x2 != null;
const endpoints = (e) => [{ x: e.geometria.x1, y: e.geometria.y1 }, { x: e.geometria.x2, y: e.geometria.y2 }];

function distPontoSegmento(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ── 1. Paredes duplicadas (geometria idêntica, normal ou invertida) ──────────
function paredesDuplicadas(paredes) {
  const out = [];
  const visto = new Set();
  for (let i = 0; i < paredes.length; i++) {
    for (let j = i + 1; j < paredes.length; j++) {
      const a = paredes[i], b = paredes[j];
      if (visto.has(b.nome)) continue;
      const ga = a.geometria, gb = b.geometria;
      const normal = mesmaCoord(ga.x1, ga.y1, gb.x1, gb.y1) && mesmaCoord(ga.x2, ga.y2, gb.x2, gb.y2);
      const invert = mesmaCoord(ga.x1, ga.y1, gb.x2, gb.y2) && mesmaCoord(ga.x2, ga.y2, gb.x1, gb.y1);
      if (normal || invert) {
        out.push({
          tipo: "parede_duplicada", severidade: "alta",
          regra: "Duas paredes com a mesma geometria (extremidades coincidentes).",
          recomendacao: "Remover a parede duplicada para não contar material em dobro no quantitativo.",
          mensagem: `Paredes ${a.nome} e ${b.nome} são duplicadas.`, elementos: [a.nome, b.nome],
        });
        visto.add(b.nome);
      }
    }
  }
  return out;
}

// ── 2. Linhas sobrepostas (colineares com sobreposição parcial) ──────────────
function linhasSobrepostas(paredes) {
  const out = [];
  const colinear = (g1, g2) => {
    const cross = (g1.x2 - g1.x1) * (g2.y2 - g2.y1) - (g1.y2 - g1.y1) * (g2.x2 - g2.x1);
    if (Math.abs(cross) > 1e-3) return false; // direções não paralelas
    return distPontoSegmento(g2.x1, g2.y1, g1.x1, g1.y1, g1.x2, g1.y2) < TOL;
  };
  for (let i = 0; i < paredes.length; i++) {
    for (let j = i + 1; j < paredes.length; j++) {
      const a = paredes[i], b = paredes[j], g1 = a.geometria, g2 = b.geometria;
      if (!colinear(g1, g2)) continue;
      // projeção 1D no eixo dominante
      const horiz = Math.abs(g1.x2 - g1.x1) >= Math.abs(g1.y2 - g1.y1);
      const pr = (x, y) => (horiz ? x : y);
      const [a1, a2] = [pr(g1.x1, g1.y1), pr(g1.x2, g1.y2)].sort((m, n) => m - n);
      const [b1, b2] = [pr(g2.x1, g2.y1), pr(g2.x2, g2.y2)].sort((m, n) => m - n);
      const over = Math.min(a2, b2) - Math.max(a1, b1);
      const identica = mesmaCoord(a1, 0, b1, 0) && mesmaCoord(a2, 0, b2, 0);
      if (over > TOL && !identica) {
        out.push({
          tipo: "linha_sobreposta", severidade: "media",
          regra: "Duas paredes colineares se sobrepõem parcialmente.",
          recomendacao: "Unir os trechos ou ajustar as extremidades — sobreposição gera dupla contagem parcial.",
          mensagem: `Paredes ${a.nome} e ${b.nome} se sobrepõem (~${over.toFixed(2)} m).`, elementos: [a.nome, b.nome],
        });
      }
    }
  }
  return out;
}

// ── Conectividade: quantos nós livres cada elemento tem ──────────────────────
function usoDeNos(elementos) {
  const uso = new Map();
  for (const e of elementos) if (temGeo(e)) for (const p of endpoints(e)) {
    const k = nodeKey(p.x, p.y); uso.set(k, (uso.get(k) || 0) + 1);
  }
  return uso;
}

// ── 3 & 8. Desconectado (1 nó livre) / Isolado (2 nós livres) ────────────────
function conectividade(elementos) {
  const uso = usoDeNos(elementos);
  const desconectados = [], isolados = [];
  for (const e of elementos) {
    if (!temGeo(e) || e.tipo === "abertura") continue;
    const livres = endpoints(e).filter((p) => (uso.get(nodeKey(p.x, p.y)) || 0) <= 1).length;
    if (livres === 2) isolados.push({
      tipo: "elemento_isolado", severidade: "media",
      regra: "Elemento cujas duas extremidades não tocam nenhum outro elemento.",
      recomendacao: "Verificar se o elemento pertence à estrutura; conectá-lo ou removê-lo.",
      mensagem: `${e.nome} está isolado (sem conexão).`, elementos: [e.nome],
    });
    else if (livres === 1) desconectados.push({
      tipo: "elemento_desconectado", severidade: "baixa",
      regra: "Elemento com uma extremidade solta (não conectada a outro elemento).",
      recomendacao: "Fechar o encontro/junta — extremidade solta pode indicar lacuna no modelo.",
      mensagem: `${e.nome} tem uma extremidade desconectada.`, elementos: [e.nome],
    });
  }
  return [...isolados, ...desconectados];
}

// ── 4. Layer vazio (declarado no DXF, sem geometria) ─────────────────────────
function layersVazios(geometria) {
  if (!geometria?.layers?.length) return [];
  const usados = new Set();
  (geometria.lines || []).forEach((l) => usados.add(l.layer));
  (geometria.polylines || []).forEach((p) => usados.add(p.layer));
  (geometria.blocks || []).forEach((b) => usados.add(b.layer));
  (geometria.texts || []).forEach((t) => usados.add(t.layer));
  return geometria.layers
    .filter((l) => l.nome && l.nome !== "0" && !usados.has(l.nome))
    .map((l) => ({
      tipo: "layer_vazio", severidade: "baixa",
      regra: "Layer declarado no DXF sem nenhuma entidade.",
      recomendacao: "Ignorar — não afeta o cálculo. Limpar o arquivo CAD se desejar.",
      mensagem: `Layer "${l.nome}" está vazio.`, elementos: [],
    }));
}

// ── 5. Perfil incompatível (parede↛montante, viga↛guia) ──────────────────────
function perfisIncompativeis(elementos, perfis) {
  if (!perfis?.length) return [];
  const byId = Object.fromEntries(perfis.map((p) => [p.id, p]));
  const esperado = { parede: "montante", viga: "guia" };
  const out = [];
  for (const e of elementos) {
    if (!e.perfil_id || !esperado[e.tipo]) continue;
    const perfil = byId[e.perfil_id];
    if (perfil && perfil.tipo && perfil.tipo !== esperado[e.tipo]) {
      out.push({
        tipo: "perfil_incompativel", severidade: "alta",
        regra: `${e.tipo} deve usar perfil do tipo "${esperado[e.tipo]}".`,
        recomendacao: `Trocar o perfil de ${e.nome} para um "${esperado[e.tipo]}".`,
        mensagem: `${e.nome} (${e.tipo}) está com perfil "${perfil.nome}" (${perfil.tipo}).`, elementos: [e.nome],
      });
    }
  }
  return out;
}

// ── 6. Abertura fora da parede ───────────────────────────────────────────────
function aberturasForaDaParede(elementos) {
  const paredes = elementos.filter((e) => e.tipo === "parede" && temGeo(e));
  const out = [];
  for (const a of elementos.filter((e) => e.tipo === "abertura" && temGeo(e))) {
    const px = a.geometria.x1, py = a.geometria.y1;
    const dMin = paredes.reduce((m, p) => Math.min(m, distPontoSegmento(px, py, p.geometria.x1, p.geometria.y1, p.geometria.x2, p.geometria.y2)), Infinity);
    if (dMin > 0.3) out.push({
      tipo: "abertura_fora_parede", severidade: "media",
      regra: "Abertura (porta/janela) não está sobre nenhuma parede (tolerância 0,30 m).",
      recomendacao: "Reposicionar a abertura sobre a parede correspondente ou reclassificá-la.",
      mensagem: `Abertura ${a.nome} está a ${dMin === Infinity ? "∞" : dMin.toFixed(2) + " m"} da parede mais próxima.`, elementos: [a.nome],
    });
  }
  return out;
}

// ── 7. Viga sem apoio (extremidades não tocam paredes) ───────────────────────
function vigasSemApoio(elementos) {
  const paredes = elementos.filter((e) => e.tipo === "parede" && temGeo(e));
  const nosParede = new Set();
  paredes.forEach((p) => endpoints(p).forEach((pt) => nosParede.add(nodeKey(pt.x, pt.y))));
  const out = [];
  for (const v of elementos.filter((e) => e.tipo === "viga" && temGeo(e))) {
    const apoios = endpoints(v).filter((pt) => nosParede.has(nodeKey(pt.x, pt.y))).length;
    if (apoios === 0) out.push({
      tipo: "viga_sem_apoio", severidade: "alta",
      regra: "Viga cujas extremidades não coincidem com nenhuma parede (sem apoio).",
      recomendacao: "Apoiar a viga sobre paredes/pilares nas extremidades antes do cálculo.",
      mensagem: `Viga ${v.nome} não tem apoio nas extremidades.`, elementos: [v.nome],
    });
  }
  return out;
}

/**
 * Executa todas as verificações. @param {{elementos, geometria, perfis?}} data
 * @returns {Array} conflitos, cada um com { tipo, severidade, regra, recomendacao, mensagem, elementos, id }
 */
export function detectarConflitos(data) {
  const { elementos, geometria, perfis } = data || {};
  if (!elementos || !elementos.length) return [];
  const paredes = elementos.filter((e) => e.tipo === "parede" && temGeo(e));

  const todos = [
    ...paredesDuplicadas(paredes),
    ...linhasSobrepostas(paredes),
    ...conectividade(elementos),
    ...layersVazios(geometria),
    ...perfisIncompativeis(elementos, perfis),
    ...aberturasForaDaParede(elementos),
    ...vigasSemApoio(elementos),
  ];
  const ordem = { alta: 0, media: 1, baixa: 2 };
  return todos
    .sort((a, b) => ordem[a.severidade] - ordem[b.severidade])
    .map((c, i) => ({ id: `${c.tipo}-${i}`, ...c }));
}
