// StickQuote™ PDF Measurement Engine
// Extrai medidas de PDFs arquitetônicos brasileiros e estima áreas Steel Frame

async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjsLib;
}

// Converte string BR ("149,00" ou "149.00") para número
function brToNum(s) {
  if (!s) return 0;
  const clean = String(s).trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

// Extrai todo o texto do PDF (todas as páginas)
export async function extractPDFText(file) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return text;
}

// Parseia medidas do texto extraído
export function parseMeasurements(text) {
  const t = text;

  // ── ÁREAS ──
  // "Área construída: 149,00 m²"  /  "149,00 m²"  /  "149m2"
  const areaMatches = [];
  const areaPatterns = [
    /[Áá]rea\s*(?:constru[íi]da|total|[Úú]til|privativa|bruta)?\s*[=:]\s*([\d.,]+)\s*m[²2]/gi,
    /(\d{2,4}[,.]?\d{0,2})\s*m[²2]/g,
  ];
  for (const pat of areaPatterns) {
    let m;
    while ((m = pat.exec(t)) !== null) {
      const v = brToNum(m[1]);
      if (v >= 20 && v <= 5000) areaMatches.push(v);
    }
  }
  // Área construída: maior valor razoável encontrado
  const areaConstruida = areaMatches.length > 0 ? Math.max(...areaMatches) : 0;

  // ── AMBIENTES (dimensões X) ──
  // "5,00 x 4,00"  /  "5.00X4.00"  /  "Sala 5,00x4,00"
  const ambientes = [];
  const dimPat = /([A-Za-zÀ-ÿ\s]{2,20})?\s*([\d.,]+)\s*[xX×]\s*([\d.,]+)/g;
  let dm;
  while ((dm = dimPat.exec(t)) !== null) {
    const lbl = (dm[1] || "").trim();
    const w = brToNum(dm[2]);
    const h = brToNum(dm[3]);
    if (w >= 0.5 && w <= 50 && h >= 0.5 && h <= 50) {
      ambientes.push({ label: lbl || `Ambiente ${ambientes.length + 1}`, w, h, area: parseFloat((w * h).toFixed(2)) });
    }
  }

  // ── PÉ DIREITO / ALTURA ──
  const altPatterns = [
    /p[eé]\s*direito\s*[=:]?\s*([\d.,]+)/i,
    /altura\s*(?:livre|[=:])?\s*([\d.,]+)\s*m/i,
    /h\s*=\s*([\d.,]+)\s*m/i,
    /2[,.](?:70|80|60|75|65|90|95)\s*m/,
  ];
  let alturaMedia = 2.7;
  for (const p of altPatterns) {
    const m = t.match(p);
    if (m) {
      const v = brToNum(m[1]);
      if (v >= 2.0 && v <= 5.0) { alturaMedia = v; break; }
    }
  }

  // ── CONTAGEM DE COTAS (qualidade do PDF) ──
  const cotaCount = (t.match(/\d+[,.]?\d*\s*m(?![²2])/g) || []).length;

  // ── METADADOS DE ORIGEM por medida ──
  const medidasDetalhadas = {
    areaConstruida: {
      valor: areaConstruida,
      tipo: areaConstruida > 0 ? "extraido" : "inferido",
      origem: areaConstruida > 0 ? "texto_pdf" : "calculo",
    },
    alturaMedia: {
      valor: alturaMedia,
      tipo: alturaMedia !== 2.7 ? "extraido" : "inferido",
      origem: alturaMedia !== 2.7 ? "texto_pdf" : "calculo",
    },
  };

  return { areaConstruida, ambientes, alturaMedia, cotaCount, rawText: t.slice(0, 800), medidasDetalhadas };
}

// Estima áreas Steel Frame a partir das medidas encontradas
export function estimarAreasSF(parsed) {
  const { areaConstruida, ambientes, alturaMedia } = parsed;

  let area = areaConstruida;

  // Se não encontrou área explícita, tenta somar ambientes
  if (!area && ambientes.length > 0) {
    area = ambientes.reduce((a, b) => a + b.area, 0);
  }

  // Último recurso: estima por m² médio residencial
  if (!area) area = 0;

  const h = alturaMedia;

  // Perímetro estimado de um retângulo de mesma área (fórmula razoável)
  const perimetroExt = area > 0 ? Math.round(4 * Math.sqrt(area) * 10) / 10 : 0;

  // Paredes externas = perímetro × altura
  const paredesExternas = parseFloat((perimetroExt * h).toFixed(1));

  // Paredes internas: estima 55% da área construída × altura (padrão residencial SF)
  const paredesInternas = parseFloat((area * 0.55 * h).toFixed(1));

  // Forro = área construída
  const forro = parseFloat(area.toFixed(1));

  // Cobertura = área × fator inclinação 1.25
  const cobertura = parseFloat((area * 1.25).toFixed(1));

  // Todas as derivadas são sempre "inferido/calculo" — exceto área que vem do parsed
  const meta = (v, tipo, origem) => ({ valor: v, tipo, origem });
  const areaOrigem = parsed.medidasDetalhadas?.areaConstruida;
  return {
    area: parseFloat(area.toFixed(1)),
    paredesExternas, paredesInternas, forro, cobertura, perimetroExt,
    metadados: {
      area:           areaOrigem || meta(area, "inferido", "calculo"),
      paredesExternas: meta(paredesExternas, "inferido", "calculo"),
      paredesInternas: meta(paredesInternas, "inferido", "calculo"),
      forro:           meta(forro,           areaOrigem?.tipo === "extraido" ? "inferido" : "inferido", "calculo"),
      cobertura:       meta(cobertura,       "inferido", "calculo"),
      alturaMedia:     parsed.medidasDetalhadas?.alturaMedia || meta(parsed.alturaMedia, "inferido", "calculo"),
    },
  };
}

// Calcula StickTrust™ score (0–100)
export function calcularConfiancaPDF(parsed, areas) {
  let score = 40; // base
  const { areaConstruida, ambientes, cotaCount, alturaMedia } = parsed;

  if (areaConstruida > 0) score += 20;          // área explícita encontrada
  if (ambientes.length >= 2) score += 15;       // dimensões de ambientes
  if (cotaCount >= 10) score += 10;             // muitas cotas
  if (alturaMedia !== 2.7) score += 5;          // pé direito explícito
  if (areas.perimetroExt > 0) score += 5;       // perímetro calculado
  if (ambientes.length === 0 && areaConstruida === 0) score -= 20; // nada encontrado

  score = Math.max(20, Math.min(96, score));
  const nivel = score >= 80 ? "alto" : score >= 60 ? "medio" : "baixo";
  return { score, nivel };
}

// Função principal — roda tudo e retorna resultado completo
export async function analisarPDF(file) {
  const text = await extractPDFText(file);
  const parsed = parseMeasurements(text);
  const areas = estimarAreasSF(parsed);
  const { score, nivel } = calcularConfiancaPDF(parsed, areas);

  return {
    origem: "PDF",
    confianca: score,
    nivel,
    areaConstruida: areas.area,
    paredesExternas: areas.paredesExternas,
    paredesInternas: areas.paredesInternas,
    forro: areas.forro,
    cobertura: areas.cobertura,
    alturaMedia: parsed.alturaMedia,
    metadados: areas.metadados,
    ambientes: parsed.ambientes,
    cotaCount: parsed.cotaCount,
    perimetroExt: areas.perimetroExt,
    rawText: parsed.rawText,
  };
}
