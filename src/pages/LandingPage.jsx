const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

const FEATURES = [
  { icon: "🏗️", title: "Gestão de Obras", desc: "Cronograma, diário, medições e vistorias em um só painel. Acompanhe cada etapa em tempo real." },
  { icon: "📊", title: "Orçamentos & Contratos", desc: "Gere propostas profissionais em minutos. Envie, aprove e controle contratos na plataforma." },
  { icon: "🔗", title: "Calculadora White-label", desc: "Envie um link com sua marca para clientes calcularem o custo da obra online." },
  { icon: "💰", title: "Financeiro", desc: "Controle receitas, despesas e fluxo de caixa de cada obra com relatórios automáticos." },
  { icon: "👷", title: "Equipe & SST", desc: "Gerencie colaboradores, pontos e documentos de segurança do trabalho em um lugar." },
  { icon: "🧠", title: "Inteligência", desc: "Dashboards e BI para tomar decisões com base em dados reais das suas obras." },
];

const STEPS = [
  { num: "01", title: "Crie sua conta grátis", desc: "Leva menos de 2 minutos. Sem cartão de crédito." },
  { num: "02", title: "Configure sua empresa", desc: "Adicione logo, dados e personalize sua calculadora white-label." },
  { num: "03", title: "Cadastre suas obras", desc: "Centralize cronograma, financeiro e equipe em cada projeto." },
  { num: "04", title: "Cresça com dados", desc: "Acompanhe indicadores e tome decisões mais rápidas." },
];

const PLANOS = [
  {
    key: "free", nome: "Free", preco: "R$ 0", periodo: "para sempre",
    desc: "Para testar e começar",
    items: ["2 obras ativas", "1 usuário", "Calculadora white-label", "Diário de obra", "Orçamentos básicos"],
    cta: "Começar grátis", href: "/cadastro", destaque: false,
    cor: "#8c847a", border: "#e7e1d8", bg: "#ffffff",
  },
  {
    key: "pro", nome: "Pro", preco: "R$ 297", periodo: "por mês",
    desc: "Para construtoras em crescimento",
    items: ["Obras ilimitadas", "Até 10 usuários", "Calculadora white-label", "CRM de clientes", "Relatórios PDF", "Medições e contratos", "Suporte prioritário"],
    cta: "Assinar agora", href: "/cadastro", destaque: true,
    cor: "#981915", border: "#981915", bg: "rgba(152,25,21,.08)",
  },
  {
    key: "enterprise", nome: "Enterprise", preco: "Sob consulta", periodo: "",
    desc: "Para grandes construtoras",
    items: ["Tudo do Pro", "Usuários ilimitados", "Multi-empresa", "White-label total", "SLA garantido"],
    cta: "Falar com consultor", href: "mailto:contato@stickframe.com.br?subject=Enterprise", destaque: false,
    cor: "#3b6ea5", border: "#e7e1d8", bg: "#ffffff",
  },
];

