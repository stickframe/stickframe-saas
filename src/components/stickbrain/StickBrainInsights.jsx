import { C } from "../../utils/constants";

/** "StickBrain™ diz:" — insights quantificados com ações (handoff §10). */
export default function StickBrainInsights({ oportunidades = [], recomendacoes = [], onAcao }) {
  const itens = [
    ...recomendacoes.map((t) => ({ t, tag: "Ação" })),
    ...oportunidades.map((t) => ({ t, tag: "Oportunidade" })),
  ];
  if (itens.length === 0) return null;

  return (
    <div style={{ background: "linear-gradient(135deg,#232225,#1a191c)", borderRadius: 14, padding: "18px 20px", color: "#f5f2ec" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e0726d" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4 2.5 5.2.8.8 1.5 1.6 1.5 2.8h6c0-1.2.7-2 1.5-2.8C18.8 13 20 11.4 20 9a7 7 0 0 0-7-7z" /><line x1="9" y1="21" x2="15" y2="21" /></svg>
        <span style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 18, color: "#e0726d" }}>StickBrain™ diz:</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {itens.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.5, color: "#d8d3ca" }}>
            <span style={{
              flexShrink: 0, fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5,
              color: it.tag === "Ação" ? "#fcd34d" : "#93c5fd",
              background: it.tag === "Ação" ? "#fcd34d22" : "#93c5fd22", borderRadius: 5, padding: "3px 7px", marginTop: 1,
            }}>{it.tag}</span>
            <span>{it.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
