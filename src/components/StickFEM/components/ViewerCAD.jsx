import { CARD, COR_TIPO } from "../utils/styles";

// ── Viewer CAD 2D (SVG) + Mapa de Confiança (Fase 2) ─────────────────────────
export default function ViewerCAD({ geometria, elementos, perfis }) {
  const b = geometria.bounds;
  const pad = Math.max((b.maxX - b.minX), (b.maxY - b.minY)) * 0.05 || 1;
  const vb = `${b.minX - pad} ${b.minY - pad} ${(b.maxX - b.minX) + 2 * pad} ${(b.maxY - b.minY) + 2 * pad}`;
  const flipY = b.maxY + b.minY; // espelha Y (SVG cresce pra baixo)
  const sw = Math.max((b.maxX - b.minX), (b.maxY - b.minY)) / 300 || 0.02;

  const getConfidenceColor = (el) => {
    // Fase 2: Mapa de Confiança
    switch (el.confianca) {
      case 'alta': return '#22c55e'; // green-500
      case 'media': return '#f59e0b'; // amber-500
      case 'baixa': return '#ef4444'; // red-500
      default: return COR_TIPO[el.tipo] || '#fff';
    }
  };

  const handleElementClick = (el) => {
    // Fase 2: Detalhes ao clicar & IA Explicável (confiança numérica + fatores).
    const perfilNome = perfis.find(p => p.id === el.perfil_id)?.nome || 'Não atribuído';
    const motivos = (el.motivosConfianca || ['N/A']).join('\n  - ');
    const fatores = (el.confiancaFatores || [])
      .map((f) => `  ${f.ativacao > 0 ? '＋' : '－'} ${f.label}: ${f.contribuicao} de ${Math.round(f.peso * 100)} (peso ${f.peso})`)
      .join('\n');

    const info = [
      `Elemento: ${el.nome}`,
      '---------------------------',
      `Layer: ${el.layer_origem}`,
      `Tipo: ${el.tipo}`,
      `Perfil: ${perfilNome}`,
      `Comprimento: ${el.comprimento_m?.toFixed(2) || 'N/A'} m`,
      `Confiança: ${el.confiancaScore != null ? el.confiancaScore + '%' : el.confianca} (${el.confianca})`,
      '---------------------------',
      'Fatores da confiança (o que somou):',
      fatores || '  N/A',
      '---------------------------',
      'Decisão da IA:',
      `  - ${motivos}`,
    ].join('\n');
    alert(info);
  };

  return (
    <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
      <svg viewBox={vb} style={{ width: "100%", height: 340, background: "#0f1115", display: "block" }}
        preserveAspectRatio="xMidYMid meet">
        <g transform={`matrix(1 0 0 -1 0 ${flipY})`}>
          {(geometria.lines || []).map((l, i) => (
            <line key={"l" + i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(255,255,255,.18)" strokeWidth={sw} />
          ))}
          {(geometria.polylines || []).map((p, i) => (
            <polyline key={"p" + i} points={p.pontos.map((pt) => `${pt.x},${pt.y}`).join(" ")}
              fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={sw} />
          ))}
          {(elementos || []).filter((e) => e.geometria?.x1 != null).map((e, i) => (
            <line key={"e" + i} x1={e.geometria.x1} y1={e.geometria.y1} x2={e.geometria.x2} y2={e.geometria.y2}
              stroke={getConfidenceColor(e)} strokeWidth={sw * 2.4} strokeLinecap="round" opacity={0.9}
              onClick={() => handleElementClick(e)} style={{ cursor: 'pointer' }} />
          ))}
        </g>
      </svg>
    </div>
  );
}
