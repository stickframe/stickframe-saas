// ─── FORMATADORES ────────────────────────────────────────────────────────────
export const fmt = (v) =>
  "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtPct = (v) => `${Number(v).toFixed(1)}%`;

export const fmtWA = fmt;
