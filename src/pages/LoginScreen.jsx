import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";

const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

export default function LoginScreen() {
  const login    = useAppStore((s) => s.login);
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [erro,    setErro]    = useState("");
  const [loading, setLoading] = useState(false);
  const [show,    setShow]    = useState(false);

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

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ width: "min(420px, 94vw)", background: "#161b22", border: "1px solid #30363d", borderRadius: 18, padding: "clamp(28px,5vw,44px)", boxShadow: "0 0 60px #00000099" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO} style={{ width: 80, height: 80, borderRadius: 16, objectFit: "contain", marginBottom: 14 }} alt="Logo" />
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: 22 }}>
            <span style={{ color: "#e6edf3" }}>STICK</span><span style={{ color: C.red }}>FRAME</span>
          </div>
          <div style={{ fontSize: 9, color: "#6e7681", letterSpacing: 2, marginTop: 2 }}>SISTEMAS CONSTRUTIVOS</div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: "#e6edf3" }}>Acesse sua conta</h1>
        <p style={{ fontSize: 13, color: "#6e7681", marginBottom: 24 }}>Entre com suas credenciais para continuar.</p>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#6e7681", marginBottom: 6 }}>E-MAIL</div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com.br" onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, padding: "11px 14px", color: "#e6edf3", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#6e7681" }}>SENHA</span>
            <button onClick={() => setShow((v) => !v)} style={{ background: "none", border: "none", color: C.red, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{show ? "Ocultar" : "Mostrar"}</button>
          </div>
          <input type={show ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, padding: "11px 14px", color: "#e6edf3", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        {erro && (
          <div style={{ background: C.danger + "18", border: `1px solid ${C.danger}44`, borderRadius: 6, padding: "9px 13px", fontSize: 12, color: C.danger, marginBottom: 14 }}>
            {erro}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading || !email || !senha}
          style={{ width: "100%", padding: "14px 0", background: loading ? "#30363d" : C.red, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background .2s" }}>
          {loading ? "Entrando..." : "Entrar no sistema →"}
        </button>

        <p style={{ textAlign: "center", color: "#6e7681", fontSize: 11, marginTop: 20 }}>
          Stick Frame Sistemas Construtivos · Santo André/SP
        </p>
      </div>
    </div>
  );
}
