// ─────────────────────────────────────────────────────────────────────────────
// StickBrain IA (camada determinística) — handoff §7.
// Entrada: payload do dashboard. Saída: { alertas, oportunidades, recomendacoes }.
// Regras determinísticas (sem modelo de IA): órfãos, leads parados, origem fraca,
// conversão abaixo da média, pipeline parado. Cada item já vem quantificado em R$.
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (v) => "R$ " + Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const pct = (v) => `${Math.round(Number(v || 0) * 100)}%`;

export function analisarDeterministico(d = {}) {
  const alertas = [], oportunidades = [], recomendacoes = [];
  const k = d.kpis || {}, r = d.receita || {}, orf = d.orfaos || {}, pipe = d.pipeline || {};
  const origens = Array.isArray(d.origens) ? d.origens : [];

  // 1. StickQuotes órfãos com R$ potencial parado
  if ((orf.n || 0) > 0) {
    alertas.push({
      tipo: "orfaos", nivel: orf.n >= 5 ? "danger" : "warning",
      titulo: `${orf.n} StickQuote${orf.n > 1 ? "s" : ""} órfão${orf.n > 1 ? "s" : ""}`,
      detalhe: `${fmt(orf.valor)} em engenharia calculada que nunca virou orçamento.`,
      valor: orf.valor, acao: "Recuperar",
    });
    recomendacoes.push(`Vincule os ${orf.n} StickQuotes órfãos a orçamentos — ${fmt(orf.valor)} em potencial parado.`);
  }

  // 2. Conversão orçamento→venda abaixo do alvo (10%)
  if ((k.orcamentos || 0) >= 3 && (k.conv_orc_fech ?? 1) < 0.1) {
    alertas.push({
      tipo: "conversao", nivel: "warning",
      titulo: "Conversão orçamento→venda baixa",
      detalhe: `Apenas ${pct(k.conv_orc_fech)} dos orçamentos fecham (alvo 10%).`,
      acao: "Ver orçamentos",
    });
  }

  // 3. Origem que mais vende → reforçar; origem volumosa sem conversão → revisar
  const comVenda = origens.filter((o) => (o.fechados || 0) > 0).sort((a, b) => b.conversao - a.conversao);
  if (comVenda.length) {
    oportunidades.push(`A origem "${comVenda[0].origem}" converte ${pct(comVenda[0].conversao)} — direcione mais investimento para esse canal.`);
  }
  const semConversao = origens.filter((o) => (o.leads || 0) >= 3 && (o.fechados || 0) === 0);
  semConversao.forEach((o) => {
    alertas.push({
      tipo: "origem", nivel: "warning",
      titulo: `Origem "${o.origem}" sem conversão`,
      detalhe: `${o.leads} orçamentos da origem "${o.origem}" e nenhuma venda — revisar abordagem.`,
      acao: "Analisar",
    });
  });

  // 4. Pipeline em aberto parado
  if ((pipe.total || 0) > 0 && (pipe.ativas || 0) > 0) {
    oportunidades.push(`${fmt(pipe.total)} em ${pipe.ativas} oportunidades abertas — priorize as de maior valor para fechar o mês.`);
  }

  // 5. Tempo de fechamento longo
  if ((r.tempo_medio_fechamento_d || 0) > 30) {
    recomendacoes.push(`Tempo médio de fechamento em ${r.tempo_medio_fechamento_d} dias — encurtar o follow-up pós-proposta acelera a receita.`);
  }

  return { alertas, oportunidades, recomendacoes };
}
