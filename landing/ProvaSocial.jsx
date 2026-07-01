const { useState, useRef, useEffect } = React;

const ps_C = {
  brick: '#981915',
  brickDk: '#7d1411',
  ink: '#232225',
  ink2: '#57514a',
  muted: '#8c847a',
  bgLight: '#f7f4f0',
  border: '#e7e1d8',
  sage: '#4f7d57',
  steel: '#3b6ea5',
};

// ── count-up hook, gated on intersection ──
function useCountUp(target, { duration = 1600, decimals = 0 } = {}) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(target); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now) => {
            const p = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(target * eased);
            if (p < 1) requestAnimationFrame(tick);
            else setVal(target);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return [ref, val];
}

function fmtBR(n, decimals = 0) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function Metric({ value, decimals = 0, prefix = '', suffix = '', unit, label }) {
  const [ref, val] = useCountUp(value, { decimals });
  return (
    <div ref={ref} style={ps_S.metric}>
      <div style={ps_S.metricNum}>
        {prefix}{fmtBR(Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals), decimals)}{suffix}
        {unit && <span style={ps_S.metricUnit}>{unit}</span>}
      </div>
      <div style={ps_S.metricLabel}>{label}</div>
    </div>
  );
}

const ICONS = {
  calc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="18"/>
      <line x1="8" y1="18" x2="12" y2="18"/>
    </svg>
  ),
  portal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      <circle cx="12" cy="9" r="2.4"/><path d="M8.2 14c.6-1.7 2-2.6 3.8-2.6s3.2.9 3.8 2.6"/>
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 3.5A2.5 2.5 0 0 0 7 6v0a2.5 2.5 0 0 0-1.8 4.2A2.7 2.7 0 0 0 6 15a2.5 2.5 0 0 0 3.5 2.3"/>
      <path d="M9.5 3.5A2 2 0 0 1 12 5.4v13.1a2 2 0 0 1-3.5 1.3"/>
      <path d="M14.5 3.5A2.5 2.5 0 0 1 17 6v0a2.5 2.5 0 0 1 1.8 4.2A2.7 2.7 0 0 1 18 15a2.5 2.5 0 0 1-3.5 2.3"/>
      <path d="M14.5 3.5A2 2 0 0 0 12 5.4"/>
    </svg>
  ),
  flow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="9.5" width="5" height="5" rx="1"/><rect x="16.5" y="9.5" width="5" height="5" rx="1"/>
      <rect x="9.5" y="3" width="5" height="5" rx="1"/><rect x="9.5" y="16" width="5" height="5" rx="1"/>
      <path d="M7.5 12h2M14.5 12h2M12 8v0M12 8.2V8M12 8.5v7.5"/>
    </svg>
  ),
};

const DIFFS = [
  { icon: 'calc', title: 'Orçamento técnico em minutos', text: 'Composição Steel Frame pronta — não uma planilha do zero.' },
  { icon: 'portal', title: 'Cliente acompanha pelo portal', text: 'Menos ligações, mais confiança em cada etapa da obra.' },
  { icon: 'brain', title: 'Decisão com dados (StickBrain™)', text: 'Pergunte sobre a obra e receba a resposta na hora.' },
  { icon: 'flow', title: 'Do lead à chave num fluxo só', text: 'Calculadora → orçamento → obra → entrega.' },
];

