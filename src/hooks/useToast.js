import { useState, useCallback } from "react";

export function useToast(duration = 3000) {
  const [toast, setToast] = useState(null);

  const mostrarToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  }, [duration]);

  return { toast, mostrarToast };
}
