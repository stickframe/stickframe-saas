/**
 * SmartCTA — CTA contextual da StickFrame Conversion Layer™ (C.6).
 *
 * Mostra um call-to-action diferente conforme o estágio do visitante:
 *   - novo        → "Comece sua primeira simulação"   → /calcular
 *   - retornando  → "Continue sua análise"             → /calcular
 *   - trial       → "Complete sua ativação"            → /dashboard
 *
 * O estágio pode ser passado por prop (`stage`) ou inferido por `isTrial` /
 * `isReturning`. Dispara `cta_clicked` no GA4 (não quebra navegação se o GA
 * não estiver disponível — o trackEvent é no-op nesse caso).
 *
 * Uso:
 *   <SmartCTA isTrial={plano==='trial'} isReturning={!!user} location="landing-hero" />
 *   <SmartCTA stage="novo" />
 */
import { analytics } from "../../utils/analytics";

const VARIANTS = {
  novo: {
    label: "Comece sua primeira simulação",
    href:  "/calcular",
    sub:   "Estime o custo da sua obra em 1 minuto",
  },
  retornando: {
    label: "Continue sua análise",
    href:  "/calcular",
    sub:   "Retome de onde parou",
  },
  trial: {
    label: "Complete sua ativação",
    href:  "/dashboard",
    sub:   "Finalize os passos e libere todo o StickFrame™",
  },
};

function resolveStage({ stage, isTrial, isReturning }) {
  if (stage && VARIANTS[stage]) return stage;
  if (isTrial) return "trial";
  if (isReturning) return "retornando";
  return "novo";
}

export default function SmartCTA({
  stage,
  isTrial = false,
  isReturning = false,
  location = "smart-cta",
  variant = "primary",   // "primary" | "outline"
  showSub = true,
  style = {},
  onClick,
}) {
  const key = resolveStage({ stage, isTrial, isReturning });
  const v = VARIANTS[key];

  const handleClick = (e) => {
    try { analytics.ctaClicked(v.label, location); } catch (_) { /* GA opcional */ }
    onClick?.(e, key);
  };

  const base = {
    display: "inline-flex", flexDirection: "column", alignItems: "center",
    gap: 2, textDecoration: "none", borderRadius: 12, padding: "12px 22px",
    fontFamily: "inherit", fontWeight: 800, fontSize: 15, lineHeight: 1.2,
    cursor: "pointer", transition: ".15s",
    ...(variant === "outline"
      ? { background: "transparent", color: "#981915", border: "2px solid #981915" }
      : { background: "#981915", color: "#fff", border: "2px solid #981915" }),
    ...style,
  };

  return (
    <a href={v.href} onClick={handleClick} className="smart-cta" style={base}
       data-stage={key} aria-label={v.label}>
      <span>{v.label} →</span>
      {showSub && v.sub && (
        <span style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.75 }}>{v.sub}</span>
      )}
    </a>
  );
}

export { VARIANTS as SMART_CTA_VARIANTS, resolveStage };
