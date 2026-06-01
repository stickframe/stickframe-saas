export default function Btn({ children, onClick, variant = "primary", size = "md", disabled, fullWidth }) {
  return (
    <button
      className={`sf-btn sf-btn-${variant} sf-btn-${size}${fullWidth ? " sf-btn-full" : ""}${disabled ? " sf-btn-disabled" : ""}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
