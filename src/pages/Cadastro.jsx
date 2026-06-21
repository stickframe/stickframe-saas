import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { salvarOrigemLead, obterOrigemLead } from "../utils/leadOrigem";
import { trackPageView, analytics } from "../utils/analytics";

const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

const PLAN_INFO = {
  profissional: {
    label: "Profissional",
    preco: "R$ 197/mês",
    cor: "#981915",
    bg: "rgba(152,25,21,.12)",
    border: "rgba(152,25,21,.35)",
    msg: "Após criar sua conta você será direcionado para concluir a assinatura.",
  },
  essencial: {
    label: "Essencial",
    preco: "R$ 97/mês",
    cor: "#3b6ea5",
    bg: "rgba(59,110,165,.12)",
    border: "rgba(59,110,165,.35)",
    msg: "Após criar sua conta você poderá ativar o plano Essencial.",
  },
};

export default function Cadastro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get("plan");
  const planInfo = PLAN_INFO[planKey] || null;

  useEffect(() => {
    salvarOrigemLead();
    trackPageView("/cadastro");
    analytics.signupStarted();
  }, []);

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email,       setEmail]       = useState("");
  const [senha,       setSenha]       = useState("");
  const [confirmar,   setConfirmar]   = useState("");
  const [show,        setShow]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [erro,        setErro]        = useState("");
  const [sucesso,     setSucesso]     = useState(false);

  async function handleCadastro(e) {
    e.preventDefault();
    setErro("");
    if (senha !== confirmar) { setErro("As senhas não coincidem."); return; }
    if (senha.length < 6)    { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const { data, error } = await sb.functions.invoke("cadastrar-empresa", {
        body: { nomeEmpresa, nomeUsuario, email: email.trim().toLowerCase(), senha, leadOrigem: obterOrigemLead() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      analytics.signupCompleted();
      setSucesso(true);
    } catch (err) {
      setErro(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", fontSize: 15,
    background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.15)",
    borderRadius: 8, color: "#fff", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "rgba(255,255,255,.5)",
    textTransform: "uppercase", marginBottom: 6, display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0e0505", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Hanken Grotesk', sans-serif", padding: "24px 16px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800;900&display=swap');`}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO} alt="StickFrame" style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", marginBottom: 14 }} />
          <div style={{ fontWeight: 900, letterSpacing: 3, fontSize: 18, color: "#fff" }}>
            STICK<span style={{ color: "#981915" }}>FRAME</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,.35)", marginTop: 4 }}>SISTEMA DE GESTÃO</div>
        </div>

        {/* Plan banner */}
        {planInfo && !sucesso && (
          <div style={{
            background: planInfo.bg, border: `1px solid ${planInfo.border}`,
            borderRadius: 10, padding: "12px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: planInfo.cor, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                Plano {planInfo.label} — {planInfo.preco}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>
                {planInfo.msg}
              </div>
            </div>
          </div>
        )}

        <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "32px 28px" }}>
          {sucesso ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}></div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 10 }}>
                Conta criada com sucesso!
              </div>
              {planInfo ? (
                <>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.55)", marginBottom: 28, lineHeight: 1.6 }}>
                    Sua empresa está pronta. Agora conclua a assinatura do plano{" "}
                    <strong style={{ color: planInfo.cor }}>{planInfo.label}</strong>.
                  </div>
                  <button
                    onClick={() => navigate("/checkout?plan=" + planKey)}
                    style={{ width: "100%", background: "linear-gradient(135deg,#981915,#7d1411)", color: "#fff", border: "none", borderRadius: 10, padding: 15, fontSize: 16, fontWeight: 800, fontFamily: "inherit", cursor: "pointer", marginBottom: 10 }}
                  >
                    Ativar trial gratuito de 14 dias →
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    style={{ width: "100%", background: "transparent", color: "rgba(255,255,255,.4)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
                  >
                    Entrar primeiro e ativar depois
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.55)", marginBottom: 28, lineHeight: 1.6 }}>
                    Sua empresa foi cadastrada no plano <strong style={{ color: "#fff" }}>Free</strong>.<br />
                    Agora é só entrar no sistema.
                  </div>
                  <button
                    onClick={() => navigate("/login")}
                    style={{ width: "100%", background: "linear-gradient(135deg,#981915,#7d1411)", color: "#fff", border: "none", borderRadius: 10, padding: 15, fontSize: 16, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
                  >
                    Entrar no sistema →
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
                {planInfo ? `Criar conta — Plano ${planInfo.label}` : "Criar conta gratuita"}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 24 }}>
                {planInfo
                  ? `${planInfo.preco} · cancele quando quiser`
                  : "Plano Free · 2 obras ativas · sem cartão"}
              </div>

              {erro && (
                <div style={{ background: "rgba(220,38,38,.15)", border: "1px solid rgba(220,38,38,.4)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ff8a80", marginBottom: 16 }}>
                  {erro}
                </div>
              )}

              <form onSubmit={handleCadastro} autoComplete="off">
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Nome da empresa *</label>
                  <input style={inputStyle} value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Ex: Construtora Ltda." autoComplete="off" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Seu nome *</label>
                  <input style={inputStyle} value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} placeholder="Ex: João Silva" autoComplete="off" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>E-mail *</label>
                  <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@empresa.com.br" autoComplete="off" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Senha *</label>
                  <div style={{ position: "relative" }}>
                    <input style={{ ...inputStyle, paddingRight: 80 }} type={show ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" required />
                    <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.5)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      {show ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Confirmar senha *</label>
                  <input style={inputStyle} type={show ? "text" : "password"} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} placeholder="Repita a senha" autoComplete="new-password" required />
                </div>

                <button
                  type="submit"
                  disabled={loading || !nomeEmpresa || !nomeUsuario || !email || !senha || !confirmar}
                  style={{ width: "100%", background: loading ? "#444" : "linear-gradient(135deg,#981915,#7d1411)", color: "#fff", border: "none", borderRadius: 10, padding: 15, fontSize: 16, fontWeight: 800, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 20px rgba(152,25,21,.4)" }}
                >
                  {loading ? "Criando conta…" : planInfo ? `Criar conta e assinar ${planInfo.label} →` : "Criar conta gratuita →"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,.4)" }}>
                Já tem conta?{" "}
                <Link to="/login" style={{ color: "#ff8e8a", fontWeight: 700, textDecoration: "none" }}>Entrar</Link>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,.2)" }}>
          Stick Frame Sistemas Construtivos · Santo André/SP
        </div>
      </div>
    </div>
  );
}
