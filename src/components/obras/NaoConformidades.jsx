import { useState, useEffect } from "react";
import { listarNCRs, criarNCR, atualizarNCR, fecharNCR } from "../../services/repositories/naoConformidadeRepository";
import { C } from "../../utils/constants";

const COR_G = { Baixa: C.muted, Media: "#4a9eff", Alta: "#e67e22", Critica: C.danger };
const COR_S = { Aberta: C.danger, "Em análise": C.warning, "Em correção": "#e67e22", Verificando: "#4a9eff", Fechada: C.success };
const DISCIPLINAS = ["Civil", "Elétrico", "Hidráulico", "Estrutural", "Acabamento", "Outro"];
const SUGESTOES_NCR = [
  "Montagem de perfil fora de prumo ou esquadro",
  "Espaçamento entre perfis diferente do projeto",
  "Parafuso ausente ou incorreto na ligação",
  "Placa de OSB ou drywall fixada sem folga de dilatação",
  "Isolamento termoacústico não instalado conforme projeto",
  "Barreira de vapor instalada de forma incorreta",
  "Perfil com corte irregular ou sem tratamento de corte",
  "Fixação de guia no piso/laje sem selante acústico",
  "Montante desalinhado com abertura de vão",
  "Revestimento externo com juntas sem fita de vedação",
  "Contravento ou travamento lateral ausente",
  "Caixilho de janela/porta fora de nível",
  "Instalação hidráulica ou elétrica sem passador de proteção no perfil",
  "Radier sem nível adequado para assentamento da guia",
  "Placa de fachada fixada sem espaçamento mínimo do solo",
  "Tabica de forro mal executada",
  "Forro fora de nível",
];

const inputStyle = {
  display: "block", width: "100%", marginTop: 4, padding: "8px 10px",
  borderRadius: 6, border: `1px solid ${C.border}`, background: C.dark,
  color: C.text, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
};

function BadgeNcr({ label, cor }) {
  return (
    <span style={{ background: cor + "20", color: cor, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, border: `1px solid ${cor}40` }}>
      {label}
    </span>
  );
}

export default function NaoConformidades({ obraId }) {
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [fecharId, setFecharId] = useState(null);
  const [acaoCorretiva, setAcaoCorretiva] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [obraId]);

  async function load() {
    setLoading(true);
    try { setNcrs(await listarNCRs(obraId)); } finally { setLoading(false); }
  }

  const setf = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function salvar() {
    setSaving(true);
    try {
      if (modal === "new") {
        const n = await criarNCR({ ...form, obra_id: obraId });
        setNcrs(p => [...p, n]);
      } else {
        const n = await atualizarNCR(modal.id, form);
        setNcrs(p => p.map(x => x.id === n.id ? n : x));
      }
      setModal(null); setForm({});
    } finally { setSaving(false); }
  }

  async function fechar() {
    if (!acaoCorretiva.trim()) return;
    const n = await fecharNCR(fecharId, acaoCorretiva);
    setNcrs(p => p.map(x => x.id === n.id ? n : x));
    setFecharId(null); setAcaoCorretiva("");
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
          <span style={{ color: C.danger, fontWeight: 700 }}>● {ncrs.filter(n => n.status !== "Fechada").length} abertas</span>
          <span style={{ color: C.success, fontWeight: 700 }}>● {ncrs.filter(n => n.status === "Fechada").length} fechadas</span>
        </div>
        <button
          onClick={() => { setForm({ disciplina: "Civil", gravidade: "Media" }); setModal("new"); }}
          style={{ padding: "7px 14px", background: C.danger, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}
        >+ Nova NCR</button>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: C.muted }}>Carregando...</p>
      ) : ncrs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, background: C.dark, borderRadius: 10, border: `1px solid ${C.border}` }}>
          Nenhuma não-conformidade registrada.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ncrs.map(n => (
            <div key={n.id} style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, borderLeft: `4px solid ${COR_G[n.gravidade] || C.muted}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: C.muted, marginRight: 8 }}>NCR-{String(n.numero || 0).padStart(3, "0")}</span>
                  <strong>{n.titulo}</strong>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <BadgeNcr label={n.gravidade} cor={COR_G[n.gravidade] || C.muted} />
                  <BadgeNcr label={n.status} cor={COR_S[n.status] || C.muted} />
                </div>
              </div>
              {n.descricao && <p style={{ margin: "8px 0 0", fontSize: 13, color: C.muted }}>{n.descricao}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.muted }}>📐 {n.disciplina}</span>
                {n.prazo && <span style={{ fontSize: 12, color: C.muted }}>📅 {new Date(n.prazo + "T00:00").toLocaleDateString("pt-BR")}</span>}
                {n.status !== "Fechada" && (
                  <>
                    <button onClick={() => { setForm({ ...n }); setModal(n); }}
                      style={{ marginLeft: "auto", fontSize: 11, padding: "4px 10px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>✏️ Editar</button>
                    <button onClick={() => setFecharId(n.id)}
                      style={{ fontSize: 11, padding: "4px 10px", background: C.success + "18", color: C.success, border: `1px solid ${C.success}44`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>✅ Fechar</button>
                  </>
                )}
              </div>
              {n.acao_corretiva && (
                <div style={{ marginTop: 8, background: C.success + "12", borderRadius: 6, padding: 8, fontSize: 12, color: C.success }}>
                  <strong>Ação corretiva:</strong> {n.acao_corretiva}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {modal !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, borderRadius: 12, padding: 24, width: "min(480px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{modal === "new" ? "Nova NCR" : "Editar NCR"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muted }}>✕</button>
            </div>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Título *</span>
              <input value={form.titulo || ""} onChange={setf("titulo")} list="ncr-sugestoes"
                placeholder="Ex: Execução fora de esquadro…" style={inputStyle} />
              <datalist id="ncr-sugestoes">
                {SUGESTOES_NCR.map(s => <option key={s} value={s} />)}
              </datalist>
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Descrição</span>
              <textarea value={form.descricao || ""} onChange={setf("descricao")} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[["Disciplina", "disciplina", DISCIPLINAS], ["Gravidade", "gravidade", ["Baixa", "Media", "Alta", "Critica"]]].map(([l, k, opts]) => (
                <label key={k}>
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{l}</span>
                  <select value={form[k] || ""} onChange={setf(k)} style={inputStyle}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <label style={{ display: "block", marginBottom: 18 }}>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Prazo</span>
              <input type="date" value={form.prazo || ""} onChange={setf("prazo")} style={inputStyle} />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={salvar} disabled={saving || !form.titulo?.trim()} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: C.danger, color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal fechar */}
      {fecharId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, borderRadius: 12, padding: 24, width: "min(440px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>Fechar NCR</h3>
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Ação corretiva adotada *</span>
              <textarea value={acaoCorretiva} onChange={e => setAcaoCorretiva(e.target.value)} rows={4}
                style={{ ...inputStyle, resize: "vertical" }} />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setFecharId(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={fechar} disabled={!acaoCorretiva.trim()} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: C.success, color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", opacity: !acaoCorretiva.trim() ? 0.5 : 1 }}>✅ Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
