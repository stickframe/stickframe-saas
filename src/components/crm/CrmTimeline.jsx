import { useState } from "react";
import { C } from "../../utils/constants";
import { TIMELINE_EVENTOS } from "../../utils/crm";
import { Zap, Phone, FileText, Users, CheckCircle, XCircle, Box, Calendar, Brain, Smartphone, ClipboardList, RefreshCw, Eye, Download, FileCheck, Pencil, Ruler, HardHat } from "../ui/Icon";

const TIMELINE_ICONS = {
  Zap, Phone, FileText, Users, CheckCircle, XCircle, Box, Calendar, Brain, Smartphone, ClipboardList, RefreshCw, Eye, Download, FileCheck, Pencil, Ruler, HardHat
};

export default function CrmTimeline({ lead, timeline, onAddLog }) {
  const [tipoLog, setTipoLog] = useState("note");
  const [txtLog, setTxtLog] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const LOG_OPTIONS = [
    { key: "note", label: "Nota", icon: Pencil, placeholder: "Escreva uma anotação privada..." },
    { key: "call", label: "Ligação", icon: Phone, placeholder: "Resuma o telefonema com o cliente..." },
    { key: "meeting", label: "Reunião", icon: Users, placeholder: "Descreva os pontos acordados na reunião..." },
    { key: "visit", label: "Visita", icon: Ruler, placeholder: "Registre as observações da visita técnica..." }
  ];

  async function handleSubmit() {
    if (!txtLog.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddLog(tipoLog, txtLog.trim());
      setTxtLog("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  const activeOpt = LOG_OPTIONS.find(o => o.key === tipoLog) || LOG_OPTIONS[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "fadeIn 0.2s ease-out" }}>
      
      {/* Formulador de Logs de Interação */}
      {lead.status !== "Arquivado" && (
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {LOG_OPTIONS.map(opt => {
              const active = tipoLog === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setTipoLog(opt.key)}
                  style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    cursor: "pointer", border: `1px solid ${active ? C.purple : C.border}`,
                    background: active ? C.purple + "14" : "transparent",
                    color: active ? C.purple : C.muted,
                    fontFamily: "inherit", transition: "all .15s",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {(() => {
                    const IconComp = opt.icon;
                    return IconComp ? <IconComp size={10} style={{ color: active ? C.purple : C.muted }} /> : null;
                  })()}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <textarea
            value={txtLog}
            onChange={(e) => setTxtLog(e.target.value)}
            placeholder={activeOpt.placeholder}
            rows={3}
            style={{
              width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`,
              fontSize: 12, outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box"
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={!txtLog.trim() || submitting}
            style={{
              width: "100%", padding: "9px", background: C.darker, color: C.text,
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: txtLog.trim() ? "pointer" : "not-allowed", marginTop: 8, fontFamily: "inherit"
            }}
          >
            {submitting ? "Registrando..." : `Registrar ${activeOpt.label}`}
          </button>
        </div>
      )}

      {/* Lista Timeline */}
      {timeline.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>Nenhum evento registrado ainda.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", paddingLeft: 16 }}>
          {/* Linha vertical */}
          <div style={{ position: "absolute", left: 4, top: 8, bottom: 8, width: 2, background: C.border }} />

          {timeline.map((h) => {
            const conf = TIMELINE_EVENTOS[h.tipo] || { label: "Evento", icon: "⚙️", cor: C.muted };
            return (
              <div key={h.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                {/* Marcador colorido */}
                <div style={{
                  position: "absolute", left: -16, top: 4, width: 10, height: 10,
                  borderRadius: "50%", background: conf.cor, border: `2.5px solid #fff`,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.1)"
                }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    <span>{new Date(h.created_at).toLocaleString("pt-BR")}</span>
                    <span>Por: <strong>{h.usuario}</strong></span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {(() => {
                        const IconComp = TIMELINE_ICONS[conf.icon];
                        return IconComp ? <IconComp size={11} style={{ color: conf.cor }} /> : null;
                      })()}
                      <span>{conf.label}</span>
                    </span>
                    {h.status_anterior && h.status_novo && (
                      <span style={{ fontSize: 10, color: C.muted }}>
                        ({h.status_anterior} → {h.status_novo})
                      </span>
                    )}
                  </div>

                  {h.observacao && (
                    <div style={{
                      fontSize: 12, color: C.text, background: C.surface,
                      padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                      lineHeight: 1.4, whiteSpace: "pre-wrap"
                    }}>
                      {h.observacao}
                    </div>
                  )}

                  {/* Detalhes específicos de metadados se houver */}
                  {h.meta && h.meta.texto && (
                    <div style={{
                      fontSize: 12, color: C.text, background: C.surface,
                      padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                      lineHeight: 1.4, whiteSpace: "pre-wrap"
                    }}>
                      {h.meta.texto}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
