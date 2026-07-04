import { STATUS_META } from "../../../services/stickfem/comparison/diffEngine";
import { gerarRelatorioComparativoPDF } from "../../../services/stickfem/comparison/comparisonReport";
import { CARD, BTN_PRIMARY, BTN_GHOST, TH, TD } from "../utils/styles";
import ComparisonViewer from "./ComparisonViewer";

const fmt = (v, d = 0) => (v == null ? "—" : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }));
const fmtBRL = (v) => (v == null ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }));
const corDelta = (d, bomSubir) => (d == null || d === 0 ? "var(--muted)" : (d > 0) === bomSubir ? "#3f7a4b" : "#981915");
const sinal = (d, moeda) => (d == null ? "—" : (d > 0 ? "+" : "") + (moeda ? fmtBRL(d) : fmt(d, Number.isInteger(d) ? 0 : 1)));

function Card({ st, n }) {
  const m = STATUS_META[st];
  return (
    <div style={{ background: m.cor + "14", border: `1px solid ${m.cor}44`, borderRadius: 10, padding: "10px 14px", minWidth: 96 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: m.cor, fontFamily: "'Barlow Condensed',sans-serif" }}>{n}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted, #57514a)" }}>{m.emoji} {m.label}</div>
    </div>
  );
}

function LinhaImpacto({ label, o, unidade = "", bomSubir = false, moeda = false }) {
  return (
    <tr style={{ borderTop: "1px solid var(--line)" }}>
      <td style={TD}>{label}</td>
      <td style={{ ...TD, textAlign: "right" }}>{moeda ? fmtBRL(o.antes) : fmt(o.antes)}{unidade}</td>
      <td style={{ ...TD, textAlign: "right" }}>{moeda ? fmtBRL(o.depois) : fmt(o.depois)}{unidade}</td>
      <td style={{ ...TD, textAlign: "right", fontWeight: 800, color: corDelta(o.delta, bomSubir) }}>{sinal(o.delta, moeda)}{!moeda && o.delta != null ? unidade : ""}</td>
    </tr>
  );
}

/**
 * Painel do Engineering Diff (modal). Consome { diff, impacto, meta } já
 * calculados pelo hook (compararComRevisao / entre snapshots).
 */
export default function ComparisonPanel({ comparacao, onClose }) {
  if (!comparacao) return null;
  const { diff, impacto, meta } = comparacao;
  const alteracoes = diff.itens.filter((i) => i.status !== "igual");

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,17,21,.55)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "30px 16px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)", width: "100%", maxWidth: 900, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text, #26231f)" }}>Engineering Diff</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{meta.nomeAntes} → {meta.nomeDepois}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => gerarRelatorioComparativoPDF(comparacao)} style={BTN_PRIMARY}>📄 Memorial comparativo</button>
            <button onClick={onClose} style={BTN_GHOST}>Fechar</button>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Dashboard */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {["novo", "removido", "modificado", "movido", "igual"].map((st) => <Card key={st} st={st} n={diff.resumo[st]} />)}
          </div>

          {/* Viewer colorido */}
          <ComparisonViewer itens={diff.itens} />

          {/* Impacto */}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", margin: "16px 0 6px" }}>Impacto técnico e financeiro</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
            <thead><tr style={{ background: "var(--surface-2)" }}>
              <th style={TH}>Indicador</th><th style={{ ...TH, textAlign: "right" }}>Antes</th>
              <th style={{ ...TH, textAlign: "right" }}>Depois</th><th style={{ ...TH, textAlign: "right" }}>Δ</th>
            </tr></thead>
            <tbody>
              <LinhaImpacto label="Peso total" o={impacto.peso_kg} unidade=" kg" />
              <LinhaImpacto label="Montantes" o={impacto.montantes} />
              <LinhaImpacto label="Guias" o={impacto.guias} />
              <LinhaImpacto label="Custo estimado" o={impacto.custo} moeda />
              <LinhaImpacto label="StickScore" o={impacto.stickScore} bomSubir />
              <LinhaImpacto label="Conflitos" o={impacto.conflitos} />
            </tbody>
          </table>

          {/* Tabela de alterações */}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", margin: "16px 0 6px" }}>
            Alterações ({alteracoes.length})
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <tbody>
                {alteracoes.length === 0 ? (
                  <tr><td style={{ ...TD, color: "var(--muted)" }}>Sem alterações — versões equivalentes.</td></tr>
                ) : alteracoes.slice(0, 200).map((it, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ ...TD, fontWeight: 600 }}>{it.nome}</td>
                    <td style={TD}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: STATUS_META[it.status].cor, borderRadius: 4, padding: "1px 6px" }}>{STATUS_META[it.status].label}</span>
                    </td>
                    <td style={{ ...TD, fontSize: 11, color: "var(--text-muted, #57514a)" }}>
                      {(it.mudancas || []).map((m) => `${m.label}: ${m.rotuloDe ?? m.de ?? "—"}→${m.rotuloPara ?? m.para ?? "—"}`).join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
