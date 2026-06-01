// ─── FORMATADORES ────────────────────────────────────────────────────────────

/** R$ 1.234,56 */
export const fmtBRL = (v) =>
  v == null ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Alias legados */
export const fmt   = fmtBRL;
export const fmtWA = fmtBRL;

/** Número com N casas decimais: 1.234,56 */
export const fmtN = (v, decimals = 2) =>
  Number(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** 12,3% */
export const fmtPct = (v, decimals = 1) => `${Number(v ?? 0).toFixed(decimals)}%`;

/** dd/mm/aaaa */
export const fmtDate = (d) =>
  d ? new Date(d + (String(d).length === 10 ? "T00:00" : "")).toLocaleDateString("pt-BR") : "—";

/** dd/mm/aa hh:mm */
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

/** Jan/26, Fev/26 … */
export const fmtMes = (m) => {
  if (!m) return "—";
  const [y, mo] = m.split("-");
  return `${["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][Number(mo)]}/${y?.slice(2)}`;
};
