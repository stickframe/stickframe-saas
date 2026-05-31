import { useEffect, useRef } from "react";
import { C } from "../../utils/constants";

export default function Modal({ title, onClose, children, width = 600 }) {
  const firstRef = useRef(null);

  // Focus trap: ao abrir, foca o modal; Tab fica dentro
  useEffect(() => {
    const prev = document.activeElement;
    firstRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const focusable = firstRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prev?.focus();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={firstRef}
        tabIndex={-1}
        className="modal-inner"
        style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24,
          width: `min(${width}px, 100%)`, maxHeight: "min(90vh, calc(100dvh - 40px))", overflowY: "auto",
          outline: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 id="modal-title" style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
