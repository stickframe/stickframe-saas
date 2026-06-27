import { useState, useEffect } from "react";
import { C } from "../../utils/constants";
import { getEmpresaId } from "../../services/supabase";
import { carregarMetricasFunil, analisarComStickBrain } from "../../services/stickbrainService";
import KpiCard, { KpiGrid } from "../KpiCard";
import { SkeletonKpis } from "../Skeleton";
import ErrorState from "../ErrorState";

const cond = "var(--cond)";
const fmt = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (v) => v == null ? "—" : `${Math.round(Number(v) * 100)}%`;

function FunnelStep({ label, valor, sub, cor }) {
  return (
    <div style={{ flex: "1 0 auto", minWidth: 120, background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${cor}`, borderRadius: 8, padding: "11px 13px" }}>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: cond, fontSize: 22, fontWeight: 800, color: cor, lineHeight: 1.1 }}>{valor}</div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

export default function StickBrainAnalytics() {
  const [m, setM] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [ia, setIa] = useState(null);
  const [iaBusy, setIaBusy] = useState(false);
  const [iaErro, setIaErro] = useState("");

  useEffect(() => {
    carregarMetricasFunil()
      .then(setM)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  async function rodarCopiloto() {
    setIaBusy(true); setIaErro(""); setIa(null);
    try {
      const r = await analisarComStickBrain(m, { empresaId: getEmpresaId() });
      setIa(r);
    } catch (e) { setIaErro(e.message); }
    finally { setIaBusy(false); }
  }

  if (carregando) return (
    <div style={{ marginBottom: 24 }}>
      <SkeletonKpis count={6} />
    </div>
  );
  if (erro) return null; // RPC indisponível — não bloqueia a página
  if (!m) return null;
  if ((m.leads || 0) + (m.stickquotes || 0) + (m.orcamentos || 0) === 0) return null; // sem dados de funil

  const orfaoAlto = (m.taxa_orfao || 0) >= 0.4;
  // origem que mais vende (maior valor ganho; desempate por conversão)
  const origensOrd = Array.isArray(m.origens)
    ? [...m.origens].sort((a, b) => (b.valor_ganho - a.valor_ganho) || (b.conversao - a.conversao))
    : [];
  const topOrigemId = origensOrd.find((o) => o.fechados > 0)?.origem;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: cond, fontWeight: 800, fontSize: 20, color: C.text }}>StickBrain™ — Conversão do Funil</div>
          <div style={{ fontSize: 12, color: C.muted }}>Lead → StickQuote → Orçamento → Proposta → Fechamento</div>
        </div>
        <button onClick={rodarCopiloto} disabled={iaBusy}
          style={{ background: iaBusy ? C.muted : C.red, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: iaBusy ? "wait" : "pointer", fontFamily: "inherit" }}>
          {iaBusy ? "Analisando…" : "🧠 Analisar com IA"}
        </button>
      </div>

      {/* Funil */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
        <FunnelStep label="Leads" valor={m.leads} cor="#8c847a" />
        <FunnelStep label="StickQuotes" valor={m.stickquotes} sub={`${m.stickquotes_orfaos} órfãos`} cor="#6d557e" />
        <FunnelStep label="Orçamentos" valor={m.orcamentos} sub={pct(m.taxa_lead_orcamento) + " do lead"} cor="#c88a00" />
        <FunnelStep label="Propostas" valor={m.propostas} sub={pct(m.taxa_orcamento_proposta)} cor="#3b82f6" />
        <FunnelStep label="Fechados" valor={m.fechados} sub={pct(m.taxa_proposta_fechamento) + " da proposta"} cor="#3f7a4b" />
        <FunnelStep label="Perdidos" valor={m.perdidos} cor="#a33327" />
      </div>

      {/* Indicadores */}
      <KpiGrid style={{ marginBottom: 12 }}>
        <KpiCard label="StickQuotes órfãos" value={pct(m.taxa_orfao)} accent={orfaoAlto ? C.danger : C.muted} alerta={orfaoAlto ? "danger" : null} />
        <KpiCard label="Valor ganho" value={fmt(m.valor_ganho)} accent={C.success} />
        <KpiCard label="Ticket médio" value={fmt(m.ticket_medio)} accent={C.graphite} />
        <KpiCard label="Pipeline aberto" value={fmt(m.valor_pipeline)} accent={C.red} />
        <KpiCard label="Tempo SQ→Orçam." value={`${m.tempo_medio_sq_orcamento_h || 0}h`} accent={C.steel} />
        <KpiCard label="Tempo Orçam→Fech." value={`${m.tempo_medio_orcamento_fechamento_d || 0}d`} accent={C.steel} />
      </KpiGrid>

      {/* Performance por origem */}
      {Array.isArray(m.origens) && m.origens.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.red, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Performance por origem</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ color: C.muted, textAlign: "left" }}>
              <th style={{ padding: "4px 6px" }}>Origem</th><th>Orçam.</th><th>Fechados</th><th>Conversão</th><th style={{ textAlign: "right" }}>Ganho</th>
            </tr></thead>
            <tbody>
              {origensOrd.map((o, i) => {
                const isTop = o.origem === topOrigemId;
                return (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: isTop ? "#3f7a4b0d" : "transparent" }}>
                    <td style={{ padding: "5px 6px", fontWeight: 600 }}>
                      {isTop && <span title="Origem que mais vende" style={{ marginRight: 4 }}>🏆</span>}{o.origem}
                    </td>
                    <td>{o.orcamentos}</td>
                    <td style={{ color: "#3f7a4b", fontWeight: 700 }}>{o.fechados}</td>
                    <td>{pct(o.conversao)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(o.valor_ganho)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* StickQuotes órfãos de alto valor */}
      {Array.isArray(m.stickquotes_orfaos_top) && m.stickquotes_orfaos_top.length > 0 && (
        <div style={{ background: "#a3332710", border: "1px solid #a3332733", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#a33327", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            ⚠️ StickQuotes órfãos de maior valor (potencial não convertido)
          </div>
          {m.stickquotes_orfaos_top.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
              <span style={{ color: C.text }}>{s.nome}{s.cliente ? ` · ${s.cliente}` : ""}</span>
              <span style={{ fontWeight: 700, color: "#a33327" }}>{fmt(s.valor)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Copiloto IA */}
      {iaErro && (
        <div style={{ marginBottom: 12 }}>
          <ErrorState title="O copiloto não respondeu" message={iaErro} onRetry={rodarCopiloto} compact />
        </div>
      )}
      {ia && (
        <div style={{ background: "linear-gradient(135deg,#1a191c,#2b2b2e)", borderRadius: 12, padding: "18px 20px", color: "#f5f2ec", marginBottom: 4 }}>
          <div style={{ fontFamily: cond, fontWeight: 800, fontSize: 16, marginBottom: 8, color: "#e0726d" }}>🧠 StickBrain™ Copilot</div>
          {ia.resumo && <div style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 14, color: "#d8d3ca" }}>{ia.resumo}</div>}
          {ia.impacto_estimado && (
            <div style={{ display: "inline-block", background: "#3f7a4b22", border: "1px solid #3f7a4b55", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#6ee7b7", marginBottom: 14 }}>
              Impacto estimado: {ia.impacto_estimado}
            </div>
          )}
          <Bloco titulo="🚨 Alertas" itens={ia.alertas} cor="#fca5a5" />
          <Bloco titulo="🎯 Ações recomendadas" itens={ia.acoes} cor="#fcd34d" />
          <Bloco titulo="💡 Oportunidades" itens={ia.oportunidades} cor="#93c5fd" />
          <Bloco titulo="📊 Insights" itens={ia.insights} cor="#c4b5fd" />
          {ia.previsao && <div style={{ fontSize: 12, color: "#9aa0a8", marginTop: 10, fontStyle: "italic" }}>Previsão: {ia.previsao}</div>}
        </div>
      )}
    </div>
  );
}

function Bloco({ titulo, itens, cor }) {
  if (!Array.isArray(itens) || itens.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: cor, marginBottom: 5 }}>{titulo}</div>
      <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
        {itens.map((t, i) => <li key={i} style={{ fontSize: 12.5, lineHeight: 1.5, color: "#d8d3ca" }}>{t}</li>)}
      </ul>
    </div>
  );
}
