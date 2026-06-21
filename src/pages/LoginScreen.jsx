import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/useAppStore";
import { sb } from "../services/supabase";
import { trackPageView } from "../utils/analytics";
import {
  isWebAuthnAvailable,
  hasSavedCredential,
  registerBiometric,
  authenticateWithBiometric,
  removeBiometric,
} from "../services/webAuthnService";
import logoSF from "../assets/logo_branco.png";

const FEATS = [
  {
    ic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    t: "Orçamentos em minutos", d: "Gere propostas completas com cálculo de materiais SF automatizado."
  },
  {
    ic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    t: "Obras em tempo real", d: "Cronograma, diário e medições — tudo num painel só."
  },
  {
    ic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    t: "Financeiro por obra", d: "Margem, fluxo de caixa e DRE sem planilhas soltas."
  },
];

const STATS = [
  { v: "240+", l: "Construtoras" },
  { v: "R$ 180M", l: "Em obras gerenciadas" },
  { v: "40%", l: "Mais rápido" },
];

const GLOBAL_CSS = `
@keyframes sf-spin { to { transform: rotate(360deg) } }
@media (max-width: 767px) {
  .sf-login-left { display: none !important; }
  .sf-login-right { width: 100% !important; min-height: 100vh; }
  .sf-login-wrap { padding: 0 !important; }
}
`;

