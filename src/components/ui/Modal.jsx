import { C } from "../../utils/constants";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-inner"
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, width: 600, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
