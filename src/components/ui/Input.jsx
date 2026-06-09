import { C } from "../../utils/constants";

export default function Input({ value, onChange, placeholder, type = "text", hasError, label, ...rest }) {
  const input = (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", background: "transparent",
        border: `1px solid ${hasError ? C.danger : C.border}`, borderRadius: 8,
        padding: "9px 13px", color: C.text, fontSize: 13,
        outline: "none", fontFamily: "inherit",
        boxShadow: hasError ? `0 0 0 2px ${C.danger}22` : "none",
        transition: "border-color .15s, box-shadow .15s",
      }}
      {...rest}
    />
  );
  if (!label) return input;
  return (
    <div>
      <label style={{
        fontSize: 11, fontWeight: 700, color: C.muted,
        display: "block", marginBottom: 4,
        letterSpacing: 1, textTransform: "uppercase",
      }}>{label}</label>
      {input}
    </div>
  );
}
