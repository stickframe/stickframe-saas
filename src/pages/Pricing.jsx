import { useNavigate } from "react-router-dom";

const PLANOS = [
  {
    key: "free",
    nome: "Free",
    preco: "R$ 0",
    periodo: "para sempre",
    desc: "Para testar e começar",
    cor: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
    items: [
      "2 obras ativas",
      "1 usuário",
      "Calculadora white-label",
      "Diário de obra",
      "Orçamentos básicos",
      "Suporte por e-mail",
    ],
    nao: ["Obras ilimitadas", "Múltiplos usuários", "Relatórios PDF", "CRM de clientes", "Integrações API"],
    cta: "Começar grátis",
    ctaHref: "/cadastro",
    destaque: false,
  },
  {
    key: "pro",
    nome: "Pro",
    preco: "R$ 297",
    periodo: "por mês",
    desc: "Para construtoras em crescimento",
    cor: "#dc2626",
    bg: "#fff",
    border: "#dc2626",
    items: [
      "Obras ilimitadas",
      "Até 10 usuários",
      "Calculadora white-label",
      "Diário de obra + fotos",
      "Orçamentos completos",
      "CRM de clientes",
      "Relatórios PDF",
      "Medições e contratos",
      "Integrações API",
      "Suporte prioritário",
    ],
    nao: [],
    cta: "Assinar agora",
    ctaHref: null, // abre modal de pagamento
    destaque: true,
  },
  {
    key: "enterprise",
    nome: "Enterprise",
    preco: "Sob consulta",
    periodo: "",
    desc: "Para grandes construtoras",
    cor: "#7c3aed",
    bg: "#f8fafc",
    border: "#e2e8f0",
    items: [
      "Tudo do Pro",
      "Usuários ilimitados",
      "Multi-empresa",
      "Marca própria (white-label total)",
      "Integração ERP",
      "SLA garantido",
      "Gerente de conta dedicado",
    ],
    nao: [],
    cta: "Falar com consultor",
    ctaHref: "mailto:contato@stickframe.com.br?subject=Enterprise",
    destaque: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{ background: "#0e0505", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-transparente-122x122.png" style={{ height: 36, width: "auto" }} alt="StickFrame" />
          <span style={{ fontWeight: 900, letterSpacing: 2, fontSize: 15, color: "#fff" }}>STICK<span style={{ color: "#dc2626" }}>FRAME</span></span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/login" style={{ color: "rgba(255,255,255,.6)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Entrar</a>
          <a href="/cadastro" style={{ background: "#dc2626", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Criar conta grátis</a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "64px 24px 48px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "inline-block", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#dc2626", letterSpacing: 1, marginBottom: 20 }}>
          PLANOS E PREÇOS
        </div>
        <h1 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, color: "#0f172a", margin: "0 0 16px", letterSpacing: -1 }}>
          Simples, transparente,<br />sem surpresas
        </h1>
        <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
          Comece grátis, faça upgrade quando precisar. Sem contrato de fidelidade.
        </p>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}>
        {PLANOS.map((p) => (
          <div key={p.key} style={{
            background: p.bg,
            border: `2px solid ${p.border}`,
            borderRadius: 20,
            padding: "32px 28px",
            position: "relative",
            boxShadow: p.destaque ? "0 20px 60px rgba(220,38,38,.15)" : "0 1px 3px rgba(0,0,0,.06)",
            transform: p.destaque ? "scale(1.03)" : "none",
          }}>
            {p.destaque && (
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#dc2626", color: "#fff", borderRadius: 20, padding: "4px 16px", fontSize: 11, fontWeight: 800, letterSpacing: 1, whiteSpace: "nowrap" }}>
                MAIS POPULAR
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: p.cor, marginBottom: 8 }}>{p.nome}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{p.preco}</div>
              {p.periodo && <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{p.periodo}</div>}
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>{p.desc}</div>
            </div>

            <a
              href={p.ctaHref || "#"}
              onClick={p.ctaHref ? undefined : (e) => { e.preventDefault(); navigate("/cadastro"); }}
              style={{
                display: "block", textAlign: "center", padding: "13px 0",
                background: p.destaque ? "#dc2626" : "transparent",
                color: p.destaque ? "#fff" : p.cor,
                border: `2px solid ${p.destaque ? "#dc2626" : p.cor}`,
                borderRadius: 10, fontWeight: 800, fontSize: 14,
                textDecoration: "none", marginBottom: 28, transition: "all .15s",
              }}
            >
              {p.cta}
            </a>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {p.items.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#334155" }}>
                  <span style={{ color: "#16a34a", fontSize: 15, flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
              {p.nao.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#cbd5e1" }}>
                  <span style={{ color: "#cbd5e1", fontSize: 15, flexShrink: 0 }}>✕</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "48px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: 32 }}>Dúvidas frequentes</h2>
          {[
            ["Posso cancelar quando quiser?", "Sim. Sem multa, sem fidelidade. Cancele a qualquer momento pelo painel."],
            ["O que acontece com meus dados se cancelar?", "Seus dados ficam disponíveis por 30 dias após o cancelamento para exportação."],
            ["O plano Free é realmente grátis?", "Sim, para sempre. Sem cartão de crédito para começar."],
            ["Posso mudar de plano depois?", "Sim, upgrade ou downgrade a qualquer momento pelo painel de configurações."],
          ].map(([q, a]) => (
            <div key={q} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "24px", fontSize: 12, color: "#94a3b8" }}>
        Stick Frame Sistemas Construtivos · Santo André/SP · contato@stickframe.com.br
      </div>
    </div>
  );
}
