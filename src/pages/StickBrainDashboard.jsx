import { useState, useEffect, useCallback, useMemo } from "react";
import { C } from "../utils/constants";
import { carregarDashboard } from "../services/stickbrainService";
import { analisarDeterministico } from "../services/stickbrainAI";
import useAppStore from "../store/useAppStore";
import KpiCard, { KpiGrid } from "../components/KpiCard";
import { SkeletonKpis } from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import PipelineSummary from "../components/stickbrain/PipelineSummary";
import ConversionFunnel from "../components/stickbrain/ConversionFunnel";
import OriginPerformanceChart from "../components/stickbrain/OriginPerformanceChart";
import MonthlyEvolution from "../components/stickbrain/MonthlyEvolution";
import AnalyticsAlerts from "../components/stickbrain/AnalyticsAlerts";
import StickBrainInsights from "../components/stickbrain/StickBrainInsights";

const cond = "var(--cond)";
const fmt = (v) => "R$ " + Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const fmtBig = (v) => {
  const n = Number(v || 0);
  if (n >= 1e6) return "R$ " + (n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "M";
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3) + "k";
  return "R$ " + Math.round(n);
};
const pct = (v) => (v == null ? "—" : `${Math.round(Number(v) * 100)}%`);

const PERIODOS = [["7d", "7d"], ["30d", "30d"], ["90d", "90d"], ["12m", "12m"]];

export default function StickBrainDashboard() {
  const [periodo, setPeriodo] = useState("90d");
  const [d, setD] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const setActivePage = useAppStore((s) => s.setActivePage);

  const carregar = useCallback(async (p) => {
    setCarregando(true); setErro("");
    try { setD(await carregarDashboard(p)); }
    catch (e) { setErro(e.message); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { carregar(periodo); }, [periodo, carregar]);

  const ia = useMemo(() => (d ? analisarDeterministico(d) : { alertas: [], oportunidades: [], recomendacoes: [] }), [d]);

  const Header = (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
      <div>
        <h1 style={{ fontFamily: cond, fontWeight: 800, fontSize: 28, color: C.text, lineHeight: 1 }}>
          StickBrain <span style={{ color: C.red }}>Analytics™</span>
        </h1>
        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>De onde vem dinheiro, onde está travando e o que fazer.</p>
      </div>
      <button onClick={() => carregar(periodo)} aria-label="Atualizar" title="Atualizar" style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 12px",
        cursor: "pointer", color: C.text, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
        Atualizar
      </button>
    </div>
  );

  const Filtros = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Período</span>
      <div style={{ display: "inline-flex", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden" }}>
        {PERIODOS.map(([k, lbl]) => (
          <button key={k} onClick={() => setPeriodo(k)} style={{
            background: periodo === k ? C.red : "transparent", color: periodo === k ? "#fff" : C.text,
            border: "none", padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>{lbl}</button>
        ))}
      </div>
    </div>
  );

  if (carregando) return <div>{Header}{Filtros}<SkeletonKpis count={4} /></div>;
  if (erro) return <div>{Header}{Filtros}<ErrorState title="Não foi possível carregar o StickBrain" message={erro} onRetry={() => carregar(periodo)} /></div>;

  const k = d?.kpis || {}, r = d?.receita || {}, p = d?.pipeline || {};
  const semDados = (k.leads || 0) + (k.stickquotes || 0) + (k.orcamentos || 0) === 0;

  return (
    <div>
      {Header}
      {Filtros}

      <PipelineSummary pipeline={p} />

      {/* KPIs principais */}
      <KpiGrid style={{ marginBottom: 12 }}>
        <KpiCard label="Leads" value={k.leads || 0} accent={C.steel}
          sub={k.leads_delta != null ? `${k.leads_delta >= 0 ? "▲" : "▼"} ${Math.abs(k.leads_delta)}% vs. período ant.` : null}
          subtone={k.leads_delta >= 0 ? "pos" : "neg"} />
        <KpiCard label="StickQuotes™" value={k.stickquotes || 0} accent={C.ochre}
          sub={`${pct(k.conv_lead_sq)} aproveitados`} subtone="muted" />
        <KpiCard label="Orçamentos" value={k.orcamentos || 0} accent={C.purple}
          sub={`${pct(k.conv_sq_orc)} dos StickQuotes`} subtone="muted" />
        <KpiCard label="Fechamentos" value={k.fechamentos || 0} accent={C.success}
          sub={`${pct(k.conv_orc_fech)} dos orçamentos`} subtone="pos" />
      </KpiGrid>

      {/* Métricas secundárias */}
      <KpiGrid style={{ marginBottom: 18 }}>
        <KpiCard label="Receita vendida" value={fmtBig(r.vendida)} accent={C.success}
          sub={r.vendida_delta ? `${r.vendida_delta >= 0 ? "+" : ""}${fmt(r.vendida_delta)} vs. ant.` : null}
          subtone={r.vendida_delta >= 0 ? "pos" : "neg"} />
        <KpiCard label="Ticket médio" value={fmtBig(r.ticket_medio)} accent={C.graphite} sub="por fechamento" />
        <KpiCard label="Conversão lead→venda" value={pct(r.conversao_lead_venda)} accent={C.red} sub="meta: 10%"
          subtone={(r.conversao_lead_venda || 0) >= 0.1 ? "pos" : "warn"} />
        <KpiCard label="Tempo médio fechamento" value={`${r.tempo_medio_fechamento_d || 0} d`} accent={C.steel} sub="lead → contrato" />
      </KpiGrid>

      {semDados && (
        <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 18, fontSize: 12.5, color: C.muted }}>
          Ainda sem dados suficientes no período. Conforme leads, StickQuotes e orçamentos forem entrando, o painel se preenche.
        </div>
      )}

      {/* Funil + Origem */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginBottom: 18 }}>
        <ConversionFunnel funil={d?.funil} periodo={`${periodo}`} />
        <OriginPerformanceChart origens={d?.origens} />
      </div>

      {/* Evolução mensal */}
      <div style={{ marginBottom: 18 }}>
        <MonthlyEvolution evolucao={d?.evolucao} />
      </div>

      {/* Alertas + StickBrain diz */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <AnalyticsAlerts alertas={ia.alertas} onAcao={(a) => {
          if (a.tipo === "orfaos") setActivePage("inteligencia");
          else setActivePage("orcamentos");
        }} />
        <StickBrainInsights oportunidades={ia.oportunidades} recomendacoes={ia.recomendacoes} />
      </div>
    </div>
  );
}
