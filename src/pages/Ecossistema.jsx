import useAppStore from "../store/useAppStore";

const cond = "'Barlow Condensed', system-ui, sans-serif";

function Ic({ n, w, c }) {
  const P = {
    share: <g><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></g>,
    check: <path d="M20 6 9 17l-5-5" />,
    chevR: <path d="M9 18l6-6-6-6" />,
    sparkle: <g><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></g>,
    brain: <g><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.98-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2" /></g>,
    home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
    leaf: <g><path d="M17 8C8 10 5.9 16.17 3.82 22h3.6l4.9-4.9A5 5 0 0 0 17 8z" /><path d="M3 3c8.5 1 11.4 9.3 8 15" /></g>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    dollar: <g><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></g>,
    target: <g><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></g>,
    list: <g><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></g>,
    box: <g><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z" /><path d="M12 22V9.5" /><path d="M22 8.5l-10 5.5L2 8.5" /></g>,
    search: <g><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></g>,
    users: <g><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></g>,
    chart: <g><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></g>,
    cpu: <g><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></g>,
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: w || 15, height: w || 15, flexShrink: 0 }}>
      {P[n]}
    </svg>
  );
}

// ---- Diferenciais (grid de cards escuros com ícones SVG) ----
const DIFERENCIAIS = [
  { icon: "check", title: "100% Steel Frame", desc: "Metodologia construtiva a seco — mais velocidade, menos desperdício e maior precisão na execução.", cor: "var(--sage,#4f7d57)" },
  { icon: "brain", title: "Inteligência no canteiro", desc: "StickBrain™ integrado ao sistema para análise preditiva de custos, cronogramas e não-conformidades.", cor: "var(--steel,#3b6ea5)" },
  { icon: "home", title: "Gestão completa da obra", desc: "Do orçamento à entrega: cronograma, diário de obra, medições e relatórios em um único lugar.", cor: "var(--ochre,#c0892d)" },
  { icon: "leaf", title: "Construção sustentável", desc: "Redução de até 90% no entulho, menor consumo de água e estrutura com 60% de aço reciclado.", cor: "var(--pos,#3f7a4b)" },
  { icon: "shield", title: "Rastreabilidade total", desc: "Checklist de qualidade, FVS, NCRs e histórico de decisões documentados em todas as fases.", cor: "var(--plum,#6d557e)" },
  { icon: "zap", title: "Velocidade de entrega", desc: "Obras 40% mais rápidas que alvenaria convencional — ganho real para o construtor e o cliente.", cor: "var(--brick,#981915)" },
];

// ---- Módulos do ecossistema (preserva os keys de navegação do store) ----
const MODULOS = [
  { brand: "StickScore™", icon: "target", bg: "#eef5ef", ic: "var(--sage,#4f7d57)", label: "Saúde da Obra", desc: "Performance de cada obra em tempo real num único número de 0 a 100.", key: "obras" },
  { brand: "StickBrain™", icon: "cpu", bg: "#f0edf5", ic: "var(--plum,#6d557e)", label: "Inteligência Artificial", desc: "Detecta riscos, sugere ações e gera análises automáticas dos dados da obra.", key: "inteligencia" },
  { brand: "StickCash™", icon: "dollar", bg: "#eef5ef", ic: "var(--sage,#4f7d57)", label: "Financeiro", desc: "Fluxo de caixa, margem real e alertas de desvio orçamentário por obra.", key: "financeiro" },
  { brand: "StickLead™", icon: "target", bg: "#eef3f9", ic: "var(--steel,#3b6ea5)", label: "CRM / Clientes", desc: "Pipeline de leads e relacionamento com clientes com histórico.", key: "crm" },
  { brand: "StickPlan™", icon: "list", bg: "#fef5e7", ic: "var(--ochre,#c0892d)", label: "Cronograma", desc: "Marcos, fases e alertas de atraso em tempo real.", key: "cronograma" },
  { brand: "StickSupply™", icon: "box", bg: "#fdf0ef", ic: "var(--clay,#b8624a)", label: "Almoxarifado", desc: "Pedidos, fornecedores e movimentação de materiais.", key: "suprimentos" },
  { brand: "StickInspect™", icon: "search", bg: "#f3f0f8", ic: "var(--plum,#6d557e)", label: "Qualidade / FVS", desc: "Vistorias, FVS e registro de não-conformidades.", key: "vistorias" },
  { brand: "StickTeam™", icon: "users", bg: "var(--surface-2,#faf8f4)", ic: "var(--ink-2,#57514a)", label: "Equipe", desc: "Apontamentos de ponto, check-ins e produtividade.", key: "equipe" },
  { brand: "StickPulse™", icon: "chart", bg: "#eef3f9", ic: "var(--steel,#3b6ea5)", label: "Analytics", desc: "VGV, margens, performance e tendências consolidadas.", key: "bi" },
  { brand: "StickView™", icon: "home", bg: "#fdf0ef", ic: "var(--clay,#b8624a)", label: "Portal do Cliente", desc: "Acompanhamento e aprovações para o cliente, sem acesso interno.", key: null },
];

const HERO_PILLS = ["10 módulos integrados", "IA em todos os fluxos", "Multi-obras", "Multi-usuários"];
const CTA_TAGS = ["StickScore™", "StickBrain™", "Cronograma", "Financeiro", "Analytics", "Portal do Cliente"];

