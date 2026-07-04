/**
 * StickAI Engineer™ - Módulo de Pré-Dimensionamento (Fase 7)
 *
 * Realiza uma análise preliminar e simplificada dos elementos estruturais,
 * fornecendo ao engenheiro uma visão rápida antes do cálculo FEM completo.
 * 
 * IMPORTANTE: Estes são cálculos preliminares e não substituem a análise
 * estrutural detalhada (FEM).
 */

/**
 * Calcula dados de pré-dimensionamento para uma lista de elementos.
 * 
 * @param {Array} elementos - A lista de elementos estruturais.
 * @param {Array} perfisDisponiveis - A lista de todos os perfis disponíveis.
 * @returns {Array} Uma lista de objetos de análise preliminar.
 */
export function realizarPreDimensionamento(elementos, perfisDisponiveis) {
  if (!perfisDisponiveis || perfisDisponiveis.length === 0) {
    return [];
  }

  const analise = elementos
    .filter(el => el.tipo === 'parede' || el.tipo === 'viga')
    .map(el => {
      const perfilId = el.perfil_id || el.sugestaoPerfil?.perfil_id_sugerido;
      const perfil = perfisDisponiveis.find(p => p.id === perfilId);

      const vao = el.comprimento_m || 0;
      const altura = el.altura_m || 0;
      const nomePerfil = perfil ? perfil.nome : (el.sugestaoPerfil?.perfil_nome_sugerido || 'N/A');
      
      // Assumindo campos no objeto de perfil. Se não existirem, os cálculos serão 0.
      const massaLinear = perfil?.massa_linear_kg_m || 0;
      const espessura = perfil?.espessura_mm || 0;

      const peso = vao * massaLinear;
      // Esbeltez (Lambda) = Altura / Espessura. Só faz sentido para paredes.
      const esbeltez = (el.tipo === 'parede' && espessura > 0) ? altura / (espessura / 1000) : 0;

      return {
        elemento_nome: el.nome,
        tipo: el.tipo,
        perfil: nomePerfil,
        vao: vao.toFixed(2),
        altura: altura.toFixed(2),
        peso: peso.toFixed(2),
        esbeltez: esbeltez.toFixed(0),
        status: 'pré-dimensionamento', // Marcado como preliminar
      };
    });

  return analise;
}
