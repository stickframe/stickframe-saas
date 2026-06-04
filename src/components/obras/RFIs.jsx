import { useState, useEffect } from "react";
import { listarRFIs, criarRFI, atualizarRFI, responderRFI, deletarRFI } from "../../services/repositories/rfiRepository";

const COR_STATUS = {
  "Aberto": "#ef4444",
  "Em análise": "#f97316",
  "Respondido": "#22c55e",
  "Fechado": "#6b7280",
};
const COR_URGENCIA = {
  "Normal": "#3b82f6",
  "Alta": "#f97316",
  "Crítica": "#ef4444",
};
const DISCIPLINAS = ["Civil", "Elétrico", "Hidráulico", "Estrutural", "Acabamento", "Outro"];
const URGENCIAS = ["Normal", "Alta", "Crítica"];

function Badge({ label, cor }) {
  return (
    <span style={{ background: cor, color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
  );
}

export default function RFIs({ obraId, userPerfil }) {
  const [rfis, setRfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "new" | rfi object
  const [form, setForm] = useState({});
  const [responderModal, setResponderModal] = useState(null); // rfi object
  const [resposta, setResposta] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [obraId]);

  async function load() {
    setLoading(true);
    try { setRfis(await listarRFIs(obraId)); } finally { setLoading(false); }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function salvar() {
    setSaving(true);
    try {
      if (modal === "new") {
        const n = await criarRFI({ ...form, obra_id: obraId });
        setRfis(p => [...p, n]);
      } else {
        const n = await atualizarRFI(modal.id, form);
        setRfis(p => p.map(x => x.id === n.id ? n : x));
      }
      setModal(null); setForm({});
    } finally { setSaving(false); }
  }

  async function responder() {
    if (!resposta.trim()) return;
    const n = await responderRFI(responderModal.id, resposta);
    setRfis(p => p.map(x => x.id === n.id ? n : x));
    setResponderModal(null); setResposta("");
  }

  async function fechar(id) {
    const n = await atualizarRFI(id, { status: "Fechado" });
    setRfis(p => p.map(x => x.id === n.id ? n : x));
  }

  const podeResponder = userPerfil === "diretor" || userPerfil === "engenheiro";
  const total = rfis.length;
  const abertos = rfis.filter(r => r.status === "Aberto" || r.status === "Em análise").length;
  const respondidos = rfis.filter(r => r.status === "Respondido").length;

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
          <span>📋 <b>{total}</b> total</span>
          <span>🔴 <b>{abertos}</b> abertos</span>
          <span>🟢 <b>{respondidos}</b> respondidos</span>
        </div>
        <button
          onClick={() => { setForm({ disciplina: "Estrutural", urgencia: "Normal" }); setModal("new"); }}
          style={{ padding: "7px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
        >+ Nova RFI</button>
      </div>

      {loading ? <p>Carregando...</p> : rfis.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>📝 Nenhuma RFI registrada.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rfis.map(r => (
            <div key={r.id} style={{
              background: "var(--bg-card)", borderRadius: 10, padding: 16,
              borderLeft: `4px solid ${COR_URGENCIA[r.urgencia] || "#6b7280"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 8 }}>{r.numero}</span>
                  <b>{r.titulo}</b>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge label={r.urgencia} cor={COR_URGENCIA[r.urgencia] || "#6b7280"} />
                  <Badge label={r.status} cor={COR_STATUS[r.status] || "#6b7280"} />
                </div>
              </div>

              {r.descricao && <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{r.descricao}</p>}

              <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap", alignItems: "center", fontSize: 12, color: "var(--text-muted)" }}>
                <span>📐 {r.disciplina}</span>
                {r.solicitante && <span>👤 {r.solicitante}</span>}
                {r.data_solicitacao && <span>📅 {r.data_solicitacao}</span>}

                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  {podeResponder && r.status !== "Fechado" && r.status !== "Respondido" && (
                    <button onClick={() => { setResponderModal(r); setResposta(""); }}
                      style={{ fontSize: 11, padding: "2px 10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                      💬 Responder
                    </button>
                  )}
                  {r.status === "Respondido" && (
                    <button onClick={() => fechar(r.id)}
                      style={{ fontSize: 11, padding: "2px 10px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                      ✅ Fechar
                    </button>
                  )}
                  {r.status === "Aberto" && (
                    <button onClick={() => { setForm({ ...r }); setModal(r); }}
                      style={{ fontSize: 11, padding: "2px 8px", background: "none", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer" }}>
                      ✏️ Editar
                    </button>
                  )}
                </div>
              </div>

              {r.resposta && (
                <div style={{ marginTop: 10, background: "var(--bg-hover)", borderRadius: 6, padding: 10, fontSize: 12 }}>
                  <b>Resposta:</b> {r.resposta}
                  {r.data_resposta && <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>({r.data_resposta})</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 24, width: "min(500px,95vw)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{modal === "new" ? "Nova RFI" : "Editar RFI"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Título *</span>
              <input value={form.titulo || ""} onChange={set("titulo")}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", boxSizing: "border-box" }} />
            </label>

            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Descrição</span>
              <textarea value={form.descricao || ""} onChange={set("descricao")} rows={3}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", resize: "vertical", boxSizing: "border-box" }} />
            </label>

            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Solicitante</span>
              <input value={form.solicitante || ""} onChange={set("solicitante")}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", boxSizing: "border-box" }} />
            </label>

            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Disciplina</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {DISCIPLINAS.map(d => (
                  <button key={d} onClick={() => setForm(f => ({ ...f, disciplina: d }))}
                    style={{
                      padding: "4px 12px", borderRadius: 20, border: "1px solid var(--border)", cursor: "pointer",
                      background: form.disciplina === d ? "#ef4444" : "var(--bg-input)",
                      color: form.disciplina === d ? "#fff" : "inherit", fontSize: 12, fontWeight: form.disciplina === d ? 700 : 400,
                    }}>{d}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Urgência</span>
              <div style={{ display: "flex", gap: 0, marginTop: 6, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                {URGENCIAS.map(u => (
                  <button key={u} onClick={() => setForm(f => ({ ...f, urgencia: u }))}
                    style={{
                      flex: 1, padding: "7px 0", border: "none", cursor: "pointer",
                      background: form.urgencia === u ? COR_URGENCIA[u] : "var(--bg-input)",
                      color: form.urgencia === u ? "#fff" : "inherit", fontSize: 12, fontWeight: form.urgencia === u ? 700 : 400,
                    }}>{u}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={salvar} disabled={saving || !form.titulo?.trim()}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responder Modal */}
      {responderModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 24, width: "min(460px,95vw)" }}>
            <h3 style={{ margin: "0 0 4px" }}>Responder RFI</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>{responderModal.numero} — {responderModal.titulo}</p>
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Resposta *</span>
              <textarea value={resposta} onChange={e => setResposta(e.target.value)} rows={5}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", resize: "vertical", boxSizing: "border-box" }} />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setResponderModal(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={responder} disabled={!resposta.trim()}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 700, opacity: !resposta.trim() ? 0.5 : 1 }}>
                ✅ Enviar Resposta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
