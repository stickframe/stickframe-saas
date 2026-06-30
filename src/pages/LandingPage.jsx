import { useState, useEffect, useRef } from "react";
import { salvarOrigemLead } from "../utils/leadOrigem";
import { analytics } from "../utils/analytics";
import PricingPlans from "../components/PricingPlans";

// ─── Icons ───────────────────────────────────────────────────────────────────
const Ic = {
  Building: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M6 21V9M10 21V9"/><path d="M4 9h16l-2-5H8z"/><path d="M16 9v6m0 0a2 2 0 1 0 .01 0"/></svg>,
  Doc:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4M9 13h6M9 17h6"/></svg>,
  Calc:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/></svg>,
  Money:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 14.5c0 1.1 1.1 2 2.5 2s2.5-.9 2.5-2-1.1-1.7-2.5-2-2.5-.9-2.5-2 1.1-2 2.5-2 2.5.9 2.5 2"/></svg>,
  Team:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5M18 20a6 6 0 0 0-3-5.2"/></svg>,
  Chart:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>,
  Check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M20 6 9 17l-5-5"/></svg>,
  X:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="15" height="15"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Arrow:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  Menu:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="24" height="24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>,
  Close:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="28" height="28"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Brain:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516M19.967 17.484A4 4 0 0 1 18 18"/></svg>,
  Eye:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  Score:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  Mobile:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
};

// ─── Data ────────────────────────────────────────────────────────────────────
const METRICS = [
  { val: "3×", label: "mais rápido para orçar" },
  { val: "+38%", label: "leads pela calculadora" },
  { val: "100%", label: "das obras num só painel" },
  { val: "−15%", label: "de perda de material" },
];

const DORES = [
  {
    title: "Orçamento lento",
    desc: "Cada proposta leva dias em planilhas frágeis. O cliente esfria antes de receber o preço — e você perde a obra para quem respondeu primeiro.",
  },
  {
    title: "Obra sem visibilidade",
    desc: "Você só descobre o atraso quando ele já aconteceu. Cronograma no papel, medição no caderno e margem que some no caminho.",
  },
  {
    title: "Margem que escapa",
    desc: "Sem ligar orçado, comprado e medido, o lucro vaza obra a obra — e no fim do mês ninguém sabe explicar para onde foi.",
  },
];

const FEATS = [
  { Icon: Ic.Doc,      title: "CRM & Funil",              desc: "Leads da calculadora caem direto no funil, com histórico e temperatura. Nenhum cliente esfria esquecido.", badge: null },
  { Icon: Ic.Doc,      title: "Orçamento & Proposta",      desc: "Composições de Steel Frame prontas. Gere proposta profissional e contrato em minutos, com aceite digital.", badge: null },
  { Icon: Ic.Calc,     title: "Calculadora white-label",   desc: "Um link com a sua marca onde o cliente simula o custo da obra — e vira lead qualificado automaticamente.", badge: "Diferencial" },
  { Icon: Ic.Building, title: "Gestão de Obras",           desc: "Cronograma, diário, medições e quantitativos. Acompanhe avanço físico e financeiro de cada etapa.", badge: null },
  { Icon: Ic.Money,    title: "Financeiro StickCash™",     desc: "Fluxo de caixa, DRE e margem por obra. Saiba o lucro real de cada projeto sem fechar planilha no fim do mês.", badge: null },
  { Icon: Ic.Mobile,   title: "Campo & RDO mobile",        desc: "Diário de obra com foto direto do celular, mesmo offline. O escritório vê o que acontece no canteiro em tempo real.", badge: null },
];

const COMPARATIVO = [
  { rec: "Composições nativas de Steel Frame", sf: true,  erp: false },
  { rec: "Calculadora pública geradora de leads", sf: true, erp: false },
  { rec: "Margem por obra em tempo real",      sf: true,  erp: "Parcial" },
  { rec: "RDO mobile offline",                 sf: true,  erp: "Parcial" },
  { rec: "Implantação sem consultoria cara",   sf: true,  erp: false },
  { rec: "Interface moderna e simples",        sf: true,  erp: false },
];

