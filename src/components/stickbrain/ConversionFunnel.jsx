import { C } from "../../utils/constants";

/** Funil comercial: barras decrescentes Lead→StickQuote→Orçamento→Venda + taxas. */
export default function ConversionFunnel({ funil, periodo }) {
  const etapas = Array.isArray(funil) ? funil : [];
  const max = Math.max(1, ...etapas.map((e) => Number(e.n) || 0));

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 19, color: C.text }}>Funil comercial</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>Lead → StickQuote → Orçamento → Venda</div>
        </div>
        {periodo && <span style={{ fontSize: 11, color: C.muted, background: C.bg, borderRadius: 20, padding: "3px 10px" }}>{periodo}</span>}
      </div>

      {etapas.map((e, i) => {
        const prox = etapas[i + 1];
        const taxa = prox && Number(e.n) > 0 ? Math.round((Number(prox.n) / Number(e.n)) * 100) : null;
        return (
          <div key={i}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: e.cor, color: "#fff", borderRadius: 8, padding: "12px 16px",
              width: `${40 + (Number(e.n) / max) * 60}%`, minWidth: 180,
            }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{e.etapa}</span>
              <span style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 20 }}>{e.n}</span>
            </div>
            {prox && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 4px 7px 8px" }}>
                <span style={{ fontSize: 11, color: C.muted }}>↓ de {e.etapa} para {prox.etapa}</span>
                {taxa != null && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: taxa >= 40 ? C.success : C.warning, background: C.bg, borderRadius: 6, padding: "2px 8px" }}>{taxa}%</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
