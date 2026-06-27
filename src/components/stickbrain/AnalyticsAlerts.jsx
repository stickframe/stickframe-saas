import { C } from "../../utils/constants";

const fmtBig = (v) => {
  const n = Number(v || 0);
  if (n >= 1e6) return "R$ " + (n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "M";
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3) + "k";
  return "R$ " + Math.round(n);
};

/** Alertas inteligentes com valor em R$ + ação (handoff §9). */
export default function AnalyticsAlerts({ alertas, onAcao }) {
  const lista = Array.isArray(alertas) ? alertas : [];
  if (lista.length === 0) return null;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        <span style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 19, color: C.text }}>Alertas inteligentes</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lista.map((a, i) => {
          const cor = a.nivel === "danger" ? C.danger : C.warning;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 13px",
              background: `color-mix(in srgb, ${cor} 7%, ${C.surface})`,
              border: `1px solid color-mix(in srgb, ${cor} 28%, transparent)`, borderRadius: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  {a.titulo}{a.valor ? <span style={{ color: cor }}> · {fmtBig(a.valor)} parados</span> : null}
                </div>
                {a.detalhe && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{a.detalhe}</div>}
              </div>
              {a.acao && (
                <button onClick={() => onAcao?.(a)} style={{
                  background: cor, color: "#fff", border: "none", borderRadius: 8,
                  padding: "7px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap", minHeight: 36,
                }}>{a.acao}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
