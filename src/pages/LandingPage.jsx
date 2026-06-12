import { useState, useEffect } from "react";
import {
  Gauge, Brain, Home, DollarSign, Target, CalendarDays,
  PackageOpen, ClipboardCheck, Users, BarChart2,
  LayoutDashboard, Receipt, Clock, AlertTriangle, Smartphone,
  Play, ChevronDown,
} from "lucide-react";

// ─── Ecossistema — benefit-first copy ────────────────────────────────────────
const ECOSSISTEMA = [
  { Icon: Gauge,          brand: "StickScore™",   label: "Alerta de Estouro de Custo",  desc: "Nota de 0 a 100 que avisa em tempo real se sua obra vai dar prejuízo. Baseado em compra, desvio de cronograma e mão de obra." },
  { Icon: Brain,          brand: "StickBrain™",   label: "IA de Precificação",           desc: "Sugere preço de material baseado no seu histórico e cotações da região. Acerta a margem sem chutar." },
  { Icon: Home,           brand: "StickView™",    label: "Portal do Cliente",            desc: "Seu cliente acompanha a obra com sua marca. Aprova documentos e recebe atualizações — sem acessar o sistema interno." },
  { Icon: DollarSign,     brand: "StickCash™",    label: "Financeiro por Obra",          desc: "Fluxo de caixa, margem real e alertas de desvio orçamentário. Sabe exatamente se a obra está dando lucro." },
  { Icon: Target,         brand: "StickLead™",    label: "CRM de Clientes",              desc: "Pipeline comercial desde a prospecção até a obra concluída. Nunca mais perde lead por falta de follow-up." },
  { Icon: CalendarDays,   brand: "StickPlan™",    label: "Cronograma Inteligente",       desc: "Marcos, fases e alertas de atraso em tempo real. Equipe toda na mesma página, sem reunião toda semana." },
  { Icon: PackageOpen,    brand: "StickSupply™",  label: "Almoxarifado Digital",         desc: "Compras, estoque e pedidos centralizados. Acaba com o material sumindo da obra sem registro." },
  { Icon: ClipboardCheck, brand: "StickInspect™", label: "Qualidade & Vistoria",         desc: "Fichas de verificação, não-conformidades e rastreabilidade completa. Entrega obra com laudo na mão." },
  { Icon: Users,          brand: "StickTeam™",    label: "Gestão de Equipe",             desc: "Ponto, check-ins em obra e escala de trabalho. Sabe quem está onde, sem depender de WhatsApp." },
  { Icon: BarChart2,      brand: "StickPulse™",   label: "Analytics Executivo",          desc: "VGV, margens e performance de toda a empresa num painel. Toma decisão com dado, não com feeling." },
];

// ─── Dores → Solução ─────────────────────────────────────────────────────────
const DORES = [
  {
    Icon: Clock,
    dor: "Demora pra orçar",
    problema: "Você leva 2 dias pra responder o cliente. Ele fecha com outro.",
    solucao: "Orçamento completo em 5min, com lista de material e preço atualizado. PDF com sua logo na hora.",
  },
  {
    Icon: AlertTriangle,
    dor: "Obra estoura o custo",
    problema: "Descobre o prejuízo só no final da obra, quando já é tarde.",
    solucao: "Alerta de Estouro mostra a nota da obra de 0 a 100. Previne antes de acontecer.",
  },
  {
    Icon: Smartphone,
    dor: "Equipe perdida",
    problema: "WhatsApp, papel, Excel. Ninguém sabe o que fazer.",
    solucao: "App único pro engenheiro, mestre e cliente. Cronograma e diário de obra no bolso.",
  },
];

