import { useState } from "react";
import { C } from "../../utils/constants";

const fmtBig = (v) => {
  const n = Number(v || 0);
  if (n >= 1e6) return "R$ " + (n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "M";
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3) + "k";
  return "R$ " + Math.round(n);
};
const TOM = { danger: C.danger, warning: C.warning, steel: C.steel, muted: C.muted, success: C.success };

function ScoreRing({ score }) {
  const cor = score >= 85 ? C.danger : score >= 70 ? C.warning : C.steel;
  const r = 20, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0, textAlign: "center" }}>
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke={cor + "26"} strokeWidth="5" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={cor} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 16, color: cor, lineHeight: 1 }}>{score}</div>
      </div>
    </div>
  );
}

/** Card de ação priorizada: ring + verbo/entidade + chips + CTAs + Por quê + dismiss. */
export default function ActionCard({ acao, onCta, onDismiss }) {
  const [verPorque, setVerPorque] = useState(false);
  const e = acao.entidade || {};

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <ScoreRing score={acao.score} />
          <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.5, color: C.muted, textTransform: "uppercase", marginTop: 2 }}>Prioridade</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 15, color: C.text, fontWeight: 600, lineHeight: 1.3 }}>
              {acao.verbo} <span style={{ color: C.red, fontWeight: 700 }}>{e.nome}</span>
            </div>
            <button onClick={() => onDismiss?.(acao)} aria-label="Adiar" title="Adiar" style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 2 }}>×</button>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            <strong style={{ color: C.text }}>{fmtBig(e.valor)}</strong>{e.estagio ? ` · ${e.estagio}` : ""}
          </div>

          {/* Chips de motivo */}
          {acao.motivos?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
              {acao.motivos.map((m, i) => {
                const cor = TOM[m.tom] || C.muted;
                return <span key={i} style={{ fontSize: 10.5, fontWeight: 700, color: cor, background: `color-mix(in srgb, ${cor} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${cor} 26%, transparent)`, borderRadius: 6, padding: "3px 8px" }}>{m.t}</span>;
              })}
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11, alignItems: "center" }}>
            {acao.ctas?.map((c, i) => (
              <button key={i} onClick={() => onCta?.(acao, c)} style={{
                background: c.primary ? C.red : "transparent",
                color: c.primary ? "#fff" : C.text,
                border: c.primary ? "none" : `1px solid ${C.border}`,
                borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 38,
              }}>{c.label}</button>
            ))}
            <button onClick={() => setVerPorque((v) => !v)} style={{ background: "none", border: "none", color: C.steel, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Por quê?
            </button>
          </div>

          {verPorque && (
            <div style={{ marginTop: 9, fontSize: 11.5, color: C.muted, background: C.bg, borderRadius: 8, padding: "9px 11px", lineHeight: 1.5 }}>
              {acao.porque}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
