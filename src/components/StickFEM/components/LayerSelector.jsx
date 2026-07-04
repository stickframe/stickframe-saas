import { CARD, BTN_GHOST } from "../utils/styles";

// ── 2 · Confirmação de layers (o engenheiro decide o que é estrutura) ────────
export default function LayerSelector({ layers, layerCfg, onLayerCfgChange, onReprocessar }) {
  if (!layers.length) return null;
  return (
    <div style={CARD}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)" }}>
          2 · Confirmar layers <span style={{ fontWeight: 400, color: "var(--muted)" }}>(o engenheiro decide o que é estrutura)</span>
        </div>
        <button onClick={onReprocessar} style={BTN_GHOST}>↻ Reprocessar</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {layers.map((l) => (
          <div key={l.layer} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 9px" }}>
            <span style={{ fontSize: 11.5, color: "var(--text, #26231f)", fontWeight: 600 }}>{l.layer}</span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>({l.segmentos})</span>
            <select value={layerCfg[l.layer] || l.sugerido}
              onChange={(ev) => onLayerCfgChange(l.layer, ev.target.value)}
              style={{ fontSize: 11, padding: "2px 4px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)" }}>
              <option value="parede">parede</option>
              <option value="viga">viga</option>
              <option value="abertura">abertura</option>
              <option value="ignorar">ignorar</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
