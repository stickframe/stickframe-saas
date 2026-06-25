// StickQuote™ DWG Measurement Engine
// Aceita DXF (texto) e DWG (binário com fallback de extração textual)
// Retorna mesma estrutura do pdfMeasurementEngine para reutilizar o motor

// ── Mapeamento de layers construtivos → sistema SF ──
const LAYER_MAP = {
  // Paredes externas
  "PAREDE_EXT":        { sistema: "paredesExternas", label: "Parede ext. Steel Frame" },
  "PAREDE-EXT":        { sistema: "paredesExternas", label: "Parede ext. Steel Frame" },
  "PAREDE EXT":        { sistema: "paredesExternas", label: "Parede ext. Steel Frame" },
  "WALL_EXT":          { sistema: "paredesExternas", label: "Parede ext. Steel Frame" },
  "A-WALL-EXT":        { sistema: "paredesExternas", label: "Parede ext. Steel Frame" },
  "PAREDES EXT":       { sistema: "paredesExternas", label: "Parede ext. Steel Frame" },
  // Paredes internas
  "PAREDE_INT":        { sistema: "paredesInternas", label: "Parede int. Drywall" },
  "PAREDE-INT":        { sistema: "paredesInternas", label: "Parede int. Drywall" },
  "PAREDE INT":        { sistema: "paredesInternas", label: "Parede int. Drywall" },
  "WALL_INT":          { sistema: "paredesInternas", label: "Parede int. Drywall" },
  "A-WALL-INT":        { sistema: "paredesInternas", label: "Parede int. Drywall" },
  "PAREDES INT":       { sistema: "paredesInternas", label: "Parede int. Drywall" },
  "DRYWALL":           { sistema: "paredesInternas", label: "Parede int. Drywall" },
  // Genérico — assume parede externa
  "PAREDE":            { sistema: "paredesExternas", label: "Parede Steel Frame" },
  "PAREDES":           { sistema: "paredesExternas", label: "Parede Steel Frame" },
  "WALL":              { sistema: "paredesExternas", label: "Parede Steel Frame" },
  "A-WALL":            { sistema: "paredesExternas", label: "Parede Steel Frame" },
  // Cobertura
  "COBERTURA":         { sistema: "cobertura", label: "Cobertura LSF" },
  "TELHADO":           { sistema: "cobertura", label: "Cobertura LSF" },
  "ROOF":              { sistema: "cobertura", label: "Cobertura LSF" },
  "A-ROOF":            { sistema: "cobertura", label: "Cobertura LSF" },
  // Forro
  "FORRO":             { sistema: "forro", label: "Forro ST" },
  "CEILING":           { sistema: "forro", label: "Forro ST" },
  "A-CEIL":            { sistema: "forro", label: "Forro ST" },
  // Laje / piso
  "LAJE":              { sistema: "forro", label: "Forro/Laje" },
  "PISO":              { sistema: "forro", label: "Forro/Laje" },
  "SLAB":              { sistema: "forro", label: "Forro/Laje" },
};

// ── Normaliza nome de layer ──
function normalizeLayer(name) {
  return (name || "").toUpperCase().trim();
}

function matchLayer(name) {
  const n = normalizeLayer(name);
  if (LAYER_MAP[n]) return LAYER_MAP[n];
  // partial match
  for (const [k, v] of Object.entries(LAYER_MAP)) {
    if (n.includes(k) || k.includes(n)) return v;
  }
  return null;
}

// ── Comprimento 2D entre dois pontos ──
function dist2(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ── Área de polilinha fechada (Shoelace) ──
function polylineArea(vertices) {
  let a = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += vertices[i].x * vertices[j].y;
    a -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(a) / 2;
}

// ── Comprimento de polilinha ──
function polylineLength(vertices) {
  let len = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    len += dist2(vertices[i].x, vertices[i].y, vertices[i + 1].x, vertices[i + 1].y);
  }
  return len;
}

// ── Detectar unidade de medida (mm vs m) ──
// Arquivos brasileiros frequentemente estão em mm (1 unidade = 1 mm)
function detectUnit(entities) {
  // Se a maioria das linhas tem comprimento > 100, provavelmente está em mm
  const lengths = [];
  for (const e of entities || []) {
    if (e.type === "LINE" && e.vertices?.length >= 2) {
      lengths.push(dist2(e.vertices[0].x, e.vertices[0].y, e.vertices[1].x, e.vertices[1].y));
    }
  }
  if (lengths.length === 0) return 1;
  const median = lengths.sort((a, b) => a - b)[Math.floor(lengths.length / 2)];
  // Se mediana > 500, assume mm → divide por 1000
  return median > 500 ? 0.001 : 1;
}

// ── Parse DXF text ──
async function parseDXF(text) {
  const DxfParser = (await import("dxf-parser")).default;
  const parser = new DxfParser();
  try {
    return parser.parseSync(text);
  } catch {
    return null;
  }
}

