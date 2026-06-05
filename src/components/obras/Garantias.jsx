import { useState, useEffect } from "react";
import { listarGarantias, criarGarantia, atualizarGarantia, deletarGarantia } from "../../services/repositories/garantiaRepository";

const COR = { Vigente: "#22c55e", Vencendo: "#f59e0b", Vencida: "#ef4444", Acionada: "#8b5cf6" };

export default function Garantias({ obraId }) {
  const [garantias, setGarantias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [obraId]);
  async function load() {
    setLoading(true);
    try { setGarantias(await listarGarantias(obraId)); } finally { setLoading(false); }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function salvar() {
    setSaving(true);
    try {
      if (modal === "new") {
        const g = await criarGarantia({ ...form, obra_id: obraId });
        setGarantias(p => [...p, g]);
      } else {
        const g = await atualizarGarantia(modal.id, form);
        setGarantias(p => p.map(x => x.id === g.id ? g : x));
      }
      setModal(null); setForm({});
    } finally { setSaving(false); }
  }

  const vencendo = garantias.filter(g => g.status === "Vencendo").length;
  const vencidas = garantias.filter(g => g.status === "Vencida").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
          {vencendo > 0 && <span style={{ color: "#f59e0b" }}>⚠️ {vencendo} vencendo em breve</span>}
          {vencidas > 0 && <span style={{ color: "#ef4444" }}>🔴 {vencidas} vencida(s)</span>}
        </div>
        <button onClick={() => { setForm({ prazo_anos: 1 }); setModal("new"); }}
          style={{ padding: "7px 14px", background: "#b41e1e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
          + Nova garantia
        </button>
      </div>

      {loading ? <p>Carregando...</p> : garantias.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>🛡️ Nenhuma garantia cadastrada.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {garantias.map(g => (
            <div key={g.id} style={{ background: "#ffffff", borderRadius: 10, padding: 16, borderLeft: `4px solid ${COR[g.status]}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{g.item}</div>
                {g.fornecedor && <div style={{ fontSize: 12, color: "#6b7280" }}>Fornecedor: {g.fornecedor}</div>}
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  Vence em: <b>{g.data_fim}</b>
                  {g.diasRestantes !== undefined && g.status !== "Vencida" && (
                    <span style={{ marginLeft: 8, color: COR[g.status] }}>({g.diasRestantes} dias)</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ background: COR[g.status], color: "#fff", borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{g.status}</span>
                <button onClick={() => { setForm({...g}); setModal(g); }}
                  style={{ fontSize: 11, padding: "3px 8px", background: "none", border: "1px solid #e2e4ea", borderRadius: 4, cursor: "pointer" }}>✏️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: 12, padding: 24, width: "min(460px,95vw)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{modal === "new" ? "Nova garantia" : "Editar garantia"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {[["Item *","item","text"],["Fornecedor","fornecedor","text"],["Data início","data_inicio","date"],["Data fim *","data_fim","date"]].map(([l,k,t]) => (
              <label key={k} style={{ display: "block", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{l}</span>
                <input type={t} value={form[k]||""} onChange={set(k)} style={{ display: "block", width: "100%", marginTop: 3, padding: 8, borderRadius: 6, border: "1px solid #e2e4ea", background: "#f5f6f8", boxSizing: "border-box" }} />
              </label>
            ))}
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Observações</span>
              <textarea value={form.observacoes||""} onChange={set("observacoes")} rows={2} style={{ display: "block", width: "100%", marginTop: 3, padding: 8, borderRadius: 6, border: "1px solid #e2e4ea", background: "#f5f6f8", resize: "vertical", boxSizing: "border-box" }} />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e4ea", background: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={salvar} disabled={saving || !form.item?.trim() || !form.data_fim}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#b41e1e", color: "#fff", cursor: "pointer", fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
