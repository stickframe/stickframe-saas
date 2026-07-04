import { BTN_PRIMARY, BTN_GHOST, TH, TD } from "../utils/styles";
import { exportarAuditoriaJSON, exportarAuditoriaPDF } from "../../../services/stickfem/exportAuditoria";

const COR_STATUS = { aprovado: "#3f7a4b", atencao: "#b07a1e", revisar: "#981915", indefinido: "#8c847a" };
const fmt = (v, u) => (v == null || v === "—" ? "—" : `${v}${u && u !== "—" ? " " + u : ""}`);

/**
 * Modo "Auditar cálculo" — memória de cálculo passo a passo (fórmula, valores,
 * unidade, norma), com os avisos honestos de simplificação do motor. Render-only:
 * recebe `auditoria` (de auditarPreDimensionamento) e não recomputa nada.
 */
export default function AuditPanel({ auditoria, onClose }) {
  if (!auditoria) return null;
  const { versao, estagio, geradoEm, memoria, resultado, motivo, avisos } = auditoria;
  const cor = COR_STATUS[resultado.status] || "#8c847a";

  // Agrupa passos por `grupo` mantendo a ordem.
  const grupos = [];
  for (const p of memoria) {
    const g = grupos.find((x) => x.nome === p.grupo);
    (g ? g.passos : grupos[grupos.push({ nome: p.grupo, passos: [] }) - 1].passos).push(p);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,17,21,.55)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "36px 16px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)", width: "100%", maxWidth: 860, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text, #26231f)" }}>Auditar cálculo — memória completa</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Motor v{versao} · {estagio} · {new Date(geradoEm).toLocaleString("pt-BR")}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => exportarAuditoriaJSON(auditoria)} style={BTN_GHOST}>Exportar JSON</button>
            <button onClick={() => exportarAuditoriaPDF(auditoria)} style={BTN_PRIMARY}>PDF técnico</button>
            <button onClick={onClose} style={BTN_GHOST}>Fechar</button>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Resultado */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "12px 14px", borderRadius: 10, background: cor + "14", border: `1px solid ${cor}44`, marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: cor, textTransform: "uppercase" }}>{resultado.status} · η = {resultado.utilizacao}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted, #57514a)" }}>{motivo}</div>
            <div style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--muted)" }}>
              N_Sd {resultado.nSd_kN} kN · N_Rd {resultado.nRd_kN} kN · λ {resultado.esbeltez}{resultado.esbeltezOk ? "" : " ⚠>200"} · {resultado.modoGovernante}
            </div>
          </div>

          {/* Passos por grupo */}
          {grupos.map((g) => (
            <div key={g.nome} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>{g.nome}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
                <thead><tr style={{ background: "var(--surface-2)" }}>
                  <th style={TH}>Etapa</th><th style={TH}>Fórmula / substituição</th>
                  <th style={{ ...TH, textAlign: "right" }}>Valor</th><th style={{ ...TH, textAlign: "center" }}>Norma</th>
                </tr></thead>
                <tbody>
                  {g.passos.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ ...TD, verticalAlign: "top" }}>
                        <div style={{ fontWeight: 600, color: "var(--text, #26231f)" }}>
                          {p.etapa}
                          {p.simplificado && <span style={{ marginLeft: 6, fontSize: 9, background: "rgba(176,122,30,.15)", color: "#b07a1e", borderRadius: 4, padding: "1px 5px" }}>simplificado</span>}
                        </div>
                        {p.nota && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{p.nota}</div>}
                      </td>
                      <td style={{ ...TD, fontFamily: "monospace", fontSize: 11, color: "var(--text-muted, #57514a)", verticalAlign: "top" }}>
                        {p.formula}<div style={{ color: "var(--muted)" }}>= {p.substituicao}</div>
                      </td>
                      <td style={{ ...TD, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", verticalAlign: "top" }}>{fmt(p.valor, p.unidade)}</td>
                      <td style={{ ...TD, textAlign: "center", fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap", verticalAlign: "top" }}>{p.norma}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Avisos honestos */}
          <div style={{ padding: "12px 14px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Limitações do modelo (leia antes de usar)</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: "var(--text-muted, #57514a)", lineHeight: 1.55 }}>
              {avisos.map((a, i) => <li key={i} style={{ marginBottom: 3 }}>{a}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
