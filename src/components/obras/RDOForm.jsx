import { useState } from "react";
import { sb, getEmpresaId } from "../../services/supabase";

const CLIMAS = ["Ensolarado ☀️","Parcialmente nublado 🌤","Nublado ☁️","Chuva leve 🌦","Chuva forte 🌧","Tempestade ⛈"];

export function RDOForm({ obraId, obraName, onSaved, onClose }) {
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    clima: "Ensolarado ☀️", temperatura: "", total_trabalhadores: "",
    responsavel: "", atividades_realizadas: "", equipamentos_utilizados: "", intercorrencias: "",
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function salvar() {
    setSaving(true);
    try {
      const { data, error } = await sb.from("diario_obra").insert({
        ...form,
        obra_id: obraId,
        empresa_id: getEmpresaId(),
        temperatura: form.temperatura ? parseInt(form.temperatura) : null,
        total_trabalhadores: parseInt(form.total_trabalhadores) || 0,
        fotos: [],
      }).select("*").single();
      if (error) throw error;
      onSaved?.(data);
      onClose?.();
    } finally { setSaving(false); }
  }

  return (
    <div style={{ background:"var(--bg-card)", borderRadius:12, padding:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
        <h3 style={{ margin:0 }}>📋 Novo RDO — {obraName}</h3>
        {onClose && <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer" }}>✕</button>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:14, marginBottom:16 }}>
        {[["Data","data","date"],["Temperatura (°C)","temperatura","number"],["Trabalhadores","total_trabalhadores","number"],["Responsável técnico","responsavel","text"]].map(([l,k,t]) => (
          <label key={k}>
            <span style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:4 }}>{l}</span>
            <input type={t} value={form[k]} onChange={set(k)} style={{ width:"100%", padding:8, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-input)" }} />
          </label>
        ))}
        <label>
          <span style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:4 }}>Clima</span>
          <select value={form.clima} onChange={set("clima")} style={{ width:"100%", padding:8, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-input)" }}>
            {CLIMAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      {[["Atividades realizadas","atividades_realizadas","Descreva as atividades do dia..."],
        ["Equipamentos utilizados","equipamentos_utilizados","Betoneira, guindaste..."],
        ["Intercorrências / Observações","intercorrencias","Problemas, visitas, acidentes..."]].map(([l,k,ph]) => (
        <label key={k} style={{ display:"block", marginBottom:14 }}>
          <span style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:4 }}>{l}</span>
          <textarea value={form[k]} onChange={set(k)} placeholder={ph} rows={3}
            style={{ width:"100%", padding:8, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-input)", resize:"vertical" }} />
        </label>
      ))}
      <button onClick={salvar} disabled={saving}
        style={{ padding:"10px 28px", background:"#b41e1e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, opacity:saving?0.7:1 }}>
        {saving?"Registrando...":"Registrar RDO"}
      </button>
    </div>
  );
}
