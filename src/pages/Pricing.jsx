import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/useAppStore";
import PricingPlans from "../components/PricingPlans";

const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

const FAQ = [
  ["Posso cancelar quando quiser?", "Sim. Sem multa, sem fidelidade. Cancele a qualquer momento pelo painel."],
  ["O que acontece com meus dados se cancelar?", "Seus dados ficam disponíveis por 30 dias após o cancelamento para exportação."],
  ["O plano Free é realmente grátis?", "Sim, para sempre. Sem cartão de crédito para começar."],
  ["Posso mudar de plano depois?", "Sim, upgrade ou downgrade a qualquer momento pelo painel de configurações."],
];

export default function Pricing() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const empresaId = useAppStore((s) => s.empresaId);

  useEffect(() => {
    import("../services/health/productMetrics").then(({ trackViewedPricing, setMetricsContext }) => {
      // /pricing roda fora do AppLayout — seta o contexto p/ o evento gravar (logado)
      if (user && empresaId) setMetricsContext(user.uid || user.id, empresaId);
      trackViewedPricing();
    }).catch(() => {});
  }, [user, empresaId]);

  // Mantém os handlers de assinatura/contato já existentes:
  // - link externo (Construtora+ / wa.me) → abre normalmente
  // - logado → /checkout (ativa trial/assinatura na conta atual)
  // - deslogado → /cadastro com o plano na URL
  async function onSelect(key, pl) {
    if (pl.href?.startsWith("http")) {
      window.open(pl.href, "_blank", "noopener");
      return;
    }
    const { sb } = await import("../services/supabase");
    const { data } = await sb.auth.getSession();
    navigate(`${data?.session ? "/checkout" : "/cadastro"}?plan=${key}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f1ec", fontFamily: "'Hanken Grotesk', sans-serif", color: "#26231f" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e7e1d8", background: "#fff" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={LOGO} alt="StickFrame" style={{ height: 36, width: 36, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ fontWeight: 900, letterSpacing: 2, fontSize: 15, color: "#26231f" }}>STICK<span style={{ color: "#981915" }}>FRAME</span></span>
        </a>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {user ? (
            <a href="/" style={{ background: "#26231f", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>← Voltar ao sistema</a>
          ) : (
            <>
              <a href="/login" style={{ color: "#57514a", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Entrar</a>
              <a href="/cadastro" style={{ background: "#981915", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Criar conta grátis</a>
            </>
          )}
        </div>
      </div>

      {/* Planos — componente único compartilhado com a landing */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 24px 56px" }}>
        <PricingPlans onSelect={onSelect} />
      </div>

      {/* FAQ */}
      <div style={{ borderTop: "1px solid #e7e1d8", padding: "56px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 700, color: "#26231f", textAlign: "center", marginBottom: 32 }}>Dúvidas frequentes</h2>
          {FAQ.map(([q, a]) => (
            <div key={q} style={{ borderBottom: "1px solid #e7e1d8", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#26231f", marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 14, color: "#57514a", lineHeight: 1.65 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px 24px", fontSize: 12, color: "#8c847a", background: "#f4f1ec" }}>
        Stick Frame Sistemas Construtivos · Santo André/SP · contato@stickframe.com.br
      </div>
    </div>
  );
}
