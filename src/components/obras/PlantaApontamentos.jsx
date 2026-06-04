import { useState, useEffect, useRef } from "react";
import { sb } from "../../services/supabase";
import {
  listarApontamentosArquivo,
  criarApontamento,
  atualizarApontamento,
  resolverApontamento,
  deletarApontamento,
} from "../../services/repositories/apontamentoRepository";
import useAppStore from "../../store/useAppStore";

const COR_STATUS = { Aberto: "#ef4444", "Em andamento": "#f59e0b", Resolvido: "#22c55e" };
const COR_PRIORIDADE = { Baixa: "#6b7280", Media: "#3b82f6", Alta: "#f97316", Critica: "#ef4444" };

function Pin({ numero, x, y, status, prioridade, onClick }) {
  return (
    <div
      onClick={onClick}
      title={`#${numero} — ${status}`}
      style={{
        position: "absolute",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -100%)",
        width: 28, height: 28,
        background: COR_STATUS[status] || "#6b7280",
        borderRadius: "50% 50% 50% 0",
        rotate: "-45deg",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 900, fontSize: 11,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        zIndex: 10,
        border: `2px solid ${COR_PRIORIDADE[prioridade] || "#fff"}`,
      }}
    >
      <span style={{ rotate: "45deg" }}>{numero}</span>
    </div>
  );
}

function ApontamentoModal({ ap, obraId, onClose, onSave }) {
  const [form, setForm] = useState({
    titulo: ap?.titulo || "",
    descricao: ap?.descricao || "",
    prioridade: ap?.prioridade || "Media",
    status: ap?.status || "Aberto",
    prazo: ap?.prazo || "",
  });
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      if (ap?.id) {
        const updated = await atualizarApontamento(ap.id, form);
        onSave(updated);
      } else {
        const created = await criarApontamento({ ...ap, ...form, obra_id: obraId });
        onSave(created);
      }
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 24, width: "min(480px, 95vw)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{ap?.id ? "Editar apontamento" : "Novo apontamento"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Título *</span>
          <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)" }} />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Descrição</span>
          <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            rows={3} style={{ display: "block", width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", resize: "vertical" }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Prioridade</span>
            <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
              style={{ display: "block", width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)" }}>
              {["Baixa","Media","Alta","Critica"].map(p => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Status</span>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ display: "block", width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)" }}>
              {["Aberto","Em andamento","Resolvido"].map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Prazo</span>
          <input type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)" }} />
        </label>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "none", cursor: "pointer" }}>Cancelar</button>
          <button onClick={salvar} disabled={saving || !form.titulo.trim()}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlantaApontamentos({ arquivo, obraId, onClose }) {
  const imgRef = useRef();
  const [apontamentos, setApontamentos] = useState([]);
  const [novoPin, setNovoPin] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [modoAdicionar, setModoAdicionar] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useAppStore(s => s.user);

  const imgUrl = sb.storage.from("arquivos").getPublicUrl(arquivo.storage_path).data.publicUrl;

  useEffect(() => {
    listarApontamentosArquivo(arquivo.id)
      .then(setApontamentos)
      .finally(() => setLoading(false));
  }, [arquivo.id]);

  function handleImgClick(e) {
    if (!modoAdicionar) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setNovoPin({ coord_x: x, coord_y: y, arquivo_id: arquivo.id });
    setModoAdicionar(false);
  }

  function handleSave(ap) {
    setApontamentos(prev => {
      const idx = prev.findIndex(a => a.id === ap.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = ap; return next; }
      return [...prev, ap];
    });
  }

  async function handleDelete(id) {
    await deletarApontamento(id);
    setApontamentos(prev => prev.filter(a => a.id !== id));
    setSelecionado(null);
  }

  const abertos = apontamentos.filter(a => a.status === "Aberto").length;
  const emAndamento = apontamentos.filter(a => a.status === "Em andamento").length;
  const resolvidos = apontamentos.filter(a => a.status === "Resolvido").length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#1e1e2e", flexWrap: "wrap" }}>
        <button onClick={onClose} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>✕ Fechar</button>
        <span style={{ color: "#fff", fontWeight: 700 }}>{arquivo.nome} — Apontamentos</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <span style={{ color: "#ef4444", fontSize: 13 }}>🔴 {abertos} abertos</span>
          <span style={{ color: "#f59e0b", fontSize: 13 }}>🟡 {emAndamento} em andamento</span>
          <span style={{ color: "#22c55e", fontSize: 13 }}>🟢 {resolvidos} resolvidos</span>
        </div>
        <button
          onClick={() => setModoAdicionar(m => !m)}
          style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: modoAdicionar ? "#f59e0b" : "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
          {modoAdicionar ? "🎯 Clique na planta..." : "📌 Adicionar apontamento"}
        </button>
      </div>

      {/* Plant with pins */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 16, background: "#111" }}>
        {loading ? <p style={{ color: "#fff" }}>Carregando...</p> : (
          <div style={{ position: "relative", display: "inline-block", cursor: modoAdicionar ? "crosshair" : "default" }}>
            <img
              ref={imgRef}
              src={imgUrl}
              onClick={handleImgClick}
              style={{ maxWidth: "90vw", maxHeight: "80vh", display: "block", userSelect: "none" }}
              alt={arquivo.nome}
            />
            {apontamentos.map((ap, i) => (
              <Pin
                key={ap.id}
                numero={i + 1}
                x={ap.coord_x}
                y={ap.coord_y}
                status={ap.status}
                prioridade={ap.prioridade}
                onClick={() => setSelecionado(ap)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail panel for selected pin */}
      {selecionado && (
        <div style={{ position: "fixed", right: 16, top: 80, width: 300, background: "var(--bg-card)", borderRadius: 12, padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 2100 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <h4 style={{ margin: 0 }}>{selecionado.titulo}</h4>
            <button onClick={() => setSelecionado(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>✕</button>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 8px" }}>{selecionado.descricao}</p>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ background: COR_STATUS[selecionado.status], color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 12 }}>{selecionado.status}</span>
            <span style={{ background: COR_PRIORIDADE[selecionado.prioridade], color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 12 }}>{selecionado.prioridade}</span>
          </div>
          {selecionado.prazo && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Prazo: {selecionado.prazo}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => { setSelecionado(null); setNovoPin({ ...selecionado, _edit: true }); }}
              style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer" }}>✏️ Editar</button>
            <button onClick={() => handleDelete(selecionado.id)}
              style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}>🗑 Excluir</button>
          </div>
        </div>
      )}

      {/* New/Edit modal */}
      {novoPin && (
        <ApontamentoModal
          ap={novoPin._edit ? novoPin : { coord_x: novoPin.coord_x, coord_y: novoPin.coord_y, arquivo_id: arquivo.id }}
          obraId={obraId}
          onClose={() => setNovoPin(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
