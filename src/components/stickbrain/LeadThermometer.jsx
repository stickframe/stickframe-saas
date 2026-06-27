import { C } from "../../utils/constants";

const fmtBig = (v) => {
  const n = Number(v || 0);
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3) + "k";
  return "R$ " + Math.round(n);
};
const TEMP = {
  quente: { cor: C.success, label: "QUENTE", w: "85%" },
  morno: { cor: C.warning, label: "MORNO", w: "55%" },
  esfriando: { cor: C.danger, label: "ESFRIANDO", w: "30%" },
};

/** Termômetro de leads: tração (quente/morno/esfriando) por oportunidade. */
export default function LeadThermometer({ oportunidades }) {
  const lista = (Array.isArray(oportunidades) ? oportunidades : [])
    .slice().sort((a, b) => ({ esfriando: 0, morno: 1, quente: 2 }[a.temperatura] - { esfriando: 0, morno: 1, quente: 2 }[b.temperatura]))
    .slice(0, 6);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /></svg>
        <span style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 17, color: C.text }}>Termômetro de leads</span>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Tração nas últimas semanas</div>
      {lista.length === 0 ? <div style={{ fontSize: 12, color: C.muted }}>Sem oportunidades ativas.</div> :
        lista.map((o, i) => {
          const t = TEMP[o.temperatura] || TEMP.morno;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderTop: i ? `1px solid ${C.border}` : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.nome}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtBig(o.valor)} · {o.dias_sem_contato}d sem contato</div>
              </div>
              <div style={{ width: 70 }}>
                <div style={{ height: 5, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: 5, width: t.w, background: t.cor, borderRadius: 3 }} />
                </div>
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: t.cor, width: 58, textAlign: "right" }}>{t.label}</span>
            </div>
          );
        })}
    </div>
  );
}