function ProvaSocial() {
  return (
    <section style={ps_S.section}>
      <style>{ps_CSS}</style>
      <div style={ps_S.wrap}>

        <div style={ps_S.head}>
          <span style={ps_S.kicker}>Resultados reais</span>
          <h2 style={ps_S.h2}>Menos retrabalho. Mais obras fechadas.</h2>
          <p style={ps_S.sub}>Construtoras em Steel Frame usam o StickFrame para sair do orçamento à entrega num fluxo só.</p>
        </div>

        {/* Bloco 1 — métricas */}
        <div style={ps_S.metrics} className="ps-metrics">
          <Metric value={12500} unit="m²" label="simulados na calculadora pública" />
          <div style={ps_S.metricDiv} className="ps-mdiv" />
          <Metric value={20} prefix="+" label="simulações de obra" />
          <div style={ps_S.metricDiv} className="ps-mdiv" />
          <Metric value={18} label="orçamentos técnicos gerados" />
        </div>

        {/* Bloco 2 — diferenciais como resultado */}
        <div style={ps_S.cards} className="ps-cards">
          {DIFFS.map((d, i) => (
            <article key={i} style={ps_S.card} className="ps-card">
              <span style={ps_S.cardIcon} className="ps-cardicon">{ICONS[d.icon]}</span>
              <h3 style={ps_S.cardTitle}>{d.title}</h3>
              <p style={ps_S.cardText}>{d.text}</p>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div style={ps_S.ctaWrap}>
          <a href="#calculadora" style={ps_S.cta} className="ps-cta">
            Calcular minha obra
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}

const ps_S = {
  section: { background: '#fff', padding: '96px 0', fontFamily: "'Hanken Grotesk',system-ui,sans-serif", color: ps_C.ink },
  wrap: { maxWidth: 1140, margin: '0 auto', padding: '0 24px' },

  head: { textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' },
  kicker: { display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: ps_C.brick, marginBottom: 16 },
  h2: { fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 'clamp(32px,5vw,52px)', lineHeight: 1.04, letterSpacing: '-.5px', margin: 0, color: ps_C.ink, textWrap: 'balance' },
  sub: { fontSize: 'clamp(15px,1.6vw,18px)', color: ps_C.ink2, margin: '18px auto 0', lineHeight: 1.5, textWrap: 'pretty' },

  metrics: { background: ps_C.bgLight, border: `1px solid ${ps_C.border}`, borderRadius: 18, padding: 'clamp(28px,4vw,44px) clamp(20px,4vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 24, marginBottom: 64 },
  metric: { flex: '1 1 0', textAlign: 'center', minWidth: 0 },
  metricNum: { fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 'clamp(40px,6vw,68px)', lineHeight: 1, letterSpacing: '-1px', color: ps_C.brick, fontVariantNumeric: 'tabular-nums' },
  metricUnit: { fontSize: '.46em', fontWeight: 600, color: ps_C.ink2, marginLeft: 4, letterSpacing: 0 },
  metricLabel: { fontSize: 'clamp(13px,1.3vw,15px)', color: ps_C.ink2, marginTop: 10, lineHeight: 1.35, fontWeight: 500, textWrap: 'balance' },
  metricDiv: { width: 1, alignSelf: 'stretch', background: ps_C.border, flex: '0 0 auto' },

  cards: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 56 },
  card: { background: '#fff', border: `1px solid ${ps_C.border}`, borderRadius: 16, padding: '28px 24px', transition: 'transform .16s, box-shadow .16s, border-color .16s' },
  cardIcon: { display: 'inline-flex', width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#f3e7e5', color: ps_C.brick, marginBottom: 18 },
  cardTitle: { fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 22, lineHeight: 1.1, margin: '0 0 8px', color: ps_C.ink, letterSpacing: '-.2px' },
  cardText: { fontSize: 14.5, color: ps_C.ink2, margin: 0, lineHeight: 1.45 },

  ctaWrap: { textAlign: 'center' },
  cta: { display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: '#fff', background: ps_C.brick, padding: '17px 34px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 10px 26px rgba(152,25,21,.28)', transition: 'background .14s, box-shadow .14s, transform .14s', cursor: 'pointer' },
};

const ps_CSS = `
  .ps-card:hover{ transform: translateY(-3px); box-shadow: 0 14px 34px rgba(40,30,20,.10); border-color: #d9cfc2; }
  .ps-card:hover .ps-cardicon{ background:${ps_C.brick}; color:#fff; }
  .ps-cardicon{ transition: background .16s, color .16s; }
  .ps-cardicon svg{ width:24px; height:24px; }
  .ps-cta:hover{ background:${ps_C.brickDk}; box-shadow:0 14px 32px rgba(152,25,21,.38); transform: translateY(-1px); }
  @media (max-width: 900px){
    .ps-cards{ grid-template-columns: repeat(2,1fr) !important; }
  }
  @media (max-width: 760px){
    .ps-metrics{ flex-direction: column !important; gap: 28px !important; }
    .ps-mdiv{ width: 60% !important; height: 1px !important; align-self: center !important; }
  }
  @media (max-width: 540px){
    .ps-cards{ grid-template-columns: 1fr !important; }
  }
`;

Object.assign(window, { ProvaSocial });
