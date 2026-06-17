import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { LOGO_STICKFRAME } from "../utils/cdn";

const C = { red: "#981915", border: "#e5e7eb", muted: "#6b7280", success: "#2e9e5b", warning: "#b97a00", text: "#1a1a1a", dark: "#f5f5f7" };

export default function PainelQR() {
  const { token } = useParams();
  const [dados,    setDados]   = useState(null);
  const [loading,  setLoading] = useState(true);
  const [enviando, setEnviando]= useState(false);
  const [nome,     setNome]    = useState("");
  const [erro,     setErro]    = useState(null);

  useEffect(() => {
    sb.rpc("painel_get_dados", { p_token: token })
      .then(({ data, error }) => {
        if (error || !data) { setErro("Painel não encontrado."); return; }
        setDados(data);
      })
      .catch(() => setErro("Erro ao carregar."))
      .finally(() => setLoading(false));
  }, [token]);

  async function marcarMontado() {
    if (!nome.trim()) return;
    setEnviando(true);
    const { data, error } = await sb.rpc("painel_marcar_montado", { p_token: token, p_nome_montador: nome.trim() });
    if (error) { setErro(error.message); setEnviando(false); return; }
    setDados((prev) => ({
      ...prev,
      painel: { ...prev.painel, status: "Montado", montado_por: nome.trim(), montado_em: new Date().toISOString() },
      montados: data.montados,
      progresso: data.progresso,
    }));
    setEnviando(false);
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

  const { painel, obra, total_paineis, montados, modelo_bim } = dados;
  const progresso = total_paineis > 0 ? Math.round((montados / total_paineis) * 100) : 0;
  const jaMontado = painel.status === "Montado";
  const bimLink = modelo_bim && painel.ifc_element_id
    ? `${window.location.origin}/bim?obraId=${obra?.id}&elementId=${painel.ifc_element_id}`
    : null;

  return (
    <div style={{ minHeight: "100vh", background: C.dark, fontFamily: "Inter, system-ui, sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: jaMontado ? "#166534" : C.red, padding: "20px 20px 24px", transition: "background .4s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <img src={LOGO_STICKFRAME} alt="" style={{ height: 24, filter: "brightness(0) invert(1)" }} onError={(e) => { e.target.style.display = "none"; }} />
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>RASTREABILIDADE DE PAINEL</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#fff", fontSize: 26, fontWeight: 900 }}>{painel.codigo}</div>
            {painel.descricao && <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 3 }}>{painel.descricao}</div>}
            {obra?.nome && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}> {obra.nome}</div>}
          </div>
          <div style={{ background: jaMontado ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>{progresso}%</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 2 }}>da obra</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Status do painel */}
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Status do painel</div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 10, background: jaMontado ? C.success + "22" : C.warning + "22", color: jaMontado ? C.success : C.warning }}>
              {jaMontado ? " Montado" : "⏳ Pendente"}
            </span>
          </div>

          {painel.local_instalacao && (
            <div style={{ background: C.dark, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}></span>
              <div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 0.5 }}>LOCAL DE INSTALAÇÃO</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{painel.local_instalacao}</div>
              </div>
            </div>
          )}

          {bimLink && (
            <a href={bimLink} target="_blank" rel="noreferrer" style={{
              display: "flex", alignItems: "center", gap: 10, background: "#1a1a2e",
              borderRadius: 10, padding: "12px 14px", textDecoration: "none", marginBottom: 12,
            }}>
              <span style={{ fontSize: 22 }}></span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7eb8ff" }}>Ver localização no Modelo BIM 3D</div>
                <div style={{ fontSize: 11, color: "#8888aa" }}>Abre o modelo com este painel destacado em vermelho</div>
              </div>
              <span style={{ marginLeft: "auto", color: "#7eb8ff", fontSize: 16 }}>→</span>
            </a>
          )}

          {jaMontado && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.success, marginBottom: 4 }}> Montado com sucesso!</div>
              {painel.montado_por && <div style={{ fontSize: 12, color: C.muted }}>Por: <strong>{painel.montado_por}</strong></div>}
              {painel.montado_em && <div style={{ fontSize: 12, color: C.muted }}>Em: {new Date(painel.montado_em).toLocaleString("pt-BR")}</div>}
            </div>
          )}
        </div>

        {/* Progresso da obra */}
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Progresso da obra</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.success }}>{montados}/{total_paineis} painéis</div>
          </div>
          <div style={{ height: 12, borderRadius: 6, background: C.border, overflow: "hidden" }}>
            <div style={{ width: `${progresso}%`, height: "100%", background: progresso === 100 ? C.success : C.red, borderRadius: 6, transition: "width .6s ease" }} />
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{progresso}% concluído</div>
        </div>

        {/* Ação: marcar montado */}
        {!jaMontado && (
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Confirmar montagem</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>SEU NOME *</div>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Carlos Montador"
                onKeyDown={(e) => e.key === "Enter" && marcarMontado()}
                style={{ width: "100%", padding: "13px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={marcarMontado} disabled={enviando || !nome.trim()} style={{
              width: "100%", padding: "15px", background: !nome.trim() || enviando ? "#ccc" : C.success,
              border: "none", borderRadius: 12, color: "#fff", fontSize: 16, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {enviando ? "Registrando..." : " Marcar como Montado"}
            </button>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: "center" }}>
              Isso atualiza automaticamente o progresso físico da obra.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
