import { sb } from "../supabase";
import { getEmpresaId } from "../supabase";

let _queue = [];
let _flushing = false;

function getSessionUserId() {
  try {
    const raw = sb.auth.getSession();
    if (raw?.data?.session?.user?.id) return raw.data.session.user.id;
  } catch {}
  return null;
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
