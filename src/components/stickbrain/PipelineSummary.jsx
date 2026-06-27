import { C } from "../../utils/constants";

const fmtBig = (v) => {
  const n = Number(v || 0);
  if (n >= 1e6) return "R$ " + (n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "M";
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3) + "k";
  return "R$ " + Math.round(n);
};

/** Card-herói: pipeline em aberto + breakdown por estágio (handoff §3). */
export default function PipelineSummary({ pipeline }) {
  const p = pipeline || {};
  const estagios = Array.isArray(p.por_estagio) ? p.por_estagio : [];
  const maxVal = Math.max(1, ...estagios.map((e) => Number(e.valor) || 0));

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.red}`,
      borderRadius: 14, padding: "18px 22px", marginBottom: 18,
      display: "grid", gridTemplateColumns: "minmax(220px,1fr) 2fr", gap: 24, alignItems: "center",
    }} className="pipeline-hero">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.red, textTransform: "uppercase" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          Pipeline em aberto
        </div>
        <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 44, color: C.text, lineHeight: 1, marginTop: 4 }}>
          {fmtBig(p.total)}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
          {p.delta_pct != null && (
            <span style={{ color: p.delta_pct >= 0 ? C.success : C.danger, fontWeight: 700 }}>
              {p.delta_pct >= 0 ? "▲" : "▼"} {Math.abs(p.delta_pct)}%{" "}
            </span>
          )}
          · {p.ativas || 0} oportunidades ativas
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 16 }}>
        {estagios.map((e, i) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: C.text }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.cor }} />
              {e.label}
            </div>
            <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 22, color: C.text, lineHeight: 1.1, marginTop: 3 }}>
              {fmtBig(e.valor)}
            </div>
            <div style={{ height: 5, background: C.border, borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
              <div style={{ height: 5, width: `${(Number(e.valor) / maxVal) * 100}%`, background: e.cor, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>{e.n || 0} oportunidades</div>
          </div>
        ))}
      </div>
    </div>
  );
}
