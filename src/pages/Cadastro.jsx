import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { salvarOrigemLead, obterOrigemLead } from "../utils/leadOrigem";
import { trackPageView, analytics } from "../utils/analytics";

/* ── helpers ── */
function forcaSenhaScore(s) {
  let n = 0;
  if (s.length >= 6) n++;
  if (s.length >= 10) n++;
  if (/[A-Z]/.test(s) && /[a-z]/.test(s)) n++;
  if (/\d/.test(s) && /[^A-Za-z0-9]/.test(s)) n++;
  return n;
}
const FORCA = [
  { label: "Fraca",  cor: "#c0892d" },
  { label: "Fraca",  cor: "#c0892d" },
  { label: "Média",  cor: "#3b6ea5" },
  { label: "Forte",  cor: "#3f7a4b" },
  { label: "Forte",  cor: "#3f7a4b" },
];

/* ── ícones lucide inline ── */
const Ic = {
  Building: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10M9 7h.01M15 7h.01M9 12h.01M15 12h.01"/>
    </svg>
  ),
  User: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>
    </svg>
  ),
  Mail: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
    </svg>
  ),
  Lock: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  X: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
};

const PLAN_INFO = {
  profissional: { label: "Profissional", preco: "R$ 197/mês", msg: "Após criar sua conta você será direcionado para concluir a assinatura." },
  essencial:    { label: "Essencial",    preco: "R$ 97/mês",  msg: "Após criar sua conta você poderá ativar o plano Essencial." },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Hanken+Grotesk:wght@400;500;600;700;800;900&display=swap');

:root {
  --brick: #981915; --brick-dk: #7d1411; --brick-soft: rgba(152,25,21,.12);
  --graphite-2: #1a191c;
  --ink: #26231f; --ink-2: #57514a; --muted: #8c847a;
  --line: #e7e1d8; --line-2: #efeae2;
  --bg: #f4f1ec; --surface: #fff; --surface-2: #faf8f4;
  --pos: #3f7a4b; --steel: #3b6ea5; --ochre: #c0892d;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.cad-root {
  display: grid;
  grid-template-columns: minmax(420px, 46%) 1fr;
  height: 100vh;
  overflow: hidden;
  font-family: 'Hanken Grotesk', sans-serif;
}

/* ── BRAND PANEL ── */
.cad-brand {
  background: var(--graphite-2);
  padding: 46px 52px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.cad-brand::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(1100px 520px at 88% -8%, rgba(152,25,21,.34), transparent 60%),
              radial-gradient(500px 380px at 12% 92%, rgba(152,25,21,.16), transparent 60%);
  z-index: 0;
}
.cad-brand::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: linear-gradient(160deg, #000, transparent 78%);
  opacity: .4;
  z-index: 0;
}
.cad-brand > * { position: relative; z-index: 1; }

.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-logo img { width: 34px; height: 34px; object-fit: contain; }
.brand-logo-text { line-height: 1; }
.brand-logo-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 23px;
  letter-spacing: 1.2px;
  color: #fff;
}
.brand-logo-name span { color: #e0726d; }
.brand-logo-sub {
  font-size: 9px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.4);
  text-transform: uppercase;
  margin-top: 1px;
}

.brand-center { margin: auto 0; }

.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 13px;
  background: rgba(152,25,21,.18);
  border: 1px solid rgba(224,114,109,.28);
  border-radius: 30px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .7px;
  color: #e0726d;
  margin-bottom: 22px;
}
.brand-pill-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #3f7a4b;
  animation: pls 2.4s ease-in-out infinite;
}
@keyframes pls {
  0%,100% { box-shadow: 0 0 0 0 rgba(63,122,75,.7); }
  50%      { box-shadow: 0 0 0 5px rgba(63,122,75,0); }
}

