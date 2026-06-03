import { useCallback, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useToast } from "../components/ui/Toast";

export function useUndo({ maxHistory = 5 } = {}) {
  const stack = useRef([]);
  const toast = useToast();

  const snapshot = useCallback((label, restoreFn) => {
    stack.current = [...stack.current.slice(-maxHistory + 1), { label, restoreFn }];
  }, [maxHistory]);

  const undo = useCallback(async () => {
    const entry = stack.current.pop();
    if (!entry) return;
    try {
      await entry.restoreFn();
      toast.success(`↩️ Desfeito: ${entry.label}`);
    } catch (e) {
      toast.error(`Erro ao desfazer: ${e.message}`);
    }
  }, [toast]);

  useHotkeys("ctrl+z, meta+z", (e) => {
    e.preventDefault();
    undo();
  }, { enableOnFormTags: false });

  return { snapshot, undo };
}
