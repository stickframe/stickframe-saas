import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { LOGO_STICKFRAME } from "../utils/cdn";

const C = { red: "#981915", border: "#e5e7eb", muted: "#6b7280", success: "#3f7a4b", danger: "#e74c3c", warning: "#e67e22", text: "#1a1a1a", dark: "#f5f5f7", card: "#fff" };

function AssinaturaInline({ onSalvar, onCancelar }) {
  const canvasRef = useRef(null);
  const [desenhando, setDesenhando] = useState(false);
  const [vazio, setVazio] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function iniciar(e) { e.preventDefault(); const c = canvasRef.current; const ctx = c.getContext("2d"); const p = getPos(e, c); ctx.beginPath(); ctx.moveTo(p.x, p.y); setDesenhando(true); setVazio(false); }
  function desenhar(e) { if (!desenhando) return; e.preventDefault(); const c = canvasRef.current; const ctx = c.getContext("2d"); const p = getPos(e, c); ctx.lineTo(p.x, p.y); ctx.stroke(); }
  function parar() { setDesenhando(false); }
  function limpar() { const c = canvasRef.current; const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); setVazio(true); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ border: "2px solid #ddd", borderRadius: 10, overflow: "hidden", background: "#fff", touchAction: "none" }}>
        <canvas ref={canvasRef} width={500} height={160}
          style={{ width: "100%", height: 160, display: "block", cursor: "crosshair" }}
          onMouseDown={iniciar} onMouseMove={desenhar} onMouseUp={parar} onMouseLeave={parar}
          onTouchStart={iniciar} onTouchMove={desenhar} onTouchEnd={parar}
        />
      </div>
      <p style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Assine acima com o dedo ou mouse</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={limpar} style={btnStyle("#888")}>Limpar</button>
        <button onClick={onCancelar} style={btnStyle("#888")}>Cancelar</button>
        <button disabled={vazio} onClick={() => onSalvar(canvasRef.current.toDataURL("image/png"))} style={btnStyle(vazio ? "#ccc" : C.red, "#fff", vazio)}> Confirmar assinatura</button>
      </div>
    </div>
  );
}

function btnStyle(bg, color = "#333", disabled = false) {
  return { padding: "9px 18px", borderRadius: 8, border: `1px solid ${bg}`, background: disabled ? "#eee" : bg === "#fff" ? "#fff" : bg, color: disabled ? "#aaa" : (color || (bg === "#fff" ? "#333" : "#fff")), fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit" };
}

export default function PortalColaborador() {
  const { token } = useParams();
  const [colab, setColab] = useState(null);
  const [epis, setEpis] = useState([]);
  const [dds, setDds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [assEpi, setAssEpi] = useState(null); // epi sendo assinado
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState("");
  const pontoUrl = token ? `${window.location.origin}/ponto/${token}` : null;

  useEffect(() => {
    if (!token) { setErro("Link inválido."); setLoading(false); return; }
    sb.rpc("ponto_get_colaborador", { p_token: token })
      .then(async ({ data, error }) => {
        if (error || !data) { setErro("Colaborador não encontrado."); setLoading(false); return; }
        setColab(data);
        const empId = data.empresa_id;
        const colabId = data.id;

        const [episR, ddsR] = await Promise.all([
          sb.from("sst_epis").select("id, item, quantidade, data_entrega, validade, assinado, assinatura_base64").eq("empresa_id", empId).eq("colaborador_id", colabId).order("data_entrega", { ascending: false }),
          sb.from("sst_dds").select("id, data, tema, facilitador").eq("empresa_id", empId).order("data", { ascending: false }).limit(10),
        ]);

        setEpis(episR.data || []);
        setDds(ddsR.data || []);
        setLoading(false);
      });
  }, [token]);

  async function salvarAssEpi(base64) {
    if (!assEpi) return;
    setSalvando(true);
    await sb.from("sst_epis").update({ assinatura_base64: base64, assinado: true }).eq("id", assEpi.id);
    setEpis(prev => prev.map(e => e.id === assEpi.id ? { ...e, assinado: true, assinatura_base64: base64 } : e));
    setAssEpi(null);
    setSalvando(false);
    setToast("Assinatura registrada com sucesso!");
    setTimeout(() => setToast(""), 3000);
  }

  const fmt = (d) => d ? new Date(d + "T00:00").toLocaleDateString("pt-BR") : "—";
  const episPendentes = epis.filter(e => !e.assinado);
  const episAssinados = epis.filter(e => e.assinado);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #ddd", borderTop: `3px solid ${C.red}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: C.muted, fontSize: 13 }}>Carregando portal...</p>
    </div>
  );

  if (erro) return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}></div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0" }}>Link inválido</div>
      <div style={{ fontSize: 13, color: "#888" }}>{erro}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "'DM Sans',sans-serif", paddingBottom: 40 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Header */}
      <div style={{ background: C.red, padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <img src={LOGO_STICKFRAME} alt="StickFrame" style={{ height: 36, filter: "brightness(0) invert(1)" }} />
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{colab?.nome || "Colaborador"}</div>
          <div style={{ color: "#ffffff99", fontSize: 12 }}>{colab?.cargo || "Portal do Colaborador"}</div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>

        {/* Toast */}
        {toast && (
          <div style={{ background: C.success, color: "#fff", borderRadius: 10, padding: "12px 18px", marginBottom: 16, fontWeight: 700, fontSize: 13, textAlign: "center" }}>
             {toast}
          </div>
        )}

        {/* Ponto eletrônico */}
        <div style={{ background: C.card, borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>⏱ Ponto Eletrônico</div>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>Registre sua entrada e saída com localização GPS.</p>
          <a href={pontoUrl} style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 10, background: C.red, color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
             Bater ponto agora
          </a>
        </div>

        {/* EPIs pendentes */}
        {episPendentes.length > 0 && (
          <div style={{ background: C.card, borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: `2px solid ${C.warning}44` }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: C.warning }}> {episPendentes.length} EPI(s) aguardando assinatura</div>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Assine o recebimento dos equipamentos de proteção abaixo.</p>
            {assEpi ? (
              <div>
                <div style={{ background: "#f5f5f7", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>{assEpi.item}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Entregue em {fmt(assEpi.data_entrega)}</div>
                </div>
                <AssinaturaInline onSalvar={salvarAssEpi} onCancelar={() => setAssEpi(null)} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {episPendentes.map(e => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, background: "#f5f5f7", border: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{e.item}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Entregue: {fmt(e.data_entrega)} · Qtd: {e.quantidade}</div>
                    </div>
                    <button onClick={() => setAssEpi(e)} style={btnStyle(C.warning, "#fff")}> Assinar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EPIs já assinados */}
        {episAssinados.length > 0 && (
          <div style={{ background: C.card, borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}> EPIs assinados ({episAssinados.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {episAssinados.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.item}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Entregue: {fmt(e.data_entrega)}{e.validade ? ` · Validade: ${fmt(e.validade)}` : ""}</div>
                  </div>
                  <span style={{ fontSize: 18 }}></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DDS recentes */}
        {dds.length > 0 && (
          <div style={{ background: C.card, borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}> DDS Recentes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dds.map(d => (
                <div key={d.id} style={{ padding: "10px 12px", borderRadius: 8, background: "#f5f5f7", border: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.tema}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{fmt(d.data)}{d.facilitador ? ` · ${d.facilitador}` : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 20 }}>
          <strong style={{ color: "#888" }}>Stick Frame Sistemas Construtivos</strong><br />
          Portal do Colaborador — acesso exclusivo
        </div>
      </div>
    </div>
  );
}
