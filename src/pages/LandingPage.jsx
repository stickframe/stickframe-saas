import { useState, useEffect } from "react";
import { Gauge, Brain, Home, DollarSign, Target, CalendarDays, PackageOpen, ClipboardCheck, Users, BarChart2, LayoutDashboard, Receipt } from "lucide-react";

const ECOSSISTEMA = [
  { Icon: Gauge,          brand: "StickScore™",   label: "Saúde da Obra",            desc: "Índice proprietário que mede a performance de cada obra em tempo real — num único número de 0 a 100." },
  { Icon: Brain,          brand: "StickBrain™",   label: "Inteligência Artificial",  desc: "Motor de IA do StickFrame. Detecta riscos, sugere ações e gera análises automáticas da obra." },
  { Icon: Home,           brand: "StickView™",    label: "Portal do Cliente",        desc: "Espaço exclusivo para o cliente acompanhar o progresso da obra e aprovar documentos." },
  { Icon: DollarSign,     brand: "StickCash™",    label: "Financeiro",               desc: "Receitas e despesas por obra. Fluxo de caixa, margem real e alertas de desvio orçamentário." },
  { Icon: Target,         brand: "StickLead™",    label: "CRM / Clientes",           desc: "Gestão de leads, pipeline comercial e relacionamento da prospecção até a obra concluída." },
  { Icon: CalendarDays,   brand: "StickPlan™",    label: "Cronograma",               desc: "Planejamento e acompanhamento do cronograma. Marcos, fases e alertas de atraso em tempo real." },
  { Icon: PackageOpen,    brand: "StickSupply™",  label: "Almoxarifado",             desc: "Compras, suprimentos e estoque. Gestão de pedidos, fornecedores e movimentação de materiais." },
  { Icon: ClipboardCheck, brand: "StickInspect™", label: "Qualidade / FVS",          desc: "Vistorias, fichas de verificação e não-conformidades. Rastreabilidade completa da qualidade." },
  { Icon: Users,          brand: "StickTeam™",    label: "Equipe",                   desc: "Colaboradores, ponto, check-ins em obra e controle de escala e produtividade." },
  { Icon: BarChart2,      brand: "StickPulse™",   label: "Analytics",                desc: "Dashboard executivo com indicadores consolidados — VGV, margens, performance e tendências." },
];

const PRINTS = [
  { src: "/landing/prints/dashboard.webp",  label: "Dashboard",  Icon: LayoutDashboard },
  { src: "/landing/prints/financeiro.webp", label: "Financeiro", Icon: DollarSign },
  { src: "/landing/prints/orcamentos.webp", label: "Orçamentos", Icon: Receipt },
];

const PLANOS = [
  {
    key: "essencial", nome: "Essencial", preco: "R$ 97", periodo: "/mês",
    desc: "Para começar com o pé direito",
    items: ["3 obras ativas", "2 usuários", "Orçamentos básicos", "Diário de obra", "Calculadora white-label"],
    cta: "Começar agora", href: "/cadastro?plan=essencial", hot: false,
  },
  {
    key: "profissional", nome: "Profissional", preco: "R$ 197", periodo: "/mês",
    desc: "Para construtoras em crescimento",
    items: ["Obras ilimitadas", "Até 10 usuários", "CRM de clientes", "Relatórios PDF", "Medições & contratos", "StickScore™", "Suporte prioritário"],
    cta: "Assinar Profissional", href: "/cadastro?plan=profissional", hot: true, tag: "Mais popular",
  },
  {
    key: "construtora", nome: "Construtora+", preco: "Sob consulta", periodo: "",
    desc: "Para grandes construtoras",
    items: ["Tudo do Profissional", "Usuários ilimitados", "Multi-empresa", "White-label total", "SLA garantido", "Onboarding dedicado"],
    cta: "Falar com consultor", href: "https://wa.me/551140038929?text=Ol%C3%A1%2C+tenho+interesse+no+plano+Construtora%2B+do+StickFrame", hot: false,
  },
];

