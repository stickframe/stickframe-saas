import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastCtx = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((msg, type = "info", duration = 3500) => {
    const id = ++_id;
    setToasts((prev) => [...prev.slice(-4), { id, msg, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    success: (m, d) => show(m, "success", d),
    error:   (m, d) => show(m, "error",   d),
    info:    (m, d) => show(m, "info",    d),
    warn:    (m, d) => show(m, "warn",    d),
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item toast-${t.type}`}
            onClick={() => dismiss(t.id)}
            style={{ cursor: "pointer" }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
