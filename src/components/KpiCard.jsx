import { C } from "../utils/constants";

/**
 * KpiCard unificado — variação A (borda no topo por acento).
 * Specs: handoff design_handoff_polimento_ux §1.
 *
 * Props:
 *  - label   (string)            rótulo uppercase
 *  - value   (string|number)     número grande (Barlow Condensed 800)
 *  - sub     (string)            linha de apoio (cor por `subtone`)
 *  - subtone ('pos'|'neg'|'warn'|'muted')  cor do sub (default muted)
 *  - accent  (cor token)         cor da borda superior + ícone (default red)
 *  - icon    (ReactNode)         ícone Lucide inline (stroke=currentColor)
 *  - alerta  ('warning'|'danger')  adiciona borda esquerda colorida
 */
export default function KpiCard({ label, value, sub, subtone = "muted", accent = C.red, icon, alerta }) {
  const alertaCor = alerta === "danger" ? C.danger : alerta === "warning" ? C.warning : null;
  const subCor = subtone === "pos" ? C.success
    : subtone === "neg" ? C.danger
    : subtone === "warn" ? C.warning
    : C.muted;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderTop: `3px solid ${accent}`,
      borderLeft: alertaCor ? `3px solid ${alertaCor}` : `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "15px 16px",
      boxShadow: "0 1px 3px rgba(40,30,20,.08), 0 1px 2px rgba(40,30,20,.05)",
      position: "relative",
    }}>
      {icon && (
        <div aria-hidden="true" style={{
          position: "absolute", top: 14, right: 14, width: 26, height: 26, borderRadius: 7,
          display: "grid", placeItems: "center",
          background: `color-mix(in srgb, ${accent} 12%, #fff)`, color: accent,
        }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 30, lineHeight: 1, color: C.text, marginTop: 7 }}>
        {value}
      </div>
      {sub != null && sub !== "" && (
        <div style={{ fontSize: 11, marginTop: 6, color: subCor, fontWeight: 600 }}>{sub}</div>
      )}
    </div>
  );
}

/** Grid container que reflui (2 colunas em 390px). */
export function KpiGrid({ children, style }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, ...style }}>
      {children}
    </div>
  );
}
