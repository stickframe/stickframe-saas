import { C } from "../utils/constants";

/**
 * ErrorState — erro amigável e acionável (handoff §4).
 * Props: title, message, onRetry (opcional → botão "Tentar novamente").
 */
export default function ErrorState({ title = "Algo não carregou", message, onRetry, compact }) {
  return (
    <div style={{
      background: "#fbeeec", border: "1px solid #ecccc7", borderRadius: 12,
      padding: compact ? "12px 14px" : "16px 18px",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div aria-hidden="true" style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: "#f6dad6", color: C.danger, display: "grid", placeItems: "center",
      }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{title}</div>
        {message && <div style={{ fontSize: 12, color: "#57514a", marginTop: 3, lineHeight: 1.5 }}>{message}</div>}
        {onRetry && (
          <button onClick={onRetry} style={{
            marginTop: 10, background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700,
            color: C.text, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
