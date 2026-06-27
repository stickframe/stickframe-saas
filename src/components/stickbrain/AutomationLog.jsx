import { C } from "../../utils/constants";

/** "Feito pela IA hoje" — automações executadas com opção de desfazer (auditoria). */
export default function AutomationLog({ itens, onDesfazer }) {
  const lista = Array.isArray(itens) ? itens : [];
  if (lista.length === 0) return null;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        <span style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 17, color: C.text }}>Feito pela IA hoje</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lista.map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: C.bg, borderRadius: 9, opacity: a.desfeito ? 0.5 : 1 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, textDecoration: a.desfeito ? "line-through" : "none" }}>{a.descricao}</div>
              {a.entidade_nome && <div style={{ fontSize: 11, color: C.muted }}>{a.entidade_nome}</div>}
            </div>
            {!a.desfeito && (
              <button onClick={() => onDesfazer?.(a)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: C.text, cursor: "pointer", fontFamily: "inherit" }}>
                Desfazer
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
