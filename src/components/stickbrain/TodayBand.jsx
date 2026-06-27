import { C } from "../../utils/constants";

const fmtBig = (v) => {
  const n = Number(v || 0);
  if (n >= 1e6) return "R$ " + (n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "M";
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3) + "k";
  return "R$ " + Math.round(n);
};

/** Banda "o que fazer hoje" (escura): total de ações + contadores. */
export default function TodayBand({ total, valorEmJogo, imediatas, esfriando, quentes, automacoes }) {
  const cels = [
    { label: "Esfriando", valor: esfriando ?? 0, cor: "#f0a09a", sub: "leads perdendo tração" },
    { label: "Quentes p/ fechar", valor: quentes ?? 0, cor: "#fcd34d", sub: "orçamentos com alta chance" },
    { label: "Automações hoje", valor: automacoes ?? 0, cor: "#93c5fd", sub: "follow-ups disparados" },
  ];
  return (
    <div style={{ background: "linear-gradient(135deg,#232225,#1a191c)", borderRadius: 14, padding: "20px 24px", marginBottom: 18,
      display: "grid", gridTemplateColumns: "minmax(220px,1.2fr) repeat(3,1fr)", gap: 22, alignItems: "center" }} className="today-band">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: "#e0726d", textTransform: "uppercase" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          StickBrain · Agora
        </div>
        <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 34, color: "#f5f2ec", lineHeight: 1.05, marginTop: 4 }}>
          {total || 0} ações para hoje
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 5 }}>
          <strong style={{ color: "#f5f2ec" }}>{fmtBig(valorEmJogo)}</strong> em jogo · {imediatas || 0} exigem ação imediata
        </div>
      </div>
      {cels.map((c, i) => (
        <div key={i} style={{ borderLeft: "1px solid rgba(255,255,255,.08)", paddingLeft: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "rgba(255,255,255,.4)", textTransform: "uppercase" }}>{c.label}</div>
          <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 30, color: c.cor, lineHeight: 1.1 }}>{c.valor}</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
