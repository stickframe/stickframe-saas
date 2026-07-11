import { C } from "../../utils/constants";
import { calcularTemperatura, resolverOrigem, STATUS_CONFIG } from "../../utils/crm";

/**
 * Cartão individual que exibe os detalhes resumidos do Lead no pipeline.
 */
export default function LeadCard({ lead, onClick }) {
  const temp = calcularTemperatura(lead);
  const orig = resolverOrigem(lead.origem);
  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.Novo;

  const fmtTel = (t) => {
    if (!t) return "";
    const n = t.replace(/\D/g, "");
    const d = n.startsWith("55") ? n.slice(2) : n;
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return t;
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px 20px",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 12px rgba(40,30,20,0.08)";
        e.currentTarget.style.borderColor = C.muted + "66";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {/* Indicador sutil de Status lateral */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: statusCfg.cor }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nome e Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{lead.nome}</span>
            
            <span
              title={`Lead ${temp.nivel} (Score: ${temp.score}/10)`}
              style={{
                fontSize: 10,
                fontWeight: 800,
                background: temp.cor + "18",
                color: temp.cor,
                borderRadius: 6,
                padding: "2px 8px",
                border: `1px solid ${temp.cor}33`,
                whiteSpace: "nowrap"
              }}
            >
              {temp.icon} {temp.nivel}
            </span>

            <span
              title={`Origem: ${orig.label}`}
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: orig.cor + "12",
                color: orig.cor,
                borderRadius: 6,
                padding: "2px 8px",
                border: `1px solid ${orig.cor}2e`,
                whiteSpace: "nowrap"
              }}
            >
              {orig.dot} {orig.label}
            </span>
          </div>

          {/* Área e Padrão */}
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
            📍 {lead.cidade || "Cidade não informada"} · 📏 <strong>{lead.area || lead.area_m2 || "—"} m²</strong> ({lead.padrao || "Padrão"}) · {lead.pavimentos || "Térreo"}
          </div>

          {/* Faixa de Valor */}
          <div style={{ fontSize: 13, color: C.success, fontWeight: 700, marginBottom: 8 }}>
            R$ {Number(lead.valor_min || 0).toLocaleString("pt-BR")} – R$ {Number(lead.valor_max || 0).toLocaleString("pt-BR")}
          </div>

          {/* Contato e Data */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: C.muted }}>
            <span>📞 {fmtTel(lead.contato)}</span>
            <span>{new Date(lead.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        {/* Botão Ver Detalhes */}
        <button
          style={{
            background: C.darker,
            border: "none",
            borderRadius: 8,
            color: C.text,
            padding: "8px 12px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            alignSelf: "center",
            flexShrink: 0
          }}
        >
          Analisar
        </button>
      </div>
    </div>
  );
}
