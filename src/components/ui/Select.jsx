import { C } from "../../utils/constants";

export default function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "9px 13px", color: C.text, fontSize: 13,
        outline: "none", fontFamily: "inherit", cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}
