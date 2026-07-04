import { useState } from "react";
import { CARD, BTN_PRIMARY, BTN_GHOST, INPUT } from "../utils/styles";

// Histórico de Revisões — "Git do projeto estrutural": lista, diff, restaurar,
// memorial por revisão. Render-only: consome o que o hook expõe.
const seta = (d) => (d == null ? "" : d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : "0");
const corDelta = (d, bomSubir = true) => (d == null || d === 0 ? "var(--muted)" : (d > 0) === bomSubir ? "#3f7a4b" : "#981915");

export default function HistoryPanel({ revisoes, salvando, onSalvar, onRestaurar, onMemorial }) {
  const [motivo, setMotivo] = useState("");
  const [aberta, setAberta] = useState(null); // revisão expandida (mostra diff)

  return (
    <div style={{ ...CARD, marginTop: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 8 }}>
        Histórico de revisões <span style={{ fontWeight: 400, color: "var(--muted)" }}>(snapshot + diff + memorial · rastreabilidade)</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input placeholder="Motivo da revisão (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ ...INPUT, flex: 1, minWidth: 200 }} />
        <button onClick={() => { onSalvar(motivo); setMotivo(""); }} disabled={salvando} style={BTN_PRIMARY}>
          {salvando ? "Salvando…" : "＋ Salvar revisão"}
        </button>
      </div>

      {revisoes.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Nenhuma revisão ainda. Salve a primeira para começar o histórico.</div>
      ) : (
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
          {revisoes.map((r) => {
            const d = r.diff || {};
            const exp = aberta === r.id;
            return (
              <div key={r.id} style={{ borderTop: "1px solid var(--line)" }}>
                <div onClick={() => setAberta(exp ? null : r.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", fontSize: 12.5, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, color: "var(--text, #26231f)" }}>#{r.numero}</span>
                  <span style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                  {r.usuario_nome && <span style={{ color: "var(--muted)", fontSize: 11 }}>· {r.usuario_nome}</span>}
                  <span style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
                    {r.stickscore != null && <span title="StickScore">Score <b>{r.stickscore}</b> <span style={{ color: corDelta(d.stickScore?.delta), fontSize: 11 }}>{seta(d.stickScore?.delta)}</span></span>}
                    {r.conflitos_total != null && <span title="Conflitos" style={{ fontSize: 11.5 }}>⚠ {r.conflitos_total} <span style={{ color: corDelta(d.conflitos?.delta, false), fontSize: 11 }}>{seta(d.conflitos?.delta)}</span></span>}
                    {r.calc_hash && <span style={{ fontFamily: "monospace", fontSize: 10.5, color: "var(--muted)" }}>{r.calc_hash}</span>}
                    <span style={{ color: "var(--muted)" }}>{exp ? "▲" : "▼"}</span>
                  </span>
                </div>

                {exp && (
                  <div style={{ padding: "4px 12px 12px", background: "var(--surface-2)" }}>
                    {r.motivo && <div style={{ fontSize: 11.5, color: "var(--text-muted, #57514a)", marginBottom: 6 }}><b>Motivo:</b> {r.motivo}</div>}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11.5, color: "var(--muted)", marginBottom: 8 }}>
                      <span style={{ color: "#3f7a4b" }}>＋ {d.resumo?.adicionados ?? 0} adicionados</span>
                      <span style={{ color: "#981915" }}>－ {d.resumo?.removidos ?? 0} removidos</span>
                      <span style={{ color: "#b07a1e" }}>✎ {d.resumo?.alterados ?? 0} alterados</span>
                      {d.peso_kg?.delta != null && <span>peso <b style={{ color: corDelta(d.peso_kg.delta, false) }}>{d.peso_kg.delta > 0 ? "+" : ""}{d.peso_kg.delta} kg</b></span>}
                      {r.engine_version && <span>engine v{r.engine_version}</span>}
                    </div>
                    {(d.elementos?.alterados || []).slice(0, 8).map((a) => (
                      <div key={a.nome} style={{ fontSize: 11, color: "var(--text-muted, #57514a)" }}>
                        <b>{a.nome}</b>: {a.mudancas.map((m) => `${m.campo} ${m.de ?? "—"}→${m.para ?? "—"}`).join(" · ")}
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={(e) => { e.stopPropagation(); onRestaurar(r.id); }} style={BTN_GHOST}>↺ Restaurar</button>
                      <button onClick={(e) => { e.stopPropagation(); onMemorial(r.id); }} style={BTN_GHOST}>📄 Memorial desta revisão</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
