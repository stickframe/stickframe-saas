import { C } from "../../utils/constants";

const fmtBig = (v) => {
  const n = Number(v || 0);
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3) + "k";
  return "R$ " + Math.round(n);
};

/** Alta chance de fechar: oportunidades por probabilidade estimada. */
export default function DealCloseList({ oportunidades, onAbrir }) {
  const lista = (Array.isArray(oportunidades) ? oportunidades : [])
    .slice().sort((a, b) => (b.prob || 0) - (a.prob || 0)).slice(0, 5);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
        <span style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 17, color: C.text }}>Alta chance de fechar</span>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Probabilidade estimada pela IA</div>
      {lista.length === 0 ? <div style={{ fontSize: 12, color: C.muted }}>Sem dados ainda.</div> :
        lista.map((o, i) => {
          const cor = o.prob >= 70 ? C.success : o.prob >= 50 ? C.warning : C.muted;
          return (
            <button key={i} onClick={() => onAbrir?.(o)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "9px 4px",
              borderTop: i ? `1px solid ${C.border}` : "none", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
                background: `color-mix(in srgb, ${cor} 14%, transparent)`, color: cor, fontFamily: "var(--cond)", fontWeight: 800, fontSize: 14 }}>
                {o.prob}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.nome}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtBig(o.valor)} · {o.estagio}</div>
              </div>
              <span style={{ color: C.muted, fontSize: 16 }}>›</span>
            </button>
          );
        })}
    </div>
  );
}
