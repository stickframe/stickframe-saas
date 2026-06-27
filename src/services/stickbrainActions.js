// ─────────────────────────────────────────────────────────────────────────────
// StickBrain Operacional — motor de ações (handoff §2).
// Transforma as oportunidades scoradas (RPC stickbrain_operacional) + órfãos
// numa fila priorizada de próximas-melhores-ações, agrupada por urgência.
// Regras determinísticas — sem modelo de IA.
// ─────────────────────────────────────────────────────────────────────────────

const fmtBig = (v) => {
  const n = Number(v || 0);
  if (n >= 1e6) return "R$ " + (n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "M";
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3) + "k";
  return "R$ " + Math.round(n);
};

const ESTAGIO_LABEL = {
  novo: "Novo lead", analise: "Análise", projeto_recebido: "Projeto recebido",
  orcamento_criado: "Orçamento criado", proposta_enviada: "Proposta enviada",
  negociacao: "Em negociação",
};

/** Constrói a fila de ações a partir do payload do operacional. */
export function montarFilaAcoes(op = {}) {
  const oportunidades = Array.isArray(op.oportunidades) ? op.oportunidades : [];
  const acoes = [];

  for (const o of oportunidades) {
    const dias = o.dias_sem_contato || 0;
    const motivos = [];
    let tipo, verbo, urgencia, ctas;

    // Motivos (chips) a partir dos sinais
    if (o.temperatura === "esfriando") motivos.push({ t: `Esfriando ${dias} dias`, tom: "danger" });
    else if (dias >= 4) motivos.push({ t: `Sem contato há ${dias} dias`, tom: "warning" });
    if (o.estagio === "proposta_enviada") motivos.push({ t: "Proposta enviada", tom: "steel" });
    if (o.estagio === "negociacao") motivos.push({ t: "Em negociação", tom: "steel" });
    if (o.estagio === "orcamento_criado") motivos.push({ t: "Orçamento aguardando", tom: "warning" });
    if (o.origem) motivos.push({ t: `Veio de ${o.origem}`, tom: "muted" });

    // Tipo de ação por estágio + temperatura
    if (o.temperatura === "esfriando" && Number(o.valor) >= 100000) {
      tipo = "ligar"; verbo = "Ligar para"; urgencia = "agora";
      ctas = [{ k: "ligar", label: "Ligar agora", primary: true }, { k: "follow_up", label: "Enviar follow-up" }];
    } else if (o.estagio === "orcamento_criado") {
      tipo = "gerar_proposta"; verbo = "Enviar proposta para"; urgencia = dias >= 4 ? "hoje" : "semana";
      ctas = [{ k: "gerar_proposta", label: "Gerar proposta", primary: true }, { k: "agendar", label: "Agendar" }];
    } else if (o.estagio === "proposta_enviada" || o.estagio === "negociacao") {
      tipo = "follow_up"; verbo = "Follow-up com"; urgencia = o.temperatura === "esfriando" ? "agora" : dias >= 4 ? "hoje" : "semana";
      ctas = [{ k: "follow_up", label: "Enviar follow-up", primary: true }, { k: "agendar", label: "Agendar visita" }];
    } else {
      tipo = "follow_up"; verbo = "Retomar"; urgencia = "semana";
      ctas = [{ k: "follow_up", label: "Enviar follow-up", primary: true }, { k: "agendar", label: "Agendar" }];
    }

    acoes.push({
      id: `op-${o.oportunidade_id}`,
      tipo, urgencia, score: o.score || 0,
      verbo, entidade: { id: o.oportunidade_id, nome: o.nome, valor: o.valor, estagio: ESTAGIO_LABEL[o.estagio] || o.estagio },
      motivos, ctas,
      porque: `Score ${o.score}/100 — estágio "${ESTAGIO_LABEL[o.estagio] || o.estagio}", ${fmtBig(o.valor)}, ${dias} dia(s) sem contato. Probabilidade de fechamento ${o.prob}%.`,
    });
  }

  // Ação especial: StickQuotes órfãos
  const orf = op.orfaos || {};
  if ((orf.n || 0) > 0) {
    acoes.push({
      id: "orfaos", tipo: "recuperar_orfaos", urgencia: "hoje",
      score: Math.min(95, 70 + (orf.n || 0)),
      verbo: "Recuperar", entidade: { nome: `${orf.n} StickQuotes órfãos`, valor: orf.valor, estagio: "Sem orçamento" },
      motivos: [{ t: "Receita travada", tom: "danger" }, { t: `${fmtBig(orf.valor)} em potencial`, tom: "warning" }],
      ctas: [{ k: "recuperar", label: "Gerar orçamentos", primary: true }, { k: "ver_lista", label: "Ver lista" }],
      porque: `${orf.n} StickQuotes técnicos calculados nunca viraram orçamento — ${fmtBig(orf.valor)} em engenharia parada.`,
    });
  }

  // Ordena por score e agrupa por urgência
  acoes.sort((a, b) => b.score - a.score);
  const grupos = { agora: [], hoje: [], semana: [] };
  for (const a of acoes) (grupos[a.urgencia] || grupos.semana).push(a);

  const valorEmJogo = acoes.reduce((s, a) => s + (Number(a.entidade.valor) || 0), 0);
  return {
    grupos,
    total: acoes.length,
    valorEmJogo,
    imediatas: grupos.agora.length,
  };
}