.brand-h1 {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 54px;
  line-height: .98;
  color: #fff;
  margin-bottom: 18px;
}
.brand-h1 em { font-style: normal; color: #e0726d; }

.brand-sub {
  font-size: 15.5px;
  color: rgba(255,255,255,.66);
  line-height: 1.55;
  max-width: 30em;
  margin-bottom: 32px;
}

.brand-features { display: flex; flex-direction: column; gap: 16px; }
.brand-feat {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.brand-feat-icon {
  width: 38px; height: 38px; flex-shrink: 0;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #e0726d;
}
.brand-feat-title { font-size: 14.5px; font-weight: 700; color: #fff; margin-bottom: 2px; }
.brand-feat-desc  { font-size: 12.5px; color: rgba(255,255,255,.5); line-height: 1.4; }

.brand-footer {
  border-top: 1px solid rgba(255,255,255,.09);
  padding-top: 24px;
  display: flex;
  gap: 0;
}
.brand-stat {
  flex: 1;
  padding: 0 20px;
  border-right: 1px solid rgba(255,255,255,.09);
}
.brand-stat:first-child { padding-left: 0; }
.brand-stat:last-child  { border-right: none; }
.brand-stat-val {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 27px;
  color: #fff;
  line-height: 1;
}
.brand-stat-val span { color: #e0726d; }
.brand-stat-lbl { font-size: 10.5px; color: rgba(255,255,255,.42); margin-top: 3px; }

/* ── FORM COLUMN ── */
.cad-formcol {
  background: var(--bg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.fc-top {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  padding: 20px 40px 0;
  font-size: 13px;
  color: var(--ink-2);
  flex-shrink: 0;
}
.fc-top a { color: var(--brick); font-weight: 700; text-decoration: none; }
.fc-top a:hover { text-decoration: underline; }

.fc-inner {
  max-width: 480px;
  width: 100%;
  margin: auto;
  padding: 30px 46px 46px;
}

.fc-plan-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1.5px solid var(--line);
  border-radius: 20px;
  padding: 5px 14px 5px 6px;
  margin-bottom: 18px;
  font-size: 12.5px;
  color: var(--ink-2);
}
.fc-plan-badge {
  background: var(--brick);
  color: #fff;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: .5px;
  padding: 2px 9px;
  border-radius: 20px;
}

.fc-h1 {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 40px;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 8px;
}
.fc-lede {
  font-size: 14px;
  color: var(--ink-2);
  margin-bottom: 28px;
  line-height: 1.5;
}
.fc-lede strong { color: var(--ink); }

/* field */
.fc-field { margin-bottom: 16px; }
.fc-label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .9px;
  color: var(--ink-2);
  margin-bottom: 6px;
}
.fc-label .req { color: var(--brick); }
.fc-input-wrap { position: relative; }
.fc-input-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  display: flex;
  pointer-events: none;
}
.fc-input {
  width: 100%;
  padding: 13px 14px 13px 42px;
  font-size: 14.5px;
  font-weight: 500;
  font-family: 'Hanken Grotesk', sans-serif;
  background: var(--surface);
  border: 1.5px solid var(--line);
  border-radius: 11px;
  color: var(--ink);
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.fc-input::placeholder { color: var(--muted); font-weight: 400; }
.fc-input:focus {
  border-color: var(--brick);
  box-shadow: 0 0 0 4px var(--brick-soft);
}
.fc-input-pr { padding-right: 80px; }

.fc-show-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  font-family: inherit;
  color: var(--ink-2);
  cursor: pointer;
}

/* strength meter */
.strength-wrap { margin-top: 8px; display: flex; align-items: center; gap: 8px; }
.strength-bars { display: flex; gap: 3px; }
.strength-bar  { width: 32px; height: 5px; border-radius: 3px; background: var(--line); transition: background .2s; }

/* two-col */
.fc-two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* match feedback */
.fc-match {
  margin-top: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* checkbox */
.fc-check-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 22px;
}
.fc-check {
  width: 21px; height: 21px;
  min-width: 21px;
  border-radius: 6px;
  border: 1.5px solid var(--line);
  background: var(--surface);
  appearance: none;
  cursor: pointer;
  position: relative;
  margin-top: 1px;
  transition: background .15s, border-color .15s;
}
.fc-check:checked { background: var(--brick); border-color: var(--brick); }
.fc-check:checked::after {
  content: '';
  position: absolute;
  left: 5px; top: 2px;
  width: 8px; height: 12px;
  border: 2.5px solid #fff;
  border-top: none; border-left: none;
  transform: rotate(43deg);
}
.fc-check.shake { animation: shake .28s ease; }
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-5px); }
  40%      { transform: translateX(5px); }
  60%      { transform: translateX(-5px); }
  80%      { transform: translateX(5px); }
}
.fc-check-lbl { font-size: 12.5px; color: var(--ink-2); line-height: 1.5; }
.fc-check-lbl a { color: var(--brick); text-decoration: none; font-weight: 600; }
.fc-check-lbl a:hover { text-decoration: underline; }