const DEPOIMENTOS = [
  {
    text: "Antes eu gastava horas em planilhas. Hoje o StickFrame faz tudo automaticamente e ainda me mostra onde estou perdendo dinheiro.",
    nome: "Rafael Souza", cargo: "Eng. Civil · São Paulo", ini: "RS",
  },
  {
    text: "A calculadora white-label foi um divisor de águas. Meus clientes calculam o custo online e chegam à reunião já convencidos.",
    nome: "Ana Lima", cargo: "Arquiteta · Belo Horizonte", ini: "AL",
  },
  {
    text: "O StickScore™ me deu uma visão que eu nunca tive antes. Consigo ver o risco de cada obra antes de virar um problema.",
    nome: "Carlos Melo", cargo: "Construtor · Curitiba", ini: "CM",
  },
];

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
  .lp a:hover { opacity: .8; }
  .lp-wrap { max-width: 1180px; margin: 0 auto; padding: 0 40px; }

  .lp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px; font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 15px; padding: 13px 24px; border-radius: 10px; cursor: pointer; border: 1.5px solid transparent; white-space: nowrap; transition: .15s; text-decoration: none; }
  .lp-btn-lg { padding: 16px 30px; font-size: 16.5px; border-radius: 12px; }
  .lp-btn-brick { background: var(--brick); color: #fff; }
  .lp-btn-brick:hover { background: var(--brick-dk); opacity: 1; }
  .lp-btn-white { background: #fff; color: var(--brick); }
  .lp-btn-white:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.18); opacity: 1; }
  .lp-btn-outline-w { background: transparent; color: #fff; border-color: rgba(255,255,255,.4); }
  .lp-btn-outline-w:hover { border-color: #fff; background: rgba(255,255,255,.07); opacity: 1; }
  .lp-btn-outline { background: transparent; color: var(--ink); border-color: var(--line); }
  .lp-btn-outline:hover { border-color: var(--muted); opacity: 1; }

  .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: background .25s, box-shadow .25s; }
  .lp-nav.solid { background: var(--brick-dk); box-shadow: 0 4px 24px rgba(40,10,8,.3); }
  .lp-nav-in { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
  .lp-nav .lp-logo { height: 34px; }
  .lp-nav-links { display: flex; align-items: center; gap: 28px; font-size: 14.5px; font-weight: 600; color: #fff; }
  .lp-nav-links a { color: inherit; opacity: .85; }
  .lp-nav-links a:hover { opacity: 1; }

  .lp-hero { background: linear-gradient(165deg,#a51d18 0%,#981915 45%,#7d1411 100%); position: relative; overflow: hidden; color: #fff; padding: 150px 0 110px; }
  .lp-hero .ring  { position: absolute; right: -120px; top: -120px; width: 460px; height: 460px; border: 54px solid rgba(255,255,255,.05); border-radius: 50%; pointer-events: none; }
  .lp-hero .ring2 { position: absolute; left: -160px; bottom: -200px; width: 380px; height: 380px; border: 44px solid rgba(0,0,0,.07); border-radius: 50%; pointer-events: none; }
  .lp-hero-in { position: relative; max-width: 860px; }
  .lp-eyebrow { font-size: 12.5px; font-weight: 800; letter-spacing: 2.4px; text-transform: uppercase; }
  .lp-hero .lp-eyebrow { color: rgba(255,255,255,.65); }
  .lp-hero h1 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(56px,9vw,96px); color: #fff; text-transform: uppercase; margin: 20px 0 0; letter-spacing: 1px; line-height: .98; }
  .lp-hero .h-sub { font-size: 18.5px; color: rgba(255,255,255,.82); max-width: 560px; margin: 24px 0 0; line-height: 1.6; }
  .lp-hero .h-cta { display: flex; gap: 12px; margin-top: 36px; flex-wrap: wrap; }
  .lp-hero .h-note { font-size: 13px; color: rgba(255,255,255,.55); margin-top: 18px; }

  .lp-sec-head { margin-bottom: 48px; }
  .lp-sec-head .lp-eyebrow { color: var(--brick); display: block; margin-bottom: 12px; }
  .lp-sec-head h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(34px,4.5vw,46px); line-height: 1.02; color: var(--ink); }
  .lp-sec-head p { font-size: 17px; color: var(--ink-2); margin-top: 12px; max-width: 560px; }
  .lp-sec-head.center { text-align: center; margin-left: auto; margin-right: auto; }
  .lp-sec-head.center p { margin-left: auto; margin-right: auto; }

  .lp-feats { background: var(--graphite-2); padding: 96px 0; color: #fff; }
  .lp-feats .lp-sec-head .lp-eyebrow { color: #e08a84; }
  .lp-feats .lp-sec-head h2 { color: #fff; }
  .lp-feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .lp-feat { background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 26px 26px 28px; transition: border-color .2s, transform .2s; }
  .lp-feat:hover { border-color: rgba(255,255,255,.25); transform: translateY(-3px); }
  .lp-feat .f-ic { width: 44px; height: 44px; border-radius: 11px; background: rgba(152,25,21,.32); color: #e8918c; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .lp-feat h3 { font-size: 17.5px; font-weight: 800; color: #fff; margin-bottom: 2px; }
  .lp-feat .f-lbl { font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #e08a84; margin-bottom: 9px; }
  .lp-feat p { font-size: 14px; color: #b8b1a6; line-height: 1.55; }

  .lp-produto { padding: 96px 0 0; }
  .lp-browser { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 2px 4px rgba(40,30,20,.05),0 12px 32px rgba(40,30,20,.09); overflow: hidden; }
  .lp-browser .b-bar { display: flex; align-items: center; gap: 7px; padding: 11px 16px; border-bottom: 1px solid var(--line-2); background: var(--surface-2); }
  .lp-browser .b-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--line); flex-shrink: 0; }
  .lp-browser .b-url { margin-left: 10px; flex: 1; max-width: 340px; background: var(--surface); border: 1px solid var(--line-2); border-radius: 6px; font-size: 11.5px; color: var(--muted); padding: 4px 12px; }
  .lp-prints-sub { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
  .lp-print-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 2px rgba(40,30,20,.05); }
  .lp-print-cap { font-size: 13px; font-weight: 700; color: var(--ink-2); padding: 13px 18px; border-top: 1px solid var(--line-2); display: flex; align-items: center; gap: 9px; }

  .lp-precos { padding: 96px 0 48px; }
  .lp-plans { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; align-items: stretch; }
  .lp-plan { background: var(--surface); border: 1.5px solid var(--line); border-radius: 18px; padding: 30px 28px; display: flex; flex-direction: column; box-shadow: 0 1px 2px rgba(40,30,20,.05); position: relative; }
  .lp-plan.hot { background: var(--graphite); border-color: var(--graphite); color: #fff; }
  .lp-plan .p-tag { position: absolute; top: -12px; left: 28px; background: var(--brick); color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; }
  .lp-plan .p-nm { font-size: 15px; font-weight: 800; }
  .lp-plan .p-ds { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .lp-plan.hot .p-ds { color: #9a948a; }
  .lp-plan .p-pr { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 46px; margin: 20px 0 2px; line-height: 1; }
  .lp-plan .p-pr small { font-size: 15px; font-family: 'Hanken Grotesk', sans-serif; font-weight: 600; color: var(--muted); }
  .lp-plan.hot .p-pr small { color: #9a948a; }
  .lp-plan ul { list-style: none; margin: 22px 0 26px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .lp-plan li { display: flex; gap: 10px; font-size: 13.5px; color: var(--ink-2); align-items: flex-start; }
  .lp-plan.hot li { color: #cfc9c0; }
  .lp-plan li .chk { color: var(--sage); flex-shrink: 0; }
  .lp-plan.hot li .chk { color: #7fb389; }
  .lp-plan .lp-btn { width: 100%; }

  .lp-depo { padding: 48px 0; }
  .lp-quotes { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .lp-quote { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 26px; box-shadow: 0 1px 2px rgba(40,30,20,.05); display: flex; flex-direction: column; }
  .lp-quote .q-mark { font-family: 'Barlow Condensed', sans-serif; font-size: 44px; font-weight: 700; color: var(--brick); line-height: .6; margin-bottom: 14px; }
  .lp-quote p { font-size: 14.5px; color: var(--ink-2); line-height: 1.6; flex: 1; }
  .lp-quote .q-who { display: flex; align-items: center; gap: 11px; margin-top: 20px; }
  .lp-quote .q-av { width: 38px; height: 38px; border-radius: 10px; background: var(--brick-soft); color: var(--brick); font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-quote .q-nm { font-size: 13.5px; font-weight: 700; color: var(--ink); }
  .lp-quote .q-rl { font-size: 12px; color: var(--muted); }

  .lp-calcsec { padding: 48px 0 96px; }
  .lp-calcband { border-radius: 22px; padding: 54px 60px; display: flex; align-items: center; justify-content: space-between; gap: 40px; position: relative; overflow: hidden; background: var(--graphite); color: #fff; }
  .lp-calcband::after { content: ""; position: absolute; right: -60px; top: -60px; width: 300px; height: 300px; border: 38px solid rgba(255,255,255,.06); border-radius: 50%; pointer-events: none; }
  .lp-calcband h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(32px,4.5vw,44px); line-height: 1; position: relative; }
  .lp-calcband p { font-size: 15.5px; opacity: .85; margin-top: 10px; max-width: 480px; position: relative; }
  .lp-calcband .lp-btn { position: relative; flex-shrink: 0; }

  .lp-foot { background: var(--graphite-2); color: #9a948a; padding: 46px 0 38px; font-size: 13px; }
  .lp-foot .f-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .lp-foot .lp-logo { height: 30px; }
  .lp-foot nav { display: flex; gap: 24px; flex-wrap: wrap; }
  .lp-foot a { color: inherit; text-decoration: none; }
  .lp-foot a:hover { color: #fff; }

  @media (max-width: 860px) {
    .lp-wrap { padding: 0 22px; }
    .lp-nav-links { display: none; }
    .lp-hero { padding: 120px 0 72px; }
    .lp-hero .h-cta .lp-btn { flex: 1 1 100%; }
    .lp-feats, .lp-produto, .lp-precos { padding-top: 64px; }
    .lp-feats { padding-bottom: 64px; }
    .lp-feat-grid, .lp-plans, .lp-quotes, .lp-prints-sub { grid-template-columns: 1fr; }
    .lp-calcband { flex-direction: column; align-items: flex-start; padding: 36px 26px; }
    .lp-calcband .lp-btn { width: 100%; }
    .lp-calcsec { padding-bottom: 64px; }
    .lp-foot .f-row { flex-direction: column; align-items: flex-start; gap: 18px; }
  }
`;

export default function LandingPage() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* Nav */}
      <nav className={`lp-nav${solid ? " solid" : ""}`}>
        <div className="lp-wrap">
          <div className="lp-nav-in">
            <img src="/landing/assets/logo_branco.png" alt="StickFrame" className="lp-logo" />
            <div className="lp-nav-links">
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#produto">Produto</a>
              <a href="#precos">Preços</a>
              <a href="/cadastro" className="lp-btn lp-btn-brick" style={{ padding: "9px 18px", fontSize: 14 }}>
                Começar grátis
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="ring" />
        <div className="ring2" />
        <div className="lp-wrap">
          <div className="lp-hero-in">
            <span className="lp-eyebrow">Plataforma para construtores de steel frame</span>
            <h1>Gerencie obras.<br />Ganhe escala.</h1>
            <p className="h-sub">
              Do orçamento à entrega — cronograma, financeiro, equipe e qualidade
              integrados em uma plataforma feita para quem constrói com steel frame.
            </p>
            <div className="h-cta">
              <a href="/cadastro" className="lp-btn lp-btn-white lp-btn-lg">Começar grátis →</a>
              <a href="#produto" className="lp-btn lp-btn-outline-w lp-btn-lg">Ver o produto</a>
            </div>
            <p className="h-note">Sem cartão de crédito · Configurado em 5 minutos</p>
          </div>
        </div>
      </section>

      {/* Ecossistema Stick™ — graphite band */}
      <section className="lp-feats" id="funcionalidades">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <span className="lp-eyebrow">Ecossistema Stick™</span>
            <h2>Uma suíte completa para a gestão<br />de obras em steel frame</h2>
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

      {/* Produto — browser mockup */}
      <section className="lp-produto" id="produto">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <span className="lp-eyebrow">O produto</span>
            <h2>Projetado para o dia a dia<br />do construtor</h2>
            <p>Interface limpa, dados em tempo real, relatórios com um clique.</p>
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
            {PRINTS.slice(1).map((p) => (
              <div className="lp-print-card" key={p.src}>
                <img src={p.src} alt={p.label} />
                <div className="lp-print-cap"><p.Icon size={15} color="var(--brick)" />{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section className="lp-precos" id="precos">
        <div className="lp-wrap">
          <div className="lp-sec-head center">
            <span className="lp-eyebrow">Planos</span>
            <h2>Simples, transparente,<br />sem surpresas</h2>
            <p>Escolha o plano ideal para o tamanho da sua construtora.</p>
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

      {/* Depoimentos */}
      <section className="lp-depo">
        <div className="lp-wrap">
          <div className="lp-sec-head center">
            <span className="lp-eyebrow">Depoimentos</span>
            <h2>Quem já usa o StickFrame</h2>
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

      {/* Calcband CTA */}
      <section className="lp-calcsec">
        <div className="lp-wrap">
          <div className="lp-calcband">
            <div>
              <h2>Calcule o custo da sua<br />próxima obra agora</h2>
              <p>
                Nossa calculadora gratuita estima o investimento em steel frame
                por padrão de acabamento, em segundos.
              </p>
            </div>
            <a href="/calcular" className="lp-btn lp-btn-brick lp-btn-lg">
              Usar a calculadora →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-foot">
        <div className="lp-wrap">
          <div className="f-row">
            <img src="/landing/assets/logo_branco.png" alt="StickFrame" className="lp-logo" />
            <nav>
              <a href="#funcionalidades">Funcionalidades</a>
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