// ─── Planos ───────────────────────────────────────────────────────────────────
const PLANOS = [
  {
    key: "essencial", nome: "Essencial", preco: "R$ 97", periodo: "/mês",
    desc: "Pra começar com o pé direito",
    items: ["3 obras ativas", "2 usuários", "Orçamentos e diário de obra", "Calculadora pro seu site", "Suporte por e-mail"],
    cta: "Começar grátis", href: "/cadastro?plan=essencial", hot: false,
  },
  {
    key: "profissional", nome: "Profissional", preco: "R$ 197", periodo: "/mês",
    desc: "Pra construtoras em crescimento",
    items: ["Tudo do Essencial +", "Obras ilimitadas", "Até 10 usuários", "CRM de clientes", "Relatórios PDF com sua logo", "Medições & contratos", "Alerta de Estouro de Custo", "Suporte prioritário no WhatsApp"],
    cta: "Testar 14 dias grátis →", href: "/cadastro?plan=profissional", hot: true, tag: "Mais popular",
  },
  {
    key: "construtora", nome: "Construtora+", preco: "Sob consulta", periodo: "",
    desc: "Pra grandes operações",
    items: ["Tudo do Profissional +", "Usuários ilimitados", "API e integrações", "Onboarding com engenheiro", "SLA de suporte"],
    cta: "Falar com especialista", href: "https://wa.me/551140038929?text=Ol%C3%A1%2C+tenho+interesse+no+plano+Construtora%2B+do+StickFrame", hot: false,
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ = [
  ["Precisa de cartão pra testar?", "Não. 14 dias 100% grátis no Profissional. Sem cartão, sem compromisso."],
  ["Funciona sem internet?", "Sim. Lança os dados offline, sincroniza quando voltar o 4G."],
  ["E se eu cancelar?", "Clica em cancelar. Sem multa, sem fidelidade. Seus dados ficam salvos por 90 dias."],
  ["Já uso planilha. Por que mudar?", "Planilha não te avisa quando a obra vai estourar. O StickScore faz isso."],
];

// ─── Depoimentos ─────────────────────────────────────────────────────────────
const DEPOIMENTOS = [
  { text: "Reduzi 6h de retrabalho por obra. Paguei o StickFrame no primeiro orçamento.", nome: "Rafael Souza", cargo: "JM Construtora · Curitiba", ini: "RS" },
  { text: "A calculadora white-label foi um divisor de águas. Meus clientes chegam à reunião já convencidos.", nome: "Ana Lima", cargo: "Arquiteta · Belo Horizonte", ini: "AL" },
  { text: "O StickScore me avisou que a obra ia estourar 3 semanas antes. Salvou R$ 40 mil.", nome: "Carlos Melo", cargo: "Construtor · São Paulo", ini: "CM" },
];

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700&display=swap');
  :root {
    --brick:#981915; --brick-dk:#7d1411; --brick-soft:#f3e7e5;
    --graphite:#2b2b2e; --graphite-2:#232225;
    --ink:#26231f; --ink-2:#57514a; --muted:#8c847a;
    --line:#e7e1d8; --line-2:#efeae2;
    --bg:#f4f1ec; --surface:#ffffff; --surface-2:#faf8f4;
    --sage:#4f7d57;
  }
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: var(--ink); background: var(--bg); font-size: 16px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .lp img { display: block; max-width: 100%; }
  .lp a { text-decoration: none; transition: opacity .15s; }
  .lp a:hover { opacity: .85; }
  .lp-wrap { max-width: 1180px; margin: 0 auto; padding: 0 40px; }

  /* Buttons */
  .lp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px; font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 15px; padding: 13px 24px; border-radius: 10px; cursor: pointer; border: 1.5px solid transparent; white-space: nowrap; transition: .15s; text-decoration: none; }
  .lp-btn-lg { padding: 16px 30px; font-size: 16.5px; border-radius: 12px; }
  .lp-btn-brick { background: var(--brick); color: #fff; border-color: var(--brick); }
  .lp-btn-brick:hover { background: var(--brick-dk); border-color: var(--brick-dk); opacity: 1; }
  .lp-btn-white { background: #fff; color: var(--brick); }
  .lp-btn-white:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.18); opacity: 1; }
  .lp-btn-outline-w { background: transparent; color: #fff; border-color: rgba(255,255,255,.4); }
  .lp-btn-outline-w:hover { border-color: #fff; background: rgba(255,255,255,.07); opacity: 1; }
  .lp-btn-outline { background: transparent; color: var(--ink); border-color: var(--line); }
  .lp-btn-outline:hover { border-color: var(--muted); opacity: 1; }

  /* Nav */
  .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: background .25s, box-shadow .25s; }
  .lp-nav.solid { background: var(--brick-dk); box-shadow: 0 4px 24px rgba(40,10,8,.3); }
  .lp-nav-in { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
  .lp-nav .lp-logo { height: 34px; }
  .lp-nav-links { display: flex; align-items: center; gap: 28px; font-size: 14.5px; font-weight: 600; color: #fff; }
  .lp-nav-links a { color: inherit; opacity: .85; }
  .lp-nav-links a:hover { opacity: 1; }

  /* Hero */
  .lp-hero { background: linear-gradient(165deg,#a51d18 0%,#981915 45%,#7d1411 100%); position: relative; overflow: hidden; color: #fff; padding: 150px 0 110px; }
  .lp-hero .ring  { position: absolute; right: -120px; top: -120px; width: 460px; height: 460px; border: 54px solid rgba(255,255,255,.05); border-radius: 50%; pointer-events: none; }
  .lp-hero .ring2 { position: absolute; left: -160px; bottom: -200px; width: 380px; height: 380px; border: 44px solid rgba(0,0,0,.07); border-radius: 50%; pointer-events: none; }
  .lp-hero-in { position: relative; max-width: 780px; }
  .lp-eyebrow { font-size: 12.5px; font-weight: 800; letter-spacing: 2.4px; text-transform: uppercase; }
  .lp-hero .lp-eyebrow { color: rgba(255,255,255,.65); }
  .lp-hero h1 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(42px,7vw,80px); color: #fff; margin: 18px 0 0; line-height: 1.0; letter-spacing: .5px; }
  .lp-hero .h-sub { font-size: 18px; color: rgba(255,255,255,.82); max-width: 580px; margin: 20px 0 0; line-height: 1.65; }
  .lp-hero .h-cta { display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; align-items: center; }
  .lp-hero .h-note { font-size: 13px; color: rgba(255,255,255,.5); margin-top: 14px; }
  .lp-hero .h-video { display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,.75); font-size: 14px; font-weight: 600; cursor: pointer; border: none; background: none; padding: 0; font-family: inherit; }
  .lp-hero .h-video:hover { color: #fff; }
  .lp-hero .h-video .play-ring { width: 38px; height: 38px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.4); display: flex; align-items: center; justify-content: center; }

  /* Social proof bar */
  .lp-proof { background: var(--graphite); padding: 28px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
  .lp-proof-in { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
  .lp-proof-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .lp-proof-stat .val { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 700; color: #fff; }
  .lp-proof-stat .lbl { font-size: 11px; color: #9a948a; letter-spacing: .5px; }
  .lp-proof-div { width: 1px; height: 40px; background: rgba(255,255,255,.1); }
  .lp-proof-quote { flex: 1; min-width: 260px; font-size: 14px; color: #cfc9c0; line-height: 1.55; font-style: italic; }
  .lp-proof-quote strong { color: #fff; font-style: normal; }

  /* Dores */
  .lp-dores { padding: 80px 0; background: var(--surface); }
  .lp-sec-head { margin-bottom: 48px; }
  .lp-sec-head .lp-eyebrow { color: var(--brick); display: block; margin-bottom: 12px; }
  .lp-sec-head h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(32px,4.5vw,46px); line-height: 1.02; color: var(--ink); }
  .lp-sec-head p { font-size: 17px; color: var(--ink-2); margin-top: 12px; max-width: 560px; }
  .lp-sec-head.center { text-align: center; margin-left: auto; margin-right: auto; }
  .lp-sec-head.center p { margin-left: auto; margin-right: auto; }
  .lp-dores-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .lp-dor { background: var(--surface-2); border: 1px solid var(--line); border-radius: 16px; padding: 28px 26px; }
  .lp-dor .d-icon { width: 44px; height: 44px; border-radius: 11px; background: var(--brick-soft); color: var(--brick); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .lp-dor .d-title { font-size: 17px; font-weight: 800; color: var(--ink); margin-bottom: 8px; }
  .lp-dor .d-problema { font-size: 14px; color: var(--muted); line-height: 1.55; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
  .lp-dor .d-label { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--brick); margin-bottom: 6px; }
  .lp-dor .d-solucao { font-size: 14px; color: var(--ink); line-height: 1.55; font-weight: 500; }

  /* Features — graphite band */
  .lp-feats { background: var(--graphite-2); padding: 96px 0; color: #fff; }
  .lp-feats .lp-sec-head .lp-eyebrow { color: #e08a84; }
  .lp-feats .lp-sec-head h2 { color: #fff; }
  .lp-feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .lp-feat { background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 26px 26px 28px; transition: border-color .2s, transform .2s; }
  .lp-feat:hover { border-color: rgba(255,255,255,.25); transform: translateY(-3px); }
  .lp-feat .f-ic { width: 44px; height: 44px; border-radius: 11px; background: rgba(152,25,21,.32); color: #e8918c; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .lp-feat h3 { font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 2px; }
  .lp-feat .f-lbl { font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #e08a84; margin-bottom: 8px; }
  .lp-feat p { font-size: 13.5px; color: #b8b1a6; line-height: 1.55; }

  /* Browser mockup */
  .lp-produto { padding: 96px 0 0; }
  .lp-browser { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 2px 4px rgba(40,30,20,.05),0 12px 32px rgba(40,30,20,.09); overflow: hidden; }
  .lp-browser .b-bar { display: flex; align-items: center; gap: 7px; padding: 11px 16px; border-bottom: 1px solid var(--line-2); background: var(--surface-2); }
  .lp-browser .b-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--line); flex-shrink: 0; }
  .lp-browser .b-url { margin-left: 10px; flex: 1; max-width: 340px; background: var(--surface); border: 1px solid var(--line-2); border-radius: 6px; font-size: 11.5px; color: var(--muted); padding: 4px 12px; }
  .lp-prints-sub { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
  .lp-print-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 2px rgba(40,30,20,.05); }
  .lp-print-cap { font-size: 13px; font-weight: 700; color: var(--ink-2); padding: 13px 18px; border-top: 1px solid var(--line-2); display: flex; align-items: center; gap: 9px; }

  /* Plans */
  .lp-precos { padding: 96px 0 48px; }
  .lp-plans { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; align-items: stretch; }
  .lp-plan { background: var(--surface); border: 1.5px solid var(--line); border-radius: 18px; padding: 30px 28px; display: flex; flex-direction: column; position: relative; }
  .lp-plan.hot { background: var(--graphite); border-color: var(--graphite); color: #fff; }
  .lp-plan .p-tag { position: absolute; top: -12px; left: 28px; background: var(--brick); color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; }
  .lp-plan .p-nm { font-size: 15px; font-weight: 800; }
  .lp-plan .p-ds { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .lp-plan.hot .p-ds { color: #9a948a; }
  .lp-plan .p-pr { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 46px; margin: 20px 0 2px; line-height: 1; }
  .lp-plan .p-pr small { font-size: 15px; font-family: 'Hanken Grotesk', sans-serif; font-weight: 600; color: var(--muted); }
  .lp-plan.hot .p-pr small { color: #9a948a; }
  .lp-plan .p-trial { font-size: 12px; color: var(--sage); font-weight: 700; margin-bottom: 4px; }
  .lp-plan.hot .p-trial { color: #7fb389; }
  .lp-plan ul { list-style: none; margin: 18px 0 24px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
  .lp-plan li { display: flex; gap: 10px; font-size: 13.5px; color: var(--ink-2); align-items: flex-start; }
  .lp-plan.hot li { color: #cfc9c0; }
  .lp-plan li .chk { color: var(--sage); flex-shrink: 0; }
  .lp-plan.hot li .chk { color: #7fb389; }
  .lp-plan .lp-btn { width: 100%; }

  /* Testimonials */
  .lp-depo { padding: 48px 0; }
  .lp-quotes { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .lp-quote { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 26px; display: flex; flex-direction: column; }
  .lp-quote .q-mark { font-family: 'Barlow Condensed', sans-serif; font-size: 44px; font-weight: 700; color: var(--brick); line-height: .6; margin-bottom: 14px; }
  .lp-quote p { font-size: 14.5px; color: var(--ink-2); line-height: 1.6; flex: 1; }
  .lp-quote .q-who { display: flex; align-items: center; gap: 11px; margin-top: 20px; }
  .lp-quote .q-av { width: 38px; height: 38px; border-radius: 10px; background: var(--brick-soft); color: var(--brick); font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-quote .q-nm { font-size: 13.5px; font-weight: 700; color: var(--ink); }
  .lp-quote .q-rl { font-size: 12px; color: var(--muted); }

  /* FAQ */
  .lp-faq { padding: 64px 0; background: var(--surface); }
  .lp-faq-list { max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }
  .lp-faq-item { border-bottom: 1px solid var(--line); }
  .lp-faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 0; background: none; border: none; font-family: inherit; font-size: 15px; font-weight: 700; color: var(--ink); cursor: pointer; text-align: left; }
  .lp-faq-q svg { flex-shrink: 0; color: var(--muted); transition: transform .2s; }
  .lp-faq-q.open svg { transform: rotate(180deg); }
  .lp-faq-a { font-size: 14px; color: var(--ink-2); line-height: 1.7; padding-bottom: 18px; }

  /* CTA calcband */
  .lp-calcsec { padding: 48px 0 32px; }
  .lp-calcband { border-radius: 22px; padding: 54px 60px; display: flex; align-items: center; justify-content: space-between; gap: 40px; position: relative; overflow: hidden; background: var(--graphite); color: #fff; }
  .lp-calcband::after { content: ""; position: absolute; right: -60px; top: -60px; width: 300px; height: 300px; border: 38px solid rgba(255,255,255,.06); border-radius: 50%; pointer-events: none; }
  .lp-calcband h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(30px,4vw,42px); line-height: 1.05; position: relative; }
  .lp-calcband p { font-size: 15px; opacity: .8; margin-top: 10px; max-width: 440px; position: relative; }
  .lp-calcband .lp-btn { position: relative; flex-shrink: 0; }

  /* Closing CTA */
  .lp-close { padding: 80px 0; text-align: center; background: var(--bg); }
  .lp-close h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(34px,5vw,52px); line-height: 1.02; color: var(--ink); max-width: 700px; margin: 0 auto 16px; }
  .lp-close p { font-size: 16px; color: var(--muted); margin-bottom: 32px; }
  .lp-close .h-note { font-size: 13px; color: var(--muted); margin-top: 14px; }

  /* Footer */
  .lp-foot { background: var(--graphite-2); color: #9a948a; padding: 46px 0 38px; font-size: 13px; }
  .lp-foot .f-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .lp-foot .lp-logo { height: 30px; }
  .lp-foot nav { display: flex; gap: 24px; flex-wrap: wrap; }
  .lp-foot a { color: inherit; }
  .lp-foot a:hover { color: #fff; opacity: 1; }

  /* Mobile */
  @media (max-width: 860px) {
    .lp-wrap { padding: 0 22px; }
    .lp-nav-links { display: none; }
    .lp-hero { padding: 120px 0 72px; }
    .lp-hero .h-cta .lp-btn { flex: 1 1 100%; }
    .lp-hero .h-video { justify-content: center; }
    .lp-proof-in { justify-content: center; }
    .lp-proof-div { display: none; }
    .lp-dores-grid, .lp-feat-grid, .lp-plans, .lp-quotes, .lp-prints-sub { grid-template-columns: 1fr; }
    .lp-calcband { flex-direction: column; align-items: flex-start; padding: 36px 26px; }
    .lp-calcband .lp-btn { width: 100%; }
    .lp-calcsec { padding-bottom: 32px; }
    .lp-dores, .lp-produto, .lp-precos { padding-top: 64px; }
    .lp-feats { padding: 64px 0; }
    .lp-foot .f-row { flex-direction: column; align-items: flex-start; gap: 18px; }
  }
`;

// ─── FAQ item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-faq-item">
      <button className={`lp-faq-q${open ? " open" : ""}`} onClick={() => setOpen(!open)}>
        {q}
        <ChevronDown size={18} />
      </button>
      {open && <div className="lp-faq-a">{a}</div>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const fn = () => setSolid(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* ── Nav ── */}
      <nav className={`lp-nav${solid ? " solid" : ""}`}>
        <div className="lp-wrap">
          <div className="lp-nav-in">
            <img src="/landing/assets/logo_branco.png" alt="StickFrame" className="lp-logo" />
            <div className="lp-nav-links">
              <a href="#dores">Por que StickFrame</a>
              <a href="#produto">Produto</a>
              <a href="#precos">Preços</a>
              <a href="/cadastro?plan=profissional" className="lp-btn lp-btn-brick" style={{ padding: "9px 18px", fontSize: 14 }}>
                Testar 14 dias grátis
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="ring" />
        <div className="ring2" />
        <div className="lp-wrap">
          <div className="lp-hero-in">
            <span className="lp-eyebrow">Plataforma para construtoras de steel frame</span>
            <h1>Faça orçamento de steel frame em 5min. Direto do canteiro.</h1>
            <p className="h-sub">
              Chega de perder obra porque demorou 2 dias pra mandar preço. O StickFrame
              calcula material, mão de obra e margem na hora. PDF com sua logo pra mandar pro cliente.
            </p>
            <div className="h-cta">
              <a href="/cadastro?plan=profissional" className="lp-btn lp-btn-white lp-btn-lg">
                Testar 14 dias grátis →
              </a>
              <a href="#produto" className="lp-btn lp-btn-outline-w lp-btn-lg">
                <Play size={15} /> Ver o produto em 90s
              </a>
            </div>
            <p className="h-note">Sem cartão de crédito · Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="lp-proof">
        <div className="lp-wrap">
          <div className="lp-proof-in">
            <div className="lp-proof-stat">
              <span className="val">+80</span>
              <span className="lbl">construtoras ativas</span>
            </div>
            <div className="lp-proof-div" />
            <div className="lp-proof-stat">
              <span className="val">5min</span>
              <span className="lbl">pra fechar orçamento</span>
            </div>
            <div className="lp-proof-div" />
            <div className="lp-proof-stat">
              <span className="val">40%</span>
              <span className="lbl">menos retrabalho</span>
            </div>
            <div className="lp-proof-div" />
            <p className="lp-proof-quote">
              <strong>"Reduzi 6h de retrabalho por obra.</strong> Paguei o StickFrame no primeiro orçamento." — Rafael S., JM Construtora · Curitiba
            </p>
          </div>
        </div>
      </section>

      {/* ── Dores → Solução ── */}
      <section className="lp-dores" id="dores">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <span className="lp-eyebrow">Por que mudar</span>
            <h2>Cansado de planilha e retrabalho?</h2>
          </div>
          <div className="lp-dores-grid">
            {DORES.map(({ Icon, dor, problema, solucao }) => (
              <div className="lp-dor" key={dor}>
                <div className="d-icon"><Icon size={20} /></div>
                <div className="d-title">{dor}</div>
                <div className="d-problema">{problema}</div>
                <div className="d-label">StickFrame resolve</div>
                <div className="d-solucao">{solucao}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ecossistema Stick™ — graphite band ── */}
      <section className="lp-feats" id="funcionalidades">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <span className="lp-eyebrow">Ecossistema Stick™</span>
            <h2>Uma suíte completa pra não usar<br />5 apps diferentes</h2>
            <p style={{ color: "#b8b1a6" }}>Cada módulo tem identidade, metodologia e propósito próprios.</p>
          </div>
          <div className="lp-feat-grid">
            {ECOSSISTEMA.map(({ Icon, brand, label, desc }) => (
              <div className="lp-feat" key={brand}>
                <div className="f-ic"><Icon size={22} /></div>
                <h3>{brand}</h3>
                <div className="f-lbl">{label}</div>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Produto — browser mockup ── */}
      <section className="lp-produto" id="produto">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <span className="lp-eyebrow">O produto</span>
            <h2>Projetado pro chão de obra,<br />não pra sala de reunião</h2>
            <p>Interface limpa, funciona no 4G, dados em tempo real.</p>
          </div>
          <div className="lp-browser">
            <div className="b-bar">
              <span className="b-dot" />
              <span className="b-dot" />
              <span className="b-dot" />
              <span className="b-url">app.stickframe.com.br/dashboard</span>
            </div>
            <img src="/landing/prints/dashboard.webp" alt="Dashboard StickFrame" style={{ width: "100%" }} />
          </div>
          <div className="lp-prints-sub">
            <div className="lp-print-card">
              <img src="/landing/prints/financeiro.webp" alt="Financeiro" />
              <div className="lp-print-cap"><DollarSign size={15} color="var(--brick)" />Financeiro por Obra</div>
            </div>
            <div className="lp-print-card">
              <img src="/landing/prints/orcamentos.webp" alt="Orçamentos" />
              <div className="lp-print-cap"><Receipt size={15} color="var(--brick)" />Orçamentos & PDF</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Preços ── */}
      <section className="lp-precos" id="precos">
        <div className="lp-wrap">
          <div className="lp-sec-head center">
            <span className="lp-eyebrow">Planos</span>
            <h2>Comece grátis. Escale quando fizer sentido.</h2>
            <p>14 dias de teste no Profissional. Sem cartão, sem compromisso.</p>
          </div>
          <div className="lp-plans">
            {PLANOS.map((pl) => (
              <div className={`lp-plan${pl.hot ? " hot" : ""}`} key={pl.key}>
                {pl.tag && <div className="p-tag">{pl.tag}</div>}
                <div className="p-nm">{pl.nome}</div>
                <div className="p-ds">{pl.desc}</div>
                <div className="p-pr">
                  {pl.preco}{pl.periodo && <small>{pl.periodo}</small>}
                </div>
                {pl.hot && <div className="p-trial">✓ 14 dias grátis para testar</div>}
                <ul>
                  {pl.items.map((it) => (
                    <li key={it}><span className="chk">✓</span>{it}</li>
                  ))}
                </ul>
                <a href={pl.href} className={`lp-btn ${pl.hot ? "lp-btn-brick" : "lp-btn-outline"}`}>
                  {pl.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section className="lp-depo">
        <div className="lp-wrap">
          <div className="lp-sec-head center">
            <span className="lp-eyebrow">Depoimentos</span>
            <h2>Quem já trocou planilha por StickFrame</h2>
          </div>
          <div className="lp-quotes">
            {DEPOIMENTOS.map((d) => (
              <div className="lp-quote" key={d.nome}>
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

      {/* ── FAQ ── */}
      <section className="lp-faq">
        <div className="lp-wrap">
          <div className="lp-sec-head center">
            <span className="lp-eyebrow">Dúvidas frequentes</span>
            <h2>Mata objeção antes de fechar</h2>
          </div>
          <div className="lp-faq-list">
            {FAQ.map(([q, a]) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── Calculadora CTA ── */}
      <section className="lp-calcsec">
        <div className="lp-wrap">
          <div className="lp-calcband">
            <div>
              <h2>Calcule o custo da sua<br />próxima obra agora</h2>
              <p>
                Nossa calculadora gratuita estima o investimento em steel frame
                por padrão de acabamento, em segundos. A gente te manda o resultado por e-mail.
              </p>
            </div>
            <a href="/calcular" className="lp-btn lp-btn-brick lp-btn-lg">
              Usar a calculadora →
            </a>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="lp-close">
        <div className="lp-wrap">
          <h2>Pare de apagar incêndio.<br />Comece a dar lucro por obra.</h2>
          <p>+80 construtoras já trocam planilha por 5min de orçamento.</p>
          <a href="/cadastro?plan=profissional" className="lp-btn lp-btn-brick lp-btn-lg">
            Testar 14 dias grátis no Profissional →
          </a>
          <p className="h-note">Sem cartão de crédito · Cancele em 1 clique</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-foot">
        <div className="lp-wrap">
          <div className="f-row">
            <img src="/landing/assets/logo_branco.png" alt="StickFrame" className="lp-logo" />
            <nav>
              <a href="#dores">Por que StickFrame</a>
              <a href="#precos">Preços</a>
              <a href="/calcular">Calculadora</a>
              <a href="mailto:oi@stickframe.com.br">Contato</a>
            </nav>
            <span>© {new Date().getFullYear()} StickFrame · Todos os direitos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