const STICK_LINE = [
  { Icon: Ic.Score,  name: "StickScore™",  tag: "Qualificação de lead",    desc: "Pontua cada lead pela probabilidade de virar contrato e prioriza seu time comercial." },
  { Icon: Ic.Money,  name: "StickCash™",   tag: "Inteligência financeira",  desc: "Margem, fluxo e DRE por obra, conciliados automaticamente a cada medição." },
  { Icon: Ic.Eye,    name: "StickView™",   tag: "Visão de obra",            desc: "Avanço físico × financeiro lado a lado, com alerta antes do atraso virar prejuízo." },
  { Icon: Ic.Brain,  name: "StickBrain™",  tag: "Copiloto de dados",        desc: "Pergunte em linguagem natural sobre suas obras e receba a resposta na hora." },
];

const DEPOIMENTOS = [
  { text: "Antes eu levava dois dias para fechar um orçamento de steel frame. Hoje sai em vinte minutos, com contrato junto.", nome: "Rafael Souza", cargo: "JM Construtora · Curitiba", ini: "RS" },
  { text: "A calculadora com a nossa marca virou nossa maior fonte de leads. O cliente chega já sabendo a faixa de preço.", nome: "Ana Lima", cargo: "Arquiteta · Belo Horizonte", ini: "AL" },
  { text: "O financeiro por obra acabou com as planilhas soltas. Sei a margem de cada projeto em tempo real.", nome: "Carlos Melo", cargo: "Construtor · São Paulo", ini: "CM" },
];

