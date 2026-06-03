import { useCallback } from "react";
import { useToast as useGlobalToast } from "../components/ui/Toast";

const EMOJI_TYPE = {
  "✅": "success", "💾": "success", "🎉": "success",
  "❌": "error",   "⚠️": "warn",
  "🗑": "info",    "📋": "info",
};

function detectType(msg) {
  const first = [...(msg || "")][0];
  return EMOJI_TYPE[first] || "info";
}

export function useToast() {
  const global = useGlobalToast();

  const mostrarToast = useCallback((msg) => {
    const type = detectType(msg);
    global[type](msg);
  }, [global]);

  // `toast` kept as null — rendering is handled globally by ToastProvider
  return { toast: null, mostrarToast };
}
