/**
 * StickFEM™ — DXF Parser.
 * Lê o texto de um arquivo DXF (via dxf-parser) e devolve geometria normalizada
 * e agnóstica: layers, linhas, polilinhas, textos, blocos, círculos + bounds.
 * Unidades convertidas para metros (assume DXF em mm por padrão, configurável).
 */
import DxfParser from "dxf-parser";

const DEFAULT_ESCALA = 0.001; // mm → m

export function parseDXF(dxfText, { escala = DEFAULT_ESCALA } = {}) {
  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfText);
  if (!dxf) throw new Error("DXF inválido ou vazio.");

  const s = (v) => (typeof v === "number" ? v * escala : v);

  const layersMap = dxf.tables?.layer?.layers || {};
  const layers = Object.keys(layersMap).map((nome) => ({
    nome,
    cor: layersMap[nome].color ?? null,
  }));

  const lines = [];
  const polylines = [];
  const texts = [];
  const blocks = [];
  const circles = [];

  for (const e of dxf.entities || []) {
    const layer = e.layer || "0";
    switch (e.type) {
      case "LINE": {
        const [a, b] = e.vertices || [];
        if (a && b) lines.push({ layer, x1: s(a.x), y1: s(a.y), x2: s(b.x), y2: s(b.y) });
        break;
      }
      case "LWPOLYLINE":
      case "POLYLINE": {
        const pts = (e.vertices || []).map((v) => ({ x: s(v.x), y: s(v.y) }));
        if (pts.length >= 2) polylines.push({ layer, pontos: pts, fechada: !!e.shape || !!e.closed });
        break;
      }
      case "TEXT":
      case "MTEXT": {
        const p = e.startPoint || e.position || {};
        texts.push({ layer, texto: (e.text || "").trim(), x: s(p.x || 0), y: s(p.y || 0) });
        break;
      }
      case "CIRCLE":
      case "ARC": {
        const c = e.center || {};
        circles.push({ layer, x: s(c.x || 0), y: s(c.y || 0), r: s(e.radius || 0), tipo: e.type });
        break;
      }
      case "INSERT": {
        const p = e.position || {};
        blocks.push({ layer, nome: e.name || "", x: s(p.x || 0), y: s(p.y || 0) });
        break;
      }
      default:
        break;
    }
  }

  // Bounds (em metros)
  const xs = [], ys = [];
  const push = (x, y) => { if (x != null) xs.push(x); if (y != null) ys.push(y); };
  lines.forEach((l) => { push(l.x1, l.y1); push(l.x2, l.y2); });
  polylines.forEach((p) => p.pontos.forEach((pt) => push(pt.x, pt.y)));
  const bounds = xs.length
    ? { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
    : { minX: 0, minY: 0, maxX: 1, maxY: 1 };

  const stats = {
    layers: layers.length,
    linhas: lines.length,
    polilinhas: polylines.length,
    textos: texts.length,
    blocos: blocks.length,
    circulos: circles.length,
    largura_m: +(bounds.maxX - bounds.minX).toFixed(2),
    altura_m: +(bounds.maxY - bounds.minY).toFixed(2),
  };

  return { layers, lines, polylines, texts, blocks, circles, bounds, stats, escala };
}
