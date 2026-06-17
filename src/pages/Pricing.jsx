import { useNavigate } from "react-router-dom";

const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

const PLANOS = [
  {
    key: "essencial",
    nome: "Essencial",
    preco: "R$ 97",
    periodo: "por mês",
    desc: "Pra começar com o pé direito",
    cor: "#3b6ea5",
    border: "rgba(59,110,165,.4)",
    bg: "rgba(59,110,165,.06)",
    items: [
      "3 obras ativas",
      "2 usuários",
      "Orçamentos e diário de obra",
      "Calculadora white-label",
      "Suporte por e-mail",
    ],
    nao: ["Obras ilimitadas", "CRM de clientes", "Relatórios PDF", "StickScore™"],
    cta: "Assinar Essencial",
    checkoutPlan: "essencial",
    destaque: false,
  },
  {
    key: "profissional",
    nome: "Profissional",
    preco: "R$ 197",
    periodo: "por mês · 14 dias grátis",
    desc: "Para construtoras em crescimento",
    cor: "#981915",
    border: "#981915",
    bg: "rgba(152,25,21,.08)",
    items: [
      "Obras ilimitadas",
      "Até 10 usuários",
      "Calculadora white-label",
      "Diário de obra + fotos",
      "Orçamentos completos",
      "CRM de clientes",
      "Relatórios PDF",
      "Medições e contratos",
      "StickScore™ — Alerta de Estouro",
      "Suporte prioritário no WhatsApp",
    ],
    nao: [],
    cta: "Testar 14 dias grátis →",
    checkoutPlan: "profissional",
    destaque: true,
  },
  {
    key: "construtora",
    nome: "Construtora+",
    preco: "Sob consulta",
    periodo: "",
    desc: "Pra grandes operações",
    cor: "#6d557e",
    border: "rgba(109,85,126,.3)",
    bg: "rgba(109,85,126,.05)",
    items: [
      "Tudo do Profissional",
      "Usuários ilimitados",
      "Multi-empresa",
      "Marca própria (white-label total)",
      "Integração ERP",
      "SLA garantido",
      "Onboarding com engenheiro",
    ],
    nao: [],
    cta: "Falar com especialista",
    ctaHref: "https://wa.me/551140038929?text=Ol%C3%A1%2C+tenho+interesse+no+plano+Construtora%2B+do+StickFrame",
    destaque: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  // Logado → /checkout (ativa trial/assinatura na conta atual).
  // Deslogado → /cadastro com o plano na URL.
  async function irParaPlano(planKey) {
    const { sb } = await import("../services/supabase");
    const { data } = await sb.auth.getSession();
    if (data?.session) {
      navigate(`/checkout?plan=${planKey}`);
    } else {
      navigate(`/cadastro?plan=${planKey}`);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#1c1b20", fontFamily: "'Hanken Grotesk', sans-serif", color: "#ece7df" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={LOGO} alt="StickFrame" style={{ height: 36, width: 36, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ fontWeight: 900, letterSpacing: 2, fontSize: 15, color: "#fff" }}>STICK<span style={{ color: "#981915" }}>FRAME</span></span>
        </a>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/login" style={{ color: "rgba(255,255,255,.6)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Entrar</a>
          <a href="/cadastro" style={{ background: "#981915", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Criar conta grátis</a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "56px 24px 40px" }}>
        <div style={{ display: "inline-block", background: "rgba(152,25,21,.15)", border: "1px solid rgba(152,25,21,.3)", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, color: "#981915", letterSpacing: 1.5, marginBottom: 20, textTransform: "uppercase" }}>
          Planos e Preços
        </div>
        <h1 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", letterSpacing: -1 }}>
          Simples, transparente,<br />sem surpresas
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.5)", maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
          Comece grátis, faça upgrade quando precisar. Sem contrato de fidelidade.
        </p>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "8px 24px 56px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>
        {PLANOS.map((p) => (
          <div key={p.key} style={{
            background: p.bg,
            border: `1.5px solid ${p.border}`,
            borderRadius: 16,
            padding: "28px 24px",
            position: "relative",
          }}>
            {p.destaque && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#981915", color: "#fff", borderRadius: 20, padding: "3px 14px", fontSize: 10, fontWeight: 800, letterSpacing: 1.5, whiteSpace: "nowrap" }}>
                MAIS POPULAR
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: p.cor, marginBottom: 10 }}>{p.nome}</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{p.preco}</div>
              {p.periodo && <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 4 }}>{p.periodo}</div>}
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 8 }}>{p.desc}</div>
            </div>

            <a
              href={p.ctaHref || "#"}
              onClick={p.checkoutPlan ? (e) => { e.preventDefault(); irParaPlano(p.checkoutPlan); } : undefined}
              style={{
                display: "block", textAlign: "center", padding: "12px 0",
                background: p.destaque ? "#981915" : "transparent",
                color: p.destaque ? "#fff" : p.cor,
                border: `1.5px solid ${p.destaque ? "#981915" : p.border}`,
                borderRadius: 8, fontWeight: 800, fontSize: 14,
                textDecoration: "none", marginBottom: 24,
              }}
            >
              {p.cta}
            </a>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {p.items.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,.75)" }}>
                  <span style={{ color: "#3f7a4b", fontSize: 14, flexShrink: 0 }}></span>
                  {item}
                </div>
              ))}
              {p.nao.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,.2)" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 32 }}>Dúvidas frequentes</h2>
          {[
            ["Posso cancelar quando quiser?", "Sim. Sem multa, sem fidelidade. Cancele a qualquer momento pelo painel."],
            ["O que acontece com meus dados se cancelar?", "Seus dados ficam disponíveis por 30 dias após o cancelamento para exportação."],
            ["O plano Free é realmente grátis?", "Sim, para sempre. Sem cartão de crédito para começar."],
            ["Posso mudar de plano depois?", "Sim, upgrade ou downgrade a qualquer momento pelo painel de configurações."],
          ].map(([q, a]) => (
            <div key={q} style={{ borderBottom: "1px solid rgba(255,255,255,.08)", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.65 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px 24px", fontSize: 11, color: "rgba(255,255,255,.2)", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        Stick Frame Sistemas Construtivos · Santo André/SP · contato@stickframe.com.br
      </div>
    </div>
  );
}
