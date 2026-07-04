/**
 * StickFEM™ — Linha do Tempo: lógica pura (agrupamento, filtros, busca,
 * indicadores). Sem I/O nem UI — totalmente testável.
 */

/** Agrupa eventos consecutivos de mesmo tipo dentro de uma janela de tempo. */
export function agruparEventos(eventos = [], { janelaMs = 60000 } = {}) {
  const ordenados = [...eventos].sort((a, b) => new Date(b.data) - new Date(a.data)); // mais recente primeiro
  const grupos = [];
  for (const ev of ordenados) {
    const ultimo = grupos[grupos.length - 1];
    const proximo = ultimo && ultimo.tipo === ev.tipo &&
      Math.abs(new Date(ultimo.data) - new Date(ev.data)) <= janelaMs;
    if (proximo) { ultimo.itens.push(ev); ultimo.count++; }
    else grupos.push({ tipo: ev.tipo, modulo: ev.modulo, icone: ev.icone, label: ev.label, severidade: ev.severidade, data: ev.data, itens: [ev], count: 1, representante: ev });
  }
  return grupos;
}

const PRESETS = {
  engenharia: (e) => e.modulo === "engenharia",
  ia: (e) => e.modulo === "ia",
  auditoria: (e) => e.modulo === "auditoria",
};

/** Filtra por usuário, período, severidade, módulo, tipo e presets. */
export function filtrarEventos(eventos = [], filtros = {}) {
  const { usuario, de, ate, severidade, modulo, tipo, preset } = filtros;
  const deT = de ? new Date(de).getTime() : null;
  const ateT = ate ? new Date(ate).getTime() : null;
  return eventos.filter((e) => {
    if (usuario && e.usuario !== usuario) return false;
    if (severidade && e.severidade !== severidade) return false;
    if (modulo && e.modulo !== modulo) return false;
    if (tipo && e.tipo !== tipo) return false;
    if (preset && PRESETS[preset] && !PRESETS[preset](e)) return false;
    const t = new Date(e.data).getTime();
    if (deT != null && t < deT) return false;
    if (ateT != null && t > ateT) return false;
    return true;
  });
}

/** Busca textual em descrição, label, tipo, hash e payload. */
export function pesquisarEventos(eventos = [], termo = "") {
  const q = String(termo || "").trim().toLowerCase();
  if (!q) return eventos;
  return eventos.filter((e) => {
    const alvo = `${e.descricao} ${e.label} ${e.tipo} ${e.hash || ""} ${JSON.stringify(e.payload || {})}`.toLowerCase();
    return alvo.includes(q);
  });
}

const ultimoDoModulo = (eventos, pred) => eventos
  .filter(pred)
  .sort((a, b) => new Date(b.data) - new Date(a.data))[0] || null;

/** Indicadores do dashboard de rastreabilidade. */
export function indicadoresDashboard(eventos = []) {
  const ordenados = [...eventos].sort((a, b) => new Date(b.data) - new Date(a.data));
  const ultimaAtividade = ordenados[0] || null;
  const alteracoes = new Set(["mudanca_perfil", "mudanca_manual", "recalcular", "alteracao_cargas", "snapshot_restaurado"]);
  const ultimaAlteracao = ultimoDoModulo(eventos, (e) => alteracoes.has(e.tipo));

  return {
    totalEventos: eventos.length,
    ultimaAtividade,
    ultimaAprovacao: ultimoDoModulo(eventos, (e) => e.tipo === "aprovacao_tecnica"),
    ultimoMemorial: ultimoDoModulo(eventos, (e) => e.tipo === "memorial_emitido"),
    ultimaComparacao: ultimoDoModulo(eventos, (e) => e.tipo === "comparacao_executada"),
    ultimoCalculo: ultimoDoModulo(eventos, (e) => e.tipo === "predimensionamento" || e.tipo === "auditoria_executada"),
    tempoDesdeUltimaAlteracaoMs: ultimaAlteracao ? Date.now() - new Date(ultimaAlteracao.data).getTime() : null,
  };
}

/** Usuários distintos presentes (para o filtro). */
export function usuariosDistintos(eventos = []) {
  return [...new Set(eventos.map((e) => e.usuario).filter(Boolean))];
}
