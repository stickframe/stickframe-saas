import { useEffect } from "react";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useTrial } from "../hooks/useTrial";

const cond = "var(--cond)";

// Planos oferecidos como upgrade dentro do app. Reaproveita a estrutura
// da página pública /pricing, mas em tema claro e com CTA contextual.
const PLANOS = {
  pro: {
    key: "profissional",
    nome: "Profissional",
    preco: "R$ 197",
    periodo: "por mês",
    cor: C.red,
    desc: "Margem, prazo e cliente na palma da mão.",
    items: [
      "Obras ilimitadas",
      "Até 10 usuários",
      "CRM de clientes + Relatórios PDF",
      "Diário de obra + fotos",
      "Medições e contratos",
      "StickScore™ — Alerta de Estouro",
      "Suporte prioritário no WhatsApp",
    ],
  },
  enterprise: {
    key: "construtora",
    nome: "Construtora+",
    preco: "Sob consulta",
    periodo: "plano sob medida",
    cor: C.purple,
    desc: "Multi-operação com inteligência total.",
    items: [
      "Tudo do Profissional",
      "Usuários ilimitados",
      "Multi-empresa",
      "Marca própria (white-label total)",
      "Integração ERP",
      "SLA garantido",
      "Onboarding com engenheiro",
    ],
  },
};

const WHATSAPP_ENTERPRISE =
  "https://wa.me/551140038929?text=Ol%C3%A1%2C+quero+fazer+upgrade+para+o+plano+Construtora%2B+do+StickFrame";

function PlanoCard({ plano, destaque, onCta, ctaLabel }) {
  return (
    <div style={{
      background: destaque ? "var(--brick-soft,#f3e7e5)" : "var(--surface,#fff)",
      border: `1.5px solid ${destaque ? plano.cor : "var(--line,#e7e1d8)"}`,
      borderRadius: 16, padding: "28px 26px", position: "relative", flex: "1 1 320px", maxWidth: 420,
    }}>
      {destaque && (
        <div style={{ position: "absolute", top: -12, left: 26, background: plano.cor, color: "#fff", borderRadius: 20, padding: "3px 14px", fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>
          Recomendado
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: plano.cor, marginBottom: 8 }}>{plano.nome}</div>
      <div style={{ fontFamily: cond, fontSize: 34, fontWeight: 800, color: "var(--ink,#26231f)", lineHeight: 1 }}>{plano.preco}</div>
      <div style={{ fontSize: 12, color: "var(--muted,#8c847a)", marginTop: 4 }}>{plano.periodo}</div>
      <div style={{ fontSize: 13, color: "var(--ink-2,#57514a)", marginTop: 10, marginBottom: 18 }}>{plano.desc}</div>

      <button onClick={onCta} style={{
        width: "100%", padding: "12px 0", background: destaque ? plano.cor : "transparent",
        color: destaque ? "#fff" : plano.cor, border: `1.5px solid ${plano.cor}`,
        borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginBottom: 22,
      }}>
        {ctaLabel}
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {plano.items.map((it) => (
          <div key={it} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-2,#57514a)" }}>
            <span style={{ color: "var(--pos,#3f7a4b)", fontWeight: 800, flexShrink: 0 }}>✓</span>
            {it}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Planos() {
  const planoReal = useAppStore((s) => s.planoReal ?? s.user?.plano ?? "free");
  const empresaId = useAppStore((s) => s.empresaId);
  const user = useAppStore((s) => s.user);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const { isTrial, isExpired, daysLeft } = useTrial();

  // Telemetria de produto: visualizou planos
  useEffect(() => {
    import("../services/health/productMetrics").then(({ trackViewedPricing, setMetricsContext }) => {
      if (user && empresaId) setMetricsContext(user.uid || user.id, empresaId);
      trackViewedPricing();
    }).catch(() => {});
  }, [user, empresaId]);

  // Logado → /checkout (ativa/atualiza assinatura na conta atual).
  function irParaCheckout(planKey) {
    window.location.assign(`/checkout?plan=${planKey}`);
  }
  function falarConstrutora() {
    window.open(WHATSAPP_ENTERPRISE, "_blank", "noopener");
  }

  const ehEnterprise = planoReal === "enterprise";
  const ehPro = planoReal === "pro" && !isTrial && !isExpired;
  // free, trial ativo ou trial expirado → mostra Pro + Enterprise

  const Header = (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontFamily: cond, fontWeight: 800, fontSize: 30, color: "var(--ink,#26231f)", lineHeight: 1.05 }}>
        Planos <span style={{ color: C.red }}>StickFrame™</span>
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-2,#57514a)", marginTop: 6, maxWidth: 560 }}>
        {ehEnterprise
          ? "Você está no plano mais completo. Aproveite todos os módulos do Ecossistema Stick™."
          : ehPro
            ? "Você está no plano Profissional. Faça upgrade para o Construtora+ quando precisar de multi-operação."
            : (isTrial || isExpired)
              ? `Seu trial Pro ${isExpired ? "expirou" : `expira em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`}. Garanta seu acesso escolhendo um plano.`
              : "Desbloqueie obras ilimitadas, CRM, StickScore™ e muito mais."}
      </p>
    </div>
  );

  // Enterprise/full — sem upsell
  if (ehEnterprise) {
    return (
      <div>
        {Header}
        <div style={{ background: "var(--surface,#fff)", border: "1px solid var(--line,#e7e1d8)", borderRadius: 16, padding: "40px 36px", textAlign: "center", maxWidth: 620 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--brick-soft,#f3e7e5)", display: "grid", placeItems: "center", margin: "0 auto 18px", fontSize: 26 }}>✓</div>
          <div style={{ fontFamily: cond, fontWeight: 800, fontSize: 24, color: "var(--ink,#26231f)", marginBottom: 8 }}>Você já tem o plano completo</div>
          <p style={{ fontSize: 13.5, color: "var(--ink-2,#57514a)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 22px" }}>
            Seu plano <strong>Construtora+</strong> inclui todos os módulos, usuários ilimitados, white-label e SLA garantido. Não há nada para fazer upgrade.
          </p>
          <button onClick={() => setActivePage("crm")} style={{
            background: C.red, color: "#fff", border: "none", borderRadius: 10, padding: "12px 26px",
            fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>
            Falar com suporte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {Header}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
        {!ehPro && (
          <PlanoCard
            plano={PLANOS.pro}
            destaque
            ctaLabel={isTrial || isExpired ? "Assinar o Profissional →" : "Testar 14 dias grátis →"}
            onCta={() => irParaCheckout(PLANOS.pro.key)}
          />
        )}
        <PlanoCard
          plano={PLANOS.enterprise}
          destaque={ehPro}
          ctaLabel="Falar com especialista"
          onCta={falarConstrutora}
        />
      </div>

      <p style={{ fontSize: 12, color: "var(--muted,#8c847a)", marginTop: 22 }}>
        Sem fidelidade. Cancele quando quiser. Dúvidas? <button onClick={() => setActivePage("crm")} style={{ background: "none", border: "none", color: C.red, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: 0 }}>Fale com o suporte</button>.
      </p>
    </div>
  );
}