/* submit */
.fc-btn {
  width: 100%;
  background: var(--brick);
  color: #fff;
  border: none;
  border-radius: 13px;
  padding: 16px;
  font-size: 15.5px;
  font-weight: 700;
  font-family: 'Hanken Grotesk', sans-serif;
  cursor: pointer;
  box-shadow: 0 8px 22px -10px rgba(152,25,21,.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background .15s, transform .15s, box-shadow .15s;
  margin-bottom: 14px;
}
.fc-btn:hover:not(:disabled) {
  background: var(--brick-dk);
  transform: translateY(-1px);
  box-shadow: 0 12px 28px -10px rgba(152,25,21,.8);
}
.fc-btn:disabled { opacity: .7; cursor: not-allowed; }
.fc-btn.success  { background: var(--pos); }

.fc-guarantees {
  display: flex;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 11.5px;
  color: var(--muted);
  margin-bottom: 6px;
}
.fc-guarantee { display: flex; align-items: center; gap: 4px; color: var(--pos); }
.fc-guarantee span { color: var(--muted); }

.fc-legal {
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  margin-top: 18px;
}

/* erro */
.fc-error {
  background: rgba(152,25,21,.08);
  border: 1px solid rgba(152,25,21,.3);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--brick);
  margin-bottom: 16px;
}

/* success screen */
.fc-success { text-align: center; padding: 20px 0; }
.fc-success-icon { font-size: 52px; margin-bottom: 16px; }
.fc-success h2 { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; font-weight: 700; color: var(--ink); margin-bottom: 10px; }
.fc-success p  { font-size: 14px; color: var(--ink-2); line-height: 1.6; margin-bottom: 24px; }

