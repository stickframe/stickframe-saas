import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import {
  isWebAuthnAvailable,
  hasSavedCredential,
  registerBiometric,
  authenticateWithBiometric,
  removeBiometric,
} from "../services/webAuthnService";

const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

export default function LoginScreen() {
  const login                = useAppStore((s) => s.login);
  const loginWithRefreshToken = useAppStore((s) => s.loginWithRefreshToken);
  const navigate             = useNavigate();

  const [email,        setEmail]        = useState("");
  const [senha,        setSenha]        = useState("");
  const [erro,         setErro]         = useState("");
  const [loading,      setLoading]      = useState(false);
  const [show,         setShow]         = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioSaved,     setBioSaved]     = useState(false);
  const [bioLoading,   setBioLoading]   = useState(false);

  // Prompt shown after first login to register biometrics
  const [bioPrompt,    setBioPrompt]    = useState(null); // { refreshToken, nome }

  useEffect(() => {
    isWebAuthnAvailable().then((ok) => {
      setBioAvailable(ok);
      setBioSaved(ok && hasSavedCredential());
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !senha) return;
    setLoading(true); setErro("");
    try {
      const refreshToken = await login(email.trim(), senha);
      if (bioAvailable && !bioSaved && refreshToken) {
        const user = useAppStore.getState().user;
        setBioPrompt({ refreshToken, nome: user?.nome || email });
      } else {
        navigate("/");
      }
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBioLogin = async () => {
    setBioLoading(true); setErro("");
    try {
      const refreshToken = await authenticateWithBiometric();
      await loginWithRefreshToken(refreshToken);
      navigate("/");
    } catch (e) {
      if (e.name === "NotAllowedError") {
        setErro("Autenticação biométrica cancelada.");
      } else if (e.message?.includes("expirada")) {
        removeBiometric();
        setBioSaved(false);
        setErro("Sessão expirada. Faça login com e-mail e senha para reativar a biometria.");
      } else {
        setErro(e.message);
      }
    } finally {
      setBioLoading(false);
    }
  };

  const handleRegisterBio = async () => {
    if (!bioPrompt) return;
    try {
      await registerBiometric(
        useAppStore.getState().user?.id,
        bioPrompt.nome,
        bioPrompt.refreshToken
      );
      setBioSaved(true);
    } catch (e) {
      // user declined — just proceed
    }
    setBioPrompt(null);
    navigate("/");
  };

  // ── Prompt to activate biometrics after first login ──────────────────────
  if (bioPrompt) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
        <div style={{ width: "min(420px, 94vw)", background: "#161b22", border: "1px solid #30363d", borderRadius: 18, padding: "clamp(28px,5vw,44px)", boxShadow: "0 0 60px #00000099", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔐</div>
          <h2 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 800, margin: "0 0 10px" }}>Ativar login biométrico?</h2>
          <p style={{ color: "#6e7681", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
            Use Face ID, Touch ID ou Windows Hello para entrar mais rápido nos próximos acessos.
          </p>
          <button
            onClick={handleRegisterBio}
            style={{ width: "100%", padding: "14px 0", background: C.red, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}
          >
            ✦ Ativar biometria
          </button>
          <button
            onClick={() => { setBioPrompt(null); navigate("/"); }}
            style={{ width: "100%", padding: "11px 0", background: "transparent", border: "1px solid #30363d", borderRadius: 10, color: "#6e7681", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >
            Agora não
          </button>
        </div>
      </div>
    );
  }

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

        {/* Biometric quick-login */}
        {bioSaved && (
          <button
            onClick={handleBioLogin}
            disabled={bioLoading}
            style={{
              width: "100%", padding: "14px 0", marginBottom: 20,
              background: bioLoading ? "#30363d" : "#1c2128",
              border: `1px solid ${C.red}66`, borderRadius: 10,
              color: "#e6edf3", fontSize: 15, fontWeight: 700,
              cursor: bioLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10, transition: "all .2s",
            }}
          >
            <span style={{ fontSize: 22 }}>🔐</span>
            {bioLoading ? "Verificando..." : "Entrar com biometria"}
          </button>
        )}

        {bioSaved && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#30363d" }} />
            <span style={{ color: "#6e7681", fontSize: 11 }}>ou use e-mail e senha</span>
            <div style={{ flex: 1, height: 1, background: "#30363d" }} />
          </div>
        )}

        {!bioSaved && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: "#e6edf3" }}>Acesse sua conta</h1>
            <p style={{ fontSize: 13, color: "#6e7681", marginBottom: 24 }}>Entre com suas credenciais para continuar.</p>
          </>
        )}

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
          style={{ width: "100%", padding: "14px 0", background: loading ? "#30363d" : C.red, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading || !email || !senha ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background .2s" }}>
          {loading ? "Entrando..." : "Entrar no sistema →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6e7681" }}>
          Não tem conta?{" "}
          <a href="/cadastro" style={{ color: C.red, fontWeight: 700, textDecoration: "none" }}>Criar conta grátis</a>
        </div>

        <p style={{ textAlign: "center", color: "#6e7681", fontSize: 11, marginTop: 16 }}>
          Stick Frame Sistemas Construtivos · Santo André/SP
        </p>
      </div>
    </div>
  );
}