function injectStyle() {
  if (document.getElementById("sf-login-style")) return;
  const s = document.createElement("style");
  s.id = "sf-login-style";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

const EyeIcon = ({ open }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
  </svg>
);

export default function LoginScreen() {
  const login                = useAppStore((s) => s.login);
  const loginWithRefreshToken = useAppStore((s) => s.loginWithRefreshToken);
  const navigate             = useNavigate();

  const [step,         setStep]         = useState("login"); // login | forgot | done
  const [email,        setEmail]        = useState("");
  const [senha,        setSenha]        = useState("");
  const [erro,         setErro]         = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showSenha,    setShowSenha]    = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioSaved,     setBioSaved]     = useState(false);
  const [bioLoading,   setBioLoading]   = useState(false);
  const [bioPrompt,    setBioPrompt]    = useState(null);

  const [empresaBranding, setEmpresaBranding] = useState(null);

  useEffect(() => {
    trackPageView("/login");
    injectStyle();
    const token = new URLSearchParams(window.location.search).get("e");
    if (!token) return;
    sb.from("empresas")
      .select("nome, logo_url, cor_primaria")
      .eq("calc_token", token)
      .maybeSingle()
      .then(({ data }) => { if (data) setEmpresaBranding(data); });
  }, []);

  useEffect(() => {
    isWebAuthnAvailable().then((ok) => {
      setBioAvailable(ok);
      setBioSaved(ok && hasSavedCredential());
    });
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
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

  const handleForgot = async (e) => {
    e?.preventDefault();
    if (!email) { setErro("Informe seu e-mail."); return; }
    setLoading(true); setErro("");
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      setStep("done");
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
    } catch {
      // user declined
    }
    setBioPrompt(null);
    navigate("/");
  };

  const fieldBox = {
    display: "flex", alignItems: "center",
    background: "var(--surface-2,#faf8f4)",
    border: "1.5px solid var(--line,#e7e1d8)",
    borderRadius: 10, transition: "border-color .12s",
  };
  const inputBase = {
    flex: 1, border: "none", background: "none", outline: "none",
    fontFamily: "inherit", fontSize: 14, color: "var(--ink,#26231f)",
    padding: "11px 14px",
  };
  const btnPrimary = (dis) => ({
    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
    background: dis ? "#c44340" : "var(--brick,#981915)",
    color: "#fff", border: "none", borderRadius: 10,
    fontFamily: "inherit", fontWeight: 700, fontSize: 15,
    padding: "13px", cursor: dis ? "not-allowed" : "pointer",
    transition: ".13s", marginTop: 4, width: "100%",
  });

  // Biometric prompt overlay
  if (bioPrompt) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg,#f4f1ec)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
        <div style={{ width: "min(420px,94vw)", background: "#fff", border: "1px solid var(--line,#e7e1d8)", borderRadius: 18, padding: "clamp(28px,5vw,44px)", boxShadow: "0 8px 40px #00000018", textAlign: "center" }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: 22, marginBottom: 16 }}>
            <span style={{ color: "var(--ink,#26231f)" }}>STICK</span><span style={{ color: "var(--brick,#981915)" }}>FRAME</span>
          </div>
          <div style={{ marginBottom: 16, display: "grid", placeItems: "center", color: "var(--brick,#981915)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{width:56,height:56}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 style={{ color: "var(--ink,#26231f)", fontSize: 20, fontWeight: 800, margin: "0 0 10px" }}>Ativar login biométrico?</h2>
          <p style={{ color: "var(--muted,#8c847a)", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
            Use Face ID, Touch ID ou Windows Hello para entrar mais rápido nos próximos acessos.
          </p>
          <button onClick={handleRegisterBio} style={{ width: "100%", padding: "14px 0", background: "var(--brick,#981915)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Ativar biometria
          </button>
          <button onClick={() => { setBioPrompt(null); navigate("/"); }} style={{ width: "100%", padding: "11px 0", background: "transparent", border: "1px solid var(--line,#e7e1d8)", borderRadius: 10, color: "var(--muted,#8c847a)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Agora não
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-login-wrap" style={{ display: "flex", minHeight: "100vh", position: "relative" }}>

      {/* Left panel */}
      <div
        className="sf-login-left"
        style={{
          flex: 1,
          background: "linear-gradient(180deg,#232225 0%,#2b2b2e 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 52px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative rings */}
        <div style={{ position: "absolute", right: -80, top: -80, width: 360, height: 360, border: "48px solid rgba(255,255,255,.05)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: -100, bottom: -120, width: 300, height: 300, border: "38px solid rgba(0,0,0,.1)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <img src={logoSF} alt="Stick Frame" style={{ height: 36, marginBottom: 52, display: "block" }} />

          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "rgba(255,255,255,.55)", textTransform: "uppercase", marginBottom: 16 }}>
            Sistema de gestão para construtoras de Steel Frame
          </div>

          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 54, lineHeight: .97, letterSpacing: .3, textTransform: "uppercase" }}>
            Sua obra,<br />seu controle.
          </h2>

          <p style={{ fontSize: 16, color: "rgba(255,255,255,.75)", marginTop: 20, maxWidth: 380, lineHeight: 1.65 }}>
            Orçamentos, obras, financeiro e CRM — tudo que uma construtora de steel frame precisa, em um só lugar.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40 }}>
            {FEATS.map((f) => (
              <div key={f.t} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.1)", display: "grid", placeItems: "center", flexShrink: 0, color: "rgba(255,255,255,.85)" }}>{f.ic}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{f.t}</div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)", lineHeight: 1.5 }}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 32, position: "relative" }}>
          {STATS.map((s) => (
            <div key={s.l}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 28, color: "#fff", lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)", marginTop: 3, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div
        className="sf-login-right"
        style={{
          flex: "0 0 480px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 60px",
          background: "var(--surface,#fff)",
          minHeight: "100vh",
          position: "relative",
        }}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>

          {/* Company branding override */}
          {empresaBranding?.logo_url && (
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <img src={empresaBranding.logo_url} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "contain" }} alt={empresaBranding.nome} />
              {empresaBranding.nome && <div style={{ fontWeight: 800, fontSize: 16, color: "var(--ink,#26231f)" }}>{empresaBranding.nome}</div>}
            </div>
          )}

          {/* Biometric quick-login */}
          {bioSaved && step === "login" && (
            <>
              <button
                onClick={handleBioLogin}
                disabled={bioLoading}
                style={{ width: "100%", padding: "14px 0", marginBottom: 16, background: "var(--surface-2,#faf8f4)", border: "1px solid var(--line,#e7e1d8)", borderRadius: 10, color: "var(--ink,#26231f)", fontSize: 15, fontWeight: 700, cursor: bioLoading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {bioLoading ? "Verificando..." : "Entrar com biometria"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: "var(--line,#e7e1d8)" }} />
                <span style={{ color: "var(--muted,#8c847a)", fontSize: 11 }}>ou use e-mail e senha</span>
                <div style={{ flex: 1, height: 1, background: "var(--line,#e7e1d8)" }} />
              </div>
            </>
          )}

          {/* ── LOGIN ── */}
          {step === "login" && (
            <>
              <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 34, color: "var(--ink,#26231f)", marginBottom: 6 }}>Bom ver você</h1>
              <p style={{ fontSize: 14, color: "var(--muted,#8c847a)", marginBottom: 32 }}>Entre na sua conta Stick Frame</p>

              {erro && (
                <div style={{ background: "#fef2f1", border: "1px solid #f5c9c7", color: "var(--brick,#981915)", fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 9, marginBottom: 16 }}>{erro}</div>
              )}

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-2,#57514a)", marginBottom: 6 }}>E-mail</label>
                  <div style={fieldBox}>
                    <input
                      type="email" placeholder="voce@construtora.com.br"
                      value={email} onChange={(e) => { setEmail(e.target.value); setErro(""); }}
                      style={inputBase}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2,#57514a)" }}>Senha</label>
                    <button type="button" onClick={() => { setStep("forgot"); setErro(""); }} style={{ background: "none", border: "none", fontSize: 12, color: "var(--brick,#981915)", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                      Esqueci minha senha
                    </button>
                  </div>
                  <div style={fieldBox}>
                    <input
                      type={showSenha ? "text" : "password"} placeholder="••••••••"
                      value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                      style={inputBase}
                    />
                    <button type="button" onClick={() => setShowSenha((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 14px", color: "var(--muted,#8c847a)", display: "grid", placeItems: "center" }}>
                      <EyeIcon open={showSenha} />
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                  {loading
                    ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "sf-spin .7s linear infinite" }} />Entrando…</>
                    : "Entrar"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted,#8c847a)", marginTop: 28 }}>
                Não tem conta?{" "}
                <a href="/cadastro" style={{ color: "var(--brick,#981915)", fontWeight: 700, textDecoration: "none" }}>Começar grátis</a>
              </p>
            </>
          )}

          {/* ── FORGOT ── */}
          {step === "forgot" && (
            <>
              <button onClick={() => { setStep("login"); setErro(""); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--muted,#8c847a)", fontSize: 13, fontWeight: 600, marginBottom: 28, padding: 0, fontFamily: "inherit" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                Voltar
              </button>
              <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 32, color: "var(--ink,#26231f)", marginBottom: 6 }}>Recuperar senha</h1>
              <p style={{ fontSize: 14, color: "var(--muted,#8c847a)", marginBottom: 28 }}>Enviaremos um link para o seu e-mail.</p>

              {erro && (
                <div style={{ background: "#fef2f1", border: "1px solid #f5c9c7", color: "var(--brick,#981915)", fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 9, marginBottom: 16 }}>{erro}</div>
              )}

              <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-2,#57514a)", marginBottom: 6 }}>E-mail cadastrado</label>
                  <div style={fieldBox}>
                    <input
                      type="email" autoFocus placeholder="voce@construtora.com.br"
                      value={email} onChange={(e) => { setEmail(e.target.value); setErro(""); }}
                      style={inputBase}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                  {loading ? "Enviando…" : "Enviar link de recuperação"}
                </button>
              </form>
            </>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#eaf3ec", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3f7a4b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 28, color: "var(--ink,#26231f)", marginBottom: 8 }}>E-mail enviado!</h2>
              <p style={{ fontSize: 14, color: "var(--muted,#8c847a)", lineHeight: 1.6, marginBottom: 28 }}>
                Verifique sua caixa de entrada em <b style={{ color: "var(--ink,#26231f)" }}>{email}</b> e siga o link para redefinir sua senha.
              </p>
              <button onClick={() => setStep("login")} style={{ background: "none", border: "1px solid var(--line,#e7e1d8)", borderRadius: 9, fontFamily: "inherit", fontWeight: 600, fontSize: 13.5, padding: "10px 20px", cursor: "pointer", color: "var(--ink-2,#57514a)" }}>
                Voltar ao login
              </button>
            </div>
          )}
        </div>

        <p style={{ position: "absolute", bottom: 24, fontSize: 11.5, color: "var(--muted,#8c847a)" }}>© 2026 Stick Frame</p>
      </div>
    </div>
  );
}
