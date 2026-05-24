import { useState } from "react";
import { C, PERFIS } from "../utils/constants";
import useAppStore from "../store/useAppStore";

export default function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [email,  setEmail]  = useState("");
  const [senha,  setSenha]  = useState("");
  const [erro,   setErro]   = useState("");
  const [loading,setLoading]= useState(false);
  const [show,   setShow]   = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) return;
    setLoading(true); setErro("");
    try { await login(email.trim(), senha); }
    catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ position: "relative", width: "min(420px, 94vw)", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: "clamp(24px,5vw,40px)", boxShadow: "0 0 80px #00000088" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <img src="/logo.png" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "contain" }} alt="Logo" />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: 20 }}>
              <span style={{ color: C.graphite }}>STICK</span><span style={{ color: C.red }}>FRAME</span>
            </div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2 }}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Bem-vindo de volta</h1>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>Entre com sua conta para acessar o sistema.</p>

        {/* Perfis */}
        <div style={{ background: C.darker, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 8 }}>PERFIS DISPONÍVEIS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(PERFIS).map(([k, v]) => (
              <span key={k} style={{ background: v.cor + "22", color: v.cor, border: `1px solid ${v.cor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{v.label}</span>
            ))}
          </div>
        </div>

        {/* E-mail */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>E-MAIL</div>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@stickframe.com.br"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
        </div>

        {/* Senha */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>SENHA</span>
            <button onClick={() => setShow((v) => !v)} style={{ background: "none", border: "none", color: C.red, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{show ? "Ocultar" : "Mostrar"}</button>
          </div>
          <input
            type={show ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
        </div>

        {erro && (
          <div style={{ background: C.danger + "18", border: `1px solid ${C.danger}44`, borderRadius: 6, padding: "9px 13px", fontSize: 12, color: C.danger, marginBottom: 14 }}>
            {erro}
          </div>
        )}

        <button
          onClick={handleLogin} disabled={loading || !email || !senha}
          style={{ width: "100%", padding: "14px 0", background: loading ? C.graphite : C.red, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background .2s" }}
        >
          {loading ? "Entrando..." : "Entrar no sistema →"}
        </button>

        <p style={{ textAlign: "center", color: C.muted, fontSize: 11, marginTop: 18 }}>
          Stick Frame Sistemas Construtivos · Santo André/SP
        </p>
      </div>
    </div>
  );
}
