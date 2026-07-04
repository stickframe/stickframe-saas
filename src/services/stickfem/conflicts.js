/**
 * StickFEM™ - Módulo de Detecção de Conflitos
 *
 * Este serviço analisa o modelo estrutural em busca de inconsistências
 * comuns que podem afetar a análise FEM ou o orçamento.
 *
 * Conflitos Planejados (Fase 3):
 * - [x] Paredes duplicadas
 * - [ ] Linhas sobrepostas
 * - [ ] Elementos desconectados
 * - [ ] Layer vazio
 * - [ ] Perfil incompatível
 * - [ ] Abertura fora da parede
 * - [ ] Viga sem apoio
 * - [ ] Elementos isolados
 */

const TOLERANCIA_GEOMETRICA = 0.01; // 1 cm

/**
 * Compara duas coordenadas para ver se são essencialmente as mesmas.
 */
const mesmaCoordenada = (p1, p2) => {
  return Math.abs(p1.x - p2.x) < TOLERANCIA_GEOMETRICA && Math.abs(p1.y - p2.y) < TOLERANCIA_GEOMETRICA;
};

/**
 * Verifica se duas paredes são geometricamente idênticas (ou invertidas).
 */
const saoParedesDuplicadas = (el1, el2) => {
  if (el1.tipo !== 'parede' || el2.tipo !== 'parede' || !el1.geometria || !el2.geometria) {
    return false;
  }
  const g1 = el1.geometria;
  const g2 = el2.geometria;
  
  const normal = mesmaCoordenada({x: g1.x1, y: g1.y1}, {x: g2.x1, y: g2.y1}) && mesmaCoordenada({x: g1.x2, y: g1.y2}, {x: g2.x2, y: g2.y2});
  const invertida = mesmaCoordenada({x: g1.x1, y: g1.y1}, {x: g2.x2, y: g2.y2}) && mesmaCoordenada({x: g1.x2, y: g1.y2}, {x: g2.x1, y: g2.y1});

  return normal || invertida;
};


/**
 * Detecta paredes duplicadas ou sobrepostas na lista de elementos.
 * @param {Array} elementos - A lista de elementos estruturais.
 * @returns {Array} Uma lista de conflitos do tipo 'parede_duplicada'.
 */
function detectarParedesDuplicadas(elementos) {
  const conflitos = [];
  const paredes = elementos.filter(el => el.tipo === 'parede');
  const jaVerificados = new Set();

  for (let i = 0; i < paredes.length; i++) {
    for (let j = i + 1; j < paredes.length; j++) {
      const p1 = paredes[i];
      const p2 = paredes[j];

      if (jaVerificados.has(p1.nome) || jaVerificados.has(p2.nome)) {
        continue;
      }
      
      if (saoParedesDuplicadas(p1, p2)) {
        conflitos.push({
          tipo: 'parede_duplicada',
          mensagem: `As paredes ${p1.nome} e ${p2.nome} são duplicadas.`,
          elementos: [p1.nome, p2.nome],
          severidade: 'alta',
        });
        // Adiciona ambos à lista para não verificar novamente
        jaVerificados.add(p1.nome);
        jaVerificados.add(p2.nome);
      }
    }
  }
  return conflitos;
}


/**
 * Executa todas as verificações de conflito no modelo.
 * @param {Object} data - Contém `elementos` e `geometria`.
 * @returns {Array} Uma lista com todos os conflitos encontrados.
 */
export function detectarConflitos(data) {
  const { elementos, geometria } = data;
  if (!elementos || elementos.length === 0) {
    return [];
  }

  const todosConflitos = [
    ...detectarParedesDuplicadas(elementos),
    // Outras funções de detecção serão chamadas aqui no futuro
  ];

  return todosConflitos;
}
