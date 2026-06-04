import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal({ title, onClose, children, width = 600 }) {
  const firstRef = useRef(null);

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="sf-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={firstRef}
        tabIndex={-1}
        className="modal-inner sf-modal-box"
        style={{ width: `min(${width}px, 100%)` }}
      >
        <div className="sf-modal-header">
          <h3 id="modal-title" className="sf-modal-title">{title}</h3>
          <button onClick={onClose} aria-label="Fechar modal" className="sf-modal-close">×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
