/**
 * StickAI Structural Parser™ — interpreta a geometria do DXF e identifica
 * elementos estruturais (paredes, vigas, eixos, aberturas).
 *
 * Slice 1 = heurística determinística (layer + comprimento + blocos). É o
 * "ativo proprietário": transformar uma planta em estrutura calculável. A
 * camada de IA (StickAI Engineer™) refina isso numa fase posterior.
 */

import { computarConfianca } from "./confianca";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const LAYER_HINTS = [
  { tipo: "parede",   re: /parede|wall|muro|alvenaria|lsf|steel|montante|vedac/ },
  { tipo: "viga",     re: /viga|beam|verga|padieira/ },
  { tipo: "eixo",     re: /eixo|axis|grid|referen/ },
  { tipo: "abertura", re: /porta|janela|door|window|vao|abertura/ },
];

const BLOCK_ABERTURA = /porta|janela|door|window/;

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Quebra polilinhas em segmentos.
function segmentos(geometria) {
  const segs = [];
  for (const l of geometria.lines || []) {
    segs.push({ x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, layer: l.layer });
  }
  for (const p of geometria.polylines || []) {
    const pts = p.pontos;
    for (let i = 0; i < pts.length - 1; i++) {
      segs.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[i + 1].x, y2: pts[i + 1].y, layer: p.layer });
    }
    if (p.fechada && pts.length > 2) {
      const a = pts[pts.length - 1], b = pts[0];
      segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, layer: p.layer });
    }
  }
  return segs;
}

function classificarPorLayer(layer) {
  const n = norm(layer);
  for (const h of LAYER_HINTS) if (h.re.test(n)) return h.tipo;
  return null;
}

/**
 * Lista os layers presentes na geometria com o tipo sugerido pela heurística —
 * base para a tela de confirmação de layers (o engenheiro ajusta antes de gerar).
 */
export function layersDetectados(geometria) {
  const cont = {};
  const push = (layer) => {
    if (!cont[layer]) cont[layer] = { layer, segmentos: 0, sugerido: classificarPorLayer(layer) || "parede" };
    cont[layer].segmentos += 1;
  };
  (geometria.lines || []).forEach((l) => push(l.layer || "0"));
  (geometria.polylines || []).forEach((p) => push(p.layer || "0"));
  return Object.values(cont).sort((a, b) => b.segmentos - a.segmentos);
}

/**
 * @param geometria  saída do parseDXF()
 * @param opts       { peDireito=2.8, minParedeM=0.3, maxParedeM=30 }
 * @returns { elementos, resumo }
 */
export function parseEstrutura(geometria, opts = {}) {
  const peDireito = opts.peDireito ?? 2.8;
  const minM = opts.minParedeM ?? 0.3;
  const maxM = opts.maxParedeM ?? 30;

  const segs = segmentos(geometria);
  const elementos = [];
  let idx = 0;

  const layerConfig = opts.layerConfig || {};

  for (const s of segs) {
    const L = dist(s.x1, s.y1, s.x2, s.y2);
    if (L < minM || L > maxM) continue;

    const override = layerConfig[s.layer];
    if (override === "ignorar") continue;

    const layerTipo = classificarPorLayer(s.layer);
    let tipo;
    const motivosConfianca = [];

    if (override) {
      tipo = override;
      motivosConfianca.push(`Classificado como '${tipo}' pela configuração do engenheiro.`);
    } else if (layerTipo) {
      tipo = layerTipo;
      motivosConfianca.push(`Reconhecido como '${tipo}' pelo nome do layer ('${s.layer}').`);
    } else {
      tipo = "parede";
      motivosConfianca.push(L > 1.0
        ? `Assumido como 'parede' por ter comprimento significativo (${L.toFixed(2)}m).`
        : `Assumido como 'parede' com baixa confiança (comprimento curto, layer '${s.layer}' não reconhecido).`);
    }
    if (tipo === "eixo") continue;

    // IA Explicável — índice numérico de confiança + fatores/pesos.
    const conf = computarConfianca({
      geometriaValida: true, layerReconhecido: !!layerTipo,
      comprimento_m: L, confirmadoEngenheiro: !!override,
    });
    const confianca = conf.nivel;

    idx += 1;
    const prefixo = tipo === "parede" ? "P" : tipo === "viga" ? "V" : "E";
    elementos.push({
      tipo,
      nome: `${prefixo}${idx}`,
      geometria: {
        x1: +s.x1.toFixed(3), y1: +s.y1.toFixed(3),
        x2: +s.x2.toFixed(3), y2: +s.y2.toFixed(3),
      },
      comprimento_m: +L.toFixed(2),
      altura_m: tipo === "parede" ? peDireito : null,
      layer_origem: s.layer,
      confianca,
      confiancaScore: conf.score,       // IA Explicável — índice numérico 0–100
      confiancaFatores: conf.fatores,   // fatores + pesos que compõem o score
      motivosConfianca,                 // explicação textual
      quantidade: 1,
      propriedades: {},
    });
  }

  // Aberturas a partir de blocos
  for (const b of geometria.blocks || []) {
    if (BLOCK_ABERTURA.test(norm(b.nome))) {
      idx += 1;
      const confAb = computarConfianca({ geometriaValida: true, layerReconhecido: true, comprimento_m: 0 });
      elementos.push({
        tipo: "abertura",
        nome: `A${idx}`,
        geometria: { x1: +b.x.toFixed(3), y1: +b.y.toFixed(3), x2: +b.x.toFixed(3), y2: +b.y.toFixed(3) },
        comprimento_m: null, altura_m: null, layer_origem: b.layer,
        confianca: confAb.nivel,
        confiancaScore: confAb.score,
        confiancaFatores: confAb.fatores,
        motivosConfianca: [`Reconhecido como 'abertura' pelo nome do bloco ('${b.nome}').`],
        quantidade: 1, propriedades: { bloco: b.nome },
      });
    }
  }
  
  // ... (resumo)
  const paredes = elementos.filter((e) => e.tipo === "parede");
  const resumo = {
    total: elementos.length,
    paredes: paredes.length,
    vigas: elementos.filter((e) => e.tipo === "viga").length,
    aberturas: elementos.filter((e) => e.tipo === "abertura").length,
    comprimentoParedes_m: +paredes.reduce((s, e) => s + (e.comprimento_m || 0), 0).toFixed(2),
    confiancaScoreMedia: elementos.length
      ? Math.round(elementos.reduce((s, e) => s + (e.confiancaScore ?? 0), 0) / elementos.length)
      : 0,
    confiancaGlobal: paredes.length && paredes.every((p) => p.confianca === "baixa") ? "baixa" : "media",
  };

  return { elementos, resumo };
}
