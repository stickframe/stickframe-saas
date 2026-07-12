import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { listarHistoricoLead } from "../../services/repositories/leadHistoricoRepository";
import { C } from "../../utils/constants";
import { STATUS_CONFIG } from "../../utils/crm";
import { Zap, Phone, FileText, Users, CheckCircle, XCircle, Box } from "../ui/Icon";

const STATUS_ICONS = { Zap, Phone, FileText, Users, CheckCircle, XCircle, Box };

/**
 * Modal de visualização do histórico de auditoria/CRM do Lead.
 */
export default function LeadHistoryModal({ lead, onClose }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lead?.id) return;
    setLoading(true);
    listarHistoricoLead(lead.id)
      .then(setHistorico)
      .catch(err => console.error("Erro ao carregar histórico:", err))
      .finally(() => setLoading(false));
  }, [lead?.id]);

  return (
    <Modal title={`Histórico de Negociação — ${lead.nome}`} onClose={onClose} width={500}>
      <div style={{ padding: "20px", maxHeight: "60vh", overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>Carregando histórico…</div>
        ) : historico.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>Nenhuma alteração registrada ainda.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative", paddingLeft: 16 }}>
            {/* Linha vertical central da timeline */}
            <div style={{ position: "absolute", left: 4, top: 8, bottom: 8, width: 2, background: C.border }} />

            {historico.map((h) => {
              const confAnt = STATUS_CONFIG[h.status_anterior] || { icon: "Zap", cor: C.muted, bg: "#eee", border: "#ddd" };
              const confNovo = STATUS_CONFIG[h.status_novo] || { icon: "Zap", cor: C.muted, bg: "#eee", border: "#ddd" };
              return (
                <div key={h.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                  {/* Marcador colorido na timeline */}
                  <div style={{
                    position: "absolute", left: -16, top: 4, width: 10, height: 10,
                    borderRadius: "50%", background: confNovo.cor, border: `2.5px solid #fff`,
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.1)"
                  }} />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      <span>{new Date(h.created_at).toLocaleString("pt-BR")}</span>
                      <span>Por: <strong>{h.usuario}</strong></span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                        background: confAnt.bg, color: confAnt.cor, border: `1px solid ${confAnt.border}`,
                        display: "inline-flex", alignItems: "center", gap: 4
                      }}>
                        {(() => {
                          const IconComp = STATUS_ICONS[confAnt.icon];
                          return IconComp ? <IconComp size={10} style={{ color: confAnt.cor }} /> : null;
                        })()}
                        <span>{h.status_anterior}</span>
                      </span>
                      <span style={{ color: C.muted, fontSize: 12 }}>→</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                        background: confNovo.bg, color: confNovo.cor, border: `1px solid ${confNovo.border}`,
                        display: "inline-flex", alignItems: "center", gap: 4
                      }}>
                        {(() => {
                          const IconComp = STATUS_ICONS[confNovo.icon];
                          return IconComp ? <IconComp size={10} style={{ color: confNovo.cor }} /> : null;
                        })()}
                        <span>{h.status_novo}</span>
                      </span>
                    </div>

                    {h.observacao && (
                      <div style={{
                        fontSize: 12, color: C.text, background: C.surface2,
                        padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                        lineHeight: 1.5, whiteSpace: "pre-wrap"
                      }}>
                        {h.observacao}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${C.border}`, background: C.surface2 }}>
        <button onClick={onClose} style={{
          padding: "8px 16px", background: "#414141", border: "none",
          borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", transition: "all .15s"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#2b2b2e"}
        onMouseLeave={e => e.currentTarget.style.background = "#414141"}
        >
          Fechar
        </button>
      </div>
    </Modal>
  );
}
