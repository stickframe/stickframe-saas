import { INPUT } from "./styles";

export function StatusBadge({ status }) {
  const map = { rascunho: ["#8c847a", "Rascunho"], analisado: ["#3b6ea5", "Analisado"], aprovado: ["#3f7a4b", "Aprovado ✓"] };
  const [c, label] = map[status] || map.rascunho;
  return <span style={{ color: c, fontWeight: 700 }}>{label}</span>;
}

export function StatusEstrutural({ status, mini }) {
  const map = {
    aprovado: ["#3f7a4b", "🟢", "Aprovado"], atencao: ["#b07a1e", "🟡", "Atenção"],
    revisar: ["#981915", "🔴", "Revisar"], indefinido: ["#8c847a", "⚪", "Indefinido"],
  };
  const [cor, emoji, label] = map[status] || map.indefinido;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: mini ? 11 : 12.5, fontWeight: 700, color: cor,
      background: mini ? "transparent" : cor + "18", border: mini ? "none" : `1px solid ${cor}44`, borderRadius: 20, padding: mini ? 0 : "4px 12px" }}>
      {emoji} {label}
    </span>
  );
}

export function CampoNum({ label, value, onChange }) {
  return (
    <label style={{ fontSize: 11.5, color: "var(--text-muted, #57514a)", display: "flex", flexDirection: "column", gap: 3 }}>
      {label}
      <input type="number" step="0.1" min="0" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...INPUT, width: 130, padding: "6px 8px" }} />
    </label>
  );
}

export function SelPerfil({ label, perfis, value, onChange }) {
  return (
    <label style={{ fontSize: 12, color: "var(--text-muted, #57514a)" }}>
      {label}:{" "}
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}
        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 12 }}>
        {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
    </label>
  );
}
