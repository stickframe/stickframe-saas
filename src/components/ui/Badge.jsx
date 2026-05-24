export default function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: "2px 9px", fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
    }}>
      {label}
    </span>
  );
}
