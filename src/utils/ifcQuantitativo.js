/**
 * IFC → StickQuote™ — Extração de quantitativo para Motor de Composição SF
 *
 * Analisa o texto STEP (.ifc) e extrai:
 * - Contagem de elementos por tipo IFC
 * - Áreas estimadas via IFCAREAMEASURE e heurísticas Steel Frame
 * - Mapeamento direto para composicoes_sf
 */

// ── Tipos IFC de interesse (paredes, lajes, estrutura) ───────────────────────
const IFC_WALL_TYPES  = ["IFCWALL", "IFCWALLSTANDARDCASE", "IFCWALLSTANDARD"];
const IFC_SLAB_TYPES  = ["IFCSLAB"];
const IFC_ROOF_TYPES  = ["IFCROOF", "IFCROOFING"];
const IFC_MBR_TYPES   = ["IFCMEMBER", "IFCCOLUMN", "IFCBEAM", "IFCSTRUCTURALMEMBER"];

/**
 * Conta instâncias de um tipo IFC no texto STEP.
 * Usa regex `#NNN=IFCXXX(` para contar apenas linhas de definição.
 */
function contarTipo(upper, tipoIfc) {
  return (upper.match(new RegExp(`#\\d+=${tipoIfc}[\\s(]`, "g")) || []).length;
}

/**
 * Extrai todos os valores IFCAREAMEASURE do arquivo.
 * No formato STEP, áreas aparecem como: IFCAREAMEASURE(8.4)
 * Filtra valores > 0.5m² e < 5000m² para evitar ruído.
 */
function extrairAreaMeasures(upper) {
  const areas = [];
  const re = /IFCAREAMEASURE\(([\d.]+)\)/gi;
  let m;
  while ((m = re.exec(upper)) !== null) {
    const v = parseFloat(m[1]);
    if (v > 0.5 && v < 5000) areas.push(v);
  }
  return areas;
}

/**
 * Extrai comprimentos relevantes (para estimar área de parede via IFCLENGTHM.).
 * IfcWall geralmente tem XDim e YDim em IfcExtrudedAreaSolid.
 * Pega pares de valores IfcLengthMeasure próximos a dimensões típicas de parede (0.5–20m).
 */
function extrairLengthMeasures(upper) {
  const lens = [];
  const re = /IFCLENGTHM(?:EASURE)?\((-?[\d.]+)\)/gi;
  let m;
  while ((m = re.exec(upper)) !== null) {
    const v = Math.abs(parseFloat(m[1])) / 1000; // IFC usa mm → converter para m
    if (v > 0.3 && v < 50) lens.push(v); // filtra dimensões razoáveis de parede
  }
  return lens;
}

