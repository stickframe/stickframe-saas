/**
 * StickFEM™ — Linha do Tempo da Engenharia: catálogo de tipos de evento.
 *
 * Fonte única da verdade sobre ícone, rótulo, módulo e severidade padrão de cada
 * tipo. Toda a aplicação registra eventos por aqui (via EngineeringTimelineService),
 * sem logging espalhado.
 */

export const MODULOS = ["projeto", "parser", "engenharia", "conflitos", "ia", "auditoria", "comparacao", "sistema"];
export const SEVERIDADES = ["info", "atencao", "critico"];

// tipo → { icone, label, modulo, severidade padrão }
export const TIPOS_EVENTO = {
  // Projeto
  projeto_criado:        { icone: "📁", label: "Projeto criado", modulo: "projeto", severidade: "info" },
  dxf_importado:         { icone: "📥", label: "DXF importado", modulo: "projeto", severidade: "info" },
  ifc_importado:         { icone: "📥", label: "IFC importado", modulo: "projeto", severidade: "info" },
  // Parser
  parsing_concluido:     { icone: "🧩", label: "Parsing concluído", modulo: "parser", severidade: "info" },
  // Engenharia
  predimensionamento:    { icone: "📐", label: "Pré-dimensionamento", modulo: "engenharia", severidade: "info" },
  mudanca_perfil:        { icone: "🔧", label: "Mudança de perfil", modulo: "engenharia", severidade: "info" },
  mudanca_manual:        { icone: "✎", label: "Alteração manual", modulo: "engenharia", severidade: "info" },
  recalcular:            { icone: "♻", label: "Recálculo", modulo: "engenharia", severidade: "info" },
  alteracao_cargas:      { icone: "🌦", label: "Alteração de cargas/vento", modulo: "engenharia", severidade: "info" },
  // Conflitos
  conflito_detectado:    { icone: "⚠", label: "Conflito detectado", modulo: "conflitos", severidade: "atencao" },
  conflito_resolvido:    { icone: "✔", label: "Conflito resolvido", modulo: "conflitos", severidade: "info" },
  conflito_ignorado:     { icone: "⊘", label: "Conflito ignorado", modulo: "conflitos", severidade: "atencao" },
  // IA
  sugestao_criada:       { icone: "🤖", label: "Sugestão da IA", modulo: "ia", severidade: "info" },
  sugestao_aceita:       { icone: "🤖", label: "Sugestão aceita", modulo: "ia", severidade: "info" },
  sugestao_rejeitada:    { icone: "🤖", label: "Sugestão rejeitada", modulo: "ia", severidade: "info" },
  // Auditoria
  memorial_emitido:      { icone: "📄", label: "Memorial emitido", modulo: "auditoria", severidade: "info" },
  auditoria_executada:   { icone: "🔍", label: "Auditoria executada", modulo: "auditoria", severidade: "info" },
  aprovacao_tecnica:     { icone: "✅", label: "Aprovação técnica", modulo: "auditoria", severidade: "info" },
  reprovacao_tecnica:    { icone: "❌", label: "Reprovação técnica", modulo: "auditoria", severidade: "critico" },
  // Comparações / revisões
  revisao_criada:        { icone: "💾", label: "Revisão criada", modulo: "comparacao", severidade: "info" },
  comparacao_executada:  { icone: "⇄", label: "Comparação executada", modulo: "comparacao", severidade: "info" },
  snapshot_restaurado:   { icone: "↺", label: "Revisão restaurada", modulo: "comparacao", severidade: "atencao" },
  // Sistema
  engine_atualizado:     { icone: "⚙", label: "Engine atualizado", modulo: "sistema", severidade: "info" },
  catalogo_atualizado:   { icone: "📚", label: "Catálogo atualizado", modulo: "sistema", severidade: "info" },
  perfil_sincronizado:   { icone: "🔄", label: "Perfil sincronizado", modulo: "sistema", severidade: "info" },
  provider_alterado:     { icone: "🔌", label: "Provider alterado", modulo: "sistema", severidade: "info" },
};

export function metaTipo(tipo) {
  return TIPOS_EVENTO[tipo] || { icone: "•", label: tipo || "Evento", modulo: "sistema", severidade: "info" };
}

/**
 * Normaliza um evento cru para a forma canônica da timeline.
 * @param {Object} e { tipo, descricao?, payload?, severidade?, hash?, usuario?,
 *                      engineVersion?, revisaoId?, at? }
 */
export function normalizarEvento(e = {}) {
  const meta = metaTipo(e.tipo);
  return {
    tipo: e.tipo || "evento",
    modulo: e.modulo || meta.modulo,
    icone: meta.icone,
    label: meta.label,
    severidade: e.severidade || meta.severidade,
    descricao: e.descricao || meta.label,
    payload: e.payload || {},
    hash: e.hash || null,
    engineVersion: e.engineVersion || null,
    usuario: e.usuario || null,
    revisaoId: e.revisaoId || null,
    data: e.at || e.data || new Date().toISOString(),
  };
}
