import { C } from "../../utils/constants";

const CORES = {
  "Indicação": C.success, "Google": C.steel, "Calculadora": C.ochre,
  "PDF": C.red, "AI Vision": C.purple, "DWG": "#4f7d57",
};
const corOrigem = (o) => {
  const k = Object.keys(CORES).find((c) => String(o).toLowerCase().includes(c.toLowerCase()));
  return k ? CORES[k] : C.muted;
};

/** Origem dos leads: volume (barra) + conversão p/ venda (%). */
export default function OriginPerformanceChart({ origens }) {
  const lista = (Array.isArray(origens) ? origens : []).slice().sort((a, b) => (b.leads || 0) - (a.leads || 0));
  const max = Math.max(1, ...lista.map((o) => Number(o.leads) || 0));

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 19, color: C.text }}>Origem dos leads</div>
      <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 14 }}>Volume e conversão para venda</div>

      {lista.length === 0 ? (
        <div style={{ fontSize: 12.5, color: C.muted, padding: "16px 0" }}>Sem dados de origem ainda.</div>
      ) : lista.map((o, i) => {
        const cor = corOrigem(o.origem);
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr 52px", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text, fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.origem}</span>
            </div>
            <div style={{ background: C.bg, borderRadius: 6, height: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ background: cor, height: 20, width: `${(Number(o.leads) / max) * 100}%`, borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 8, color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {o.leads}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: o.conversao >= 0.35 ? C.success : C.muted, background: C.bg, borderRadius: 6, padding: "2px 7px", textAlign: "center" }}>
              {o.conversao != null ? `${Math.round(o.conversao * 100)}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
