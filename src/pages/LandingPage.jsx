import { C } from "../utils/constants";

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: C.text, background: C.surface, minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 60, borderBottom: `1px solid ${C.border}`,
        background: C.surface, position: "sticky", top: 0, zIndex: 100,
      }}>
        <span style={{ fontWeight: 800, fontSize: 20, color: C.red, letterSpacing: "-0.5px" }}>
          StickFrame
        </span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/pricing" style={{ color: C.muted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Planos</a>
          <a href="/login" style={{ color: C.muted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Entrar</a>
          <a href="/cadastro" style={{
            background: C.red, color: "#fff", padding: "8px 20px",
            borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600,
          }}>Começar grátis</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 860, margin: "0 auto", padding: "96px 24px 80px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block", background: "#fef2f2", color: C.red,
          fontSize: 13, fontWeight: 600, padding: "4px 14px", borderRadius: 20,
          marginBottom: 28, letterSpacing: "0.02em",
        }}>
          ERP para construtoras steel frame
        </div>
        <h1 style={{
          fontSize: "clamp(40px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.1,
          letterSpacing: "-1.5px", margin: "0 0 24px",
        }}>
          Gerencie suas obras{" "}
          <span style={{ color: C.red }}>com inteligência</span>
        </h1>
        <p style={{
          fontSize: 19, color: C.muted, lineHeight: 1.6,
          maxWidth: 620, margin: "0 auto 40px", fontWeight: 400,
        }}>
          ERP completo para construtoras steel frame — orçamentos, contratos,
          cronograma, diário de obra e muito mais em um só lugar.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/cadastro" style={{
            background: C.red, color: "#fff", padding: "14px 32px",
            borderRadius: 10, textDecoration: "none", fontSize: 16, fontWeight: 700,
            boxShadow: `0 4px 14px rgba(220,38,38,0.35)`,
          }}>
            Começar grátis
          </a>
          <a href="/pricing" style={{
            background: C.bg, color: C.text, padding: "14px 32px",
            borderRadius: 10, textDecoration: "none", fontSize: 16, fontWeight: 600,
            border: `1.5px solid ${C.border}`,
          }}>
            Ver planos
          </a>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: C.bg, padding: "72px 24px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <h2 style={{
            textAlign: "center", fontSize: 32, fontWeight: 800,
            letterSpacing: "-0.8px", marginBottom: 48,
          }}>
            Tudo que sua construtora precisa
          </h2>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}>
            {[
              {
                icon: "🏗️",
                title: "Gestão de Obras",
                desc: "Cronograma, diário, medições e vistorias em um só painel. Acompanhe cada etapa da obra em tempo real.",
              },
              {
                icon: "📊",
                title: "Orçamentos & Contratos",
                desc: "Gere propostas profissionais em minutos. Envie, aprove e controle contratos diretamente na plataforma.",
              },
              {
                icon: "🔗",
                title: "Calculadora White-label",
                desc: "Envie um link personalizado com sua marca para seus clientes calcularem o custo da obra online.",
              },
            ].map((f) => (
              <div key={f.title} style={{
                background: C.surface, borderRadius: 14, padding: "32px 28px",
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.3px" }}>
                  {f.title}
                </h3>
                <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section style={{ padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ color: C.muted, fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 40, textTransform: "uppercase" }}>
            Usado por construtoras em todo o Brasil
          </p>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 32,
          }}>
            {[
              { num: "+500", label: "obras gerenciadas" },
              { num: "+150", label: "construtoras" },
              { num: "R$0", label: "para começar" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 44, fontWeight: 800, color: C.red, letterSpacing: "-1px", lineHeight: 1 }}>
                  {s.num}
                </div>
                <div style={{ color: C.muted, fontSize: 15, marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ background: C.red, padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.8px" }}>
          Comece hoje, grátis
        </h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, marginBottom: 36 }}>
          Sem cartão de crédito. Configure em minutos.
        </p>
        <a href="/cadastro" style={{
          background: "#fff", color: C.red, padding: "14px 36px",
          borderRadius: 10, textDecoration: "none", fontSize: 16, fontWeight: 700,
          display: "inline-block",
        }}>
          Criar conta grátis
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${C.border}`, padding: "24px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12, background: C.surface,
      }}>
        <span style={{ color: C.muted, fontSize: 13 }}>© 2025 StickFrame</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/login"   style={{ color: C.muted, fontSize: 13, textDecoration: "none" }}>Login</a>
          <a href="/pricing" style={{ color: C.muted, fontSize: 13, textDecoration: "none" }}>Pricing</a>
        </div>
      </footer>

    </div>
  );
}
