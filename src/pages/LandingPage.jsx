import { useState, useEffect } from "react";
import { salvarOrigemLead } from "../utils/leadOrigem";

//  SVG Icon set 
const IcBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M6 21V9M10 21V9"/><path d="M4 9h16l-2-5H8z"/><path d="M16 9v6m0 0a2 2 0 1 0 .01 0"/>
  </svg>
);
const IcDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4M9 13h6M9 17h6"/>
  </svg>
);
const IcCalc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>
  </svg>
);
const IcMoney = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 14.5c0 1.1 1.1 2 2.5 2s2.5-.9 2.5-2-1.1-1.7-2.5-2-2.5-.9-2.5-2 1.1-2 2.5-2 2.5.9 2.5 2"/>
  </svg>
);
const IcTeam = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5M18 20a6 6 0 0 0-3-5.2"/>
  </svg>
);
const IcChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>
  </svg>
);
const IcCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);
const IcArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);
const IcMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="24" height="24">
    <path d="M4 7h16M4 12h16M4 17h16"/>
  </svg>
);
const IcClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="28" height="28">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

//  Data 
const FEATS = [
  { Icon: IcBuilding, title: "Gestão de Obras",           desc: "Cronograma, diário, medições e vistorias em um só painel. Acompanhe cada etapa em tempo real." },
  { Icon: IcDoc,      title: "Orçamentos & Contratos",    desc: "Gere propostas profissionais em minutos. Envie, aprove e controle contratos na plataforma." },
  { Icon: IcCalc,     title: "Calculadora White-label",   desc: "Envie um link com sua marca para clientes calcularem o custo da obra online." },
  { Icon: IcMoney,    title: "Financeiro",                desc: "Controle receitas, despesas e fluxo de caixa de cada obra com relatórios automáticos." },
  { Icon: IcTeam,     title: "Equipe & SST",              desc: "Gerencie colaboradores, pontos e documentos de segurança do trabalho em um lugar." },
  { Icon: IcChart,    title: "Inteligência",              desc: "Dashboards e BI para tomar decisões com base em dados reais das suas obras." },
];

const PLANOS = [
  {
    key: "essencial", nome: "Essencial", preco: "R$ 97", periodo: "/mês",
    desc: "Para quem está começando",
    items: ["Orçamentos & contratos ilimitados", "Calculadora white-label", "1 usuário", "Suporte por e-mail"],
    cta: "Começar grátis", href: "/cadastro?plan=essencial", hot: false,
  },
  {
    key: "profissional", nome: "Profissional", preco: "R$ 197", periodo: "/mês",
    desc: "Para construtoras em crescimento",
    items: ["Tudo do Essencial", "Gestão de obras completa", "Financeiro por obra", "5 usuários", "Suporte prioritário no WhatsApp"],
    cta: "Testar 14 dias grátis", href: "/cadastro?plan=profissional", hot: true, tag: "Mais escolhido",
  },
  {
    key: "construtora", nome: "Construtora+", preco: "Sob consulta", periodo: "",
    desc: "Para operações maiores",
    items: ["Tudo do Profissional", "Equipe & SST", "Dashboards e BI", "Usuários ilimitados", "Onboarding assistido"],
    cta: "Falar com a equipe", href: "https://wa.me/551140038929?text=Ol%C3%A1%2C+tenho+interesse+no+plano+Construtora%2B", hot: false,
  },
];

const DEPOIMENTOS = [
  { text: "Antes eu levava dois dias para fechar um orçamento de steel frame. Hoje sai em vinte minutos, com contrato junto.", nome: "Rafael Souza", cargo: "JM Construtora · Curitiba", ini: "RS" },
  { text: "A calculadora com a nossa marca virou nossa maior fonte de leads. O cliente chega já sabendo a faixa de preço.", nome: "Ana Lima", cargo: "Arquiteta · Belo Horizonte", ini: "AL" },
  { text: "O financeiro por obra acabou com as planilhas soltas. Sei a margem de cada projeto em tempo real.", nome: "Carlos Melo", cargo: "Construtor · São Paulo", ini: "CM" },
];

