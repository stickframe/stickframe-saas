import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { LOGO_STICKFRAME } from "../utils/cdn";

const C = { red: "#981915", border: "#e5e7eb", muted: "#6b7280", success: "#2e9e5b", text: "#1a1a1a", dark: "#f5f5f7" };

export default function PontoColaborador() {
  const { token } = useParams();
  const [dados,     setDados]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [enviando,  setEnviando]  = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro,      setErro]      = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | obtendo | ok | negado
  const [obraId,    setObraId]    = useState("");

  useEffect(() => {
    if (!token) { setErro("Token inválido."); setLoading(false); return; }
    sb.rpc("ponto_get_colaborador", { p_token: token })
      .then(({ data, error }) => {
        if (error || !data) { setErro("Colaborador não encontrado."); return; }
        setDados(data);
        // Pré-seleciona a única obra se só tiver uma
        if (data.obras?.length === 1) setObraId(data.obras[0].id);
      })
      .catch(() => setErro("Erro ao carregar."))
      .finally(() => setLoading(false));
  }, [token]);

  async function registrar() {
    setEnviando(true);
    setGpsStatus("obtendo");

    let lat = null, lng = null;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, maximumAge: 0 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      setGpsStatus("ok");
    } catch (_) {
      setGpsStatus("negado");
    }

    const params = { p_token: token, p_lat: lat, p_lng: lng };
    if (obraId) params.p_obra_id = obraId;

    const { data, error } = await sb.rpc("ponto_registrar", params);
    if (error) { setErro(error.message); setEnviando(false); return; }
    setResultado(data);
    setDados((prev) => ({
      ...prev,
      pontos_hoje: [{ tipo: data.tipo, created_at: new Date().toISOString(), lat, lng, distancia_obra_m: data.distancia_m }, ...(prev?.pontos_hoje || [])],
    }));
    setEnviando(false);
  }

  function calcHoras(pontos) {
    let total = 0;
    const sorted = [...pontos].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    let lastEntrada = null;
    for (const p of sorted) {
      if (p.tipo === "entrada") { lastEntrada = new Date(p.created_at); }
      else if (p.tipo === "saida" && lastEntrada) {
        total += (new Date(p.created_at) - lastEntrada) / 3600000;
        lastEntrada = null;
      }
    }
    return total;
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ color: C.muted }}>Carregando...</div>
    </div>
  );

  if (erro) return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{erro}</div>
      </div>
    </div>
  );

  const { colaborador, pontos_hoje, obras } = dados;
  const horas = calcHoras(pontos_hoje || []);
  const ultimoPonto = (pontos_hoje || [])[0];
  const proximoTipo = !ultimoPonto || ultimoPonto.tipo === "saida" ? "entrada" : "saida";
  const salarioDiario = colaborador.salario ? colaborador.salario / 26 : null;
  const custoDia = salarioDiario && horas > 0 ? (salarioDiario / 8) * horas : 0;
  const obraSelecionada = (obras || []).find((o) => o.id === obraId);
  const podeRegistrar = (obras || []).length === 0 || obraId;

  return (
    <div style={{ minHeight: "100vh", background: C.dark, fontFamily: "Inter, system-ui, sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: C.red, padding: "20px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <img src={LOGO_STICKFRAME} alt="" style={{ height: 24, filter: "brightness(0) invert(1)" }} onError={(e) => { e.target.style.display = "none"; }} />
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>PONTO ELETRÔNICO</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {colaborador.foto_url ? (
            <img src={colaborador.foto_url} alt={colaborador.nome} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
              {colaborador.nome[0].toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>{colaborador.nome}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{colaborador.cargo || colaborador.especialidade}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Seletor de obra */}
        {(obras || []).length > 0 && (
          <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: C.dark, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>🏗 Obra</div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              {obras.length === 1 ? (
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{obras[0].nome}</div>
              ) : (
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${obraId ? C.red : C.border}`,
                    fontSize: 14, fontWeight: 600, color: obraId ? C.text : C.muted,
                    background: "#fff", fontFamily: "inherit", outline: "none", appearance: "none",
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="">Selecione a obra...</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              )}
              {!obraId && obras.length > 1 && (
                <div style={{ marginTop: 6, fontSize: 11, color: C.red, fontWeight: 600 }}>⚠️ Selecione a obra para registrar o ponto</div>
              )}
            </div>
          </div>
        )}

        {/* Resultado flash */}
        {resultado && (
          <div style={{ background: resultado.tipo === "entrada" ? "#f0fdf4" : "#fef9ec", border: `1px solid ${resultado.tipo === "entrada" ? "#86efac" : "#fde68a"}`, borderRadius: 14, padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{resultado.tipo === "entrada" ? "✅" : "👋"}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: resultado.tipo === "entrada" ? C.success : "#92400e" }}>
              {resultado.tipo === "entrada" ? "Entrada registrada!" : "Saída registrada!"}
            </div>
            <div style={{ fontSize: 16, color: C.muted, marginTop: 4 }}>{resultado.hora}</div>
            {obraSelecionada && (
              <div style={{ marginTop: 8, fontSize: 13, color: C.muted }}>🏗 {obraSelecionada.nome}</div>
            )}
            {resultado.distancia_m != null && (
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: resultado.fora_da_obra ? "#fef2f2" : "#f0fdf4", border: `1px solid ${resultado.fora_da_obra ? "#fca5a5" : "#86efac"}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: resultado.fora_da_obra ? C.red : C.success }}>
                  {resultado.fora_da_obra ? "⚠️" : "📍"} {resultado.distancia_m}m da obra
                  {resultado.fora_da_obra && " — fora do perímetro"}
                </span>
              </div>
            )}
            {gpsStatus === "negado" && (
              <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>📵 GPS não disponível — localização não verificada</div>
            )}
          </div>
        )}

        {/* Botão principal */}
        <button onClick={registrar} disabled={enviando || !podeRegistrar} style={{
          width: "100%", padding: "18px", borderRadius: 14, border: "none",
          background: !podeRegistrar ? "#e5e7eb" : enviando ? "#ccc" : proximoTipo === "entrada" ? C.success : C.red,
          color: !podeRegistrar ? C.muted : "#fff", fontSize: 18, fontWeight: 800,
          cursor: !podeRegistrar || enviando ? "not-allowed" : "pointer",
          fontFamily: "inherit", boxShadow: podeRegistrar ? "0 4px 16px rgba(0,0,0,0.12)" : "none",
          transition: "background .2s",
        }}>
          {!podeRegistrar
            ? "Selecione a obra primeiro"
            : enviando && gpsStatus === "obtendo"
            ? "📡 Obtendo GPS..."
            : enviando
            ? "Registrando..."
            : proximoTipo === "entrada"
            ? "▶ Registrar Entrada"
            : "⏹ Registrar Saída"}
        </button>

        {/* Resumo do dia */}
        {(pontos_hoje || []).length > 0 && (
          <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, background: C.dark, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Registros de hoje</div>
              {horas > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.success }}>{horas.toFixed(1)}h</div>
                  {custoDia > 0 && <div style={{ fontSize: 11, color: C.muted }}>≈ R$ {custoDia.toFixed(2)}</div>}
                </div>
              )}
            </div>
            {(pontos_hoje || []).map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: i < pontos_hoje.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{p.tipo === "entrada" ? "▶" : "⏹"}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: p.tipo === "entrada" ? C.success : C.red, textTransform: "capitalize" }}>{p.tipo}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>
                  {new Date(p.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>
    </div>
  );
}