const OBRAS_ANO = ["1 a 5 obras", "6 a 15 obras", "16 a 40 obras", "Mais de 40 obras"];

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
  :root {
    --brick:#981915; --brick-dk:#7d1411; --brick-soft:#f3e7e5;
    --graphite:#2b2b2e; --graphite-2:#232225;
    --ink:#26231f; --ink-2:#57514a; --muted:#8c847a;
    --line:#e7e1d8; --line-2:#efeae2;
    --bg:#f4f1ec; --surface:#fff; --surface-2:#faf8f4;
    --sage:#4f7d57; --amber:#b07a1e;
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
  .sec-head h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(32px,4.5vw,52px); line-height: 1.02; color: var(--ink); }
  .sec-head p { font-size: 17px; color: var(--ink-2); margin-top: 12px; max-width: 560px; }
  .sec-head.center { text-align: center; }
  .sec-head.center p { margin: 12px auto 0; }

  /* Hero */
  .lp-hero { background: linear-gradient(165deg,#a51d18 0%,#981915 45%,#7d1411 100%); position: relative; overflow: hidden; color: #fff; padding: 148px 0 72px; }
  .lp-hero .ring  { position: absolute; right: -120px; top: -120px; width: 460px; height: 460px; border: 54px solid rgba(255,255,255,.05); border-radius: 50%; pointer-events: none; }
  .lp-hero .ring2 { position: absolute; left: -160px; bottom: -200px; width: 380px; height: 380px; border: 44px solid rgba(0,0,0,.07); border-radius: 50%; pointer-events: none; }
  .lp-hero-in { position: relative; max-width: 820px; }
  .lp-hero .eyebrow { color: rgba(255,255,255,.65); }
  .lp-hero h1 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(48px,7.5vw,88px); color: #fff; margin: 0; line-height: 1.0; letter-spacing: .5px; }
  .lp-hero h1 em { font-style: normal; color: rgba(255,255,255,.7); }
  .lp-hero .h-sub { font-size: 18px; color: rgba(255,255,255,.82); max-width: 580px; margin: 20px 0 0; line-height: 1.65; }
  .lp-hero .h-cta { display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; align-items: center; }
  .lp-hero .h-note { font-size: 13px; color: rgba(255,255,255,.5); margin-top: 14px; }

  /* Metrics bar */
  .lp-metrics { background: var(--graphite-2); padding: 0; }
  .metrics-row { display: grid; grid-template-columns: repeat(4,1fr); border-bottom: 1px solid rgba(255,255,255,.07); }
  .metric { padding: 28px 32px; border-right: 1px solid rgba(255,255,255,.07); }
  .metric:last-child { border-right: none; }
  .metric-val { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 38px; color: #fff; line-height: 1; }
  .metric-lbl { font-size: 13px; color: #9a948a; margin-top: 4px; }

  /* Dor */
  .lp-dor { background: var(--graphite-2); padding: 80px 0 96px; color: #fff; }
  .lp-dor .sec-head .eyebrow { color: #e08a84; }
  .lp-dor .sec-head h2 { color: #fff; }
  .lp-dor .sec-head p { color: #9a948a; }
  .dor-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 2px; }
  .dor-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 32px 28px; }
  .dor-card .d-ico { width: 40px; height: 40px; border-radius: 10px; background: rgba(152,25,21,.28); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; color: #e8918c; }
  .dor-card h3 { font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 10px; }
  .dor-card p { font-size: 14px; color: #9a948a; line-height: 1.6; }

  /* Solução */
  .lp-solucao { background: var(--surface-2); padding: 96px 0; }
  .solucao-in { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
  .solucao-in .s-text h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(30px,4vw,46px); line-height: 1.05; margin-bottom: 20px; }
  .solucao-in .s-text h2 em { font-style: normal; color: var(--brick); }
  .solucao-in .s-text p { font-size: 16px; color: var(--ink-2); line-height: 1.7; margin-bottom: 14px; }
  .sol-check { display: flex; align-items: flex-start; gap: 10px; margin: 10px 0; font-size: 15px; color: var(--ink-2); }
  .sol-check .chk { color: var(--sage); flex-shrink: 0; margin-top: 3px; }
  .sol-mock { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 24px; box-shadow: 0 2px 4px rgba(40,30,20,.05),0 12px 32px rgba(40,30,20,.09); }
  .sol-mock-header { font-size: 13px; font-weight: 700; color: var(--muted); margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--line-2); }
  .sol-kpi-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 14px; }
  .sol-kpi { background: var(--surface-2); border-radius: 10px; padding: 14px 16px; }
  .sol-kpi .kv { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 24px; color: var(--ink); }
  .sol-kpi .kl { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .sol-kpi .kt { font-size: 11px; font-weight: 700; color: var(--sage); margin-top: 2px; }
  .sol-bar-row { display: flex; flex-direction: column; gap: 10px; }
  .sol-bar-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-2); }
  .sol-bar-item span:first-child { min-width: 90px; }
  .sol-bar-track { flex: 1; height: 6px; background: var(--line-2); border-radius: 99px; overflow: hidden; }
  .sol-bar-fill { height: 100%; border-radius: 99px; background: var(--brick); }
  .sol-bar-fill.green { background: var(--sage); }

  /* Funcionalidades */
  .lp-feats { background: var(--bg); padding: 96px 0; }
  .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .feat { background: var(--surface); border: 1.5px solid var(--line); border-radius: 16px; padding: 26px 26px 28px; transition: border-color .2s, transform .2s, box-shadow .2s; position: relative; }
  .feat:hover { border-color: var(--muted); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(40,30,20,.08); }
  .feat .f-ic { width: 44px; height: 44px; border-radius: 11px; background: var(--brick-soft); color: var(--brick); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .feat .f-ic svg { width: 22px; height: 22px; }
  .feat h3 { font-size: 16px; font-weight: 800; color: var(--ink); margin-bottom: 8px; }
  .feat p { font-size: 13.5px; color: var(--ink-2); line-height: 1.55; }
  .feat .f-badge { position: absolute; top: 16px; right: 16px; background: var(--brick); color: #fff; font-size: 10px; font-weight: 800; letter-spacing: 1px; padding: 3px 8px; border-radius: 99px; text-transform: uppercase; }

  /* Comparativo */
  .lp-comp { background: var(--graphite-2); padding: 96px 0; }
  .lp-comp .sec-head .eyebrow { color: #e08a84; }
  .lp-comp .sec-head h2 { color: #fff; }
  .lp-comp .sec-head p { color: #9a948a; }
  .comp-table { width: 100%; border-collapse: collapse; }
  .comp-table th { font-size: 13.5px; font-weight: 800; padding: 12px 20px; text-align: left; color: #9a948a; border-bottom: 1px solid rgba(255,255,255,.1); }
  .comp-table th.sf-col { color: #fff; background: rgba(152,25,21,.22); border-radius: 10px 10px 0 0; }
  .comp-table td { padding: 14px 20px; font-size: 14px; color: #b8b1a6; border-bottom: 1px solid rgba(255,255,255,.06); vertical-align: middle; }
  .comp-table td.sf-col { background: rgba(152,25,21,.1); font-weight: 700; color: #fff; }
  .comp-table tr:last-child td { border-bottom: none; }
  .ic-yes { color: #7fb389; display: flex; align-items: center; }
  .ic-no  { color: #6a6460; display: flex; align-items: center; }
  .ic-par { color: var(--amber); font-size: 12px; font-weight: 700; }

  /* Stick Line */
  .lp-stick { background: var(--surface-2); padding: 96px 0; }
  .stick-eyebrow { display: inline-block; background: var(--brick); color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; padding: 4px 12px; border-radius: 99px; margin-bottom: 16px; }
  .stick-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 48px; }
  .stick-card { background: var(--surface); border: 1.5px solid var(--line); border-radius: 16px; padding: 28px 24px; }
  .stick-card .st-ico { width: 44px; height: 44px; border-radius: 11px; background: var(--brick-soft); color: var(--brick); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  .stick-card .st-ico svg { width: 22px; height: 22px; }
  .stick-card .st-name { font-size: 17px; font-weight: 800; color: var(--ink); }
  .stick-card .st-tag { font-size: 11.5px; font-weight: 700; color: var(--brick); text-transform: uppercase; letter-spacing: .8px; margin-top: 2px; margin-bottom: 12px; }
  .stick-card p { font-size: 13.5px; color: var(--ink-2); line-height: 1.55; }

  /* Preços */
  .lp-precos { padding: 96px 0 64px; background: var(--bg); }

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

  /* Demo form */
  .lp-demo { background: var(--graphite-2); padding: 96px 0; }
  .lp-demo .sec-head .eyebrow { color: #e08a84; }
  .lp-demo .sec-head h2 { color: #fff; }
  .lp-demo .sec-head p { color: #9a948a; }
  .demo-in { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
  .demo-bullets { display: flex; flex-direction: column; gap: 16px; margin-top: 32px; }
  .demo-bullet { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #cfc9c0; }
  .demo-bullet .d-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brick); flex-shrink: 0; }
  .demo-form { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 18px; padding: 36px 32px; }
  .demo-form label { display: block; font-size: 13px; font-weight: 700; color: #9a948a; margin-bottom: 6px; }
  .demo-form input, .demo-form select { width: 100%; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 9px; padding: 12px 16px; font-size: 15px; color: #fff; font-family: inherit; outline: none; margin-bottom: 16px; transition: border-color .15s; }
  .demo-form input::placeholder { color: rgba(255,255,255,.3); }
  .demo-form input:focus, .demo-form select:focus { border-color: rgba(152,25,21,.7); }
  .demo-form select option { background: var(--graphite); color: #fff; }
  .demo-form .form-note { font-size: 12px; color: #6a6460; margin-top: 12px; text-align: center; }

  /* Footer */
  .lp-foot { background: var(--graphite-2); border-top: 1px solid rgba(255,255,255,.06); color: #9a948a; padding: 46px 0 32px; font-size: 13px; }
  .lp-foot .f-row { display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap; padding-bottom: 28px; border-bottom: 1px solid rgba(255,255,255,.07); margin-bottom: 20px; }
  .lp-foot nav { display: flex; gap: 24px; flex-wrap: wrap; align-items: center; }
  .lp-foot nav a { color: #9a948a; transition: color .15s; }
  .lp-foot nav a:hover { color: #fff; opacity: 1; }
  .lp-foot .f-copy { font-size: 12.5px; color: #6a6460; }
  .lp-foot .f-tag { font-size: 12px; color: #6a6460; margin-top: 4px; }

  /* Mobile */
  @media (max-width: 860px) {
    .lp-wrap { padding: 0 22px; }
    .lp-nav-links { display: none; }
    .lp-burger { display: flex; }
    .lp-hero { padding: 120px 0 56px; }
    .lp-hero .h-cta .btn { flex: 1 1 100%; }
    .metrics-row { grid-template-columns: repeat(2,1fr); }
    .metric { border-right: none; border-bottom: 1px solid rgba(255,255,255,.07); }
    .dor-grid, .feat-grid, .plans, .quotes, .stick-grid { grid-template-columns: 1fr; }
    .solucao-in, .demo-in { grid-template-columns: 1fr; gap: 40px; }
    .comp-table { display: block; overflow-x: auto; }
    .lp-dor, .lp-solucao, .lp-feats, .lp-comp, .lp-stick, .lp-precos, .lp-depo, .lp-demo { padding: 64px 0; }
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", obras: "" });
  const [sent, setSent] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    salvarOrigemLead();
    analytics.landingView();
    const fn = () => setSolid(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  function handleDemo(e) {
    e.preventDefault();
    // Redireciona para WhatsApp com dados preenchidos
    const msg = encodeURIComponent(
      `Olá! Quero uma demonstração do StickFrame.\nNome: ${form.nome}\nE-mail: ${form.email}\nWhatsApp: ${form.whatsapp}\nObras/ano: ${form.obras}`
    );
    window.open(`https://wa.me/551140038929?text=${msg}`, "_blank");
    setSent(true);
  }

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* Nav */}
      <nav className={`lp-nav${solid ? " solid" : ""}`}>
        <div className="lp-wrap">
          <div className="lp-nav-in">
            <img src="/landing/assets/logo_branco.png" alt="StickFrame" className="lp-logo" />
            <div className="lp-nav-links">
              <a href="#solucao">Solução</a>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#comparativo">Comparativo</a>
              <a href="#precos">Preços</a>
              <a href="/login">Entrar</a>
              <a href="#demo" className="btn btn-outline-w" style={{ padding: "9px 20px", fontSize: 14 }}>Solicitar demonstração</a>
            </div>
            <button className="lp-burger" aria-label="Menu" onClick={() => setMenuOpen(true)}>
              <Ic.Menu />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`lp-m-menu${menuOpen ? " open" : ""}`}>
        <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 20, right: 24, background: "none", border: "none", cursor: "pointer", color: "#fff" }}>
          <Ic.Close />
        </button>
        {["#solucao|Solução", "#funcionalidades|Funcionalidades", "#comparativo|Comparativo", "#precos|Preços", "/login|Entrar"].map(s => {
          const [href, label] = s.split("|");
          return <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>;
        })}
        <a href="#demo" className="btn btn-brick" onClick={() => setMenuOpen(false)}>Solicitar demonstração</a>
      </div>

      {/* Hero */}
      <section className="lp-hero">
        <div className="ring" /><div className="ring2" />
        <div className="lp-wrap">
          <div className="lp-hero-in">
            <span className="eyebrow">StickFrame™ · Sistema de gestão</span>
            <h1>Controle custo, prazo e<br /><em>cliente em um</em><br />único fluxo</h1>
            <p className="h-sub">
              Empresas que usam StickQuote + Portal Cliente reduzem retrabalho e fecham mais obras. Do primeiro lead à entrega da chave, tudo conectado.
            </p>
            <div className="h-cta">
              <a href="/calcular" className="btn btn-white btn-lg"
                 onClick={() => analytics.ctaClicked("Calcular minha obra", "landing-hero")}>
                Calcular minha obra →
              </a>
              <a href="#solucao" className="btn btn-outline-w btn-lg"
                 onClick={() => analytics.ctaClicked("Ver como funciona", "landing-hero")}>
                Ver como funciona
              </a>
            </div>
            <p className="h-note">Sem cartão de crédito · 14 dias grátis · Configuração em minutos</p>
          </div>
        </div>
      </section>

      {/* Metrics bar */}
      <div className="lp-metrics">
        <div className="lp-wrap" style={{ padding: 0 }}>
          <div className="metrics-row">
            {METRICS.map(m => (
              <div className="metric" key={m.val}>
                <div className="metric-val">{m.val}</div>
                <div className="metric-lbl">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dor */}
      <section className="lp-dor">
        <div className="lp-wrap">
          <div className="sec-head">
            <span className="eyebrow">O problema</span>
            <h2>O que trava o crescimento da sua construtora</h2>
            <p>Steel Frame é rápido na obra — mas a gestão continua presa em planilhas, WhatsApp e retrabalho.</p>
          </div>
          <div className="dor-grid">
            {DORES.map(d => (
              <div className="dor-card" key={d.title}>
                <div className="dor-card">
                  <div className="d-ico"><Ic.X /></div>
                  <h3>{d.title}</h3>
                  <p>{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solução */}
      <section className="lp-solucao" id="solucao">
        <div className="lp-wrap">
          <div className="solucao-in">
            <div className="s-text">
              <span className="eyebrow" style={{ color: "var(--brick)" }}>A solução</span>
              <h2>Sua construtora não precisa de mais uma <em>planilha</em></h2>
              <p>O StickFrame conecta venda, obra e financeiro num único fluxo pensado para Steel Frame. Tudo conversa: o orçamento vira contrato, o contrato vira obra, a obra alimenta o caixa.</p>
              {[
                "Composições nativas de Steel Frame — perfis, painéis e quantitativos por m²",
                "Calculadora white-label que captura leads com a sua marca, 24h por dia",
                "Margem por obra em tempo real — orçado × comprado × medido, sempre conciliados",
              ].map(t => (
                <div className="sol-check" key={t}>
                  <span className="chk"><Ic.Check /></span>
                  {t}
                </div>
              ))}
              <a href="/cadastro" className="btn btn-brick" style={{ marginTop: 28 }}>Começar agora</a>
            </div>
            <div className="sol-mock">
              <div className="sol-mock-header">Obra · Residencial Recanto</div>
              <div className="sol-kpi-row">
                {[
                  { v: "72%",   l: "Avanço físico",      t: "▲ 8pp esta semana" },
                  { v: "24,3%", l: "Margem atual",        t: "▲ 1,2pp" },
                  { v: "+1,8%", l: "Desvio de orçamento", t: "Dentro do limite" },
                ].map(k => (
                  <div className="sol-kpi" key={k.l}>
                    <div className="kv">{k.v}</div>
                    <div className="kl">{k.l}</div>
                    <div className="kt">{k.t}</div>
                  </div>
                ))}
              </div>
              <div className="sol-bar-row">
                {[
                  { l: "Fundação",  p: 100, done: true },
                  { l: "Estrutura", p: 100, done: true },
                  { l: "Fechamento",p: 72,  done: false },
                  { l: "Instalações",p: 28, done: false },
                  { l: "Acabamento", p: 0,  done: false },
                ].map(b => (
                  <div className="sol-bar-item" key={b.l}>
                    <span>{b.l}</span>
                    <div className="sol-bar-track">
                      <div className={`sol-bar-fill${b.done ? " green" : ""}`} style={{ width: `${b.p}%` }} />
                    </div>
                    <span style={{ minWidth: 36, textAlign: "right", fontSize: 12 }}>{b.p}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="lp-feats" id="funcionalidades">
        <div className="lp-wrap">
          <div className="sec-head center">
            <span className="eyebrow">A plataforma</span>
            <h2>Do lead à chave, num fluxo só</h2>
            <p>Cada módulo resolve uma etapa da operação — e todos compartilham os mesmos dados.</p>
          </div>
          <div className="feat-grid">
            {FEATS.map(({ Icon, title, desc, badge }) => (
              <div className="feat" key={title}>
                {badge && <div className="f-badge">{badge}</div>}
                <div className="f-ic"><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparativo */}
      <section className="lp-comp" id="comparativo">
        <div className="lp-wrap">
          <div className="sec-head">
            <span className="eyebrow">Por que StickFrame</span>
            <h2>StickFrame vs. ERPs genéricos</h2>
            <p>Os grandes sistemas tentam servir qualquer construtora. O StickFrame foi feito para a sua.</p>
          </div>
          <table className="comp-table">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Recurso</th>
                <th className="sf-col" style={{ width: "25%", textAlign: "center" }}>StickFrame</th>
                <th style={{ width: "25%", textAlign: "center" }}>ERP genérico</th>
              </tr>
            </thead>
            <tbody>
              {COMPARATIVO.map(r => (
                <tr key={r.rec}>
                  <td>{r.rec}</td>
                  <td className="sf-col" style={{ textAlign: "center" }}>
                    <span className="ic-yes"><Ic.Check /></span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {r.erp === true
                      ? <span className="ic-yes"><Ic.Check /></span>
                      : r.erp === false
                      ? <span className="ic-no"><Ic.X /></span>
                      : <span className="ic-par">{r.erp}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Linha Stick™ */}
      <section className="lp-stick">
        <div className="lp-wrap">
          <div style={{ maxWidth: 640 }}>
            <span className="stick-eyebrow">Tecnologia proprietária</span>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "clamp(32px,4.5vw,52px)", lineHeight: 1.02 }}>
              A linha Stick™ que protege sua margem
            </h2>
            <p style={{ fontSize: 17, color: "var(--ink-2)", marginTop: 12 }}>
              Inteligência que não está em planilha nem em ERP genérico — só no StickFrame.
            </p>
          </div>
          <div className="stick-grid">
            {STICK_LINE.map(({ Icon, name, tag, desc }) => (
              <div className="stick-card" key={name}>
                <div className="st-ico"><Icon /></div>
                <div className="st-name">{name}</div>
                <div className="st-tag">{tag}</div>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section className="lp-precos" id="precos">
        <div className="lp-wrap">
          <PricingPlans />
        </div>
      </section>

      {/* Depoimentos */}
      <section className="lp-depo">
        <div className="lp-wrap">
          <div className="sec-head center">
            <span className="eyebrow">Depoimentos</span>
            <h2>Quem constrói com o StickFrame</h2>
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

      {/* Demo */}
      <section className="lp-demo" id="demo">
        <div className="lp-wrap">
          <div className="demo-in">
            <div>
              <span className="eyebrow" style={{ color: "#e08a84" }}>Demonstração</span>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "clamp(32px,4.5vw,52px)", lineHeight: 1.02, color: "#fff" }}>
                Veja o StickFrame rodando na sua operação
              </h2>
              <p style={{ fontSize: 16, color: "#9a948a", marginTop: 12, lineHeight: 1.7 }}>
                Agende uma demonstração guiada e descubra em 30 minutos como organizar venda, obra e financeiro num único lugar.
              </p>
              <div className="demo-bullets">
                {["30 min de demonstração guiada", "14 dias de teste grátis", "Sem cartão de crédito"].map(b => (
                  <div className="demo-bullet" key={b}><div className="d-dot" />{b}</div>
                ))}
              </div>
            </div>
            <div className="demo-form" ref={formRef}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Recebemos sua solicitação!</p>
                  <p style={{ color: "#9a948a", fontSize: 14 }}>Nossa equipe entra em contato em até 1 dia útil.</p>
                </div>
              ) : (
                <form onSubmit={handleDemo}>
                  <label>Nome</label>
                  <input required placeholder="Seu nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                  <label>E-mail</label>
                  <input required type="email" placeholder="seu@email.com.br" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <label>WhatsApp</label>
                  <input required placeholder="(11) 99999-9999" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                  <label>Obras por ano</label>
                  <select required value={form.obras} onChange={e => setForm(f => ({ ...f, obras: e.target.value }))}>
                    <option value="">Selecione</option>
                    {OBRAS_ANO.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <button type="submit" className="btn btn-brick" style={{ width: "100%", fontSize: 16, padding: "15px" }}>
                    Solicitar demonstração
                  </button>
                  <p className="form-note">Ao enviar você concorda com nossa Política de Privacidade.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-foot">
        <div className="lp-wrap">
          <div className="f-row">
            <div>
              <img src="/landing/assets/logo_branco.png" alt="StickFrame" className="lp-logo" />
              <div className="f-tag">A plataforma de gestão feita para construtoras de Steel Frame.</div>
            </div>
            <nav>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#comparativo">Comparativo</a>
              <a href="#precos">Preços</a>
              <a href="#demo">Demonstração</a>
              <a href="/calcular">Calculadora</a>
              <a href="/termos">Termos</a>
              <a href="/privacidade">Privacidade</a>
            </nav>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span className="f-copy">© {new Date().getFullYear()} StickFrame · Todos os direitos reservados</span>
            <span className="f-copy">Feito para quem constrói a seco.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
