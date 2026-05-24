// ─── HELPERS DE DATA ─────────────────────────────────────────────────────────
export const hoje = () => new Date().toLocaleDateString("pt-BR");

export const hojeISO = () => new Date().toISOString().split("T")[0];

export const parseBR = (str) => {
  if (!str) return null;
  const [d, m, a] = str.split("/");
  return new Date(Number(a), Number(m) - 1, Number(d));
};

export const diffDias = (dataBR) => {
  const d = parseBR(dataBR);
  if (!d) return null;
  return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
};

export const mesAno = () =>
  new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" });
