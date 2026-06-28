import { sb } from "../supabase";

let _userId = null;
let _empresaId = null;

export function setMetricsContext(userId, empresaId) {
  _userId = userId;
  _empresaId = empresaId;
}

export async function trackProductEvent(eventType, payload = {}) {
  try {
    await sb.from("saas_events").insert({
      event_type: eventType,
      user_id: _userId,
      empresa_id: _empresaId,
      payload,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[metrics] track failed:", e);
  }
}

// -- Activation events --
export function trackCompanyCreated() {
  trackProductEvent("company_created");
}

export function trackFirstClient() {
  trackProductEvent("created_first_client");
}

export function trackFirstQuote() {
  trackProductEvent("created_first_quote");
}

export function trackFirstObra() {
  trackProductEvent("created_first_obra");
}

export function trackStickBrainOpened() {
  trackProductEvent("opened_stickbrain");
}

export function trackMeasurementApproved() {
  trackProductEvent("approved_measurement");
}

export function trackStickQuoteUsed() {
  trackProductEvent("used_stickquote");
}

export function trackPortalOpened() {
  trackProductEvent("opened_portal");
}

// -- Growth events --
export function trackViewedPricing() {
  trackProductEvent("viewed_pricing");
}

export function trackStartedTrial(plan) {
  trackProductEvent("started_trial", { plan });
}

export function trackCompletedOnboarding() {
  trackProductEvent("completed_onboarding");
}

export function trackConvertedPlan(plan) {
  trackProductEvent("converted_plan", { plan });
}

// -- Helper: check if first time for this empresa --
export async function isFirstEvent(eventType) {
  if (!_empresaId) return false;
  const { count } = await sb.from("saas_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", eventType)
    .eq("empresa_id", _empresaId);
  return (count ?? 0) === 0;
}
