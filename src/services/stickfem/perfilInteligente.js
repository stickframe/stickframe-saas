/**
 * StickAI Engineer™ - Módulo de Perfis Inteligentes (Fase 6)
 *
 * Sugere perfis estruturais para paredes com base em heurísticas de engenharia,
 * como comprimento do vão, tipo de parede, etc.
 */

/**
 * Aplica a lógica de sugestão de perfis aos elementos.
 * 
 * @param {Array} elementos - A lista de elementos estruturais.
 * @param {Array} perfisDisponiveis - A lista de todos os perfis disponíveis no sistema.
 * @returns {Array} A lista de elementos enriquecida com as sugestões.
 */
export function sugerirPerfisInteligentes(elementos, perfisDisponiveis) {
  if (!perfisDisponiveis || perfisDisponiveis.length === 0) {
    return elementos; // Não podemos sugerir sem saber os perfis
  }

  // Heurística simples para encontrar perfis comuns
  const perfilLeve = perfisDisponiveis.find(p => p.nome.includes('90'));
  const perfilMedio = perfisDisponiveis.find(p => p.nome.includes('140'));
  const perfilPesado = perfisDisponiveis.find(p => p.nome.includes('200'));

  return elementos.map(el => {
    if (el.tipo === 'parede' && !el.perfil_id) { // Só sugere se não houver perfil
      const L = el.comprimento_m;
      let sugestao = {};

      if (L < 4.0 && perfilLeve) {
        sugestao = {
          perfil_id_sugerido: perfilLeve.id,
          perfil_nome_sugerido: perfilLeve.nome,
          explicacao: `Sugestão baseada em vão curto (${L.toFixed(2)}m).`,
        };
      } else if (L >= 4.0 && L < 7.0 && perfilMedio) {
        sugestao = {
          perfil_id_sugerido: perfilMedio.id,
          perfil_nome_sugerido: perfilMedio.nome,
          explicacao: `Sugestão baseada em vão médio (${L.toFixed(2)}m).`,
        };
      } else if (L >= 7.0 && perfilPesado) {
        sugestao = {
          perfil_id_sugerido: perfilPesado.id,
          perfil_nome_sugerido: perfilPesado.nome,
          explicacao: `Sugestão baseada em vão longo (${L.toFixed(2)}m).`,
        };
      }

      if (sugestao.perfil_id_sugerido) {
        return { ...el, sugestaoPerfil: sugestao };
      }
    }
    return el;
  });
}
