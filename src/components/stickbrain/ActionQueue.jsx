import { C } from "../../utils/constants";
import ActionCard from "./ActionCard";

const GRUPOS = [
  { k: "agora", label: "Agora", cor: C.danger },
  { k: "hoje", label: "Hoje", cor: C.warning },
  { k: "semana", label: "Esta semana", cor: C.steel },
];

/** Fila de ações agrupada por urgência (Agora / Hoje / Esta semana). */
export default function ActionQueue({ grupos, onCta, onDismiss }) {
  const g = grupos || {};
  const vazio = !["agora", "hoje", "semana"].some((k) => (g[k] || []).length > 0);

  if (vazio) {
    return (
      <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>
        Nenhuma ação pendente no momento. Conforme oportunidades entrarem ou esfriarem, elas aparecem aqui priorizadas.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {GRUPOS.map(({ k, label, cor }) => {
        const itens = g[k] || [];
        if (itens.length === 0) return null;
        return (
          <div key={k}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: cor, background: `color-mix(in srgb, ${cor} 12%, transparent)`, borderRadius: 20, padding: "1px 8px" }}>{itens.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {itens.map((a) => <ActionCard key={a.id} acao={a} onCta={onCta} onDismiss={onDismiss} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
