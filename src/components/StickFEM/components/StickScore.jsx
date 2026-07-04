const scoreColor = (value) => {
  if (value >= 90) return "#22c55e";
  if (value >= 70) return "#f59e0b";
  return "#ef4444";
};

const scoreLabel = (value) => {
  if (value >= 90) return "🟢 Excelente";
  if (value >= 70) return "🟡 Bom";
  return "🔴 Precisa de atenção";
};

export default function StickScore({ score, details, onDetailsClick }) {
  return (
    <div
      onClick={onDetailsClick}
      style={{
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12,
        padding: "12px 16px", cursor: "pointer", minWidth: 220,
      }}
      title="Clique para ver o detalhamento do StickScore™"
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.5 }}>StickScore™</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(score) }}>{score}</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>/100</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(score) }}>{scoreLabel(score)}</span>
      </div>
      {details && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
          {Object.entries(details).map(([key, value]) => (
            <span key={key} style={{ fontSize: 10.5, color: "var(--muted)" }}>
              {key}: <b style={{ color: scoreColor(value) }}>{value}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}