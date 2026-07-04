import { useState, useMemo } from "react";
import { STATUS_META } from "../../../services/stickfem/comparison/diffEngine";
import { CARD } from "../utils/styles";

// Viewer CAD do Engineering Diff: desenha os elementos coloridos por status,
// com legenda e liga/desliga por categoria. Render-only.
const ORDEM = ["novo", "removido", "modificado", "movido", "igual"];

export default function ComparisonViewer({ itens }) {
  const [visiveis, setVisiveis] = useState({ novo: true, removido: true, modificado: true, movido: true, igual: false });

  // bounds a partir de todas as geometrias (antes e depois)
  const bounds = useMemo(() => {
    const xs = [], ys = [];
    for (const it of itens) for (const el of [it.a, it.b]) {
      const g = el?.geometria; if (!g) continue;
      xs.push(g.x1, g.x2); ys.push(g.y1, g.y2);
    }
    if (!xs.length) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
  }, [itens]);

  const pad = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.05 || 1;
  const vb = `${bounds.minX - pad} ${bounds.minY - pad} ${(bounds.maxX - bounds.minX) + 2 * pad} ${(bounds.maxY - bounds.minY) + 2 * pad}`;
  const flipY = bounds.maxY + bounds.minY;
  const sw = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) / 300 || 0.02;

  const linha = (g, cor, key, dash) => g && g.x1 != null && (
    <line key={key} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={cor}
      strokeWidth={sw * 2.4} strokeLinecap="round" opacity={0.9} strokeDasharray={dash || undefined} />
  );

  return (
    <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "8px 12px", borderBottom: "1px solid var(--line)" }}>
        {ORDEM.map((st) => (
          <label key={st} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-muted, #57514a)", cursor: "pointer" }}>
            <input type="checkbox" checked={visiveis[st]} onChange={() => setVisiveis((v) => ({ ...v, [st]: !v[st] }))} />
            <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_META[st].cor, display: "inline-block" }} />
            {STATUS_META[st].label}
          </label>
        ))}
      </div>
      <svg viewBox={vb} style={{ width: "100%", height: 320, background: "#0f1115", display: "block" }} preserveAspectRatio="xMidYMid meet">
        <g transform={`matrix(1 0 0 -1 0 ${flipY})`}>
          {itens.map((it, i) => {
            if (!visiveis[it.status]) return null;
            const cor = STATUS_META[it.status].cor;
            if (it.status === "movido") {
              // desenha antes (tracejado) e depois (cheio)
              return [linha(it.a?.geometria, cor, `m-a-${i}`, `${sw * 3},${sw * 2}`), linha(it.b?.geometria, cor, `m-b-${i}`)];
            }
            const g = (it.b || it.a)?.geometria;
            return linha(g, cor, `e-${i}`);
          })}
        </g>
      </svg>
    </div>
  );
}
