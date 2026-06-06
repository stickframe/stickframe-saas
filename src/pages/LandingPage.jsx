const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#fff", background: "#0e0505", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64, borderBottom: "1px solid rgba(255,255,255,.08)",
        position: "sticky", top: 0, zIndex: 100, background: "#0e0505",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={LOGO} alt="StickFrame" style={{ height: 34, width: 34, borderRadius: 7, objectFit: "cover" }} />
          <span style={{ fontWeight: 900, letterSpacing: 2, fontSize: 15, color: "#fff" }}>STICK<span style={{ color: "#dc2626" }}>FRAME</span></span>
        </a>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <a href="/pricing" style={{ color: "rgba(255,255,255,.6)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Planos</a>
          <a href="/login"   style={{ color: "rgba(255,255,255,.6)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Entrar</a>
          <a href="/cadastro" style={{ background: "#dc2626", color: "#fff", padding: "8px 18px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>Começar grátis</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "96px 24px 80px", textAlign: "center" }}>
        <div style={{
          display: "inline-block", background: "rgba(220,38,38,.15)", color: "#dc2626",
          border: "1px solid rgba(220,38,38,.3)",
          fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20,
          marginBottom: 28, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          ERP para construtoras steel frame
        </div>
        <h1 style={{ fontSize: "clamp(40px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1.5px", margin: "0 0 24px", color: "#fff" }}>
          Gerencie suas obras{" "}
          <span style={{ color: "#dc2626" }}>com inteligência</span>
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,.5)", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 40px" }}>
          ERP completo para construtoras steel frame — orçamentos, contratos,
          cronograma, diário de obra e muito mais em um só lugar.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/cadastro" style={{ background: "#dc2626", color: "#fff", padding: "14px 32px", borderRadius: 10, textDecoration: "none", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 20px rgba(220,38,38,.4)" }}>
            Começar grátis
          </a>
          <a href="/pricing" style={{ background: "transparent", color: "#fff", padding: "14px 32px", borderRadius: 10, textDecoration: "none", fontSize: 15, fontWeight: 600, border: "1.5px solid rgba(255,255,255,.2)" }}>
            Ver planos
          </a>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "64px 24px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 40, color: "#fff" }}>
            Tudo que sua construtora precisa
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { icon: "🏗️", title: "Gestão de Obras", desc: "Cronograma, diário, medições e vistorias em um só painel. Acompanhe cada etapa em tempo real." },
              { icon: "📊", title: "Orçamentos & Contratos", desc: "Gere propostas profissionais em minutos. Envie, aprove e controle contratos na plataforma." },
              { icon: "🔗", title: "Calculadora White-label", desc: "Envie um link com sua marca para seus clientes calcularem o custo da obra online." },
            ].map((f) => (
              <div key={f.title} style={{ background: "rgba(255,255,255,.04)", borderRadius: 14, padding: "28px 24px", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#fff" }}>{f.title}</h3>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section style={{ padding: "64px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <p style={{ color: "rgba(255,255,255,.3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 40, textTransform: "uppercase" }}>
          Usado por construtoras em todo o Brasil
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, maxWidth: 600, margin: "0 auto" }}>
          {[{ num: "+500", label: "obras gerenciadas" }, { num: "+150", label: "construtoras" }, { num: "R$0", label: "para começar" }].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 42, fontWeight: 900, color: "#dc2626", letterSpacing: "-1px", lineHeight: 1 }}>{s.num}</div>
              <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section style={{ background: "#dc2626", padding: "72px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 34, fontWeight: 900, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.8px" }}>
          Comece hoje, grátis
        </h2>
        <p style={{ color: "rgba(255,255,255,.75)", fontSize: 16, marginBottom: 32 }}>
          Sem cartão de crédito. Configure em minutos.
        </p>
        <a href="/cadastro" style={{ background: "#fff", color: "#dc2626", padding: "14px 36px", borderRadius: 10, textDecoration: "none", fontSize: 15, fontWeight: 800, display: "inline-block" }}>
          Criar conta grátis →
        </a>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ color: "rgba(255,255,255,.2)", fontSize: 12 }}>© 2025 StickFrame</span>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/login"   style={{ color: "rgba(255,255,255,.3)", fontSize: 12, textDecoration: "none" }}>Login</a>
          <a href="/pricing" style={{ color: "rgba(255,255,255,.3)", fontSize: 12, textDecoration: "none" }}>Pricing</a>
        </div>
      </footer>
    </div>
  );
}
