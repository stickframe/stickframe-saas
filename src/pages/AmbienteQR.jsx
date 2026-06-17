import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { LOGO_STICKFRAME } from "../utils/cdn";

const C = { red: "#981915", border: "#e5e7eb", muted: "#6b7280", success: "#2e9e5b", text: "#1a1a1a", dark: "#f5f5f7" };
const CATEGORIAS = ["Hidráulica","Elétrica","Acabamento","Estrutural","Esquadrias","Marcenaria","Pintura","Outro"];

export default function AmbienteQR() {
  const { token } = useParams();
  const [dados,    setDados]   = useState(null);
  const [loading,  setLoading] = useState(true);
  const [enviando, setEnviando]= useState(false);
  const [enviado,  setEnviado] = useState(false);
  const [erro,     setErro]    = useState(null);
  const [form,     setForm]    = useState({ titulo: "", descricao: "", categoria: "Outro" });
  const [foto,     setFoto]    = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    sb.rpc("ambiente_get_dados", { p_token: token })
      .then(({ data, error }) => {
        if (error || !data) { setErro("Ambiente não encontrado."); return; }
        setDados(data);
      })
      .catch(() => setErro("Erro ao carregar."))
      .finally(() => setLoading(false));
  }, [token]);

  async function enviar() {
    if (!form.titulo.trim()) return;
    setEnviando(true);
    try {
      let fotoUrl = null;
      if (foto) {
        const ext = foto.name.split(".").pop();
        const path = `ocorrencias/${token}/${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from("arquivos").upload(path, foto);
        if (!upErr) fotoUrl = path;
      }
      const { error } = await sb.rpc("ambiente_registrar_ocorrencia", {
        p_token:     token,
        p_titulo:    `[${form.categoria}] ${form.titulo.trim()}`,
        p_descricao: form.descricao.trim() || "—",
        p_foto_url:  fotoUrl,
      });
      if (error) throw error;
      setEnviado(true);
    } catch (e) { setErro(e.message); }
    finally { setEnviando(false); }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ color: C.muted }}>Carregando...</div>
    </div>
  );

  if (erro) return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}></div>
        <div style={{ fontWeight: 700 }}>{erro}</div>
      </div>
    </div>
  );

  const { ambiente, obra } = dados;

  return (
    <div style={{ minHeight: "100vh", background: C.dark, fontFamily: "Inter, system-ui, sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: C.red, padding: "20px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <img src={LOGO_STICKFRAME} alt="" style={{ height: 24, filter: "brightness(0) invert(1)" }} onError={(e) => { e.target.style.display = "none"; }} />
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>OCORRÊNCIA DE CAMPO</span>
        </div>
        <div style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>{ambiente.nome}</div>
        {ambiente.andar && <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 3 }}>{ambiente.andar}</div>}
        {obra?.nome && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}> {obra.nome}</div>}
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        {enviado ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.success }}>Ocorrência registrada!</div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>A equipe responsável foi notificada e irá analisar.</div>
            <button onClick={() => { setEnviado(false); setForm({ titulo: "", descricao: "", categoria: "Outro" }); setFoto(null); }}
              style={{ marginTop: 20, padding: "12px 24px", background: C.red, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              + Nova ocorrência
            </button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Registrar ocorrência</div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>CATEGORIA</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIAS.map((cat) => (
                  <button key={cat} onClick={() => setForm((f) => ({ ...f, categoria: cat }))} style={{
                    padding: "6px 12px", borderRadius: 20, border: `1px solid ${form.categoria === cat ? C.red : C.border}`,
                    background: form.categoria === cat ? C.red + "12" : "#fff",
                    color: form.categoria === cat ? C.red : C.muted,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>{cat}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PROBLEMA *</div>
              <input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder={`Ex: Faltou ralo no banheiro da ${ambiente.nome}`}
                style={{ width: "100%", padding: "12px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>DESCRIÇÃO</div>
              <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva o problema com mais detalhes..." rows={3}
                style={{ width: "100%", padding: "12px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>FOTO</div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] || null)} style={{ display: "none" }} />
              {foto ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px" }}>
                  <span style={{ fontSize: 20 }}></span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{foto.name}</span>
                  <button onClick={() => setFoto(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "12px", border: `2px dashed ${C.border}`, borderRadius: 10, background: C.dark, color: C.muted, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                   Tirar foto / selecionar
                </button>
              )}
            </div>

            <button onClick={enviar} disabled={enviando || !form.titulo.trim()} style={{
              padding: "15px", background: enviando || !form.titulo.trim() ? "#ccc" : C.red,
              border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {enviando ? "Enviando..." : " Reportar Ocorrência"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
