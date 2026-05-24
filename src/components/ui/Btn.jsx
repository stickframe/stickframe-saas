import { C } from "../../utils/constants";

export default function Btn({ children, onClick, variant = "primary", size = "md", disabled, fullWidth }) {
  const base = {
    border: "none", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontWeight: 700, transition: "opacity .15s",
    opacity: disabled ? 0.4 : 1, width: fullWidth ? "100%" : undefined,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  };

  const sizes = {
    sm: { padding: "6px 12px", fontSize: 11 },
    md: { padding: "9px 18px", fontSize: 13 },
  };

  const variants = {
    primary: { background: C.red,     color: "#fff",    border: "none" },
    ghost:   { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    success: { background: C.success, color: "#fff",    border: "none" },
    danger:  { background: C.danger,  color: "#fff",    border: "none" },
  };

  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant] }} onClick={disabled ? undefined : onClick}>
      {children}
    </button>
  );
}