// ── Extração textual de fallback (DWG binário) ──
// Lê strings ASCII do binário e extrai cotas e nomes de layer
function extractFromBinary(buffer) {
  const bytes = new Uint8Array(buffer);
  let text = "";
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if ((c >= 32 && c < 127) || c === 10 || c === 13) {
      text += String.fromCharCode(c);
    } else {
      text += " ";
    }
  }

  // Extrai nomes de layer encontrados no texto
  const layerNames = new Set();
  const layerPat = /(?:LAYER|layer)\s*\n?\s*([A-Z_][A-Z0-9_\-\s]{1,30})/g;
  let m;
  while ((m = layerPat.exec(text)) !== null) {
    layerNames.add(m[1].trim().toUpperCase());
  }

  // Busca todos os termos que parecem layer
  for (const key of Object.keys(LAYER_MAP)) {
    if (text.toUpperCase().includes(key)) layerNames.add(key);
  }

  // Extrai cotas numéricas (brasileiras e internacionais)
  const cotaPat = /\b(\d{1,4}[,.]?\d{0,3})\s*(?:m|M)?\b/g;
  const cotas = [];
  while ((m = cotaPat.exec(text)) !== null) {
    const v = parseFloat(m[1].replace(",", "."));
    if (v >= 0.5 && v <= 5000) cotas.push(v);
  }

  return { layerNames: [...layerNames], cotas, rawText: text.slice(0, 1000) };
}

// ── Análise principal DXF via parser ──
function analisarDXF(dxf) {
  const entities = dxf.entities || [];
  const scale = detectUnit(entities);

  const layerLengths = {}; // sistema → comprimento total em metros
  const layerAreas = {};   // sistema → área total em m²
  const layersDetectadas = new Set();
  const cotas = [];

  for (const e of entities) {
    const layer = e.layer || "";
    const mapped = matchLayer(layer);
    if (mapped) layersDetectadas.add(normalizeLayer(layer));

    if (e.type === "LINE" && e.vertices?.length >= 2) {
      const len = dist2(e.vertices[0].x, e.vertices[0].y, e.vertices[1].x, e.vertices[1].y) * scale;
      if (mapped && len > 0.05 && len < 200) {
        layerLengths[mapped.sistema] = (layerLengths[mapped.sistema] || 0) + len;
      }
    }

    if ((e.type === "LWPOLYLINE" || e.type === "POLYLINE") && e.vertices?.length >= 3) {
      const verts = e.vertices.map(v => ({ x: v.x * scale, y: v.y * scale }));
      const isClosed = e.shape || (e.vertices[0].x === e.vertices[e.vertices.length - 1].x);
      const len = polylineLength(verts);
      const area = isClosed ? polylineArea(verts) : 0;

      if (mapped) {
        if (len > 0.1 && len < 2000) {
          layerLengths[mapped.sistema] = (layerLengths[mapped.sistema] || 0) + len;
        }
        if (area > 1 && area < 10000) {
          layerAreas[mapped.sistema] = (layerAreas[mapped.sistema] || 0) + area;
        }
      }

      // Área fechada genérica → candidata a área construída
      if (isClosed && area > 5 && area < 10000 && !mapped) {
        layerAreas["_generic"] = (layerAreas["_generic"] || 0) + area;
      }
    }

    // Dimensão / cota
    if (e.type === "DIMENSION" || e.type === "MTEXT" || e.type === "TEXT") {
      const txt = e.text || e.string || "";
      const cotaPat = /(\d{1,4}[,.]?\d{0,2})/g;
      let m;
      while ((m = cotaPat.exec(txt)) !== null) {
        const v = parseFloat(m[1].replace(",", "."));
        if (v >= 0.5 && v <= 50) cotas.push(v);
      }
      if (e.type === "DIMENSION" && e.length) {
        cotas.push(e.length * scale);
      }
    }
  }

  return { layerLengths, layerAreas, layersDetectadas: [...layersDetectadas], cotas };
}

// ── Inferir áreas SF a partir de comprimentos de parede ──
function inferirAreas(layerLengths, layerAreas, alturaMedia) {
  // Área construída: forro ou genérico ou estimativa a partir de perímetro externo
  let areaConstruida = layerAreas["forro"] || layerAreas["_generic"] || 0;

  const perimetroExt = layerLengths["paredesExternas"] || 0;
  if (!areaConstruida && perimetroExt > 4) {
    // Área ≈ (perimetro/4)² para plantas quadradas
    areaConstruida = Math.round(Math.pow(perimetroExt / 4, 2) * 10) / 10;
  }

  const paredesExternas = layerLengths["paredesExternas"]
    ? parseFloat((layerLengths["paredesExternas"] * alturaMedia).toFixed(1))
    : areaConstruida > 0 ? parseFloat((4 * Math.sqrt(areaConstruida) * alturaMedia).toFixed(1)) : 0;

  const paredesInternas = layerLengths["paredesInternas"]
    ? parseFloat((layerLengths["paredesInternas"] * alturaMedia).toFixed(1))
    : areaConstruida > 0 ? parseFloat((areaConstruida * 0.55 * alturaMedia).toFixed(1)) : 0;

  const forro    = layerAreas["forro"]    || parseFloat(areaConstruida.toFixed(1));
  const cobertura = layerAreas["cobertura"] || parseFloat((areaConstruida * 1.25).toFixed(1));

  return {
    areaConstruida: parseFloat(areaConstruida.toFixed(1)),
    paredesExternas,
    paredesInternas,
    forro: parseFloat(forro.toFixed(1)),
    cobertura: parseFloat(cobertura.toFixed(1)),
    perimetroExt: parseFloat(perimetroExt.toFixed(1)),
  };
}

