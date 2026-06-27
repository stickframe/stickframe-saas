import { C } from "../../utils/constants";

const pct = (v) => `${Math.round(Number(v || 0) * 100)}%`;

/** Sinal de origem: canais queimando dinheiro (conversão muito abaixo da média). */
export default function OriginSignal({ sinais }) {
  const lista = Array.isArray(sinais) ? sinais : [];
  const queimando = lista.filter((s) => s.queimando);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
        <span style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 17, color: C.text }}>Sinal de origem</span>
      </div>
      {queimando.length === 0 ? (
        <div style={{ fontSize: 12, color: C.muted }}>Nenhuma origem queimando dinheiro — todos os canais estão dentro da média.</div>
      ) : queimando.map((s, i) => (
        <div key={i} style={{ background: `color-mix(in srgb, ${C.danger} 7%, ${C.surface})`, border: `1px solid color-mix(in srgb, ${C.danger} 26%, transparent)`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>
            "{s.origem}" está queimando dinheiro
          </div>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>
            Converte {pct(s.conversao)} (média {pct(s.media)}) em {s.leads} oportunidades. Revisar abordagem ou investimento neste canal.
          </div>
        </div>
      ))}
    </div>
  );
}
