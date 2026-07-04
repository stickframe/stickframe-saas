/**
 * Cliente CalcSteel (catálogo). Endpoints REAIS confirmados na doc, mas o token
 * JWT NUNCA passa pelo browser: toda chamada vai por um `proxyFetch` injetado,
 * que na prática é a Edge Function do Supabase (supabase/functions/calcsteel-proxy)
 * — ela guarda as credenciais (secret) e faz login/refresh do lado servidor.
 *
 * Base: https://calcsteel.com/api/v1  ·  Auth: Bearer JWT (15 min) + refresh.
 * Este módulo só cuida de catálogo (GET /profiles, GET /standards). A análise
 * (POST /analysis) fica no CalcSteelProvider e depende de contrato de
 * project_data ainda não publicado (obtém-se salvando do editor CalcSteel).
 */
import { mapProfileFromCalcSteel } from "./calcsteelMapping";

export const CALCSTEEL_BASE = "https://calcsteel.com/api/v1";
export const CALCSTEEL_ENDPOINTS = {
  profiles: "/profiles",         // GET  ?family=&standard=&category=  (cache 24h)
  profile: "/profiles/:id",      // GET
  standards: "/standards",       // GET  (cache 24h)
  analysis: "/analysis",         // POST { project_data, design_standard } → { success, diagrams, design_checks, remaining_credits }
  me: "/auth/me",                // GET  → { analysis_credits, ... }
};

/**
 * @param {Function} proxyFetch  (path, opts) => Promise<any>  — roteia pela Edge Function.
 * @param {Object}   [query]     { family, standard, category }
 * @returns {Promise<object[]>}  perfis já MAPEADOS para perfil_estrutural.
 */
export async function fetchProfiles(proxyFetch, query = {}) {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== "")).toString();
  const path = CALCSTEEL_ENDPOINTS.profiles + (qs ? `?${qs}` : "");
  const data = await proxyFetch(path, { method: "GET" });
  const lista = Array.isArray(data) ? data : (data?.profiles || data?.data || []);
  return lista.map(mapProfileFromCalcSteel);
}

/** Lista de normas suportadas (para o seletor de design_standard). */
export async function fetchStandards(proxyFetch) {
  const data = await proxyFetch(CALCSTEEL_ENDPOINTS.standards, { method: "GET" });
  return Array.isArray(data) ? data : (data?.standards || data?.data || []);
}