/* responsive */
@media (max-width: 980px) {
  .cad-brand { display: none; }
  .cad-root  { grid-template-columns: 1fr; }
}
@media (max-width: 520px) {
  .fc-inner { padding: 24px 20px 36px; }
  .fc-two   { grid-template-columns: 1fr; }
  .fc-h1    { font-size: 34px; }
  .fc-top   { padding: 16px 20px 0; }
}
`;

export default function Cadastro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey  = searchParams.get("plan");
  const planInfo = PLAN_INFO[planKey] || null;

  const [nomeEmpresa,    setNomeEmpresa]    = useState("");
  const [nomeUsuario,    setNomeUsuario]    = useState("");
  const [email,          setEmail]          = useState("");
  const [senha,          setSenha]          = useState("");
  const [confirmar,      setConfirmar]      = useState("");
  const [mostrarSenha,   setMostrarSenha]   = useState(false);
  const [aceitouTermos,  setAceitouTermos]  = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [erro,           setErro]           = useState("");
  const [sucesso,        setSucesso]        = useState(false);
  const [shakeTermos,    setShakeTermos]    = useState(false);
  const checkRef = useRef(null);

  const forca           = forcaSenhaScore(senha);
  const senhasConferem  = confirmar.length > 0 && senha === confirmar;
  const senhasDiscordam = confirmar.length > 0 && senha !== confirmar;

  useEffect(() => {
    salvarOrigemLead();
    trackPageView("/cadastro");
    analytics.signupStarted();
  }, []);

  async function handleCadastro(e) {
    e.preventDefault();
    setErro("");
    if (!aceitouTermos) {
      setShakeTermos(true);
      setTimeout(() => setShakeTermos(false), 400);
      return;
    }
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

  const forcaInfo = FORCA[forca] || FORCA[0];

  return (
    <div className="cad-root">
      <style>{CSS}</style>

      {/* ── PAINEL DE MARCA ── */}
      <aside className="cad-brand">
        {/* Logo */}
        <div className="brand-logo">
          <img src="/logo-transparente-122x122.png" alt="StickFrame" />
          <div className="brand-logo-text">
            <div className="brand-logo-name">STICK<span>FRAME</span></div>
            <div className="brand-logo-sub">Sistema de Gestão</div>
          </div>
        </div>

        {/* Centro */}
        <div className="brand-center">
          <div className="brand-pill">
            <span className="brand-pill-dot" />
            Plano Free · sem cartão
          </div>

          <h2 className="brand-h1">
            Gestão completa da<br />
            <em>obra em Steel Frame</em>
          </h2>

          <p className="brand-sub">
            Orçamento técnico, controle de obras, financeiro e CRM num só lugar.
            Comece grátis e leve sua construtora para o digital.
          </p>

          <div className="brand-features">
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3"/><rect x="9" y="3" width="6" height="8" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
                title: "Orçamento técnico preciso",
                desc: "Catálogo de insumos com preços de mercado e cálculo por m².",
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
                title: "Controle de obras em tempo real",
                desc: "Cronograma, medições e diário de obra na palma da mão.",
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 14.5c0 1.1 1.1 2 2.5 2s2.5-.9 2.5-2-1.1-1.7-2.5-2-2.5-.9-2.5-2 1.1-2 2.5-2 2.5.9 2.5 2"/></svg>,
                title: "Financeiro integrado",
                desc: "Fluxo de caixa, contas a pagar e margem por projeto.",
              },
            ].map(({ icon, title, desc }) => (
              <div className="brand-feat" key={title}>
                <div className="brand-feat-icon">{icon}</div>
                <div>
                  <div className="brand-feat-title">{title}</div>
                  <div className="brand-feat-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="brand-footer">
          {[
            { val: "2.4k", suf: "", lbl: "obras gerenciadas" },
            { val: "R$ 38", suf: "M", lbl: "em orçamentos" },
            { val: "4.9", suf: "★", lbl: "avaliação média" },
          ].map(({ val, suf, lbl }) => (
            <div className="brand-stat" key={lbl}>
              <div className="brand-stat-val">{val}<span>{suf}</span></div>
              <div className="brand-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── FORMULÁRIO ── */}
      <main className="cad-formcol">
        <div className="fc-top">
          <span>Já tem conta?</span>
          <Link to="/login">Entrar →</Link>
        </div>

        <div className="fc-inner">
          {sucesso ? (
            <div className="fc-success">
              <div className="fc-success-icon">✅</div>
              <h2>Conta criada!</h2>
              <p>
                {planInfo
                  ? <>Sua empresa está pronta. Agora conclua a assinatura do plano <strong>{planInfo.label}</strong>.</>
                  : <>Sua empresa foi cadastrada no plano <strong>Free</strong>. Agora é só entrar.</>}
              </p>
              <button
                className="fc-btn success"
                onClick={() => navigate(planKey ? `/checkout?plan=${planKey}` : "/login")}
              >
                {planKey ? "Ativar trial de 14 dias →" : "Entrar no sistema →"}
                <Ic.Arrow />
              </button>
              {planKey && (
                <button
                  className="fc-btn"
                  style={{ background: "transparent", border: "1.5px solid var(--line)", color: "var(--ink-2)", boxShadow: "none" }}
                  onClick={() => navigate("/login")}
                >
                  Entrar primeiro e ativar depois
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Plan pill */}
              <div className="fc-plan-pill">
                <span className="fc-plan-badge">{planInfo ? planInfo.label.toUpperCase() : "FREE"}</span>
                {planInfo ? planInfo.preco : "2 obras ativas"}
              </div>

              <h1 className="fc-h1">
                {planInfo ? `Criar conta — ${planInfo.label}` : "Criar conta gratuita"}
              </h1>
              <p className="fc-lede">
                Leva menos de <strong>1 minuto</strong>. Sem cartão de crédito, sem compromisso.
              </p>

              {erro && <div className="fc-error">{erro}</div>}

              <form onSubmit={handleCadastro} autoComplete="on">
                {/* Nome empresa */}
                <div className="fc-field">
                  <label className="fc-label">Nome da empresa <span className="req">*</span></label>
                  <div className="fc-input-wrap">
                    <span className="fc-input-icon"><Ic.Building /></span>
                    <input className="fc-input" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)}
                      placeholder="Ex: Construtora Ltda." autoComplete="organization" required />
                  </div>
                </div>

                {/* Nome */}
                <div className="fc-field">
                  <label className="fc-label">Seu nome <span className="req">*</span></label>
                  <div className="fc-input-wrap">
                    <span className="fc-input-icon"><Ic.User /></span>
                    <input className="fc-input" value={nomeUsuario} onChange={e => setNomeUsuario(e.target.value)}
                      placeholder="Ex: João Silva" autoComplete="name" required />
                  </div>
                </div>

                {/* Email */}
                <div className="fc-field">
                  <label className="fc-label">E-mail <span className="req">*</span></label>
                  <div className="fc-input-wrap">
                    <span className="fc-input-icon"><Ic.Mail /></span>
                    <input className="fc-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="seuemail@empresa.com.br" autoComplete="email" required />
                  </div>
                </div>

                {/* Senhas */}
                <div className="fc-two">
                  {/* Senha */}
                  <div className="fc-field">
                    <label className="fc-label">Senha <span className="req">*</span></label>
                    <div className="fc-input-wrap">
                      <span className="fc-input-icon"><Ic.Lock /></span>
                      <input className="fc-input fc-input-pr"
                        type={mostrarSenha ? "text" : "password"}
                        value={senha} onChange={e => setSenha(e.target.value)}
                        placeholder="Mín. 6 caracteres" autoComplete="new-password" required />
                      <button type="button" className="fc-show-btn" onClick={() => setMostrarSenha(v => !v)}>
                        {mostrarSenha ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    {senha.length > 0 && (
                      <div className="strength-wrap">
                        <div className="strength-bars">
                          {[0,1,2,3].map(i => (
                            <div key={i} className="strength-bar"
                              style={{ background: i < forca ? forcaInfo.cor : undefined }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: forcaInfo.cor }}>{forcaInfo.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Confirmar */}
                  <div className="fc-field">
                    <label className="fc-label">Confirmar senha <span className="req">*</span></label>
                    <div className="fc-input-wrap">
                      <span className="fc-input-icon"><Ic.Lock /></span>
                      <input className="fc-input"
                        type={mostrarSenha ? "text" : "password"}
                        value={confirmar} onChange={e => setConfirmar(e.target.value)}
                        placeholder="Repita a senha" autoComplete="new-password" required />
                    </div>
                    {confirmar.length > 0 && (
                      <div className="fc-match" style={{ color: senhasConferem ? "var(--pos)" : "var(--brick)" }}>
                        {senhasConferem ? <><Ic.Check /> As senhas conferem</> : <><Ic.X /> As senhas não conferem</>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Termos */}
                <div className="fc-check-row">
                  <input
                    ref={checkRef}
                    type="checkbox"
                    className={`fc-check${shakeTermos ? " shake" : ""}`}
                    checked={aceitouTermos}
                    onChange={e => setAceitouTermos(e.target.checked)}
                  />
                  <span className="fc-check-lbl">
                    Li e concordo com os{" "}
                    <a href="/termos" target="_blank" rel="noreferrer">Termos de Uso</a>{" "}
                    e a{" "}
                    <a href="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>{" "}
                    da StickFrame.
                  </span>
                </div>

                {/* Botão */}
                <button
                  type="submit"
                  className="fc-btn"
                  disabled={loading || !nomeEmpresa || !nomeUsuario || !email || !senha || !confirmar}
                >
                  {loading ? "Criando sua conta…" : (planInfo ? `Criar conta e assinar ${planInfo.label}` : "Criar conta gratuita")}
                  {!loading && <Ic.Arrow />}
                </button>

                {/* Garantias */}
                <div className="fc-guarantees">
                  {["Sem cartão", "Cancele quando quiser", "Dados criptografados"].map(g => (
                    <div key={g} className="fc-guarantee">
                      <Ic.Check /><span>{g}</span>
                    </div>
                  ))}
                </div>
              </form>

              <div className="fc-legal">
                Stick Frame Sistemas Construtivos · Santo André/SP
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
