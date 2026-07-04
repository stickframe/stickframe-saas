import { useMemo } from "react";
import { CASOS_REFERENCIA } from "../../../validation/index";
import { rodarSuite } from "../../../services/stickfem/validation/validationRunner";
import { COBERTURA_NORMAS, STATUS_NORMA, coberturaNormasPct } from "../../../services/stickfem/validation/normsCoverage";
import { engineeringHealth } from "../../../services/stickfem/validation/healthScore";
import { montarBenchmark, SOFTWARES_BENCHMARK, benchmarkVazio } from "../../../services/stickfem/validation/benchmark";
import { ENGINE_VERSION } from "../../../services/stickfem/engine/version";
import { CARD, TH, TD } from "../utils/styles";

const cor = (v) => (v == null ? "#8c847a" : v >= 90 ? "#3f7a4b" : v >= 70 ? "#b07a1e" : "#981915");

function Gauge({ label, valor, sufixo = "%" }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", minWidth: 120 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: cor(valor), fontFamily: "'Barlow Condensed',sans-serif" }}>
        {valor == null ? "—" : valor}{valor != null ? sufixo : ""}
      </div>
    </div>
  );
}

// Referências externas reais: vazio até haver rodadas oficiais (aguardando validação externa).
const REFERENCIAS_EXTERNAS = {};

export default function ValidationPanel() {
  const suite = useMemo(() => rodarSuite(CASOS_REFERENCIA), []);
  const normasPct = coberturaNormasPct();
  const health = useMemo(() => engineeringHealth({
    validacaoPct: suite.cobertura, regressaoAprovados: suite.aprovados, regressaoTotal: suite.total,
  }), [suite]);
  const benchmark = useMemo(() => montarBenchmark(suite.resultados, REFERENCIAS_EXTERNAS), [suite]);
  const vazio = benchmarkVazio(REFERENCIAS_EXTERNAS);

  return (
    <div>
      <div style={{ ...CARD, background: "rgba(59,110,165,.06)", borderColor: "rgba(59,110,165,.3)" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text, #26231f)" }}>
          🧪 Validação Técnica <span style={{ fontSize: 10, fontWeight: 800, background: "#3b6ea5", color: "#fff", borderRadius: 5, padding: "2px 7px", marginLeft: 6 }}>ENGINE v{ENGINE_VERSION}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
          Prova contínua de que o motor está correto. A regressão roda no CI a cada mudança.
        </div>
      </div>

      {/* Health / confiança */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Gauge label="Engineering Health" valor={health.health} />
        <Gauge label="Validação (cobertura)" valor={suite.cobertura} />
        <Gauge label="Cobertura de normas" valor={normasPct} />
        <Gauge label="Regressão" valor={suite.total ? Math.round((suite.aprovados / suite.total) * 100) : null} sufixo="%" />
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", minWidth: 120 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Casos de referência</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#3f7a4b", fontFamily: "'Barlow Condensed',sans-serif" }}>{suite.aprovados}/{suite.total}</div>
        </div>
      </div>

      {/* Modelos de referência */}
      <div style={CARD}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 8 }}>Modelos de referência (regressão)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "var(--surface-2)" }}>
            {["Modelo", "Perfil", "η", "Esbeltez", "Peso (kg)", "Status", "Regressão"].map((h) => <th key={h} style={TH}>{h}</th>)}
          </tr></thead>
          <tbody>
            {suite.resultados.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={TD}>{r.nome}</td>
                <td style={{ ...TD, color: "var(--muted)" }}>{r.resultado.perfil}</td>
                <td style={{ ...TD, fontWeight: 700 }}>{r.resultado.utilizacao}</td>
                <td style={TD}>{r.resultado.esbeltez}{r.resultado.esbeltezOk ? "" : " ⚠"}</td>
                <td style={TD}>{r.resultado.peso_total_kg}</td>
                <td style={{ ...TD, color: r.resultado.status === "revisar" ? "#981915" : r.resultado.status === "atencao" ? "#b07a1e" : "#3f7a4b", fontWeight: 700 }}>{r.resultado.status}</td>
                <td style={{ ...TD, color: r.pass ? "#3f7a4b" : "#981915", fontWeight: 800 }}>{r.pass ? "✔ OK" : "✖ divergiu"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cobertura de normas */}
      <div style={CARD}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 8 }}>Cobertura de normas</div>
        {COBERTURA_NORMAS.map((n) => {
          const st = STATUS_NORMA[n.status];
          return (
            <div key={n.norma} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderTop: "1px solid var(--line)" }}>
              <span style={{ color: st.cor, fontWeight: 800, minWidth: 16 }}>{st.icone}</span>
              <div style={{ minWidth: 110 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text, #26231f)" }}>{n.norma}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{n.titulo}</div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.cor }}>{st.label}</span>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{n.nota}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Benchmark contra softwares comerciais */}
      <div style={CARD}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 4 }}>Benchmark vs. softwares comerciais</div>
        {vazio && (
          <div style={{ fontSize: 11.5, color: "#b07a1e", background: "rgba(176,122,30,.1)", border: "1px solid rgba(176,122,30,.3)", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
            ⏳ Aguardando validação externa — sem números fabricados. Preencher com rodadas reais de SAP2000/RFEM/CYPE/TQS/CalcSteel para os mesmos modelos.
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 560 }}>
            <thead><tr style={{ background: "var(--surface-2)" }}>
              <th style={TH}>Caso</th><th style={TH}>StickFEM</th>
              {SOFTWARES_BENCHMARK.map((s) => <th key={s} style={TH}>{s}</th>)}
            </tr></thead>
            <tbody>
              {benchmark.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={TD}>{l.nome}</td>
                  <td style={{ ...TD, fontWeight: 700 }}>{l.stickfem ?? "—"}</td>
                  {SOFTWARES_BENCHMARK.map((s) => {
                    const c = l.comparacoes[s];
                    return <td key={s} style={{ ...TD, color: "var(--muted)" }}>{c.valor == null ? "—" : `${c.valor} (${c.difPct > 0 ? "+" : ""}${c.difPct}%)`}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {health.pendente.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          Fora do Health Score por dependerem de dados reais: {health.pendente.join(" · ")}.
        </div>
      )}
    </div>
  );
}