const FAQ = [
  ["Posso cancelar quando quiser?", "Sim. Sem multa, sem fidelidade. Cancele a qualquer momento pelo painel."],
  ["O plano Free é realmente grátis?", "Sim, para sempre. Sem cartão de crédito para começar."],
  ["Quanto tempo leva para configurar?", "Menos de 5 minutos. Você já começa a usar no mesmo dia."],
  ["Posso fazer upgrade depois?", "Sim, upgrade ou downgrade a qualquer momento nas configurações."],
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", color: "#26231f", background: "#f4f1ec", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Hanken+Grotesk:wght@400;500;600;700;800;900&display=swap');
        html { scroll-behavior: smooth; }
        a { transition: opacity .15s; }
        a:hover { opacity: .8; }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64, borderBottom: "1px solid #e7e1d8",
        position: "sticky", top: 0, zIndex: 100, background: "#f4f1ec",
      }}>
        <a href="#hero" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={LOGO} alt="StickFrame" style={{ height: 34, width: 34, borderRadius: 7, objectFit: "cover" }} />
          <span style={{ fontWeight: 900, letterSpacing: 2, fontSize: 15, color: "#26231f" }}>STICK<span style={{ color: "#981915" }}>FRAME</span></span>
        </a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="#funcionalidades" style={{ color: "#8c847a", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Funcionalidades</a>
          <a href="#como-funciona"   style={{ color: "#8c847a", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Como funciona</a>
          <a href="#precos"          style={{ color: "#8c847a", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Preços</a>
          <a href="/login"           style={{ color: "#8c847a", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Entrar</a>
          <a href="/cadastro" style={{ background: "#981915", color: "#fff", padding: "8px 18px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>Começar grátis</a>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" style={{ maxWidth: 860, margin: "0 auto", padding: "100px 24px 88px", textAlign: "center" }}>
        <div style={{
          display: "inline-block", background: "rgba(152,25,21,.15)", color: "#981915",
          border: "1px solid rgba(152,25,21,.3)", fontSize: 11, fontWeight: 700,
          padding: "4px 14px", borderRadius: 20, marginBottom: 28, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          ERP para construtoras steel frame
        </div>
        <h1 style={{ fontSize: "clamp(38px, 6vw, 58px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1.5px", margin: "0 0 24px", color: "#26231f" }}>
          Gerencie suas obras{" "}
          <span style={{ color: "#981915" }}>com inteligência</span>
        </h1>
        <p style={{ fontSize: 18, color: "#8c847a", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
          ERP completo para construtoras steel frame — orçamentos, contratos,
          cronograma, diário de obra e muito mais em um só lugar.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
          <a href="/cadastro" style={{ background: "#981915", color: "#fff", padding: "14px 32px", borderRadius: 10, textDecoration: "none", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 20px rgba(152,25,21,.4)" }}>
            Começar grátis
          </a>
          <a href="#precos" style={{ background: "transparent", color: "#26231f", padding: "14px 32px", borderRadius: 10, textDecoration: "none", fontSize: 15, fontWeight: 600, border: "1.5px solid #e7e1d8" }}>
            Ver planos
          </a>
        </div>
        {/* Números */}
        <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap", borderTop: "1px solid #e7e1d8", paddingTop: 40 }}>
          {[{ num: "+500", label: "obras gerenciadas" }, { num: "+150", label: "construtoras" }, { num: "R$ 0", label: "para começar" }].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#981915", letterSpacing: "-1px", lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>{s.num}</div>
              <div style={{ color: "#8c847a", fontSize: 12, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" style={{ padding: "80px 24px", borderTop: "1px solid #e7e1d8", background: "#ffffff" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#981915", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Funcionalidades</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.5px", margin: 0, color: "#26231f" }}>Tudo que sua construtora precisa</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: "#f4f1ec", borderRadius: 14, padding: "24px 22px", border: "1px solid #e7e1d8", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#26231f" }}>{f.title}</h3>
                <p style={{ color: "#8c847a", fontSize: 13, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" style={{ padding: "80px 24px", borderTop: "1px solid #e7e1d8" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#981915", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Como funciona</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.5px", margin: 0, color: "#26231f" }}>Configure em minutos</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#981915", opacity: .8, minWidth: 32, paddingTop: 2, fontFamily: "'Barlow Condensed', sans-serif" }}>{s.num}</div>
                <div style={{ flex: 1, borderBottom: i < STEPS.length - 1 ? "1px solid #e7e1d8" : "none", paddingBottom: 32 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#26231f", marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: "#8c847a", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" style={{ padding: "80px 24px", borderTop: "1px solid #e7e1d8", background: "#ffffff" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#981915", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Preços</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.5px", margin: "0 0 12px", color: "#26231f" }}>Simples, transparente, sem surpresas</h2>
            <p style={{ color: "#8c847a", fontSize: 15, margin: 0 }}>Comece grátis, faça upgrade quando precisar.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20, alignItems: "start" }}>
            {PLANOS.map((p) => (
              <div key={p.key} style={{ background: p.bg, border: `1.5px solid ${p.border}`, borderRadius: 16, padding: "28px 24px", position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                {p.destaque && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#981915", color: "#fff", borderRadius: 20, padding: "3px 14px", fontSize: 10, fontWeight: 800, letterSpacing: 1.5, whiteSpace: "nowrap" }}>
                    MAIS POPULAR
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: p.cor, marginBottom: 10 }}>{p.nome}</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: "#26231f", lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>{p.preco}</div>
                {p.periodo && <div style={{ fontSize: 12, color: "#8c847a", marginTop: 4 }}>{p.periodo}</div>}
                <div style={{ fontSize: 12, color: "#8c847a", marginTop: 8, marginBottom: 20 }}>{p.desc}</div>
                <a href={p.href} style={{
                  display: "block", textAlign: "center", padding: "12px 0",
                  background: p.destaque ? "#981915" : "transparent",
                  color: p.destaque ? "#fff" : p.cor,
                  border: `1.5px solid ${p.destaque ? "#981915" : p.border}`,
                  borderRadius: 8, fontWeight: 800, fontSize: 14, textDecoration: "none", marginBottom: 20,
                }}>
                  {p.cta}
                </a>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.items.map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#26231f" }}>
                      <span style={{ color: "#3f7a4b", fontSize: 13, flexShrink: 0 }}>✓</span>{item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "72px 24px", borderTop: "1px solid #e7e1d8" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#981915", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#26231f" }}>Dúvidas frequentes</h2>
          </div>
          {FAQ.map(([q, a]) => (
            <div key={q} style={{ borderBottom: "1px solid #e7e1d8", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#26231f", marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13, color: "#8c847a", lineHeight: 1.65 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section style={{ background: "#981915", padding: "72px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 34, fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.8px" }}>Comece hoje, grátis</h2>
        <p style={{ color: "rgba(255,255,255,.75)", fontSize: 16, marginBottom: 32 }}>Sem cartão de crédito. Configure em minutos.</p>
        <a href="/cadastro" style={{ background: "#fff", color: "#981915", padding: "14px 36px", borderRadius: 10, textDecoration: "none", fontSize: 15, fontWeight: 800, display: "inline-block" }}>
          Criar conta grátis →
        </a>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e7e1d8", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ color: "#8c847a", fontSize: 12 }}>© 2025 StickFrame · Stick Frame Sistemas Construtivos · Santo André/SP</span>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/login"   style={{ color: "#8c847a", fontSize: 12, textDecoration: "none" }}>Login</a>
          <a href="#precos"  style={{ color: "#8c847a", fontSize: 12, textDecoration: "none" }}>Preços</a>
          <a href="mailto:contato@stickframe.com.br" style={{ color: "#8c847a", fontSize: 12, textDecoration: "none" }}>Contato</a>
        </div>
      </footer>
    </div>
  );
}
