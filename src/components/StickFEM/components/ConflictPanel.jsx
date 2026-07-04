import { useState } from "react";
import { CARD } from "../utils/styles";

// Fase 3 — Detecção de Conflitos: badge + lista clicável (regra/severidade/recomendação).
const COR_SEV = { alta: "#981915", media: "#b07a1e", baixa: "#8c847a" };
const LABEL_SEV = { alta: "Alta", media: "Média", baixa: "Baixa" };

export default function ConflictPanel({ conflitos }) {
  const [aberto, setAberto] = useState(false);
  if (!conflitos.length) return null;

  const porSev = conflitos.reduce((a, c) => ((a[c.severidade] = (a[c.severidade] || 0) + 1), a), {});

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setAberto((v) => !v)} style={{
        background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.4)",
        color: "#ef4444", padding: "8px 14px", borderRadius: 8, fontWeight: "bold", cursor: "pointer",
        fontFamily: "inherit", fontSize: 13,
      }}>
        ⚠ {conflitos.length} {conflitos.length === 1 ? "conflito" : "conflitos"}
        {porSev.alta ? ` · ${porSev.alta} alta${porSev.alta > 1 ? "s" : ""}` : ""} {aberto ? "▲" : "▼"}
      </button>

      {aberto && (
        <div style={{
          ...CARD, position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
          width: 420, maxWidth: "90vw", maxHeight: 380, overflowY: "auto", marginBottom: 0,
          boxShadow: "0 10px 30px rgba(0,0,0,.25)",
        }}>
          {conflitos.map((c) => (
            <div key={c.id} style={{ padding: "9px 4px", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: "#fff", background: COR_SEV[c.severidade], borderRadius: 4, padding: "1px 6px", textTransform: "uppercase" }}>
                  {LABEL_SEV[c.severidade]}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text, #26231f)" }}>{c.mensagem}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                <b>Regra:</b> {c.regra}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted, #57514a)", marginTop: 2 }}>
                <b>Recomendação:</b> {c.recomendacao}
              </div>
              {c.elementos?.length > 0 && (
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>Elementos: {c.elementos.join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
