/**
 * IFC → StickQuote™ — Extração de quantitativo para Motor de Composição SF
 *
 * Analisa o texto STEP (.ifc) e extrai:
 * - Contagem de elementos por tipo IFC
 * - Áreas estimadas via IFCAREAMEASURE e heurísticas Steel Frame
 * - Mapeamento direto para composicoes_sf
 * - Validação de saúde do modelo (IFC Intake Validator)
 */

// ── Tipos IFC de interesse (paredes, lajes, estrutura) ───────────────────────
const IFC_WALL_TYPES = ["IFCWALL", "IFCWALLSTANDARDCASE", "IFCWALLSTANDARD"];
const IFC_SLAB_TYPES = ["IFCSLAB"];
// IFCROOFING não existe no schema IFC 2x3 / IFC4 — apenas IFCROOF é válido
const IFC_ROOF_TYPES = ["IFCROOF"];
const IFC_MBR_TYPES  = ["IFCMEMBER", "IFCCOLUMN", "IFCBEAM", "IFCSTRUCTURALMEMBER"];

// Schemas IFC reconhecidos
const IFC_SCHEMAS_VALIDOS = ["IFC2X3", "IFC4", "IFC4X1", "IFC4X2", "IFC4X3"];

// Limites físicos razoáveis para áreas de parede SF (m²)
const AREA_MIN_M2 = 0.5;
const AREA_MAX_M2 = 5000;

/**
 * Conta instâncias de um tipo IFC no texto STEP.
 * Usa regex `#NNN=IFCXXX(` para contar apenas linhas de definição.
 */
function contarTipo(upper, tipoIfc) {
  return (upper.match(new RegExp(`#\\d+=${tipoIfc}[\\s(]`, "g")) || []).length;
}

/**
 * Extrai metadados do cabeçalho STEP.
 * FILE_DESCRIPTION contém software de exportação.
 * FILE_SCHEMA contém a versão IFC.
 */
function extrairHeaderIFC(texto) {
  const descMatch   = texto.match(/FILE_DESCRIPTION\s*\(\s*\([^)]*'([^']*)'/i);
  const schemaMatch = texto.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i);
  return {
    software: descMatch?.[1]?.trim() || "desconhecido",
    schema:   schemaMatch?.[1]?.toUpperCase() || "desconhecido",
  };
}

/**
 * Extrai valores IFCAREAMEASURE contextualizados.
 *
 * Filtros semânticos aplicados para reduzir ruído:
 * - Valor entre AREA_MIN_M2 e AREA_MAX_M2
 * - Exclui valores < 0.5 m² que indicam seção transversal de perfil metálico
 *   (ex: seção C90×40 ≈ 0.0012 m²)
 *
 * Limitação conhecida: não extrai hierarquia IFC (IfcRelAssociates etc.),
 * apenas valores numéricos do texto STEP. Ver confidence score para mitigação.
 */
function extrairAreaMeasures(upper) {
  const areas = [];
  const re = /IFCAREAMEASURE\(([\d.]+)\)/gi;
  let m;
  while ((m = re.exec(upper)) !== null) {
    const v = parseFloat(m[1]);
    if (v >= AREA_MIN_M2 && v <= AREA_MAX_M2) areas.push(v);
  }
  return areas;
}

/**
 * Extrai comprimentos relevantes (para debug de dimensões de parede).
 */
function extrairLengthMeasures(upper) {
  const lens = [];
  const re = /IFCLENGTHM(?:EASURE)?\((-?[\d.]+)\)/gi;
  let m;
  while ((m = re.exec(upper)) !== null) {
    const v = Math.abs(parseFloat(m[1])) / 1000; // IFC geralmente usa mm → m
    if (v > 0.3 && v < 50) lens.push(v);
  }
  return lens;
}

/**
 * Calcula o nível de confiança da estimativa de área.
 *
 * "alta"  — IFCAREAMEASURE presente + elementos detectados
 * "media" — IFCAREAMEASURE presente mas sem elementos contados
 * "baixa" — sem IFCAREAMEASURE; área calculada por heurística (8 m²/IfcWall)
 */
function calcularConfianca(wallCount, slabCount, roofCount, mbrCount, areaMeasures) {
  if (areaMeasures.length === 0) return "baixa";
  const temElementos = wallCount > 0 || slabCount > 0 || roofCount > 0 || mbrCount > 0;
  return temElementos ? "alta" : "media";
}

// ── IFC Intake Validator ─────────────────────────────────────────────────────

/**
 * Valida o modelo IFC antes do mapeamento.
 * Retorna score de saúde (0–100), avisos e metadados do modelo.
 *
 * @param {string} texto — conteúdo do arquivo .ifc
 * @returns {IfcModelHealth}
 */
