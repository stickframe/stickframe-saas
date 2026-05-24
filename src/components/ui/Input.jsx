import { C } from "../../utils/constants";

export default function Input({ value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", background: "transparent",
        border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "9px 13px", color: C.text, fontSize: 13,
        outline: "none", fontFamily: "inherit",
      }}
      {...rest}
    />
  );
}
