import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";

const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

const VARIANTES = [
  {
    id: "A",
    titulo: "Acesse sua conta",
    sub: "Entre com suas credenciais para continuar.",
    wrapStyle: {
      minHeight: "100vh",
      background: "#0d1117",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    },
    cardStyle: {
      width: "min(420px, 94vw)",
      background: "#161b22",
      border: "1px solid #30363d",
      borderRadius: 18,
      padding: "clamp(28px,5vw,44px)",
      boxShadow: "0 0 60px #00000099",
    },
    logoBlock: (
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src={LOGO} style={{ width: 80, height: 80, borderRadius: 16, objectFit: "contain", marginBottom: 14 }} alt="Logo" />
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: 22 }}>
          <span style={{ color: "#e6edf3" }}>STICK</span><span style={{ color: C.red }}>FRAME</span>
        </div>
        <div style={{ fontSize: 9, color: "#6e7681", letterSpacing: 2, marginTop: 2 }}>SISTEMAS CONSTRUTIVOS</div>
      </div>
    ),
    inputStyle: { background: "#0d1117", border: "1px solid #30363d", color: "#e6edf3" },
    labelColor: "#6e7681",
    rodapeColor: "#6e7681",
  },
  {
    id: "B",
    titulo: "Entrar no sistema",
    sub: "Acesso restrito a usuários autorizados.",
    wrapStyle: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0a0a 0%, #0f0f0f 50%, #0a1a10 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    },
    cardStyle: {
      width: "min(420px, 94vw)",
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${C.red}33`,
      borderTop: `3px solid ${C.red}`,
      borderRadius: 18,
      padding: "clamp(28px,5vw,44px)",
      boxShadow: `0 0 80px ${C.red}18`,
      backdropFilter: "blur(10px)",
    },
    logoBlock: (
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <img src={LOGO} style={{ width: 56, height: 56, borderRadius: 12, objectFit: "contain", flexShrink: 0 }} alt="Logo" />
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: 22 }}>
            <span style={{ color: "#fff" }}>STICK</span><span style={{ color: C.red }}>FRAME</span>
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginTop: 2 }}>SISTEMAS CONSTRUTIVOS</div>
        </div>
      </div>
    ),
    inputStyle: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" },
    labelColor: "rgba(255,255,255,0.45)",
    rodapeColor: "rgba(255,255,255,0.25)",
  },
  {
    id: "C",
    titulo: "Olá, faça seu login",
    sub: "Sistema de gestão Steel Frame.",
    wrapStyle: {
      minHeight: "100vh",
      background: "#f3f4f6",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    },
    cardStyle: {
      width: "min(420px, 94vw)",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 18,
      padding: "clamp(28px,5vw,44px)",
      boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
    },
    logoBlock: (
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <img src={LOGO} style={{ width: 72, height: 72, borderRadius: 16, objectFit: "contain", marginBottom: 12, border: "1px solid #e5e7eb" }} alt="Logo" />
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: 20 }}>
          <span style={{ color: "#111" }}>STICK</span><span style={{ color: C.red }}>FRAME</span>
        </div>
        <div style={{ fontSize: 9, color: "#9ca3af", letterSpacing: 2, marginTop: 2 }}>SISTEMAS CONSTRUTIVOS</div>
      </div>
    ),
    inputStyle: { background: "#f9fafb", border: "1px solid #d1d5db", color: "#111" },
    labelColor: "#6b7280",
    rodapeColor: "#9ca3af",
  },
];

function LoginForm({ variante: v, email, setEmail, senha, setSenha, show, setShow, erro, loading, handleLogin }) {
  return (
    <div style={v.wrapStyle}>
      <div style={v.cardStyle}>
        {v.logoBlock}
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: v.inputStyle.color }}>{v.titulo}</h1>
        <p style={{ fontSize: 13, color: v.labelColor, marginBottom: 24 }}>{v.sub}</p>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: v.labelColor, marginBottom: 6 }}>E-MAIL</div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com.br" onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", borderRadius: 8, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", ...v.inputStyle }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: v.labelColor }}>SENHA</span>
            <button onClick={() => setShow((x) => !x)} style={{ background: "none", border: "none", color: C.red, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{show ? "Ocultar" : "Mostrar"}</button>
          </div>
          <input type={show ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", borderRadius: 8, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", ...v.inputStyle }} />
        </div>

        {erro && (
          <div style={{ background: C.danger + "18", border: `1px solid ${C.danger}44`, borderRadius: 6, padding: "9px 13px", fontSize: 12, color: C.danger, marginBottom: 14 }}>
            {erro}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading || !email || !senha}
          style={{ width: "100%", padding: "14px 0", background: loading ? "#555" : C.red, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background .2s" }}>
          {loading ? "Entrando..." : "Entrar no sistema →"}
        </button>

        <p style={{ textAlign: "center", color: v.rodapeColor, fontSize: 11, marginTop: 18 }}>
          Stick Frame Sistemas Construtivos · Santo André/SP
        </p>
      </div>
    </div>
  );
}

export default function LoginScreen() {
  const login    = useAppStore((s) => s.login);
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [erro,    setErro]    = useState("");
  const [loading, setLoading] = useState(false);
  const [show,    setShow]    = useState(false);
  const [preview, setPreview] = useState(null);

  const handleLogin = async () => {
    if (!email || !senha) return;
    setLoading(true); setErro("");
    try {
      await login(email.trim(), senha);
      navigate("/");
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (preview) {
    const v = VARIANTES.find((x) => x.id === preview);
    return (
      <div style={{ position: "relative" }}>
        <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", gap: 8, background: "rgba(0,0,0,0.85)", borderRadius: 10, padding: "8px 14px", backdropFilter: "blur(8px)" }}>
          {VARIANTES.map((x) => (
            <button key={x.id} onClick={() => setPreview(x.id)} style={{
              padding: "6px 16px", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: "none",
              background: preview === x.id ? C.red : "rgba(255,255,255,0.12)",
              color: preview === x.id ? "#fff" : "rgba(255,255,255,0.7)",
            }}>{x.id}</button>
          ))}
          <button onClick={() => setPreview(null)} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: "none", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            ← Voltar
          </button>
        </div>
        <LoginForm variante={v} email={email} setEmail={setEmail} senha={senha} setSenha={setSenha} show={show} setShow={setShow} erro={erro} loading={loading} handleLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <img src={LOGO} style={{ width: 64, height: 64, borderRadius: 12, objectFit: "contain", marginBottom: 12 }} alt="Logo" />
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>ESCOLHA O LAYOUT DA TELA DE LOGIN</div>
        <div style={{ color: "#6e7681", fontSize: 12, marginTop: 4 }}>Clique em uma opção para visualizar</div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {VARIANTES.map((v) => (
          <button key={v.id} onClick={() => setPreview(v.id)} style={{
            padding: "14px 28px", borderRadius: 12, border: `1px solid ${C.red}44`,
            background: C.red + "12", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {v.id}: {v.titulo}
          </button>
        ))}
      </div>
    </div>
  );
}