// ── StickTrust™ para DWG ──
function calcularConfiancaDWG(layersDetectadas, cotas, areas, origem) {
  let score = 30;
  if (origem === "dxf") score += 10; // DXF tem estrutura real

  const sistemasEncontrados = new Set(
    layersDetectadas.map(l => matchLayer(l)?.sistema).filter(Boolean)
  );
  score += sistemasEncontrados.size * 12;       // até +48 (4 sistemas)
  if (cotas.length >= 5) score += 10;
  if (cotas.length >= 20) score += 5;
  if (areas.areaConstruida > 0) score += 10;
  if (areas.perimetroExt > 0) score += 5;
  if (layersDetectadas.length === 0) score -= 20;

  score = Math.max(20, Math.min(95, score));
  const nivel = score >= 75 ? "alto" : score >= 50 ? "medio" : "baixo";
  return { score, nivel };
}

// ── Detectar pé direito nas cotas ──
function detectarAlturaMedia(cotas) {
  const alturas = cotas.filter(v => v >= 2.0 && v <= 4.5);
  if (alturas.length === 0) return 2.7;
  // Moda simples: valor mais frequente ≈ pé direito declarado
  const freq = {};
  for (const v of alturas) {
    const k = v.toFixed(1);
    freq[k] = (freq[k] || 0) + 1;
  }
  const moda = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  return parseFloat(moda[0]);
}

// ── Função principal ──
export async function analisarDWG(file) {
  const buffer = await file.arrayBuffer();
  const isDXF = file.name.toLowerCase().endsWith(".dxf");

  let layerLengths = {}, layerAreas = {}, layersDetectadas = [], cotas = [];
  let origem = "dwg_text";

  if (isDXF) {
    // DXF: parse estruturado
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const dxf = await parseDXF(text);
    if (dxf) {
      const result = analisarDXF(dxf);
      layerLengths = result.layerLengths;
      layerAreas   = result.layerAreas;
      layersDetectadas = result.layersDetectadas;
      cotas        = result.cotas;
      origem       = "dxf";
    } else {
      // fallback textual no DXF malformado
      const fb = extractFromBinary(buffer);
      layersDetectadas = fb.layerNames;
      cotas = fb.cotas;
    }
  } else {
    // DWG: binário → extração textual
    const fb = extractFromBinary(buffer);
    layersDetectadas = fb.layerNames;
    cotas = fb.cotas;
  }

  const alturaMedia = detectarAlturaMedia(cotas);
  const areas = inferirAreas(layerLengths, layerAreas, alturaMedia);
  const { score, nivel } = calcularConfiancaDWG(layersDetectadas, cotas, areas, origem);

  // Metadados de origem por campo (mesmo padrão do pdfMeasurementEngine)
  const meta = (valor, tipo, src) => ({ valor, tipo, origem: src });
  const metadados = {
    area:            meta(areas.areaConstruida, layerAreas["forro"] || layerAreas["_generic"] ? "extraido" : "inferido", origem === "dxf" ? "geometria_dxf" : "calculo"),
    paredesExternas: meta(areas.paredesExternas, layerLengths["paredesExternas"] ? "extraido" : "inferido", layerLengths["paredesExternas"] ? "geometria_dxf" : "calculo"),
    paredesInternas: meta(areas.paredesInternas, layerLengths["paredesInternas"] ? "extraido" : "inferido", layerLengths["paredesInternas"] ? "geometria_dxf" : "calculo"),
    forro:           meta(areas.forro,           layerAreas["forro"] ? "extraido" : "inferido", layerAreas["forro"] ? "geometria_dxf" : "calculo"),
    cobertura:       meta(areas.cobertura,       layerAreas["cobertura"] ? "extraido" : "inferido", layerAreas["cobertura"] ? "geometria_dxf" : "calculo"),
    alturaMedia:     meta(alturaMedia,           cotas.filter(v => v >= 2 && v <= 4.5).length > 0 ? "extraido" : "inferido", "cotas"),
  };

  return {
    origem: "DWG",
    origemDetalhe: isDXF ? "DXF (estruturado)" : "DWG (extração textual)",
    confianca: score,
    nivel,
    areaConstruida: areas.areaConstruida,
    paredesExternas: areas.paredesExternas,
    paredesInternas: areas.paredesInternas,
    forro: areas.forro,
    cobertura: areas.cobertura,
    alturaMedia,
    perimetroExt: areas.perimetroExt,
    layersDetectadas,
    cotaCount: cotas.length,
    metadados,
  };
}
