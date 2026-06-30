/**
 * Captura a origem do lead (utm_source ou referrer) e persiste
 * em localStorage até o momento do cadastro.
 */
const KEY  = "sf_lead_origem";   // origem (string) — compatibilidade
const KEY2 = "sf_lead_intel";    // Lead Intelligence (campanha, página, ts)

export function salvarOrigemLead() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get("utm_source");

    // Lead Intelligence (C.5): registra campanha + página de entrada no
    // primeiro toque (first-touch). Não sobrescreve se já existir.
    if (!localStorage.getItem(KEY2)) {
      const intel = {
        origem:   (utm || "").toLowerCase().slice(0, 60) || undefined,
        campanha: (params.get("utm_campaign") || params.get("utm_medium") || "").slice(0, 80) || undefined,
        pagina:   (window.location.pathname || "/").slice(0, 120),
        referrer: (document.referrer || "").slice(0, 160) || undefined,
        ts:       new Date().toISOString(),
      };
      localStorage.setItem(KEY2, JSON.stringify(intel));
    }

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

/**
 * Lead Intelligence detalhada (C.5): { origem, campanha, pagina, referrer, ts }.
 * `origem` cai para obterOrigemLead() quando não há utm_source.
 */
export function obterLeadIntel() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY2) || "{}");
    return {
      origem:   raw.origem || obterOrigemLead(),
      campanha: raw.campanha || null,
      pagina:   raw.pagina || null,
      referrer: raw.referrer || null,
      ts:       raw.ts || null,
    };
  } catch (_) {
    return { origem: "direto", campanha: null, pagina: null, referrer: null, ts: null };
  }
}
