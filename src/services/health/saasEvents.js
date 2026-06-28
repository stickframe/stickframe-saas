import { sb } from "../supabase";
import { getEmpresaId } from "../supabase";

let _queue = [];
let _flushing = false;

function getSessionUserId() {
  // sb.auth.getSession() é assíncrono; o app persiste user_id no localStorage
  // (AppLayout). Leitura síncrona evita Promise e mantém o padrão do getEmpresaId.
  try {
    return localStorage.getItem("user_id") || null;
  } catch {
    return null;
  }
}

async function flush() {
  if (_flushing || _queue.length === 0) return;
  _flushing = true;
  const batch = _queue.splice(0);
  try {
    const { error } = await sb.from("saas_events").insert(batch);
    if (error) console.warn("[saasEvents] flush error:", error);
  } catch (e) {
    console.warn("[saasEvents] flush exception:", e);
  } finally {
    _flushing = false;
  }
}

export async function trackEvent(eventType, payload = {}) {
  const empresa_id = await getEmpresaId();
  const row = {
    event_type: eventType,
    user_id: getSessionUserId(),
    empresa_id,
    payload,
    created_at: new Date().toISOString(),
  };

  _queue.push(row);

  if (_queue.length >= 10) {
    await flush();
  }
}

export function trackPageView(pageName) {
  trackEvent("page_view", { page: pageName });
}

export function trackFeatureUsage(feature, metadata = {}) {
  trackEvent("feature_usage", { feature, ...metadata });
}

export function trackError(context, error) {
  trackEvent("error", { context, message: error?.message || String(error) });
}

export async function flushEvents() {
  await flush();
}

setInterval(() => { flush(); }, 30000);

// Flush ao sair/ocultar a aba — eventos de marco disparam uma vez e não podem
// se perder na fila em memória se o usuário navegar antes do intervalo de 30s.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", () => { flush(); });
}
