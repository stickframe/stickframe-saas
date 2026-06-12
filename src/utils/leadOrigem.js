/**
 * Captura a origem do lead (utm_source ou referrer) e persiste
 * em localStorage até o momento do cadastro.
 */
const KEY = "sf_lead_origem";

export function salvarOrigemLead() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get("utm_source");
    if (utm) {
      localStorage.setItem(KEY, utm.toLowerCase().slice(0, 60));
      return;
    }
    if (localStorage.getItem(KEY)) return;
    const ref = document.referrer;
    if (!ref || ref.includes(window.location.hostname)) return;
    const host = new URL(ref).hostname;
    const origem =
      host.includes("google")    ? "google" :
      host.includes("instagram") ? "instagram" :
      host.includes("facebook") || host.startsWith("fb.") || host.includes("l.facebook") ? "facebook" :
      host.includes("whatsapp") || host.includes("wa.me") ? "whatsapp" :
      host.includes("linkedin")  ? "linkedin" :
      host.includes("youtube")   ? "youtube" :
      host;
    localStorage.setItem(KEY, origem.slice(0, 60));
  } catch (_) {}
}

export function obterOrigemLead() {
  try {
    return localStorage.getItem(KEY) || "direto";
  } catch (_) {
    return "direto";
  }
}
