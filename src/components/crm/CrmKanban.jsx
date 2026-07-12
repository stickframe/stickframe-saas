import { C } from "../../utils/constants";
import { STATUS_CONFIG, calcularLeadScore, resolverOrigem } from "../../utils/crm";
import { Zap, Phone, FileText, Users, CheckCircle, XCircle, Box } from "../ui/Icon";

const STATUS_ICONS = { Zap, Phone, FileText, Users, CheckCircle, XCircle, Box };

export default function CrmKanban({ leads, onMoveLead, onSelectLead }) {
  
  // Lista de colunas do funil Kanban
  const colunas = Object.keys(STATUS_CONFIG);

  // Agrupa leads pelo status
  const leadsPorStatus = colunas.reduce((acc, status) => {
    acc[status] = leads.filter(l => l.status === status);
    return acc;
  }, {});

  function handleDragStart(e, leadId) {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function handleDrop(e, targetStatus) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;
    
    // Aciona callback para atualizar o status do lead
    await onMoveLead(Number(leadId), targetStatus);
  }

  const fmtBRLShort = (v) => {
    const n = Number(v || 0);
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
    return n.toString();
  };

  return (
    <div 
      style={{
        display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16,
        alignItems: "flex-start", minHeight: "65vh", boxSizing: "border-box"
      }}
    >
      {colunas.map(status => {
        const cfg = STATUS_CONFIG[status];
        const colLeads = leadsPorStatus[status] || [];
        const sumPotencial = colLeads.reduce((acc, l) => acc + Number(l.valor_min || 0), 0);

        return (
          <div
            key={status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
            style={{
              flex: "0 0 280px",
              background: C.surface2,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              maxHeight: "60vh",
              overflow: "hidden"
            }}
          >
            {/* Cabeçalho da Coluna */}
            <div 
              style={{
                padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: C.surface
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {(() => {
                  const IconComp = STATUS_ICONS[cfg.icon];
                  return IconComp ? <IconComp size={13} style={{ color: cfg.cor }} /> : null;
                })()}
                <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{cfg.label}</span>
                <span style={{
                  background: cfg.cor + "18", color: cfg.cor, borderRadius: 10,
                  fontSize: 10, fontWeight: 800, padding: "1px 6px"
                }}>
                  {colLeads.length}
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.success }}>
                R$ {fmtBRLShort(sumPotencial)}
              </span>
            </div>

            {/* Lista de Cards da Coluna */}
            <div 
              style={{
                padding: "10px", display: "flex", flexDirection: "column", gap: 8,
                overflowY: "auto", flex: 1
              }}
            >
              {colLeads.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 10px", fontSize: 11, color: C.muted, border: `1px dashed ${C.border}`, borderRadius: 8 }}>
                  Solte leads aqui
                </div>
              ) : (
                colLeads.map(lead => {
                  const scoreObj = calcularLeadScore(lead);
                  const orig = resolverOrigem(lead.origem);
                  
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => onSelectLead(lead)}
                      style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: "10px 12px", cursor: "grab",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)", transition: "all 0.15s ease",
                        position: "relative"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = cfg.cor + "88";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.04)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4, paddingRight: 32 }}>
                        {lead.nome}
                      </div>

                      {/* Score Badge no Canto Superior Direito */}
                      <span style={{
                        position: "absolute", top: 10, right: 12, fontSize: 9, fontWeight: 800,
                        background: scoreObj.cor + "14", color: scoreObj.cor, padding: "1px 4px",
                        borderRadius: 4, border: `1px solid ${scoreObj.cor}2e`
                      }}>
                        ⭐ {scoreObj.score}
                      </span>

                      {/* Valores estimativos */}
                      <div style={{ fontSize: 11, color: C.success, fontWeight: 700, marginBottom: 6 }}>
                        R$ {fmtBRLShort(lead.valor_min)} – {fmtBRLShort(lead.valor_max)}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: C.muted }}>
                        <span>📍 {lead.cidade?.split("-")[0]?.trim() || "Sem cidade"}</span>
                        <span>{orig.dot} {orig.label}</span>
                      </div>

                      {/* Indicador de Próxima Ação */}
                      {lead.proxima_acao && (
                        <div style={{
                          marginTop: 6, paddingTop: 4, borderTop: `1px solid ${C.border}66`,
                          fontSize: 9, fontWeight: 600, color: C.purple, display: "flex", gap: 4, alignItems: "center"
                        }}>
                          📅 {lead.proxima_acao}: {lead.proxima_acao_data ? new Date(lead.proxima_acao_data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "Sem data"}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