/**
 * Analisa o texto IFC e retorna um resumo quantitativo.
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
  const areaMeasures  = extrairAreaMeasures(upper);
  const lengthMeasures = extrairLengthMeasures(upper);
  const totalAreaMedida = areaMeasures.reduce((s, a) => s + a, 0);

  // Estimar área de parede ─────────────────────────────────────────────────────
  // Se o IFC tem medidas de área, usá-las como referência
  // Caso contrário, heurística: Steel Frame típico = 6-9 m² por instância IfcWall
  let areaParede = 0;
  if (wallCount > 0) {
    if (totalAreaMedida > 0) {
      // Distribuir proporcionalmente pelas instâncias de parede
      // (IfcAreaMeasure inclui slabs e paredes, aproximação razoável)
      const wallFraction = wallCount / Math.max(1, wallCount + slabCount + roofCount);
      const mediaWall = (totalAreaMedida * wallFraction) / wallCount;
      // Limitar entre 3m² e 25m² por instância (parede SF típica)
      const mediaClamp = Math.min(25, Math.max(3, mediaWall));
      areaParede = wallCount * mediaClamp;
    } else {
      // Sem IFCAREAMEASURE: heurística de módulo SF (3m × 2,7m = ~8m² por instância)
      areaParede = wallCount * 8.0;
    }
  }
  // Fallback via membros estruturais: montante 600mm spacing × altura 2,8m
  if (areaParede === 0 && mbrCount > 0) {
    // Montantes: N × 0,6m espaç. × 2,8m alt. / 2 lados = área de paredes internas
    areaParede = mbrCount * 0.6 * 2.8 * 0.5;
  }

  // Estimar área de laje/forro
  let areaLaje = 0;
  if (slabCount > 0) {
    if (totalAreaMedida > 0 && areaParede > 0) {
      // Área de laje ≈ restante das medidas não alocadas às paredes
      const slabFraction = slabCount / Math.max(1, wallCount + slabCount + roofCount);
      areaLaje = (totalAreaMedida * slabFraction) / Math.max(1, slabCount) * slabCount;
      areaLaje = Math.min(areaLaje, totalAreaMedida * 0.8); // cap 80%
    } else {
      areaLaje = slabCount * 20.0; // ~20m² por laje
    }
  }

  // Estimar área de cobertura
  let areaCobertura = 0;
  if (roofCount > 0) {
    areaCobertura = roofCount > 0 ? Math.max(areaLaje * 1.2, roofCount * 20.0) : 0;
  }

  // Área construída total estimada (base para estrutura LSF)
  // Para SF: área de laje ≈ área útil construída
  const areaConstruidaEstimada = areaLaje > 0
    ? areaLaje
    : areaParede > 0 ? areaParede * 0.4 : 0; // sem laje, estimar via paredes

  return {
    // Contagens brutas
    wallCount,
    slabCount,
    roofCount,
    mbrCount,
    // Medidas extraídas
    areaMeasures,
    totalAreaMedida: Math.round(totalAreaMedida * 10) / 10,
    lengthMeasures: lengthMeasures.slice(0, 20), // primeiros 20 para debug
    // Estimativas de área por sistema
    areaParede:      Math.round(areaParede),
    areaLaje:        Math.round(areaLaje),
    areaCobertura:   Math.round(areaCobertura),
    areaConstruida:  Math.round(areaConstruidaEstimada),
    // Metadados
    temDados: wallCount > 0 || slabCount > 0 || mbrCount > 0,
  };
}

/**
 * Mapeamento de IFC detectado → sugestões de composição StickQuote™.
 * Retorna uma lista de {composicaoId, label, areaEstimada, detectado} pronta
 * para popular o MotorComposicao (editável pelo usuário antes de confirmar).
 */
export function mapearComposicoes(resultado, composicoesDisponiveis) {
  const { wallCount, slabCount, roofCount, mbrCount,
          areaParede, areaLaje, areaCobertura, areaConstruida } = resultado;

  const compMap = Object.fromEntries(
    (composicoesDisponiveis || []).map((c) => [c.id, c])
  );

  const sugestoes = [];

  function addSugestao(composicaoId, areaEstimada, detectadoPor) {
    // Tenta achar pelo id exato; fallback: pelo campo nome contendo parte do id
    const comp = compMap[composicaoId]
      || Object.values(compMap).find((c) =>
          c.id === composicaoId ||
          c.nome?.toLowerCase().includes(composicaoId.replace(/-/g, ' '))
        );
    if (!comp) return; // composição não disponível
    if (areaEstimada <= 0) return;
    sugestoes.push({
      composicaoId: comp.id,
      composicaoNome: comp.nome,
      composicaoCor:  comp.cor,
      areaEstimada:   Math.round(areaEstimada),
      area:           Math.round(areaEstimada), // campo editável
      detectadoPor,
    });
  }

  // Paredes externas (~60% das paredes detectadas)
  if (wallCount > 0 && areaParede > 0) {
    addSugestao('par-ext',       Math.round(areaParede * 0.60), `${wallCount} IfcWall`);
    addSugestao('par-int-st',    Math.round(areaParede * 0.40), `${wallCount} IfcWall`);
    addSugestao('isolamento',    areaParede,                    `${wallCount} IfcWall`);
  }

  // Forro (laje)
  if (slabCount > 0 && areaLaje > 0) {
    addSugestao('forro-st', areaLaje, `${slabCount} IfcSlab`);
  }

  // Estrutura LSF — baseada na área construída
  if ((wallCount > 0 || mbrCount > 0) && areaConstruida > 0) {
    addSugestao('estrutura-lsf', areaConstruida, 'Área construída estimada');
  }

  return sugestoes;
}
