import { useEffect, useRef } from "react";
import { CARD, BTN_GHOST, TH, TD, SEL, COR_TIPO } from "../utils/styles";

// ── 3 · Revisão técnica dos elementos (StickAI Structural Parser™) ───────────
export default function ElementTable({ elementos, perfis, resumo, perfMont, perfGuia, onSetEl, onValidarTodas, foco, onFocoConsumido }) {
  const scrollBox = useRef(null);
  const linhaFoco = useRef(null);

  useEffect(() => {
    if (foco != null && linhaFoco.current) {
      linhaFoco.current.scrollIntoView({ block: "center", behavior: "smooth" });
      const t = setTimeout(() => onFocoConsumido?.(), 2200); // limpa o realce
      return () => clearTimeout(t);
    }
  }, [foco, onFocoConsumido]);

  return (
    <div style={CARD}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)" }}>
          3 · Revisão técnica dos elementos <span style={{ fontWeight: 400, color: "var(--muted)" }}>(StickAI Structural Parser™ — corrija o que precisar)</span>
        </div>
        <button onClick={onValidarTodas} style={BTN_GHOST}>✓ Validar todas</button>
      </div>
      {resumo && (
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
          {resumo.paredes} paredes · {resumo.comprimentoParedes_m} m lineares · confiança média {resumo.confiancaScoreMedia != null ? `${resumo.confiancaScoreMedia}%` : resumo.confiancaGlobal}
        </div>
      )}
      <div ref={scrollBox} style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "var(--surface-2)" }}>
            {["Elem.", "Tipo", "Comp.", "Perfil", "Calcular", "Val.", "Conf."].map((h) => (
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {elementos.slice(0, 300).map((e, i) => {
              const perfisTipo = perfis.filter((p) => (e.tipo === "viga" ? p.tipo === "guia" : p.tipo === "montante"));
              const emFoco = foco === i;
              return (
                <tr key={i} ref={emFoco ? linhaFoco : null}
                  style={{ borderTop: "1px solid var(--line)", background: emFoco ? "rgba(176,122,30,.18)" : e.incluir_calculo === false ? "rgba(140,132,122,.08)" : undefined, transition: "background .4s" }}>
                  <td style={TD}>{e.nome}</td>
                  <td style={TD}>
                    <select value={e.tipo} onChange={(ev) => onSetEl(i, { tipo: ev.target.value })}
                      style={{ ...SEL, color: COR_TIPO[e.tipo] }}>
                      <option value="parede">parede</option>
                      <option value="viga">viga</option>
                      <option value="abertura">abertura</option>
                    </select>
                  </td>
                  <td style={TD}>{e.comprimento_m ?? "—"}</td>
                  <td style={TD}>
                    {e.tipo === "abertura" ? "—" : (
                      <select value={e.perfil_id || (e.tipo === "viga" ? perfGuia : perfMont) || ""}
                        onChange={(ev) => onSetEl(i, { perfil_id: ev.target.value })} style={SEL}>
                        {perfisTipo.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <input type="checkbox" checked={e.incluir_calculo !== false}
                      onChange={(ev) => onSetEl(i, { incluir_calculo: ev.target.checked })} />
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <input type="checkbox" checked={e.validado === true}
                      onChange={(ev) => onSetEl(i, { validado: ev.target.checked })} />
                  </td>
                  <td style={{ ...TD, color: e.confianca === "baixa" ? "#981915" : e.confianca === "media" ? "#b07a1e" : "#3f7a4b", fontWeight: 600 }}
                    title={(e.confiancaFatores || []).map((f) => `${f.label}: ${f.ativacao > 0 ? "+" : ""}${f.contribuicao} (peso ${f.peso})`).join("\n")}>
                    {e.confiancaScore != null ? `${e.confiancaScore}%` : e.confianca}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