//  CSS 
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
  :root {
    --brick:#981915; --brick-dk:#7d1411; --brick-soft:#f3e7e5;
    --graphite:#2b2b2e; --graphite-2:#232225;
    --ink:#26231f; --ink-2:#57514a; --muted:#8c847a;
    --line:#e7e1d8; --line-2:#efeae2;
    --bg:#f4f1ec; --surface:#fff; --surface-2:#faf8f4;
    --sage:#4f7d57;
  }
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: var(--ink); background: var(--bg); font-size: 16px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .lp img { display: block; max-width: 100%; }
  .lp a { text-decoration: none; transition: opacity .15s; }
  .lp a:hover { opacity: .85; }
  .lp-wrap { max-width: 1180px; margin: 0 auto; padding: 0 40px; }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 15px; padding: 13px 24px; border-radius: 10px; cursor: pointer; border: 1.5px solid transparent; white-space: nowrap; transition: .15s; text-decoration: none; }
  .btn-lg { padding: 15px 28px; font-size: 16px; border-radius: 12px; }
  .btn-brick { background: var(--brick); color: #fff; border-color: var(--brick); }
  .btn-brick:hover { background: var(--brick-dk); border-color: var(--brick-dk); opacity: 1; }
  .btn-white { background: #fff; color: var(--brick); border-color: #fff; }
  .btn-white:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.18); opacity: 1; }
  .btn-outline-w { background: transparent; color: #fff; border-color: rgba(255,255,255,.4); }
  .btn-outline-w:hover { border-color: #fff; background: rgba(255,255,255,.08); opacity: 1; }
  .btn-outline { background: transparent; color: var(--ink); border-color: var(--line); }
  .btn-outline:hover { border-color: var(--muted); opacity: 1; }

  /* Nav */
  .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: background .25s, box-shadow .25s; }
  .lp-nav.solid { background: var(--brick-dk); box-shadow: 0 4px 24px rgba(40,10,8,.3); }
  .lp-nav-in { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
  .lp-logo { height: 34px; display: block; }
  .lp-nav-links { display: flex; align-items: center; gap: 28px; font-size: 14.5px; font-weight: 600; color: #fff; }
  .lp-nav-links a { color: inherit; opacity: .85; }
  .lp-nav-links a:hover { opacity: 1; }

  /* Hamburger */
  .lp-burger { display: none; background: none; border: none; cursor: pointer; padding: 4px; color: #fff; align-items: center; justify-content: center; }
  .lp-m-menu { display: none; position: fixed; inset: 0; background: var(--graphite); z-index: 200; flex-direction: column; align-items: flex-start; padding: 80px 32px 40px; gap: 28px; }
  .lp-m-menu.open { display: flex; }
  .lp-m-menu a { color: #fff; font-size: 22px; font-weight: 700; opacity: .85; text-decoration: none; }
  .lp-m-menu a:hover { opacity: 1; }
  .lp-m-menu .btn { margin-top: 12px; font-size: 16px; padding: 14px 28px; }

  /* Eyebrow */
  .eyebrow { font-size: 12.5px; font-weight: 800; letter-spacing: 2.4px; text-transform: uppercase; display: block; margin-bottom: 12px; }

  /* Section headers */
  .sec-head { margin-bottom: 48px; }
  .sec-head .eyebrow { color: var(--brick); }
  .sec-head h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(32px,4.5vw,48px); line-height: 1.02; color: var(--ink); }
  .sec-head p { font-size: 17px; color: var(--ink-2); margin-top: 12px; max-width: 560px; }
  .sec-head.center { text-align: center; }
  .sec-head.center p { margin: 12px auto 0; }

  /* Hero — tijolo */
  .lp-hero { background: linear-gradient(165deg,#a51d18 0%,#981915 45%,#7d1411 100%); position: relative; overflow: hidden; color: #fff; padding: 148px 0 108px; }
  .lp-hero .ring  { position: absolute; right: -120px; top: -120px; width: 460px; height: 460px; border: 54px solid rgba(255,255,255,.05); border-radius: 50%; pointer-events: none; }
  .lp-hero .ring2 { position: absolute; left: -160px; bottom: -200px; width: 380px; height: 380px; border: 44px solid rgba(0,0,0,.07); border-radius: 50%; pointer-events: none; }
  .lp-hero-in { position: relative; max-width: 780px; }
  .lp-hero .eyebrow { color: rgba(255,255,255,.65); }
  .lp-hero h1 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(46px,7.5vw,86px); color: #fff; margin: 0; line-height: 1.0; letter-spacing: .5px; }
  .lp-hero .h-sub { font-size: 18px; color: rgba(255,255,255,.82); max-width: 580px; margin: 20px 0 0; line-height: 1.65; }
  .lp-hero .h-cta { display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; align-items: center; }
  .lp-hero .h-note { font-size: 13px; color: rgba(255,255,255,.5); margin-top: 14px; }

  /* Funcionalidades — graphite band */
  .lp-feats { background: var(--graphite-2); padding: 96px 0; color: #fff; }
  .lp-feats .sec-head .eyebrow { color: #e08a84; }
  .lp-feats .sec-head h2 { color: #fff; }
  .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .feat { background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 26px 26px 28px; transition: border-color .2s, transform .2s; }
  .feat:hover { border-color: rgba(255,255,255,.25); transform: translateY(-3px); }
  .feat .f-ic { width: 44px; height: 44px; border-radius: 11px; background: rgba(152,25,21,.32); color: #e8918c; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .feat .f-ic svg { width: 22px; height: 22px; }
  .feat h3 { font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 8px; }
  .feat p { font-size: 13.5px; color: #b8b1a6; line-height: 1.55; }

  /* Produto */
  .lp-produto { padding: 96px 0; background: var(--surface-2); }
  .lp-browser { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 2px 4px rgba(40,30,20,.05),0 12px 32px rgba(40,30,20,.09); overflow: hidden; }
  .lp-browser .b-bar { display: flex; align-items: center; gap: 7px; padding: 11px 16px; border-bottom: 1px solid var(--line-2); background: var(--surface-2); }
  .lp-browser .b-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--line); flex-shrink: 0; }
  .lp-browser .b-url { margin-left: 10px; flex: 1; max-width: 340px; background: var(--surface); border: 1px solid var(--line-2); border-radius: 6px; font-size: 11.5px; color: var(--muted); padding: 4px 12px; }
  .lp-browser img { width: 100%; display: block; }
  .prints-sub { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
  .print-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 2px rgba(40,30,20,.05); }
  .print-card img { width: 100%; display: block; }
  .p-cap { font-size: 13px; font-weight: 700; color: var(--ink-2); padding: 13px 18px; border-top: 1px solid var(--line-2); display: flex; align-items: center; gap: 9px; }
  .p-cap svg { width: 15px; height: 15px; color: var(--brick); flex-shrink: 0; }

  /* Precos */
  .lp-precos { padding: 96px 0 64px; background: var(--bg); }
  .plans { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; align-items: stretch; }
  .plan { background: var(--surface); border: 1.5px solid var(--line); border-radius: 18px; padding: 30px 28px; display: flex; flex-direction: column; position: relative; }
  .plan.hot { background: var(--graphite); border-color: var(--graphite); color: #fff; }
  .plan .p-tag { position: absolute; top: -12px; left: 28px; background: var(--brick); color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; }
  .plan .p-nm { font-size: 15px; font-weight: 800; }
  .plan .p-ds { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .plan.hot .p-ds { color: #9a948a; }
  .plan .p-pr { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 46px; margin: 20px 0 2px; line-height: 1; }
  .plan .p-pr small { font-size: 15px; font-family: 'Hanken Grotesk', sans-serif; font-weight: 600; color: var(--muted); }
  .plan.hot .p-pr small { color: #9a948a; }
  .plan ul { list-style: none; margin: 18px 0 24px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
  .plan li { display: flex; gap: 10px; font-size: 13.5px; color: var(--ink-2); align-items: flex-start; }
  .plan.hot li { color: #cfc9c0; }
  .plan li .chk { color: var(--sage); flex-shrink: 0; display: flex; }
  .plan.hot li .chk { color: #7fb389; }
  .plan .btn { width: 100%; }

  /* Depoimentos */
  .lp-depo { padding: 64px 0; background: var(--surface); }
  .quotes { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .quote { background: var(--surface-2); border: 1px solid var(--line); border-radius: 16px; padding: 26px; display: flex; flex-direction: column; }
  .quote .q-mark { font-family: 'Barlow Condensed', sans-serif; font-size: 52px; font-weight: 700; color: var(--brick); line-height: .55; margin-bottom: 14px; }
  .quote p { font-size: 14.5px; color: var(--ink-2); line-height: 1.6; flex: 1; }
  .quote .q-who { display: flex; align-items: center; gap: 11px; margin-top: 20px; }
  .quote .q-av { width: 38px; height: 38px; border-radius: 10px; background: var(--brick-soft); color: var(--brick); font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .quote .q-nm { font-size: 13.5px; font-weight: 700; color: var(--ink); }
  .quote .q-rl { font-size: 12px; color: var(--muted); }

  /* CTA Calculadora */
  .lp-calcsec { padding: 48px 0; background: var(--bg); }
  .calcband { border-radius: 22px; padding: 54px 60px; display: flex; align-items: center; justify-content: space-between; gap: 40px; position: relative; overflow: hidden; background: var(--graphite); color: #fff; }
  .calcband::after { content: ""; position: absolute; right: -60px; top: -60px; width: 300px; height: 300px; border: 38px solid rgba(255,255,255,.06); border-radius: 50%; pointer-events: none; }
  .calcband h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(28px,4vw,42px); line-height: 1.05; position: relative; color: #fff; }
  .calcband p { font-size: 15px; color: rgba(255,255,255,.78); margin-top: 10px; max-width: 440px; position: relative; }
  .calcband .btn { position: relative; flex-shrink: 0; }

  /* Footer */
  .lp-foot { background: var(--graphite-2); color: #9a948a; padding: 46px 0 32px; font-size: 13px; }
  .lp-foot .f-row { display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap; padding-bottom: 28px; border-bottom: 1px solid rgba(255,255,255,.07); margin-bottom: 20px; }
  .lp-foot nav { display: flex; gap: 24px; flex-wrap: wrap; align-items: center; }
  .lp-foot nav a { color: #9a948a; transition: color .15s; }
  .lp-foot nav a:hover { color: #fff; opacity: 1; }
  .lp-foot .f-copy { font-size: 12.5px; color: #6a6460; }

  /* Mobile */
  @media (max-width: 860px) {
    .lp-wrap { padding: 0 22px; }
    .lp-nav-links { display: none; }
    .lp-burger { display: flex; }
    .lp-hero { padding: 120px 0 72px; }
    .lp-hero .h-cta .btn { flex: 1 1 100%; }
    .feat-grid, .plans, .quotes, .prints-sub { grid-template-columns: 1fr; }
    .calcband { flex-direction: column; align-items: flex-start; padding: 36px 26px; }
    .calcband .btn { width: 100%; }
    .lp-feats { padding: 64px 0; }
    .lp-produto, .lp-precos { padding-top: 64px; }
    .lp-foot .f-row { flex-direction: column; gap: 20px; }
  }
`;

//  Component 
export default function LandingPage() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    salvarOrigemLead();
    const fn = () => setSolid(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/*  Nav  */}
      <nav className={`lp-nav${solid ? " solid" : ""}`}>
        <div className="lp-wrap">
          <div className="lp-nav-in">
            <img src="/landing/assets/logo_branco.png" alt="Stick Frame" className="lp-logo" />
            <div className="lp-nav-links">
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#produto">O produto</a>
              <a href="#precos">Preços</a>
              <a href="/login">Entrar</a>
            </div>
            <button className="lp-burger" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
              <IcMenu />
            </button>
          </div>
        </div>
      </nav>

      {/*  Mobile menu  */}
      <div
        className={`lp-m-menu${menuOpen ? " open" : ""}`}
        onClick={(e) => { if (e.target.tagName === "A" || e.target === e.currentTarget) setMenuOpen(false); }}
      >
        <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 20, right: 24, background: "none", border: "none", cursor: "pointer", color: "#fff" }}>
          <IcClose />
        </button>
        <a href="#funcionalidades" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
        <a href="#produto" onClick={() => setMenuOpen(false)}>O produto</a>
        <a href="#precos" onClick={() => setMenuOpen(false)}>Preços</a>
        <a href="/login" onClick={() => setMenuOpen(false)}>Entrar</a>
        <a href="/calcular" onClick={() => setMenuOpen(false)}>Calculadora</a>
        <a href="/cadastro" className="btn btn-brick" onClick={() => setMenuOpen(false)}>Começar grátis</a>
      </div>

      {/*  Hero — tijolo  */}
      <section className="lp-hero">
        <div className="ring" />
        <div className="ring2" />
        <div className="lp-wrap">
          <div className="lp-hero-in">
            <span className="eyebrow">Sistema de gestão · Steel Frame</span>
            <h1>Construa rápido.<br />Gerencie melhor.</h1>
            <p className="h-sub">
              A plataforma que organiza orçamento, obra, financeiro e equipe — na velocidade do steel frame.
            </p>
            <div className="h-cta">
              <a href="/cadastro" className="btn btn-white btn-lg">Começar grátis</a>
              <a href="/calcular" className="btn btn-outline-w btn-lg">Simular custo de obra</a>
            </div>
            <p className="h-note">Sem cartão de crédito · Configuração em minutos</p>
          </div>
        </div>
      </section>

      {/*  Funcionalidades — banda grafite  */}
      <section className="lp-feats" id="funcionalidades">
        <div className="lp-wrap">
          <div className="sec-head">
            <span className="eyebrow">Funcionalidades</span>
            <h2>Tudo que sua construtora precisa</h2>
          </div>
          <div className="feat-grid">
            {FEATS.map(({ Icon, title, desc }) => (
              <div className="feat" key={title}>
                <div className="f-ic"><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  Produto  */}
      <section className="lp-produto" id="produto">
        <div className="lp-wrap">
          <div className="sec-head center">
            <span className="eyebrow">O produto</span>
            <h2>Um painel só para a obra inteira</h2>
            <p>Do primeiro orçamento à entrega da chave — sem planilhas soltas, sem retrabalho.</p>
          </div>
          <div className="lp-browser">
            <div className="b-bar">
              <span className="b-dot" />
              <span className="b-dot" />
              <span className="b-dot" />
              <span className="b-url">app.stickframe.com.br</span>
            </div>
            <img src="/landing/prints/dashboard.webp" alt="Dashboard Stick Frame" style={{ width: "100%", minHeight: 240, background: "var(--surface-2)" }} />
          </div>
          <div className="prints-sub">
            <div className="print-card">
              <img src="/landing/prints/orcamentos.webp" alt="Orçamentos" style={{ minHeight: 180, background: "var(--surface-2)" }} />
              <div className="p-cap">
                <IcDoc />
                Orçamentos aprovados em minutos
              </div>
            </div>
            <div className="print-card">
              <img src="/landing/prints/financeiro.webp" alt="Financeiro" style={{ minHeight: 180, background: "var(--surface-2)" }} />
              <div className="p-cap">
                <IcMoney />
                Margem por obra em tempo real
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*  Preços  */}
      <section className="lp-precos" id="precos">
        <div className="lp-wrap">
          <div className="sec-head center">
            <span className="eyebrow">Preços</span>
            <h2>Escolha o tamanho da sua operação</h2>
            <p>Comece grátis e evolua conforme as obras crescem. Cancele quando quiser.</p>
          </div>
          <div className="plans">
            {PLANOS.map((pl) => (
              <div className={`plan${pl.hot ? " hot" : ""}`} key={pl.key}>
                {pl.tag && <div className="p-tag">{pl.tag}</div>}
                <div className="p-nm">{pl.nome}</div>
                <div className="p-ds">{pl.desc}</div>
                <div className="p-pr">{pl.preco}{pl.periodo && <small>{pl.periodo}</small>}</div>
                <ul>
                  {pl.items.map((it) => (
                    <li key={it}>
                      <span className="chk"><IcCheck /></span>
                      {it}
                    </li>
                  ))}
                </ul>
                <a href={pl.href} className={`btn${pl.hot ? " btn-brick" : " btn-outline"}`}>
                  {pl.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  Depoimentos  */}
      <section className="lp-depo">
        <div className="lp-wrap">
          <div className="sec-head center">
            <span className="eyebrow">Depoimentos</span>
            <h2>Quem constrói com o Stick Frame</h2>
          </div>
          <div className="quotes">
            {DEPOIMENTOS.map((d) => (
              <div className="quote" key={d.nome}>
                <div className="q-mark">"</div>
                <p>{d.text}</p>
                <div className="q-who">
                  <div className="q-av">{d.ini}</div>
                  <div>
                    <div className="q-nm">{d.nome}</div>
                    <div className="q-rl">{d.cargo}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  CTA Calculadora  */}
      <section className="lp-calcsec" id="calculadora">
        <div className="lp-wrap">
          <div className="calcband">
            <div>
              <h2>Quanto custa construir em Steel Frame?</h2>
              <p>Simule o custo completo da sua obra em segundos — materiais, projetos e mão de obra. Grátis e sem compromisso.</p>
            </div>
            <a href="/calcular" className="btn btn-brick btn-lg">
              Simular agora
              <IcArrow />
            </a>
          </div>
        </div>
      </section>

      {/*  Footer  */}
      <footer className="lp-foot">
        <div className="lp-wrap">
          <div className="f-row">
            <img src="/landing/assets/logo_branco.png" alt="Stick Frame" className="lp-logo" />
            <nav>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#precos">Preços</a>
              <a href="/calcular">Calculadora</a>
              <a href="/termos">Termos</a>
              <a href="/privacidade">Privacidade</a>
            </nav>
            <span className="f-copy">© {new Date().getFullYear()} Stick Frame · Todos os direitos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
