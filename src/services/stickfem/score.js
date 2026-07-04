/**
 * StickScore™ 2.0 — Saúde e qualidade do modelo estrutural.
 *
 * Critérios:
 * • Qualidade do DXF:      Boa prática no uso de entidades.
 * • Organização dos layers: Nomes claros, poucos layers.
 * • Elementos reconhecidos: % de geometria convertida em elementos.
 * • Confiabilidade:         % de elementos com alta confiança do parser.
 * • Perfis atribuídos:      % de paredes e vigas com perfis definidos.
 * • Conflitos:              Detecção de inconsistências geométricas.
 */
export function computeStickScore(data) {
  const { elementos = [], geometria = null, conflitos = [] } = data;

  // 1. Qualidade do DXF (0-100)
  // Penaliza DXF com muitas entidades pequenas ou não utilizadas.
  let scoreDxf = 100;
  if (geometria) {
    const totalEntidades = geometria.stats.linhas + geometria.stats.polilinhas;
    // Penaliza se menos de 50% das entidades viraram elementos
    const utilizacao = elementos.length / totalEntidades;
    if (totalEntidades > 0 && utilizacao < 0.5) {
      scoreDxf -= (0.5 - utilizacao) * 50;
    }
    // Penaliza por excesso de layers
    if (geometria.stats.layers > 20) {
      scoreDxf -= Math.min(geometria.stats.layers - 20, 20);
    }
  } else {
    scoreDxf = 0; // Sem geometria, sem score.
  }

  // 2. Organização dos Layers (0-100)
  // Beneficia layers com nomes sugestivos.
  let scoreLayers = 0;
  if (geometria && geometria.layers) {
    const layersSugeridos = geometria.layers.filter(l => l.sugerido !== 'ignorar').length;
    scoreLayers = (layersSugeridos / geometria.layers.length) * 100;
  }
  
  // 3. Parser (Elementos Reconhecidos) (0-100)
  const paredesEVigas = elementos.filter(e => e.tipo === 'parede' || e.tipo === 'viga');
  const scoreParser = paredesEVigas.length > 0 ? 100 : 0; // Simples por enquanto

  // 4. Confiabilidade (0-100)
  // % de elementos validados pelo engenheiro + confiança do parser.
  let scoreConfianca = 0;
  if (elementos.length > 0) {
      const validados = elementos.filter(e => e.validado).length;
      const confiancaAlta = elementos.filter(e => e.confianca !== 'baixa').length;
      scoreConfianca = ((validados / elementos.length) * 0.6 + (confiancaAlta / elementos.length) * 0.4) * 100;
  }

  // 5. Perfis Atribuídos (0-100)
  let scorePerfis = 0;
  if (paredesEVigas.length > 0) {
    const comPerfil = paredesEVigas.filter(e => e.perfil_id).length;
    scorePerfis = (comPerfil / paredesEVigas.length) * 100;
  } else {
    scorePerfis = 100; // Se não há paredes/vigas, não há o que atribuir.
  }
  
  // 6. Consistência (Conflitos) (0-100)
  // Penaliza por cada conflito encontrado.
  let scoreConsistencia = 100 - (conflitos.length * 5);

  // --- Pontuação Final ---
  const details = {
    dxf: Math.round(scoreDxf),
    layers: Math.round(scoreLayers),
    parser: Math.round(scoreParser),
    confiabilidade: Math.round(scoreConfianca),
    perfis: Math.round(scorePerfis),
    consistencia: Math.round(scoreConsistencia),
  };

  // Média ponderada
  const pesos = { dxf: 0.1, layers: 0.15, parser: 0.2, confiabilidade: 0.25, perfis: 0.2, consistencia: 0.1 };
  const scoreFinal = Object.keys(details).reduce((acc, key) => {
    return acc + details[key] * pesos[key];
  }, 0);

  return {
    score: Math.round(scoreFinal),
    details: details,
  };
}
