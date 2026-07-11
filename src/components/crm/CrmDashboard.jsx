import { useMemo } from "react";
import { C } from "../../utils/constants";
import { calcularTemperatura } from "../../utils/crm";

export default function CrmDashboard({ leads }) {
  const stats = useMemo(() => {
    const total = leads.length;
    if (total === 0) return null;

    const convertidos = leads.filter(l => l.status === "Convertido");
    const perdidos = leads.filter(l => l.status === "Perdido");
    const ativos = leads.filter(l => ["Novo", "Em Atendimento", "Orçamento Enviado", "Negociação"].includes(l.status));

    // Taxa de Conversão
    const txConversao = total > 0 ? (convertidos.length / total) * 100 : 0;

    // Pipeline Financeiro
    const pipelineAtivo = ativos.reduce((acc, l) => acc + Number(l.valor_min || 0), 0);
    const pipelineGanho = convertidos.reduce((acc, l) => acc + Number(l.valor_min || 0), 0);
    const pipelinePerdido = perdidos.reduce((acc, l) => acc + Number(l.valor_min || 0), 0);

    // Ticket Médio (Convertidos)
    const ticketMedio = convertidos.length > 0
      ? convertidos.reduce((acc, l) => acc + Number(l.valor_min || 0), 0) / convertidos.length
      : 0;

    // Origens e Conversão
    const origensCount = {};
    leads.forEach(l => {
      const orig = l.origem || "Calculadora";
      if (!origensCount[orig]) origensCount[orig] = { total: 0, ganho: 0 };
      origensCount[orig].total += 1;
      if (l.status === "Convertido") origensCount[orig].ganho += 1;
    });

    const origensRanking = Object.entries(origensCount).map(([name, v]) => ({
      name,
      total: v.total,
      ganho: v.ganho,
      rate: v.total > 0 ? (v.ganho / v.total) * 100 : 0
    })).sort((a, b) => b.rate - a.rate);

    // Cidades e Conversão
    const cidadesCount = {};
    leads.forEach(l => {
      const cid = l.cidade || "Outra";
      if (!cidadesCount[cid]) cidadesCount[cid] = { total: 0, ganho: 0 };
      cidadesCount[cid].total += 1;
      if (l.status === "Convertido") cidadesCount[cid].ganho += 1;
    });

    const cidadesRanking = Object.entries(cidadesCount).map(([name, v]) => ({
      name,
      total: v.total,
      ganho: v.ganho,
      rate: v.total > 0 ? (v.ganho / v.total) * 100 : 0
    })).sort((a, b) => b.total - a.total).slice(0, 5);

    // Temperatura
    const tempCount = { Quente: 0, Morno: 0, Frio: 0 };
    leads.forEach(l => {
      const temp = calcularTemperatura(l).nivel;
      tempCount[temp] = (tempCount[temp] || 0) + 1;
    });

    return {
      total,
      ativosCount: ativos.length,
      ganhosCount: convertidos.length,
      perdidosCount: perdidos.length,
      txConversao,
      pipelineAtivo,
      pipelineGanho,
      pipelinePerdido,
      ticketMedio,
      origensRanking,
      cidadesRanking,
      tempCount
    };
  }, [leads]);

  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
        Sem dados suficientes para gerar métricas de CRM.
      </div>
    );
  }

  const cardStyle = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
  };

  const labelStyle = { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 };
  const valStyle = { fontSize: 20, fontWeight: 800, color: C.text };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.2s ease-out" }}>
      
      {/* Grid de KPIs Financeiros */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <div style={cardStyle}>
          <span style={labelStyle}>📈 Taxa de Conversão</span>
          <span style={{ ...valStyle, color: C.success }}>{stats.txConversao.toFixed(1)}%</span>
          <span style={{ fontSize: 11, color: C.muted }}>{stats.ganhosCount} fechados de {stats.total} leads</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>💼 Pipeline Ativo</span>
          <span style={{ ...valStyle, color: C.purple }}>R$ {stats.pipelineAtivo.toLocaleString("pt-BR")}</span>
          <span style={{ fontSize: 11, color: C.muted }}>{stats.ativosCount} oportunidades em andamento</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>💰 Valor Ganho</span>
          <span style={{ ...valStyle, color: C.success }}>R$ {stats.pipelineGanho.toLocaleString("pt-BR")}</span>
          <span style={{ fontSize: 11, color: C.muted }}>Conversões bem-sucedidas</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>🎯 Ticket Médio</span>
          <span style={valStyle}>R$ {stats.ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
          <span style={{ fontSize: 11, color: C.muted }}>Média por contrato fechado</span>
        </div>
      </div>

      {/* Grid de Gráficos e Rankings */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        
        {/* Distribuição de Temperatura */}
        <div style={{ ...cardStyle, flex: 1 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 12px" }}>🌡️ Qualificação dos Leads ativos</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["Quente", "Morno", "Frio"].map(lvl => {
              const count = stats.tempCount[lvl] || 0;
              const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const color = lvl === "Quente" ? C.danger : lvl === "Morno" ? C.warning : C.steel;
              const icon = lvl === "Quente" ? "🔥" : lvl === "Morno" ? "🟡" : "❄️";
              return (
                <div key={lvl}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{icon} {lvl}</span>
                    <span style={{ color: C.muted }}>{count} leads ({percent.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${percent}%`, background: color, height: "100%", borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Origens que mais Convertem */}
        <div style={{ ...cardStyle, flex: 1 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 12px" }}>🔗 Conversão por Origem</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.origensRanking.slice(0, 4).map(o => (
              <div key={o.name} style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyClass: "space-between", fontSize: 12 }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{o.name}</span>
                <span style={{ color: C.muted, marginRight: 12 }}>{o.ganho}/{o.total} convertidos</span>
                <span style={{
                  fontSize: 11, fontWeight: 800, background: C.success + "12", color: C.success,
                  padding: "2px 8px", borderRadius: 6, border: `1px solid ${C.success}22`
                }}>
                  {o.rate.toFixed(0)}% converte
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cidades mais Ativas */}
        <div style={{ ...cardStyle, flex: 1 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 12px" }}>📍 Regiões mais Ativas (Top Cidades)</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.cidadesRanking.map(c => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", justifyItems: "center", fontSize: 12 }}>
                <span style={{ flex: 1, fontWeight: 600 }}>🏙️ {c.name}</span>
                <span style={{ color: C.muted, marginRight: 12 }}>{c.total} simulações</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>
                  {c.ganho} fechadas
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
