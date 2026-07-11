import { useMemo } from "react";
import { C } from "../../utils/constants";
import { calcularLeadScore, calcularTemperatura } from "../../utils/crm";

export default function CrmAlerts({ leads, onSelectLead }) {
  const alerts = useMemo(() => {
    const list = [];
    const hojeStr = new Date().toISOString().split("T")[0];

    leads.forEach(l => {
      // 1. Ação Agendada para Hoje ou Atrasada
      if (l.proxima_acao && l.proxima_acao_data) {
        if (l.proxima_acao_data <= hojeStr && l.status !== "Convertido" && l.status !== "Perdido" && l.status !== "Arquivado") {
          list.push({
            id: `acao-${l.id}`,
            lead: l,
            tipo: "prazo",
            icon: "📅",
            texto: `Ação Pendente: "${l.proxima_acao}" agendada para hoje ou em atraso`,
            cor: C.purple
          });
        }
      }

      // 2. SLA estourado para Leads Novos (sem contato por mais de 24h)
      if (l.status === "Novo") {
        const horasSemContato = l.created_at ? (Date.now() - new Date(l.created_at).getTime()) / 36e5 : 999;
        if (horasSemContato > 24) {
          list.push({
            id: `sla-novo-${l.id}`,
            lead: l,
            tipo: "sla",
            icon: "🔴",
            texto: `Brecha de SLA: Lead novo aguardando contato há mais de 24h (${Math.floor(horasSemContato)}h)`,
            cor: C.danger
          });
        }
      }

      // 3. Lead parado em Atendimento / Negociação há mais de 7 dias
      if (["Em Atendimento", "Negociação", "Orçamento Enviado"].includes(l.status)) {
        const diasSemContato = l.created_at ? (Date.now() - new Date(l.created_at).getTime()) / 86400000 : 999;
        if (diasSemContato > 7) {
          list.push({
            id: `parado-${l.id}`,
            lead: l,
            tipo: "parado",
            icon: "🟡",
            texto: `Lead Parado: Sem interação em ${l.status} há mais de 7 dias (${Math.floor(diasSemContato)} dias)`,
            cor: C.warning
          });
        }
      }

      // 4. Lead Quente com Score Alto e Sem Ação Agendada
      const temp = calcularTemperatura(l);
      const scoreObj = calcularLeadScore(l);
      if (temp.nivel === "Quente" && scoreObj.score >= 75 && !l.proxima_acao && !["Convertido", "Perdido", "Arquivado"].includes(l.status)) {
        list.push({
          id: `quente-${l.id}`,
          lead: l,
          tipo: "oportunidade",
          icon: "🔥",
          texto: `Oportunidade Quente: Lead com score ${scoreObj.score} excelente e sem Próxima Ação definida`,
          cor: C.danger
        });
      }
    });

    return list;
  }, [leads]);

  if (alerts.length === 0) return null;

  return (
    <div style={{ background: C.red + "08", border: `1px solid ${C.red}22`, borderRadius: 12, padding: "12px 18px", marginBottom: 20 }}>
      <h4 style={{ fontSize: 12, fontWeight: 800, color: C.red, display: "flex", alignItems: "center", gap: 6, margin: "0 0 10px" }}>
        ⚠️ Central de Alertas Comerciais ({alerts.length})
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "200px", overflowY: "auto" }}>
        {alerts.map(a => (
          <div
            key={a.id}
            onClick={() => onSelectLead(a.lead)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`,
              cursor: "pointer", fontSize: 11, transition: "all 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = a.cor}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <span style={{ fontSize: 14 }}>{a.icon}</span>
            <div style={{ flex: 1 }}>
              <strong>{a.lead.nome}</strong>: {a.texto}
            </div>
            <button style={{
              background: C.darker, border: "none", borderRadius: 6,
              fontSize: 10, fontWeight: 700, padding: "4px 8px", cursor: "pointer",
              color: C.text, fontFamily: "inherit"
            }}>
              Ver Lead
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
