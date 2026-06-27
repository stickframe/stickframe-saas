import { C } from "../utils/constants";

/**
 * EmptyState padronizado — handoff §3.
 * Props:
 *  - icon        (ReactNode)  ícone Lucide inline (stroke=currentColor)
 *  - title       (string)
 *  - description (string)
 *  - action      ({ label, onClick, variant? })  CTA opcional ('primary'|'ghost')
 *  - compact     (bool)       padding menor para contextos internos (modais)
 */
export default function EmptyState({ icon, title, description, action, compact }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      padding: compact ? "22px 18px" : "34px 24px",
    }}>
      <div aria-hidden="true" style={{
        width: 60, height: 60, borderRadius: "50%", background: C.brickSoft,
        display: "grid", placeItems: "center", color: C.red, marginBottom: 14,
      }}>
        {icon || <DefaultIcon />}
      </div>
      <div style={{ fontFamily: "var(--cond)", fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 5 }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 12.5, color: C.muted, maxWidth: 280, lineHeight: 1.55 }}>{description}</div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 16,
            background: action.variant === "ghost" ? "transparent" : C.red,
            color: action.variant === "ghost" ? C.text : "#fff",
            border: action.variant === "ghost" ? `1px solid ${C.border}` : "none",
            borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", minHeight: 40,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
