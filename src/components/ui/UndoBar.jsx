import { useEffect, useState } from "react";
import { useUndoStore } from "../../store/undoStore";
import { useToast } from "./Toast";

export default function UndoBar() {
  const stack = useUndoStore((s) => s.stack);
  const pop = useUndoStore((s) => s.pop);
  const toast = useToast();
  const [visible, setVisible] = useState(false);
  const [timer, setTimer] = useState(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!stack.length) { setVisible(false); return; }
    const last = stack[stack.length - 1];
    setLabel(last.label);
    setVisible(true);
    clearTimeout(timer);
    const t = setTimeout(() => setVisible(false), 6000);
    setTimer(t);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stack.length]);

  if (!visible || !stack.length) return null;

  const handleUndo = async () => {
    const entry = pop();
    if (!entry) return;
    try {
      await entry.restoreFn();
      toast.success(`↩ Desfeito: ${entry.label}`);
      setVisible(false);
    } catch (e) {
      toast.error(`Erro ao desfazer: ${e.message}`);
    }
  };

  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: "#1e2028", color: "#e8eaf0", borderRadius: 10,
      padding: "10px 18px", display: "flex", alignItems: "center", gap: 14,
      fontSize: 13, fontWeight: 600, zIndex: 9998,
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      animation: "pageIn 0.2s ease-out both",
    }}>
      <span>{label} — excluído</span>
      <button
        onClick={handleUndo}
        style={{
          background: "#981915", color: "#fff", border: "none",
          borderRadius: 6, padding: "4px 12px", fontSize: 12,
          fontWeight: 700, cursor: "pointer",
        }}
      >
        Desfazer (Ctrl+Z)
      </button>
    </div>
  );
}