export function validarModeloIFC(texto) {
  const upper    = texto.toUpperCase();
  const header   = extrairHeaderIFC(texto);
  const warnings = [];

  const wallCount    = IFC_WALL_TYPES.reduce((s, t) => s + contarTipo(upper, t), 0);
  const slabCount    = IFC_SLAB_TYPES.reduce((s, t) => s + contarTipo(upper, t), 0);
  const roofCount    = IFC_ROOF_TYPES.reduce((s, t) => s + contarTipo(upper, t), 0);
  const mbrCount     = IFC_MBR_TYPES.reduce((s, t)  => s + contarTipo(upper, t), 0);
  const areaMeasures = extrairAreaMeasures(upper);

  let health = 100;

  // Schema IFC
  const schemaConhecido = IFC_SCHEMAS_VALIDOS.some((s) => header.schema.includes(s));
  if (!schemaConhecido) {
    warnings.push(`Schema IFC não reconhecido: "${header.schema}" — pode haver incompatibilidade de exportação`);
    health -= 15;
  }

  // Elementos estruturais
  const totalElementos = wallCount + slabCount + roofCount + mbrCount;
  if (totalElementos === 0) {
    warnings.push("Nenhuma família de parede, laje, cobertura ou membro estrutural detectada");
    health -= 40;
  }

  // IFCAREAMEASURE ausente
  if (areaMeasures.length === 0 && totalElementos > 0) {
    warnings.push(
      "Arquivo sem IFCAREAMEASURE — áreas calculadas por heurística (8 m²/parede). " +
      "Valide com a planta antes de usar o orçamento."
    );
    health -= 25;
  }

  // IFCAREAMEASURE com média suspeita (possível inclusão de seções transversais)
  if (areaMeasures.length > 0) {
    const somaArea  = areaMeasures.reduce((s, a) => s + a, 0);
    const mediaArea = somaArea / areaMeasures.length;
    if (mediaArea < 1.0) {
      warnings.push(
        `Média de IFCAREAMEASURE baixa (${mediaArea.toFixed(2)} m²) — ` +
        "possível inclusão de seções transversais de perfis metálicos"
      );
      health -= 15;
    }
    // Proporção alta: muitas áreas por elemento → aberturas incluídas
    if (wallCount > 0 && areaMeasures.length > wallCount * 10) {
      warnings.push(
        `Proporção alta: ${areaMeasures.length} medidas de área para ${wallCount} paredes — ` +
        "IFCAREAMEASURE pode incluir aberturas ou outras geometrias"
      );
      health -= 10;
    }
  }

  // Software de exportação
  const softwareLower = header.software.toLowerCase();
  const softwaresConhecidos = ["revit", "archicad", "allplan", "tekla", "vectorworks", "ifc"];
  const softwareReconhecido = softwaresConhecidos.some((s) => softwareLower.includes(s));
  if (!softwareReconhecido && header.software !== "desconhecido") {
    warnings.push(`Software de exportação não reconhecido: "${header.software}"`);
    health -= 5;
  }

  const confianca = calcularConfianca(wallCount, slabCount, roofCount, mbrCount, areaMeasures);

  return {
    modelHealth:       Math.max(0, Math.round(health)),
    confianca,         // "alta" | "media" | "baixa"
    schema:            header.schema,
    software:          header.software,
    warnings,
    elementosTotal:    totalElementos,
    areaMeasuresCount: areaMeasures.length,
  };
}

// ── Análise quantitativa ─────────────────────────────────────────────────────

/**
 * Analisa o texto IFC e retorna um resumo quantitativo com score de confiança.
 *
 * @param {string} texto — conteúdo do arquivo .ifc
 * @returns {IfcQuantitativoResult}
 */