function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ width: 4, height: 22, background: "var(--brick,#981915)", borderRadius: 2 }} />
      <div style={{ fontFamily: cond, fontWeight: 700, fontSize: 22, color: "var(--ink,#26231f)" }}>{children}</div>
    </div>
  );
}

export default function Ecossistema() {
  const setActivePage = useAppStore((s) => s.setActivePage);

  return (
    <div style={{ padding: 32, maxWidth: 1080, margin: "0 auto" }}>

      {/* Hero escuro */}
      <div style={{ background: "linear-gradient(135deg,var(--graphite,#2b2b2e) 0%,var(--graphite-2,#232225) 100%)", borderRadius: 16, padding: "40px 48px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(152,25,21,.12)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, right: 80, width: 140, height: 140, borderRadius: "50%", background: "rgba(152,25,21,.07)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, position: "relative" }}>
          <div style={{ width: 46, height: 46, background: "var(--brick,#981915)", borderRadius: 12, display: "grid", placeItems: "center" }}>
            <Ic n="share" w={22} c="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: cond, fontWeight: 700, fontSize: 32, color: "#fff", letterSpacing: ".5px", lineHeight: 1 }}>Ecossistema Stick™</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 3 }}>Plataforma completa para construtoras Steel Frame</div>
          </div>
        </div>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.75)", maxWidth: 580, lineHeight: 1.7, marginBottom: 28, position: "relative" }}>
          O Ecossistema Stick™ conecta todos os módulos do seu negócio de construção leve — do primeiro orçamento à entrega da obra, com rastreabilidade, inteligência e velocidade.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", position: "relative" }}>
          {HERO_PILLS.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.09)", borderRadius: 20, padding: "6px 14px", border: "1px solid rgba(255,255,255,.12)" }}>
              <Ic n="check" w={12} c="var(--sage,#4f7d57)" />
              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Diferenciais — grid de cards escuros */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Por que Stick Frame?</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {DIFERENCIAIS.map((d) => (
            <div key={d.title} style={{ background: "#2e2c31", borderRadius: 12, padding: "18px 20px", border: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,.08)", display: "grid", placeItems: "center", marginBottom: 14 }}>
                <Ic n={d.icon} w={18} c={d.cor} />
              </div>
              <div style={{ fontFamily: cond, fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 6, lineHeight: 1.2 }}>{d.title}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.52)", lineHeight: 1.6 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Módulos disponíveis */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Módulos disponíveis</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {MODULOS.map((m) => {
            const nav = m.key ? () => setActivePage(m.key) : undefined;
            return (
              <div
                key={m.brand}
                onClick={nav}
                style={{ background: "var(--surface,#fff)", border: "1px solid var(--line,#e7e1d8)", borderRadius: 12, padding: "16px 18px", cursor: nav ? "pointer" : "default", transition: ".12s" }}
                onMouseEnter={(e) => { if (nav) { e.currentTarget.style.borderColor = "var(--brick,#981915)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(152,25,21,.1)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line,#e7e1d8)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: m.bg, display: "grid", placeItems: "center", marginBottom: 12 }}>
                  <Ic n={m.icon} w={18} c={m.ic} />
                </div>
                <div style={{ fontFamily: cond, fontSize: 15, fontWeight: 700, color: "var(--ink,#26231f)", marginBottom: 2, lineHeight: 1.1 }}>{m.brand}</div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--muted,#8c847a)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted,#8c847a)", lineHeight: 1.5 }}>{m.desc}</div>
                {nav ? (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--brick,#981915)" }}>
                    Acessar <Ic n="chevR" w={11} c="var(--brick,#981915)" />
                  </div>
                ) : (
                  <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: "var(--muted,#8c847a)", letterSpacing: ".5px", textTransform: "uppercase" }}>Em breve</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA — planos */}
      <div style={{ background: "var(--surface,#fff)", border: "1px solid var(--line,#e7e1d8)", borderRadius: 16, padding: "36px 40px", display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, background: "var(--brick-soft,#f3e7e5)", borderRadius: 9, display: "grid", placeItems: "center" }}>
              <Ic n="sparkle" w={18} c="var(--brick,#981915)" />
            </div>
            <div style={{ fontFamily: cond, fontWeight: 700, fontSize: 22, color: "var(--ink,#26231f)" }}>Aproveite todos os módulos</div>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-2,#57514a)", lineHeight: 1.7, maxWidth: 520, marginBottom: 16 }}>
            Seu plano atual já inclui acesso ao Ecossistema Stick™. Convide sua equipe, conecte fornecedores e gerencie todas as obras em um único lugar — quanto maior o StickScore™, maior a previsibilidade da obra.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {CTA_TAGS.map((m) => (
              <span key={m} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--ink-2,#57514a)", background: "var(--surface-2,#faf8f4)", border: "1px solid var(--line,#e7e1d8)", borderRadius: 6, padding: "4px 10px" }}>
                <Ic n="check" w={11} c="var(--pos,#3f7a4b)" />{m}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <button onClick={() => setActivePage("crm")} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--brick,#981915)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            <Ic n="phone" w={15} c="#fff" /> Falar com suporte
          </button>
          <button onClick={() => setActivePage("bi")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--surface,#fff)", color: "var(--ink-2,#57514a)", border: "1.5px solid var(--line,#e7e1d8)", borderRadius: 10, padding: "11px 24px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Ver planos
          </button>
        </div>
      </div>

    </div>
  );
}
