// Google Analytics 4 — StickFrame
// Não rastrear dados sensíveis: sem senhas, dados pessoais ou informações privadas.

const GA_ID = import.meta.env.VITE_GA_ID || "G-WSMBGMCHC5";

function gtag(...args) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
  if (typeof window.gtag === "function") window.gtag(...args);
}

export function initGA() {
  if (!GA_ID || typeof window === "undefined") return;
  if (document.getElementById("ga4-script")) return; // already loaded

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function getLeadOrigem() {
  try {
    return JSON.parse(localStorage.getItem("sf_lead_origem") || "{}");
  } catch {
    return {};
  }
}

export function trackPageView(path) {
  if (!GA_ID || typeof window.gtag !== "function") return;
  window.gtag("config", GA_ID, {
    page_path: path,
    ...getLeadOrigem(),
  });
}

export function trackEvent(eventName, params = {}) {
  if (!GA_ID || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, {
    ...getLeadOrigem(),
    ...params,
  });
}

// Convenience wrappers for standard funnel events
export const analytics = {
  clickSignup:        (source) => trackEvent("click_signup",        { event_category: "conversion", source }),
  requestDemo:        (source) => trackEvent("request_demo",        { event_category: "conversion", source }),
  clickWhatsapp:      (source) => trackEvent("click_whatsapp",      { event_category: "engagement", source }),
  viewFeatures:       ()       => trackEvent("view_features",        { event_category: "engagement" }),
  signupStarted:      ()       => trackEvent("signup_started",       { event_category: "funnel" }),
  signupCompleted:    ()       => trackEvent("signup_completed",     { event_category: "funnel" }),
};
