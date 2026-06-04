import { useState, useEffect } from "react";
import { listarNCRs, criarNCR, atualizarNCR, fecharNCR, deletarNCR } from "../../services/repositories/naoConformidadeRepository";

const COR_G = { Baixa:"#6b7280", Media:"#3b82f6", Alta:"#f97316", Critica:"#ef4444" };
const COR_S = { Aberta:"#ef4444", "Em análise":"#f59e0b", "Em correção":"#f97316", Verificando:"#3b82f6", Fechada:"#22c55e" };
const DISCIPLINAS = ["Civil","Elétrico","Hidráulico","Estrutural","Acabamento","Outro"];

function Badge({ label, cor }) {
  return <span style={{ background: cor, color:"#fff", borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{label}</span>;
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

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

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
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ display:"flex", gap:16, fontSize:13 }}>
          <span>🔴 <b>{ncrs.filter(n=>n.status!=="Fechada").length}</b> abertas</span>
          <span>🟢 <b>{ncrs.filter(n=>n.status==="Fechada").length}</b> fechadas</span>
        </div>
        <button onClick={() => { setForm({ disciplina:"Civil", gravidade:"Media" }); setModal("new"); }}
          style={{ padding:"7px 14px", background:"#ef4444", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700 }}>+ Nova NCR</button>
      </div>

      {loading ? <p>Carregando...</p> : ncrs.length === 0 ? (
        <div style={{ textAlign:"center", padding:40, color:"var(--text-muted)" }}>✅ Nenhuma não-conformidade registrada.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {ncrs.map(n => (
            <div key={n.id} style={{ background:"var(--bg-card)", borderRadius:10, padding:16, borderLeft:`4px solid ${COR_G[n.gravidade]}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                <div>
                  <span style={{ fontSize:11, color:"var(--text-muted)", marginRight:8 }}>NCR-{String(n.numero||0).padStart(3,"0")}</span>
                  <b>{n.titulo}</b>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <Badge label={n.gravidade} cor={COR_G[n.gravidade]} />
                  <Badge label={n.status} cor={COR_S[n.status]} />
                </div>
              </div>
              {n.descricao && <p style={{ margin:"8px 0 0", fontSize:13, color:"var(--text-muted)" }}>{n.descricao}</p>}
              <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"var(--text-muted)" }}>📐 {n.disciplina}</span>
                {n.prazo && <span style={{ fontSize:12, color:"var(--text-muted)" }}>📅 {n.prazo}</span>}
                {n.status !== "Fechada" && <>
                  <button onClick={() => { setForm({...n}); setModal(n); }}
                    style={{ marginLeft:"auto", fontSize:11, padding:"2px 8px", background:"none", border:"1px solid var(--border)", borderRadius:4, cursor:"pointer" }}>✏️ Editar</button>
                  <button onClick={() => setFecharId(n.id)}
                    style={{ fontSize:11, padding:"2px 8px", background:"#22c55e", color:"#fff", border:"none", borderRadius:4, cursor:"pointer" }}>✅ Fechar</button>
                </>}
              </div>
              {n.acao_corretiva && (
                <div style={{ marginTop:8, background:"var(--bg-hover)", borderRadius:6, padding:8, fontSize:12 }}>
                  <b>Ação corretiva:</b> {n.acao_corretiva}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {modal !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"var(--bg-card)", borderRadius:12, padding:24, width:"min(480px,95vw)", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{ margin:0 }}>{modal==="new" ? "Nova NCR" : "Editar NCR"}</h3>
              <button onClick={() => setModal(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            <label style={{ display:"block", marginBottom:12 }}>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>Título *</span>
              <input value={form.titulo||""} onChange={set("titulo")} style={{ display:"block", width:"100%", marginTop:4, padding:8, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-input)" }} />
            </label>
            <label style={{ display:"block", marginBottom:12 }}>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>Descrição</span>
              <textarea value={form.descricao||""} onChange={set("descricao")} rows={3} style={{ display:"block", width:"100%", marginTop:4, padding:8, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-input)", resize:"vertical" }} />
            </label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              {[["Disciplina","disciplina",DISCIPLINAS],["Gravidade","gravidade",["Baixa","Media","Alta","Critica"]]].map(([l,k,opts]) => (
                <label key={k}>
                  <span style={{ fontSize:12, color:"var(--text-muted)" }}>{l}</span>
                  <select value={form[k]||""} onChange={set(k)} style={{ display:"block", width:"100%", marginTop:4, padding:8, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-input)" }}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <label style={{ display:"block", marginBottom:16 }}>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>Prazo</span>
              <input type="date" value={form.prazo||""} onChange={set("prazo")} style={{ display:"block", width:"100%", marginTop:4, padding:8, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-input)" }} />
            </label>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => setModal(null)} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid var(--border)", background:"none", cursor:"pointer" }}>Cancelar</button>
              <button onClick={salvar} disabled={saving||!form.titulo?.trim()} style={{ padding:"8px 20px", borderRadius:8, border:"none", background:"#ef4444", color:"#fff", cursor:"pointer", fontWeight:700, opacity:saving?0.6:1 }}>
                {saving?"Salvando...":"Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fechar modal */}
      {fecharId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"var(--bg-card)", borderRadius:12, padding:24, width:"min(440px,95vw)" }}>
            <h3 style={{ margin:"0 0 12px" }}>Fechar NCR</h3>
            <label style={{ display:"block", marginBottom:16 }}>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>Ação corretiva adotada *</span>
              <textarea value={acaoCorretiva} onChange={e => setAcaoCorretiva(e.target.value)} rows={4}
                style={{ display:"block", width:"100%", marginTop:4, padding:8, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-input)", resize:"vertical" }} />
            </label>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => setFecharId(null)} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid var(--border)", background:"none", cursor:"pointer" }}>Cancelar</button>
              <button onClick={fechar} disabled={!acaoCorretiva.trim()} style={{ padding:"8px 20px", borderRadius:8, border:"none", background:"#22c55e", color:"#fff", cursor:"pointer", fontWeight:700, opacity:!acaoCorretiva.trim()?0.5:1 }}>✅ Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