export function analisarIFCText(texto) {
  const upper = texto.toUpperCase();

  // Contagem por família
  const wallCount = IFC_WALL_TYPES.reduce((s, t) => s + contarTipo(upper, t), 0);
  const slabCount = IFC_SLAB_TYPES.reduce((s, t) => s + contarTipo(upper, t), 0);
  const roofCount = IFC_ROOF_TYPES.reduce((s, t) => s + contarTipo(upper, t), 0);
  const mbrCount  = IFC_MBR_TYPES.reduce((s, t)  => s + contarTipo(upper, t), 0);

  // Medidas de área explícitas no IFC
  const areaMeasures    = extrairAreaMeasures(upper);
  const lengthMeasures  = extrairLengthMeasures(upper);
  const totalAreaMedida = areaMeasures.reduce((s, a) => s + a, 0);

  // Confidence score da estimativa
  const confianca = calcularConfianca(wallCount, slabCount, roofCount, mbrCount, areaMeasures);

  // ── Estimar área de parede ─────────────────────────────────────────────────
  let areaParede = 0;
  if (wallCount > 0) {
    if (totalAreaMedida > 0) {
      const wallFraction = wallCount / Math.max(1, wallCount + slabCount + roofCount);
      const mediaWall    = (totalAreaMedida * wallFraction) / wallCount;
      const mediaClamp   = Math.min(25, Math.max(3, mediaWall));
      areaParede = wallCount * mediaClamp;
    } else {
      // Heurística explicitamente marcada — confianca = "baixa"
      areaParede = wallCount * 8.0;
    }
  }
  // Fallback via membros estruturais
  if (areaParede === 0 && mbrCount > 0) {
    areaParede = mbrCount * 0.6 * 2.8 * 0.5;
  }

  // ── Estimar área de laje/forro ──────────────────────────────────────────────
  let areaLaje = 0;
  if (slabCount > 0) {
    if (totalAreaMedida > 0 && areaParede > 0) {
      const slabFraction = slabCount / Math.max(1, wallCount + slabCount + roofCount);
      areaLaje = (totalAreaMedida * slabFraction) / Math.max(1, slabCount) * slabCount;
      areaLaje = Math.min(areaLaje, totalAreaMedida * 0.8);
    } else {
      areaLaje = slabCount * 20.0;
    }
  }

  // ── Estimar área de cobertura ───────────────────────────────────────────────
  let areaCobertura = 0;
  if (roofCount > 0) {
    areaCobertura = Math.max(areaLaje * 1.2, roofCount * 20.0);
  }

  // ── Área construída total estimada ─────────────────────────────────────────
  const areaConstruidaEstimada = areaLaje > 0
    ? areaLaje
    : areaParede > 0 ? areaParede * 0.4 : 0;

  return {
    // Contagens brutas
    wallCount,
    slabCount,
    roofCount,
    mbrCount,
    // Medidas extraídas
    areaMeasures,
    totalAreaMedida:  Math.round(totalAreaMedida * 10) / 10,
    lengthMeasures:   lengthMeasures.slice(0, 20),
    // Estimativas de área por sistema
    areaParede:       Math.round(areaParede),
    areaLaje:         Math.round(areaLaje),
    areaCobertura:    Math.round(areaCobertura),
    areaConstruida:   Math.round(areaConstruidaEstimada),
    // Score de confiança
    confianca,        // "alta" | "media" | "baixa"
    // Metadados
    temDados: wallCount > 0 || slabCount > 0 || mbrCount > 0,
  };
}

// ── Mapeamento IFC → composições StickQuote™ ─────────────────────────────────

/**
 * Mapeamento de IFC detectado → sugestões de composição StickQuote™.
 * Retorna lista pronta para popular o MotorComposicao (editável pelo usuário).
 */
export function mapearComposicoes(resultado, composicoesDisponiveis) {
  const { wallCount, slabCount, mbrCount,
          areaParede, areaLaje, areaConstruida } = resultado;

  const compMap = Object.fromEntries(
    (composicoesDisponiveis || []).map((c) => [c.id, c])
  );

  const sugestoes = [];

  function addSugestao(composicaoId, areaEstimada, detectadoPor) {
    const comp = compMap[composicaoId]
      || Object.values(compMap).find((c) =>
          c.id === composicaoId ||
          c.nome?.toLowerCase().includes(composicaoId.replace(/-/g, " "))
        );
    if (!comp) return;
    if (areaEstimada <= 0) return;
    sugestoes.push({
      composicaoId:   comp.id,
      composicaoNome: comp.nome,
      composicaoCor:  comp.cor,
      areaEstimada:   Math.round(areaEstimada),
      area:           Math.round(areaEstimada),
      detectadoPor,
    });
  }

  if (wallCount > 0 && areaParede > 0) {
    addSugestao("par-ext",    Math.round(areaParede * 0.60), `${wallCount} IfcWall`);
    addSugestao("par-int-st", Math.round(areaParede * 0.40), `${wallCount} IfcWall`);
    addSugestao("isolamento", areaParede,                    `${wallCount} IfcWall`);
  }

  if (slabCount > 0 && areaLaje > 0) {
    addSugestao("forro-st", areaLaje, `${slabCount} IfcSlab`);
  }

  if ((wallCount > 0 || mbrCount > 0) && areaConstruida > 0) {
    addSugestao("estrutura-lsf", areaConstruida, "Área construída estimada");
  }

  return sugestoes;
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

/** Converte confianca em label + cores para UI. */
export function confiancaUI(confianca) {
  switch (confianca) {
    case "alta":  return { label: "Alta",  cor: "#059669", bg: "rgba(5,150,105,.12)",  border: "rgba(5,150,105,.3)"  };
    case "media": return { label: "Média", cor: "#b07a1e", bg: "rgba(176,122,30,.12)", border: "rgba(176,122,30,.3)" };
    default:      return { label: "Baixa", cor: "#981915", bg: "rgba(152,25,21,.12)",  border: "rgba(152,25,21,.3)"  };
  }
}

/** Converte modelHealth (0–100) em label + cores para UI. */
export function healthUI(score) {
  if (score >= 80) return { label: "Saudável",   cor: "#059669", bg: "rgba(5,150,105,.1)"  };
  if (score >= 60) return { label: "Atenção",    cor: "#b07a1e", bg: "rgba(176,122,30,.1)" };
  return              { label: "Problemático", cor: "#981915", bg: "rgba(152,25,21,.1)"  };
}
