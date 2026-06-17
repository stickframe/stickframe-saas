import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { sb } from "../services/supabase";
import {
  isWebAuthnAvailable,
  hasSavedCredential,
  registerBiometric,
  authenticateWithBiometric,
  removeBiometric,
} from "../services/webAuthnService";
import logoSF from "../assets/logo_branco.png";

const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

const MOBILE_STYLE = `
@media (max-width: 767px) {
  .sf-login-left { display: none !important; }
  .sf-login-right { width: 100% !important; min-height: 100vh; border-radius: 0 !important; }
  .sf-login-wrap { padding: 0 !important; }
}
`;

function injectStyle() {
  if (document.getElementById("sf-login-style")) return;
  const s = document.createElement("style");
  s.id = "sf-login-style";
  s.textContent = MOBILE_STYLE;
  document.head.appendChild(s);
}

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

  // Branding da empresa via ?e=TOKEN
  const [empresaBranding, setEmpresaBranding] = useState(null);
  useEffect(() => {
    injectStyle();
    const token = new URLSearchParams(window.location.search).get("e");
    if (!token) return;
    sb.from("empresas")
      .select("nome, logo_url, cor_primaria")
      .eq("calc_token", token)
      .maybeSingle()
      .then(({ data }) => { if (data) setEmpresaBranding(data); });
  }, []);

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

  //  Biometric prompt screen 
  if (bioPrompt) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg,#f4f1ec)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
        <div style={{ width: "min(420px, 94vw)", background: "#fff", border: "1px solid var(--line,#e7e1d8)", borderRadius: 18, padding: "clamp(28px,5vw,44px)", boxShadow: "0 8px 40px #00000018", textAlign: "center" }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: 22, marginBottom: 16 }}>
            <span style={{ color: "var(--ink,#26231f)" }}>STICK</span><span style={{ color: "var(--brick,#981915)" }}>FRAME</span>
          </div>
          <div style={{ fontSize: 56, marginBottom: 16 }}></div>
          <h2 style={{ color: "var(--ink,#26231f)", fontSize: 20, fontWeight: 800, margin: "0 0 10px", fontFamily: "'Hanken Grotesk',sans-serif" }}>Ativar login biométrico?</h2>
          <p style={{ color: "var(--muted,#8c847a)", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px", fontFamily: "'Hanken Grotesk',sans-serif" }}>
            Use Face ID, Touch ID ou Windows Hello para entrar mais rápido nos próximos acessos.
          </p>
          <button
            onClick={handleRegisterBio}
            style={{ width: "100%", padding: "14px 0", background: "var(--brick,#981915)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}
          >
             Ativar biometria
          </button>
          <button
            onClick={() => { setBioPrompt(null); navigate("/"); }}
            style={{ width: "100%", padding: "11px 0", background: "transparent", border: "1px solid var(--line,#e7e1d8)", borderRadius: 10, color: "var(--muted,#8c847a)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >
            Agora não
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="sf-login-wrap"
      style={{ minHeight: "100vh", display: "flex", background: "var(--graphite,#2b2b2e)" }}
    >
      {/*  Left panel  */}
      <div
        className="sf-login-left"
        style={{
          width: "50%",
          background: "linear-gradient(180deg,#232225 0%,#2b2b2e 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 52px",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {/* Logo + Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <img src={logoSF} alt="SF" style={{ width: 56, height: 56, objectFit: "contain" }} />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: 28, lineHeight: 1 }}>
              <span style={{ color: "#fff" }}>STICK</span><span style={{ color: "var(--brick,#981915)" }}>FRAME</span>
            </div>
            <div style={{ fontSize: 11, color: "#9a948a", letterSpacing: 2, marginTop: 3 }}>SISTEMA DE GESTÃO</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "36px 0" }} />

        {/* Feature bullets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {[
            { icon: "", title: "Orçamentos em minutos", desc: "Gere propostas com cálculo SF automático." },
            { icon: "", title: "Obras em tempo real", desc: "Cronograma, diário e medições num painel." },
            { icon: "", title: "Financeiro por obra", desc: "Margem, fluxo de caixa e DRE integrados." },
          ].map((f) => (
            <div key={f.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 3, fontFamily: "'Hanken Grotesk',sans-serif" }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#9a948a", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "36px 0" }} />

        {/* Stats */}
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {[
            ["240+", "Construtoras"],
            ["R$ 180M", "Em obras"],
            ["40%", "Mais rápido"],
          ].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#9a948a", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/*  Right panel  */}
      <div
        className="sf-login-right"
        style={{
          flex: 1,
          background: "var(--surface,#fff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          borderRadius: 0,
        }}
      >
        <div style={{ width: "min(400px, 100%)" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            {empresaBranding?.logo_url && (
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <img src={empresaBranding.logo_url} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "contain" }} alt={empresaBranding.nome} />
                {empresaBranding.nome && (
                  <div style={{ fontWeight: 800, fontSize: 16, color: "var(--ink,#26231f)" }}>{empresaBranding.nome}</div>
                )}
              </div>
            )}
            {/* Wordmark on right panel */}
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: empresaBranding ? 14 : 18, marginBottom: 8 }}>
              <span style={{ color: "var(--ink,#26231f)" }}>STICK</span><span style={{ color: "var(--brick,#981915)" }}>FRAME</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Barlow Condensed',sans-serif", color: "var(--ink,#26231f)", margin: "0 0 6px" }}>
              Bom ver você
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted,#8c847a)", margin: 0 }}>Entre na sua conta Stick Frame</p>
          </div>

          {/* Biometric quick-login */}
          {bioSaved && (
            <button
              onClick={handleBioLogin}
              disabled={bioLoading}
              style={{
                width: "100%", padding: "14px 0", marginBottom: 20,
                background: bioLoading ? "var(--surface-2,#faf8f4)" : "var(--surface-2,#faf8f4)",
                border: `1px solid var(--line,#e7e1d8)`,
                borderRadius: 10,
                color: "var(--ink,#26231f)", fontSize: 15, fontWeight: 700,
                cursor: bioLoading ? "not-allowed" : "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 10, transition: "all .2s",
              }}
            >
              <span style={{ fontSize: 22 }}></span>
              {bioLoading ? "Verificando..." : "Entrar com biometria"}
            </button>
          )}

          {bioSaved && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "var(--line,#e7e1d8)" }} />
              <span style={{ color: "var(--muted,#8c847a)", fontSize: 11 }}>ou use e-mail e senha</span>
              <div style={{ flex: 1, height: 1, background: "var(--line,#e7e1d8)" }} />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--muted,#8c847a)", marginBottom: 6 }}>E-MAIL</div>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com.br" onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", background: "var(--surface-2,#faf8f4)", border: "1.5px solid var(--line,#e7e1d8)", borderRadius: 10, padding: "11px 14px", color: "var(--ink,#26231f)", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--muted,#8c847a)" }}>SENHA</span>
              <button onClick={() => setShow((v) => !v)} style={{ background: "none", border: "none", color: "var(--brick,#981915)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                {show ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <input
              type={show ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", background: "var(--surface-2,#faf8f4)", border: "1.5px solid var(--line,#e7e1d8)", borderRadius: 10, padding: "11px 14px", color: "var(--ink,#26231f)", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <a href="/esqueci-senha" style={{ fontSize: 12, color: "var(--brick,#981915)", textDecoration: "none" }}>Esqueci minha senha</a>
            </div>
          </div>

          {erro && (
            <div style={{ background: C.danger + "18", border: `1px solid ${C.danger}44`, borderRadius: 6, padding: "9px 13px", fontSize: 12, color: C.danger, marginBottom: 14 }}>
              {erro}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !email || !senha}
            style={{ width: "100%", padding: "14px 0", background: loading ? "#c9302c" : "var(--brick,#981915)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading || !email || !senha ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background .2s", opacity: !email || !senha ? 0.65 : 1 }}
          >
            {loading ? "Entrando..." : "Entrar no sistema →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--muted,#8c847a)" }}>
            Não tem conta?{" "}
            <a href="/cadastro" style={{ color: "var(--brick,#981915)", fontWeight: 700, textDecoration: "none" }}>Criar conta grátis</a>
          </div>
        </div>
      </div>
    </div>
  );
}
