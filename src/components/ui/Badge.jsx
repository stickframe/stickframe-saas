export default function Badge({ label, color, dot = false }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: color, flexShrink: 0, display: "inline-block",
        }} />
      )}
      {label}
    </span>
  );
}
