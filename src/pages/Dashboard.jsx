import { useEffect, useState, lazy, Suspense } from "react";
import { sb, getEmpresaId } from "../services/supabase";
import { listarMonitorados } from "../services/repositories/precosRepository";
import { C, CATEGORIAS_DESPESA, FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { mesAno } from "../utils/date";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { useToast } from "../hooks/useToast";
import { emailAlertaInadimplencia } from "../services/emailService";
import { printHtml } from "../utils/printHtml";
import SmartAlerts from "../components/ui/SmartAlerts";
import AtencaoHoje from "../components/ui/AtencaoHoje";
import DashboardKPIs from "../components/Dashboard/DashboardKPIs";
import HojeNoStickFrame from "../components/Dashboard/HojeNoStickFrame";
import OnboardingChecklist from "../components/ui/OnboardingChecklist";
import SeuProgresso from "../components/Dashboard/SeuProgresso";
import TrialProgress from "../components/ui/TrialProgress";
import ComplianceNR from "../components/Dashboard/ComplianceNR";
import CalculadoraRapida from "../components/ui/CalculadoraRapida";
import { calcularStickScore, calcularStickScoreExecutivo, salvarSnapshotScore } from "../utils/stickScore";
import { StickScoreInline, StickScoreHero, StickScoreExecutivoCard } from "../components/ui/StickScore";
import StickScoreBenchmark from "../components/ui/StickScoreBenchmark";

//  SVG icon helpers 
const IC = {
  TrendUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M3 17l6-6 4 4 8-8M21 7v5h-5" />
    </svg>
  ),
  TrendDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M3 7l6 6 4-4 8 8M21 17v-5h-5" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h4" />
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" />
    </svg>
  ),
  Percent: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M19 5 5 19M8.5 8.5a2 2 0 1 0-.001-.001M16.5 16.5a2 2 0 1 0-.001-.001" />
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
    </svg>
  ),
  Printer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
      <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
      <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  ChartBar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
      <path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 9.74 19.72 19.72 0 0 1 2 1.17 2 2 0 0 1 4 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  ),
};

//  Mini Sparkline 
function Sparkline({ data = [], color = "#4f7d57", height = 26 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 120;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height * 0.85);
    return `${x},${y}`;
  });
  const gradId = `sp-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${pts.join(" L ")} L ${w},${height} L 0,${height} Z`} fill={`url(#${gradId})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

// Reloads page on chunk fetch failure
function lazyWithRetry(fn) {
  return lazy(() => fn().catch((e) => {
    if (e?.message?.includes("fetch") || e?.message?.includes("Failed")) {
      window.location.reload();
    }
    throw e;
  }));
}

const DashboardComercial   = lazyWithRetry(() => import("./DashboardComercial"));
const DashboardEngenheiro  = lazyWithRetry(() => import("./DashboardEngenheiro"));
const DashboardFinanceiro  = lazyWithRetry(() => import("./DashboardFinanceiro"));
const DashboardAnalytics   = lazyWithRetry(() => import("./DashboardAnalytics"));

//  Gráfico de barras 
function GraficoBarras({ data, height = 120 }) {
  if (!data.length) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>Sem dados</div>
  );
  const max = Math.max(...data.map((d) => Math.max(d.rec || 0, d.desp || 0, d.value || 0)), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 9, height, paddingTop: 6 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
          {d.rec !== undefined ? (
            <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", height: "calc(100% - 20px)" }}>
              <div style={{ flex: 1, height: `${(d.rec / max) * 100}%`, background: "#4f7d57", borderRadius: "4px 4px 0 0", minHeight: 3 }} />
              <div style={{ flex: 1, height: `${(d.desp / max) * 100}%`, background: "#981915", borderRadius: "4px 4px 0 0", minHeight: 3 }} />
            </div>
          ) : (
            <div style={{ width: "100%", height: `${((d.value || 0) / max) * 100}%`, background: d.color || "#981915", borderRadius: "4px 4px 0 0", minHeight: 3, alignSelf: "flex-end" }} />
          )}
          <span style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", lineHeight: 1.2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

//  Gráfico de linha 
function GraficoLinha({ data, height = 120 }) {
  if (data.length < 2) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>Sem histórico suficiente</div>
  );
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 300, h = height;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (d.value / max) * (h * 0.85);
    return `${x},${y}`;
  });
  const area = `M ${pts.join(" L ")} L ${w},${h} L 0,${h} Z`;
  return (
    <div style={{ position: "relative", height }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "100%", overflow: "visible" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lgLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f7d57" stopOpacity=".30" />
            <stop offset="100%" stopColor="#4f7d57" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lgLine)" />
        <polyline points={pts.join(" ")} fill="none" stroke="#4f7d57" strokeWidth="2.2" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * w;
          const y = h - (d.value / max) * (h * 0.85);
          return <circle key={d.label ?? i} cx={x} cy={y} r="3.2" fill="#4f7d57" />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
        {data.map((d, i) => <span key={d.label ?? i} style={{ fontSize: 10, color: "var(--muted)" }}>{d.label}</span>)}
      </div>
    </div>
  );
}

//  Helpers 
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function evolucaoMensal(lancamentos, tipo = "receita", mesesAtras = 6) {
  const agora  = new Date();
  const result = [];
  for (let i = mesesAtras - 1; i >= 0; i--) {
    const d     = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const ano   = d.getFullYear();
    const mes   = d.getMonth();
    const label = MESES[mes];
    const total = lancamentos
      .filter((l) => {
        const ld = new Date(l.created_at || l.data);
        return l.tipo === tipo && ld.getFullYear() === ano && ld.getMonth() === mes;
      })
      .reduce((sum, l) => sum + (l.valor || 0), 0);
    result.push({ label, value: total });
  }
  return result;
}

//  KPI Card 
function KpiCard({ label, value, sub, accentColor, iconColor, iconBg, Icon, trend, sparkData }) {
  const [hovered, setHovered] = useState(false);
  const isUp = trend != null && trend >= 0;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
        padding: "15px 15px 13px",
        boxShadow: hovered ? "0 1px 2px rgba(40,30,20,.04), 0 6px 16px rgba(40,30,20,.06)" : "0 1px 2px rgba(40,30,20,.05)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "box-shadow .16s, transform .16s", cursor: "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", color: "var(--muted)" }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: iconBg, color: iconColor, flexShrink: 0 }}>
          <Icon />
        </span>
      </div>
      <div className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 26, lineHeight: 1, color: "var(--ink)", whiteSpace: "nowrap" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 5, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        {trend != null && (
          <span style={{ fontWeight: 700, fontSize: 10.5, color: isUp ? "#4f7d57" : "#a33327", display: "inline-flex", alignItems: "center", gap: 2 }}>
            {isUp ? "" : ""} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        <span>{sub}</span>
      </div>
      {sparkData && sparkData.length >= 2 && (
        <div style={{ marginTop: 9 }}>
          <Sparkline data={sparkData} color={accentColor} height={26} />
        </div>
      )}
    </div>
  );
}

//  Dashboard (roteador por perfil) 
export default function Dashboard() {
  const perfil = useAppStore((s) => s.user?.perfil);
  const [tab, setTab] = useState("visao-geral");

  if (perfil === "comercial")  return <Suspense fallback={null}><DashboardComercial /></Suspense>;
  if (perfil === "engenheiro") return <Suspense fallback={null}><DashboardEngenheiro /></Suspense>;
  if (perfil === "financeiro") return <Suspense fallback={null}><DashboardFinanceiro /></Suspense>;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--surface-2,#faf8f4)", border: "1px solid var(--line)", borderRadius: 10, padding: 4, marginBottom: 20, width: "max-content" }}>
        {[["visao-geral", "Visão geral"], ["analytics", "Analytics"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "7px 16px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", border: "none",
              background: tab === key ? "var(--surface)" : "transparent",
              color: tab === key ? "var(--brick,#981915)" : "var(--muted)",
              boxShadow: tab === key ? "0 1px 2px rgba(40,30,20,.05)" : "none",
              transition: "all .12s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "analytics" ? (
        <Suspense fallback={<div style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</div>}>
          <DashboardAnalytics />
        </Suspense>
      ) : (
        <DashboardDiretor />
      )}
    </div>
  );
}

//  SST Operacional 
function OperacionalKpis() {
  const [kpis, setKpis] = useState(null);
  useEffect(() => {
    const empId = getEmpresaId();
    if (!empId) return;
    const hoje = new Date().toISOString().slice(0, 10);
    const em30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    Promise.all([
      sb.from("sst_incidentes").select("id, data, tipo").eq("empresa_id", empId).neq("status", "Fechado"),
      sb.from("sst_epis").select("id, validade").eq("empresa_id", empId).lte("validade", em30),
      sb.from("suprimentos_pedidos").select("id, status, urgencia").eq("empresa_id", empId).neq("status", "Entregue").neq("status", "Cancelado"),
      sb.from("suprimentos_estoque").select("id, quantidade, estoque_minimo").eq("empresa_id", empId).gt("estoque_minimo", 0),
    ]).then(([inc, epis, peds, est]) => {
      const incList = inc.data || [];
      const episList = epis.data || [];
      const pedsList = peds.data || [];
      const estList = est.data || [];
      const ultimoAcidente = incList.filter(i => i.tipo === "Acidente" || i.tipo === "Incidente").sort((a,b) => b.data.localeCompare(a.data))[0];
      const diasSemAcidente = ultimoAcidente
        ? Math.floor((new Date() - new Date(ultimoAcidente.data + "T00:00:00")) / 86400000)
        : "inf";
      setKpis({
        diasSemAcidente,
        episVencidos: episList.filter(e => e.validade < hoje).length,
        episVencendo: episList.filter(e => e.validade >= hoje).length,
        incAbertos: incList.length,
        pedPendentes: pedsList.filter(p => p.status === "Pendente").length,
        pedCriticos: pedsList.filter(p => p.urgencia === "Crítico").length,
        estoqueAbaixo: estList.filter(e => e.quantidade <= e.estoque_minimo).length,
      });
    }).catch(e => console.warn("[Dashboard] kpis:", e));
  }, []);

  if (!kpis) return null;

  const kpiOp = [
    { label: "Dias sem acidente", value: kpis.diasSemAcidente === "inf" ? "∞" : kpis.diasSemAcidente, cor: kpis.diasSemAcidente === "inf" || kpis.diasSemAcidente > 30 ? "#3f7a4b" : kpis.diasSemAcidente > 7 ? "#b07a1e" : "#a33327" },
    { label: "EPIs vencidos",      value: kpis.episVencidos,   cor: kpis.episVencidos > 0   ? "#a33327" : "#3f7a4b" },
    { label: "EPIs vencendo 30d",  value: kpis.episVencendo,   cor: kpis.episVencendo > 0   ? "#b07a1e" : "#3f7a4b" },
    { label: "Incidentes abertos", value: kpis.incAbertos,     cor: kpis.incAbertos > 0     ? "#a33327" : "#3f7a4b" },
    { label: "Pedidos pendentes",  value: kpis.pedPendentes,   cor: kpis.pedPendentes > 0   ? "#b07a1e" : "#3f7a4b" },
    { label: "Pedidos críticos",   value: kpis.pedCriticos,    cor: kpis.pedCriticos > 0    ? "#a33327" : "#3f7a4b" },
    { label: "Estoque abaixo mín", value: kpis.estoqueAbaixo,  cor: kpis.estoqueAbaixo > 0  ? "#b07a1e" : "#3f7a4b" },
  ];

  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg,16px)", padding: 20, border: "1px solid var(--line)", marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase", marginBottom: 14 }}>SST &amp; Suprimentos</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {kpiOp.map(k => (
          <div key={k.label} style={{ borderRadius: 10, padding: "12px 14px", background: "var(--surface-2,#faf8f4)", border: "1px solid var(--line)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: k.cor + "1a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: k.cor }} />
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: k.cor }}>{k.value}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, lineHeight: 1.3 }}>{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

//  DashboardDiretor 
function DashboardDiretor() {
  useModuleLoad("clientes");
  useModuleLoad("orcamentos");
  useModuleLoad("obras");
  useModuleLoad("financeiro");
  useModuleLoad("contratos");
  useModuleLoad("historico");

  const clientes    = useAppStore((s) => s.clientes);
  const orcamentos  = useAppStore((s) => s.orcamentos);
  const obras       = useAppStore((s) => s.obras);
  const financeiro  = useAppStore((s) => s.financeiro);
  const contratos   = useAppStore((s) => s.contratos);
  const medicoes    = useAppStore((s) => s.medicoes);
  const diario      = useAppStore((s) => s.diario);
  const empresa     = useAppStore((s) => s.empresa);
  const historico   = useAppStore((s) => s.historico);
  const empresaId   = useAppStore((s) => s.empresaId);
  const { toast: toastInadimpl, mostrarToast: toastMsg } = useToast();
  const loadMedicoes  = useAppStore((s) => s.loadMedicoes);
  const setActivePage = useAppStore((s) => s.setActivePage);

  useEffect(() => { obras.forEach((o) => loadMedicoes(o.id)); }, [obras, loadMedicoes]);

  useEffect(() => {
    if (!empresaId || obras.length === 0) return;
    obras.filter(o => o.status === "Em andamento").forEach((o) => {
      const fins = (financeiro[o.id]?.lancamentos || []);
      const score = calcularStickScore(o, { financeiro: fins, medicoes: medicoes[o.id] || [] });
      salvarSnapshotScore(empresaId, o.id, score);
    });
  }, [empresaId, obras, financeiro, medicoes]);

  const [precosMon, setPrecosMon] = useState([]);
  useEffect(() => { listarMonitorados().then(setPrecosMon).catch(e => console.warn("[Dashboard] monitorados:", e)); }, []);

  const [kpiOp, setKpiOp] = useState({});
  useEffect(() => {
    const empId = getEmpresaId();
    if (!empId) return;
    Promise.all([
      sb.from("suprimentos_pedidos").select("id, status, urgencia").eq("empresa_id", empId).eq("urgencia", "Crítico").neq("status", "Entregue").neq("status", "Cancelado"),
      sb.from("suprimentos_estoque").select("id, quantidade, estoque_minimo").eq("empresa_id", empId).gt("estoque_minimo", 0),
    ]).then(([peds, est]) => {
      setKpiOp({
        pedCriticos: (peds.data || []).length,
        estoqueAbaixo: (est.data || []).filter(e => e.quantidade <= e.estoque_minimo).length,
      });
    }).catch(e => console.warn("[Dashboard] kpiOp:", e));
  }, []);

  //  Financeiro
  const allLancamentos = Object.values(financeiro).flatMap((f) => f.lancamentos || []);
  const totalRec  = allLancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
  const totalDesp = allLancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
  const saldo     = totalRec - totalDesp;
  const margem    = totalRec > 0 ? ((saldo / totalRec) * 100).toFixed(1) : "0.0";
  const pipelineOrc = orcamentos.filter((o) => !["Recusado"].includes(o.status)).reduce((a, o) => a + (o.valor || 0), 0);

  //  VGV 
  const STATUS_QUALIFICADO = ["Negociação", "Proposta Enviada", "Em Execução"];
  const leadsQualificados  = clientes.filter((c) => STATUS_QUALIFICADO.includes(c.status));
  const leadsBrutos        = clientes.filter((c) => c.status === "Lead");

  const vgvFunil = [
    { label: "Oportunidades", sublabel: "negociação + proposta", valor: leadsQualificados.reduce((a, c) => a + (c.valor || 0), 0), count: leadsQualificados.length, color: C.steel },
    { label: "Leads novos",   sublabel: "a qualificar",          valor: leadsBrutos.reduce((a, c) => a + (c.valor || 0), 0),        count: leadsBrutos.length,        color: "#bcae9c", bruto: true },
    { label: "Orçamentos",    sublabel: "em aberto",             valor: orcamentos.filter((o) => o.status !== "Recusado").reduce((a, o) => a + (o.valor || 0), 0), count: orcamentos.filter((o) => o.status !== "Recusado").length, color: C.ochre },
    { label: "Contratos",     sublabel: "assinados",             valor: contratos.reduce((a, c) => a + (c.valor || 0), 0),          count: contratos.length,          color: C.plum },
    { label: "Obras ativas",  sublabel: "em execução",           valor: obras.filter((o) => o.status === "Em andamento").reduce((a, o) => a + (o.contrato || 0), 0), count: obras.filter((o) => o.status === "Em andamento").length, color: C.red },
    {
      label: "Concluídas", sublabel: "receita realizada",
      valor: obras.filter((o) => o.status === "Concluída").reduce((a, o) => {
        const fin = financeiro[o.id] || { lancamentos: [] };
        return a + fin.lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + (l.valor || 0), 0);
      }, 0),
      count: obras.filter((o) => o.status === "Concluída").length, color: C.sage,
    },
  ];
  const vgvTotal    = vgvFunil.filter((f) => !f.bruto).reduce((a, f) => a + f.valor, 0);
  const vgvComLeads = vgvFunil.reduce((a, f) => a + f.valor, 0);

  //  Medições 
  const allMedicoes   = Object.values(medicoes).flat();
  const medPendentes  = allMedicoes.filter((m) => m.status === "Pendente");
  const valorPendente = medPendentes.reduce((a, m) => a + (m.valor || 0), 0);

  //  Prazos 
  const hoje          = new Date();
  const obrasComPrazo = obras.filter((o) => o.prazo_fim && o.status !== "Concluída");
  const atrasadas     = obrasComPrazo.filter((o) => new Date(o.prazo_fim) < hoje);
  const noPrazo       = obrasComPrazo.filter((o) => new Date(o.prazo_fim) >= hoje);

  //  Compras Preditivas 
  const FASE_THRESHOLDS = [
    { fase: "Fundação",     min: 0,  max: 15,  materiais: ["Brita", "Cimento Portland", "Armação CA-50", "Formas"] },
    { fase: "Levantamento", min: 15, max: 40,  materiais: ["Perfis C90/U90", "OSB 11mm", "Parafusos Selbohner", "Fita impermeabilizante"] },
    { fase: "Cobertura",    min: 40, max: 55,  materiais: ["Telhas metálicas", "Cumeeiras e rufos", "Calhas PVC", "Estrutura da tesoura"] },
    { fase: "Fechamentos",  min: 55, max: 75,  materiais: ["Gesso acartonado", "Lã de vidro 50mm", "Massa corrida PVA", "Drywall"] },
    { fase: "Acabamento",   min: 75, max: 95,  materiais: ["Porcelanato", "Tinta Acrílica", "Louças e metais", "Disjuntores e elétrica final"] },
    { fase: "Entrega",      min: 95, max: 100, materiais: ["Limpeza final", "Pintura de toque", "Revisões e comissionamento"] },
  ];
  const alertasCompra = obras
    .filter((o) => o.status === "Em andamento" && o.prazo_inicio && o.prazo_fim)
    .flatMap((o) => {
      const inicio = new Date(o.prazo_inicio), fim = new Date(o.prazo_fim);
      const duracaoTotal = (fim - inicio) / 86400000;
      if (duracaoTotal <= 0) return [];
      const alerts = [];
      FASE_THRESHOLDS.forEach((fz) => {
        const dataFase = new Date(inicio.getTime() + (fz.min / 100) * duracaoTotal * 86400000);
        const diasAte  = Math.round((dataFase - hoje) / 86400000);
        if (diasAte >= 0 && diasAte <= 15 && (o.progresso || 0) < fz.max) {
          alerts.push({ obra: o, fase: fz.fase, diasAte, materiais: fz.materiais });
        }
      });
      return alerts;
    }).sort((a, b) => a.diasAte - b.diasAte);

  //  KPI / Trends 
  const obrasAtivas = obras.filter((o) => o.status === "Em andamento").length;
  const agora2      = new Date();
  const mesAtual    = agora2.getMonth(), anoAtual = agora2.getFullYear();
  const mesPrev     = mesAtual === 0 ? 11 : mesAtual - 1, anoPrev = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  function somarMes(tipo, mes, ano) {
    return allLancamentos.filter((l) => {
      const d = new Date(l.created_at || l.data);
      return l.tipo === tipo && d.getMonth() === mes && d.getFullYear() === ano;
    }).reduce((a, l) => a + (l.valor || 0), 0);
  }
  function trend(atual, prev) { return prev === 0 ? null : ((atual - prev) / prev) * 100; }

  const sparkRec  = evolucaoMensal(allLancamentos, "receita", 6).map((d) => d.value);
  const sparkDesp = evolucaoMensal(allLancamentos, "despesa", 6).map((d) => d.value);

  //  CRM 
  const fechados = clientes.filter((c) => c.status === "Fechado").length;
  const taxaConv = clientes.length > 0 ? ((fechados / clientes.length) * 100).toFixed(0) : "0";
  const STATUS_CRM = ["Lead", "Em negociação", "Proposta enviada", "Fechado"];
  const statusCRM  = STATUS_CRM.map((s) => ({
    label: s.split(" ")[0], fullLabel: s,
    value: clientes.filter((c) => c.status === s).reduce((a, c) => a + (c.valor || 0), 0),
    count: clientes.filter((c) => c.status === s).length,
    color: s === "Fechado" ? C.sage : s === "Lead" ? C.muted : C.ochre,
  }));

  //  Charts data 
  const evolucao = evolucaoMensal(allLancamentos, "receita", 6);

  const graficoObras = obras.map((o) => {
    const fin  = financeiro[o.id] || { lancamentos: [] };
    const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
    const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
    const nome = o.nome?.split("—")[0]?.trim()?.split(" ")[0] || "Obra";
    return { label: nome.length > 8 ? nome.slice(0, 7) + "." : nome, rec, desp };
  }).filter((d) => d.rec > 0 || d.desp > 0);

  const obrasPorFase = FASES.map((fase, i) => ({
    label: fase.split(" ")[0], fullLabel: fase,
    value: obras.filter((o) => o.fase === fase).length,
    color: [C.steel, C.ochre, C.plum, C.clay, C.sage, C.red][i % 6],
  })).filter((d) => d.value > 0);

  const despCats = CATEGORIAS_DESPESA.map((cat, i) => ({
    label: cat.split(" ")[0], fullLabel: cat,
    value: allLancamentos.filter((l) => l.tipo === "despesa" && l.categoria === cat).reduce((a, l) => a + (l.valor || 0), 0),
    color: [C.red, C.clay, C.ochre, C.plum, C.steel, C.sage, C.muted][i % 7],
  })).filter((d) => d.value > 0);

  const evolucaoPropostas = (() => {
    const agora = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
      const y = d.getFullYear(), m = d.getMonth();
      const enviadas  = orcamentos.filter(o => { const c = new Date(o.created_at); return c.getFullYear() === y && c.getMonth() === m; }).length;
      const aprovadas = orcamentos.filter(o => { const c = new Date(o.created_at); return c.getFullYear() === y && c.getMonth() === m && o.status === "Aprovado"; }).length;
      return { label: MESES[m], rec: enviadas, desp: aprovadas };
    });
  })();

  //  Rentabilidade 
  const rentabilidade = obras.filter((o) => o.contrato > 0).map((o) => {
    const fin  = financeiro[o.id] || { lancamentos: [] };
    const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
    const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
    const saldoObra    = rec - desp;
    const margemReal   = rec > 0 ? (saldoObra / rec) * 100 : 0;
    const pctRecebido  = o.contrato > 0 ? (rec / o.contrato) * 100 : 0;
    const gapPagamento = (o.progresso || 0) - pctRecebido;
    return { ...o, rec, desp, saldoObra, margemReal, pctRecebido, gapPagamento };
  }).sort((a, b) => a.margemReal - b.margemReal);

  const inadimplentes = rentabilidade.filter((o) => o.gapPagamento > 25 && o.status !== "Concluída");

  //  Relatório / PDF 
  function exportarPdf() {
    document.body.classList.add("printing");
    window.print();
    const cleanup = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
  }

  function gerarRelatorioMensal() {
    const mes = mesAno();
    const obrasAndamento = obras.filter((o) => o.status === "Em andamento");
    const linhasObras = obrasAndamento.map((o) => {
      const fin  = financeiro[o.id] || { lancamentos: [] };
      const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
      const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${o.nome}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${o.fase || "—"}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${o.progresso || 0}%</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#3f7a4b">${fmt(rec)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#981915">${fmt(desp)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${fmt(rec - desp)}</td></tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório Executivo — ${mes}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1a1a1a;padding:40px;max-width:900px;margin:auto}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.kpi{background:#f9f9fb;border:1px solid #e4e4ea;border-radius:10px;padding:14px 16px}.kpi-l{font-size:10px;font-weight:700;color:#6b7280;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}.kpi-v{font-size:20px;font-weight:900}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f0f0f3;padding:10px 12px;text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#6b7280;font-weight:700}</style></head><body><h1 style="margin-bottom:20px;color:#981915">StickFrame — Relatório Executivo ${mes}</h1><div class="kpis"><div class="kpi"><div class="kpi-l">Obras Ativas</div><div class="kpi-v" style="color:#981915">${obrasAndamento.length}</div></div><div class="kpi"><div class="kpi-l">Receita Total</div><div class="kpi-v" style="color:#3f7a4b">${fmt(totalRec)}</div></div><div class="kpi"><div class="kpi-l">Despesa Total</div><div class="kpi-v" style="color:#981915">${fmt(totalDesp)}</div></div><div class="kpi"><div class="kpi-l">Margem</div><div class="kpi-v">${margem}%</div></div></div>${obrasAndamento.length > 0 ? `<table><thead><tr><th>Obra</th><th>Fase</th><th>Progresso</th><th style="text-align:right">Receita</th><th style="text-align:right">Despesa</th><th style="text-align:right">Saldo</th></tr></thead><tbody>${linhasObras}</tbody></table>` : ""}</body></html>`;
    printHtml(html, `relatorio-executivo-${mes}`);
  }

  //  Activation / Trial progress
  const onboardingP = useAppStore.getState().onboardingProgress;
  const actSteps = ["empresa_configurada","primeiro_cliente","primeiro_orcamento","primeira_obra","conheceu_stickbrain"];
  const actDone = actSteps.filter((s) => onboardingP[s]).length;
  const activationPct = Math.round((actDone / actSteps.length) * 100);
  const activationSteps = [
    { key: "empresa", label: "Empresa", done: onboardingP.empresa_configurada },
    { key: "cliente", label: "Cliente", done: onboardingP.primeiro_cliente },
    { key: "orcamento", label: "Orçamento", done: onboardingP.primeiro_orcamento },
    { key: "obra", label: "Obra", done: onboardingP.primeira_obra },
    { key: "brain", label: "StickBrain", done: onboardingP.conheceu_stickbrain },
  ];

  //  KPIs config 
  const kpisConfig = [
    { label: "Receitas",     value: fmt(totalRec),          sub: "total recebido",         accentColor: C.sage,    iconColor: C.sage,    iconBg: "rgba(79,125,87,.13)",   Icon: IC.TrendUp,   trend: trend(somarMes("receita", mesAtual, anoAtual), somarMes("receita", mesPrev, anoPrev)), sparkData: sparkRec  },
    { label: "Despesas",     value: fmt(totalDesp),         sub: "total lançado",          accentColor: C.danger,  iconColor: C.danger,  iconBg: "rgba(163,51,39,.12)",   Icon: IC.TrendDown, trend: trend(somarMes("despesa", mesAtual, anoAtual), somarMes("despesa", mesPrev, anoPrev)), sparkData: sparkDesp },
    { label: "Margem",       value: `${margem}%`,           sub: `saldo ${fmt(saldo)}`,    accentColor: Number(margem) >= 20 ? C.sage : C.ochre, iconColor: Number(margem) >= 20 ? C.sage : C.ochre, iconBg: "rgba(79,125,87,.13)", Icon: IC.Percent },
    { label: "Obras ativas", value: String(obrasAtivas),    sub: `de ${obras.length} total`, accentColor: C.red,  iconColor: C.red,     iconBg: "var(--brick-soft,#f3e7e5)", Icon: IC.Building },
    { label: "Orçamentos",   value: String(orcamentos.length), sub: `pipeline ${fmt(pipelineOrc)}`, accentColor: C.ochre, iconColor: C.ochre, iconBg: "rgba(192,137,45,.14)", Icon: IC.FileText },
    { label: "Clientes",     value: String(clientes.length), sub: `${fechados} fechados`,  accentColor: C.steel,  iconColor: C.steel,   iconBg: "rgba(59,110,165,.12)",   Icon: IC.Users },
  ];

  // 
  return (
    <div>
      {toastInadimpl && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#2b2b2e", color: "#fff", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 12px 34px rgba(40,30,20,.12)" }}>
          {toastInadimpl}
        </div>
      )}

      {/*  Page head  */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 5, height: 30, borderRadius: 3, background: "#981915", flexShrink: 0 }} />
          <div>
            <h1 className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: ".3px", color: "var(--ink,#26231f)", lineHeight: 1, margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>Visão consolidada — {mesAno()}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={exportarPdf} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit", fontWeight: 600, fontSize: 12.5, padding: "9px 15px", borderRadius: 9, cursor: "pointer", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2,#57514a)" }}>
            <IC.Printer /> Exportar PDF
          </button>
          <button onClick={gerarRelatorioMensal} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit", fontWeight: 600, fontSize: 12.5, padding: "9px 15px", borderRadius: 9, cursor: "pointer", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2,#57514a)" }}>
            <IC.Printer /> Relatório mensal
          </button>
          <button
            onClick={async () => {
              try {
                const { error } = await sb.functions.invoke("relatorio-mensal");
                if (error) throw error;
                toastMsg("Relatório enviado por email com sucesso!");
              } catch (e) {
                toastMsg("Erro ao enviar relatório: " + (e?.message || String(e)));
              }
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit", fontWeight: 600, fontSize: 12.5, padding: "9px 15px", borderRadius: 9, cursor: "pointer", border: "none", background: "#981915", color: "#fff" }}
          >
            <IC.Send /> Enviar relatório
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="print-header" style={{ display: "none" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#981915" }}>StickFrame</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Relatório Executivo Mensal</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{mesAno()}</div>
        </div>
      </div>

      {/* Onboarding & Progress */}
      <OnboardingChecklist setActivePage={setActivePage} />

      <SeuProgresso setActivePage={setActivePage} clientes={clientes} orcamentos={orcamentos} obras={obras} />

      <TrialProgress activationPct={activationPct} activationSteps={activationSteps} />

      <div data-no-print="true"><SmartAlerts onNavigate={setActivePage} /></div>

      <HojeNoStickFrame setActivePage={setActivePage} />

      {/* Atenção Hoje — oculto a pedido */}
      {/* <AtencaoHoje obras={obras} financeiro={financeiro} medicoes={medicoes} kpis={kpiOp} setActivePage={setActivePage} /> */}

      {/* StickScore */}
      {(() => {
        const scoreExec = calcularStickScoreExecutivo(obras, financeiro);
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 20 }}>
            <StickScoreHero obras={obras} financeiroPorObra={financeiro} />
            {/* StickScore Executivo — oculto a pedido */}
            {/* <StickScoreExecutivoCard score={scoreExec} /> */}
            <StickScoreBenchmark obras={obras} financeiroPorObra={financeiro} medicoesPorObra={medicoes} />
          </div>
        );
      })()}

      {/*  VGV HERO  */}
      <section style={{
        background: "radial-gradient(120% 140% at 100% 0%, rgba(152,25,21,.045) 0%, transparent 45%), var(--surface)",
        border: "1px solid var(--line)", borderRadius: "var(--radius-lg,16px)",
        boxShadow: "0 1px 2px rgba(40,30,20,.04), 0 6px 16px rgba(40,30,20,.06)",
        padding: "22px 24px", marginBottom: 18, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "#981915" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.6, color: "var(--muted)", textTransform: "uppercase" }}>VGV · Valor Geral de Vendas</div>
            <div className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 46, lineHeight: .95, color: "var(--ink,#26231f)", marginTop: 6, letterSpacing: ".01em" }}>{fmt(vgvTotal)}</div>
            <div style={{ fontSize: 12, color: "var(--ink-2,#57514a)", marginTop: 5 }}>Oportunidades qualificadas · do pipeline às obras concluídas</div>
            {vgvComLeads > vgvTotal && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>+ {fmt(vgvComLeads - vgvTotal)} em leads não qualificados</div>
            )}
          </div>
          <div style={{ textAlign: "right", background: "var(--surface-2,#faf8f4)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 16px", minWidth: 170 }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: .5 }}>Receita realizada</div>
            <div className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 26, color: C.sage, lineHeight: 1.05, marginTop: 2 }}>{fmt(totalRec)}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{totalRec > 0 && vgvTotal > 0 ? `${((totalRec / vgvTotal) * 100).toFixed(0)}% do VGV` : "—"}</div>
          </div>
        </div>

        {/* Funnel bar */}
        <div style={{ height: 13, borderRadius: 7, overflow: "hidden", display: "flex", background: "var(--line)", marginBottom: 6 }}>
          {vgvFunil.map((f, i) => {
            const base = vgvComLeads > 0 ? vgvComLeads : 1;
            const pct  = (f.valor / base) * 100;
            if (pct < 0.5) return null;
            return (
              <div key={i} title={`${f.label}: ${pct.toFixed(1)}%`} style={{
                width: `${pct}%`, minWidth: 4, height: "100%",
                background: f.bruto
                  ? `repeating-linear-gradient(45deg,${f.color},${f.color} 4px,#cfc4b5 4px,#cfc4b5 8px)`
                  : f.color,
                borderRight: i < vgvFunil.length - 1 ? "1.5px solid var(--surface)" : "none",
              }} />
            );
          })}
        </div>

        {/* Funnel legend */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginTop: 16 }}>
          {vgvFunil.map((f, i) => (
            <div key={i} style={{ paddingLeft: 11, borderLeft: `3px solid ${f.color}`, opacity: f.bruto ? 0.65 : 1 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", color: f.color, marginBottom: 3 }}>{f.label}</div>
              <div className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: f.bruto ? "var(--muted)" : "var(--ink,#26231f)" }}>{fmt(f.valor)}</div>
              <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>{f.count} {f.count === 1 ? "item" : "itens"}</div>
            </div>
          ))}
        </div>
      </section>

      {/*  6 KPI CARDS  */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 18 }}>
        {kpisConfig.map((k) => <KpiCard key={k.label} {...k} />)}
      </section>

      {/*  TRI MINI-CARDS  */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
        {/* Medições pendentes */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius,12px)", padding: "15px 17px", boxShadow: "0 1px 2px rgba(40,30,20,.05)" }}>
          <div style={{ fontSize: 10, letterSpacing: .9, textTransform: "uppercase", color: "var(--muted)", marginBottom: 9, fontWeight: 700 }}>Medições pendentes</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 25, lineHeight: 1, color: C.ochre }}>{medPendentes.length}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>aguardando</div>
            </div>
            <div style={{ width: 1, height: 30, background: "var(--line)" }} />
            <div style={{ fontSize: 12, color: "var(--ink-2,#57514a)" }}>
              {medPendentes.length > 0 ? fmt(valorPendente) : "—"}
              <br /><span style={{ color: "var(--muted)", fontSize: 11 }}>a aprovar</span>
            </div>
          </div>
        </div>

        {/* Prazos das obras */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius,12px)", padding: "15px 17px", boxShadow: "0 1px 2px rgba(40,30,20,.05)" }}>
          <div style={{ fontSize: 10, letterSpacing: .9, textTransform: "uppercase", color: "var(--muted)", marginBottom: 9, fontWeight: 700 }}>Prazos das obras</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 25, lineHeight: 1, color: "#a33327" }}>{atrasadas.length}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>atrasada{atrasadas.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ width: 1, height: 30, background: "var(--line)" }} />
            <div>
              <div className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 25, lineHeight: 1, color: C.sage }}>{noPrazo.length}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>no prazo</div>
            </div>
          </div>
        </div>

        {/* Conversão CRM */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius,12px)", padding: "15px 17px", boxShadow: "0 1px 2px rgba(40,30,20,.05)" }}>
          <div style={{ fontSize: 10, letterSpacing: .9, textTransform: "uppercase", color: "var(--muted)", marginBottom: 9, fontWeight: 700 }}>Conversão CRM</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 25, lineHeight: 1, color: C.steel }}>{taxaConv}%</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>taxa de fechamento</div>
            </div>
            <div style={{ width: 1, height: 30, background: "var(--line)" }} />
            <div style={{ fontSize: 12, color: "var(--ink-2,#57514a)" }}>
              {fechados} / {clientes.length}
              <br /><span style={{ color: "var(--muted)", fontSize: 11 }}>clientes</span>
            </div>
          </div>
        </div>
      </section>

      {/*  CHARTS ROW 1  */}
      <section style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg,16px)", boxShadow: "0 1px 2px rgba(40,30,20,.05)", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase" }}>Receita vs Despesa por obra</span>
            <span style={{ display: "flex", gap: 14, fontSize: 10.5, color: "var(--ink-2,#57514a)" }}>
              <span><i style={{ width: 9, height: 9, borderRadius: 2, background: C.sage, display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />Receita</span>
              <span><i style={{ width: 9, height: 9, borderRadius: 2, background: C.red, display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />Despesa</span>
            </span>
          </div>
          {graficoObras.length === 0
            ? <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>Sem obras com lançamentos</div>
            : <GraficoBarras data={graficoObras} height={140} />}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg,16px)", boxShadow: "0 1px 2px rgba(40,30,20,.05)", padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Evolução de receitas · 6 meses</div>
          <div className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: C.sage, marginBottom: 8 }}>{fmt(totalRec)}</div>
          {evolucao.every((d) => d.value === 0)
            ? <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>Nenhum lançamento nos últimos 6 meses</div>
            : <GraficoLinha data={evolucao} height={120} />}
        </div>
      </section>

      {/*  CHARTS ROW 2  */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        {/* Obras por fase */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg,16px)", boxShadow: "0 1px 2px rgba(40,30,20,.05)", padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase", marginBottom: 15 }}>Obras por fase</div>
          {obrasPorFase.length === 0
            ? <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 12 }}>Sem dados de fase</div>
            : (
              <>
                <GraficoBarras data={obrasPorFase} height={96} />
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
                  {obrasPorFase.map((d) => (
                    <div key={d.fullLabel} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                      <span style={{ color: "var(--ink-2,#57514a)", display: "flex", alignItems: "center", gap: 8 }}>
                        <i style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: "inline-block" }} />{d.fullLabel}
                      </span>
                      <span className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "var(--ink,#26231f)", fontSize: 14 }}>{d.value} obra{d.value !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
        </div>

        {/* Pipeline CRM */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg,16px)", boxShadow: "0 1px 2px rgba(40,30,20,.05)", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase" }}>Pipeline CRM</span>
            <span className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: C.steel, fontWeight: 700 }}>{taxaConv}% conv.</span>
          </div>
          <GraficoBarras data={statusCRM} height={96} />
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            {statusCRM.map((s) => (
              <div key={s.fullLabel} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                <span style={{ color: "var(--ink-2,#57514a)", display: "flex", alignItems: "center", gap: 8 }}>
                  <i style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />{s.fullLabel}
                </span>
                <span className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "var(--ink,#26231f)", fontSize: 14 }}>{s.count} · {s.value > 0 ? fmt(s.value) : "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas por categoria */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg,16px)", boxShadow: "0 1px 2px rgba(40,30,20,.05)", padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase", marginBottom: 15 }}>Despesas por categoria</div>
          {despCats.length > 0
            ? (
              <>
                <GraficoBarras data={despCats} height={96} />
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
                  {despCats.slice(0, 5).map((d) => (
                    <div key={d.fullLabel} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                      <span style={{ color: "var(--ink-2,#57514a)", display: "flex", alignItems: "center", gap: 8 }}>
                        <i style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: "inline-block" }} />{d.fullLabel}
                      </span>
                      <span className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "var(--ink,#26231f)", fontSize: 14 }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )
            : <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 12 }}>Sem despesas lançadas</div>}
        </div>
      </section>

      {/* Calculadora rápida */}
      <div style={{ marginBottom: 18 }}><CalculadoraRapida /></div>

      {/*  Agenda + Monitor de preços  */}
      {(() => {
        const hojeStr = new Date().toISOString().split("T")[0];
        const followUps = clientes.filter((c) =>
          c.proximo_contato && c.proximo_contato <= hojeStr &&
          c.status !== "Fechado" && c.status !== "Em execução"
        ).sort((a, b) => a.proximo_contato.localeCompare(b.proximo_contato));
        const emAlta = precosMon
          .filter((p) => p.preco_atual && p.preco_anterior && p.preco_atual > p.preco_anterior)
          .map((p) => ({ ...p, var: ((p.preco_atual - p.preco_anterior) / p.preco_anterior) * 100 }))
          .sort((a, b) => b.var - a.var).slice(0, 6);
        const emBaixa = precosMon
          .filter((p) => p.preco_atual && p.preco_anterior && p.preco_atual < p.preco_anterior)
          .map((p) => ({ ...p, var: ((p.preco_atual - p.preco_anterior) / p.preco_anterior) * 100 }))
          .sort((a, b) => a.var - b.var).slice(0, 4);
        if (followUps.length === 0 && emAlta.length === 0 && emBaixa.length === 0) return null;
        return (
          <section style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg,16px)", boxShadow: "0 1px 2px rgba(40,30,20,.05)", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <IC.Calendar /> Agenda do dia
                </span>
                {followUps.length > 0 && <span style={{ background: C.danger + "1a", color: C.danger, borderRadius: 5, fontSize: 10.5, fontWeight: 800, padding: "3px 9px", border: `1px solid ${C.danger}33` }}>{followUps.length} pendente{followUps.length > 1 ? "s" : ""}</span>}
              </div>
              {followUps.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 12 }}>Nenhum follow-up pendente para hoje</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {followUps.map((c) => {
                    const atrasado = c.proximo_contato < hojeStr;
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: atrasado ? C.danger + "0e" : "var(--surface-2,#faf8f4)", borderRadius: 8, borderLeft: `3px solid ${atrasado ? C.danger : C.ochre}`, flexWrap: "wrap" }}>
                        <span style={{ color: atrasado ? C.danger : C.ochre, flexShrink: 0 }}><IC.Phone /></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.status} · {c.contato || c.email || "—"}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: atrasado ? C.danger : C.ochre, fontWeight: 700 }}>{atrasado ? "Atrasado" : "Hoje"}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>{new Date(c.proximo_contato + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg,16px)", boxShadow: "0 1px 2px rgba(40,30,20,.05)", padding: "18px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase", marginBottom: 15, display: "flex", alignItems: "center", gap: 6 }}>
                <IC.ChartBar /> Monitor de preços
              </div>
              {emAlta.length === 0 && emBaixa.length === 0
                ? <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 12 }}>Nenhuma variação registrada ainda</div>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {emAlta.map((p) => (
                      <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "7px 10px", background: C.danger + "0f", borderRadius: 7, borderLeft: `3px solid ${C.danger}` }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome_produto}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>{p.loja || "—"}</div>
                        </div>
                        <span className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: C.danger, flexShrink: 0 }}>+{p.var.toFixed(1)}%</span>
                      </div>
                    ))}
                    {emBaixa.map((p) => (
                      <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "7px 10px", background: C.sage + "0f", borderRadius: 7, borderLeft: `3px solid ${C.sage}` }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome_produto}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>{p.loja || "—"}</div>
                        </div>
                        <span className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: C.sage, flexShrink: 0 }}>{p.var.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </section>
        );
      })()}

      {/*  Inadimplência  */}
      {inadimplentes.length > 0 && (
        <div style={{ background: C.danger + "0d", border: `1px solid ${C.danger}33`, borderRadius: "var(--radius-lg,16px)", padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: C.danger }}><IC.Warning /></span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.danger }}>{inadimplentes.length} obra{inadimplentes.length > 1 ? "s" : ""} com pagamento atrasado em relação ao progresso</div>
                <div style={{ fontSize: 11, color: C.danger, marginTop: 2 }}>Progresso da obra supera % recebido em mais de 25 pontos</div>
              </div>
            </div>
            <button
              onClick={async () => {
                const hojeStr = new Date().toISOString().slice(0, 10);
                const vencidos = Object.values(financeiro).flatMap((f) => {
                  const obraObj = obras.find((o) => f.lancamentos?.length && financeiro[o.id] === f);
                  return (f.lancamentos || []).filter((l) =>
                    l.data_vencimento && l.data_vencimento < hojeStr && l.status !== "Pago" && l.status !== "Recebido"
                  ).map((l) => ({ ...l, obra: obraObj?.nome || "—" }));
                });
                if (!empresa?.email) { toastMsg("Email da empresa não configurado"); return; }
                if (vencidos.length === 0) { toastMsg("Nenhum lançamento vencido encontrado"); return; }
                try {
                  await emailAlertaInadimplencia({ email: empresa.email, lancamentos: vencidos });
                  toastMsg("Alerta enviado!");
                } catch (e) {
                  toastMsg(`Erro ao enviar: ${e?.message}`);
                }
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", background: C.danger + "22", border: `1px solid ${C.danger}44`, color: C.danger, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", borderRadius: 8 }}
            >
              <IC.Send /> Enviar alerta por email
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inadimplentes.map((o) => (
              <div key={o.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{o.nome}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{o.fase} · {o.status}</div>
                  </div>
                  <span style={{ background: C.danger + "1a", color: C.danger, borderRadius: 5, fontSize: 10.5, fontWeight: 800, padding: "3px 9px", border: `1px solid ${C.danger}33` }}>+{o.gapPagamento.toFixed(0)}% gap</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11 }}>
                  <div><div style={{ color: "var(--muted)", marginBottom: 2 }}>Progresso</div><div style={{ fontWeight: 700 }}>{o.progresso || 0}%</div></div>
                  <div><div style={{ color: "var(--muted)", marginBottom: 2 }}>% Pago</div><div style={{ fontWeight: 700, color: C.danger }}>{o.pctRecebido.toFixed(0)}%</div></div>
                  <div><div style={{ color: "var(--muted)", marginBottom: 2 }}>Recebido</div><div style={{ fontWeight: 700, color: C.sage }}>{fmt(o.rec)}</div></div>
                </div>
                <div style={{ marginTop: 8, position: "relative", height: 8, background: C.danger + "22", borderRadius: 4 }}>
                  <div style={{ height: 8, width: `${Math.min(o.pctRecebido, 100)}%`, background: C.sage, borderRadius: 4 }} />
                  <div style={{ position: "absolute", top: 0, left: `${Math.min(o.progresso, 100)}%`, height: 8, width: 2, background: C.danger, transform: "translateX(-1px)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  Compras Preditivas  */}
      {alertasCompra.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-lg,16px)", padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ color: C.ochre }}><IC.Warning /></span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Alertas de Compras — {alertasCompra.length} fase(s) se aproximando</div>
              <div style={{ fontSize: 11, color: "#b45309" }}>Materiais a requisitar nos próximos 15 dias</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alertasCompra.map((a, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{a.obra.nome?.split("—")[0]?.trim()}</div>
                    <div style={{ fontSize: 11, color: "#92400e" }}>Entrando em <strong>{a.fase}</strong> em {a.diasAte === 0 ? "hoje" : `${a.diasAte} dia${a.diasAte > 1 ? "s" : ""}`}</div>
                  </div>
                  <span style={{ background: a.diasAte <= 3 ? C.danger + "1a" : C.ochre + "1a", color: a.diasAte <= 3 ? C.danger : C.ochre, borderRadius: 5, padding: "3px 9px", fontSize: 10.5, fontWeight: 800, border: `1px solid ${a.diasAte <= 3 ? C.danger : C.ochre}33` }}>
                    {a.diasAte === 0 ? "Hoje" : `${a.diasAte}d`}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {a.materiais.map((m) => (
                    <span key={m} style={{ background: "#fef9ec", border: "1px solid #fde68a", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#78350f" }}>{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  Rentabilidade por obra  */}
      {rentabilidade.length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg,16px)", boxShadow: "0 1px 2px rgba(40,30,20,.05)", padding: 20, border: "1px solid var(--line)", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase", marginBottom: 16 }}>Rentabilidade por obra</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--surface-2,#faf8f4)" }}>
                  {["Obra", "Contrato", "Receita", "Despesa", "Saldo", "Margem", "% Pago", "Situação"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Obra" ? "left" : "right", fontWeight: 700, fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", letterSpacing: .8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rentabilidade.map((o, i) => {
                  const margemColor = o.margemReal >= 20 ? C.sage : o.margemReal >= 10 ? C.ochre : C.danger;
                  const situacao    = o.gapPagamento > 25 ? { label: "Atrasado", color: "#981915", bg: "#fee2e2" }
                    : o.margemReal < 0 ? { label: "Negativo", color: C.danger, bg: "#fff0f0" }
                    : o.margemReal >= 20 ? { label: "Saudável", color: C.sage, bg: "#f0fff4" }
                    : { label: "Atenção", color: C.ochre, bg: "#fffbeb" };
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--line)", background: i % 2 ? "var(--surface-2,#faf8f4)" : "transparent" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, maxWidth: 180 }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.nome?.split("—")[0]?.trim()}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{o.fase}</div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmt(o.contrato)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.sage, fontWeight: 600 }}>{fmt(o.rec)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.danger }}>{fmt(o.desp)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: o.saldoObra >= 0 ? C.sage : C.danger }}>{fmt(o.saldoObra)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: margemColor }}>{o.margemReal.toFixed(1)}%</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{o.pctRecebido.toFixed(0)}%</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span style={{ background: situacao.color + "1a", color: situacao.color, borderRadius: 5, padding: "3px 9px", fontSize: 10.5, fontWeight: 800, border: `1px solid ${situacao.color}33` }}>{situacao.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/*  DRE Simplificado  */}
      {(() => {
        const [drePeriodo, setDrePeriodo] = useState("mes");
        const fmtD = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        const agora = new Date();
        const periodos = { mes: { label: "Este mês", meses: 1 }, tri: { label: "3 meses", meses: 3 }, sem: { label: "6 meses", meses: 6 }, ano: { label: "Este ano", meses: 12 } };
        const { meses } = periodos[drePeriodo];
        const limite = new Date(agora.getFullYear(), agora.getMonth() - meses + 1, 1);
        const lans = Object.values(financeiro).flatMap((f) => f.lancamentos || []).filter((l) => l.data && new Date(l.data + "T00:00") >= limite);
        const recBruta = lans.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
        const CUSTOS_DIRETOS = ["Materiais", "Mão de obra", "Equipamentos", "Transporte"];
        const custosDiretos = lans.filter((l) => l.tipo === "despesa" && CUSTOS_DIRETOS.includes(l.categoria)).reduce((a, l) => a + (l.valor || 0), 0);
        const lucroBruto = recBruta - custosDiretos;
        const despOp    = lans.filter((l) => l.tipo === "despesa" && !CUSTOS_DIRETOS.includes(l.categoria)).reduce((a, l) => a + (l.valor || 0), 0);
        const resultado = lucroBruto - despOp;
        const margemDre = recBruta > 0 ? ((resultado / recBruta) * 100).toFixed(1) : "—";
        const linhas = [
          { label: "Receita Bruta",            valor: recBruta,      cor: C.sage,   bold: true,  indent: 0 },
          { label: "(−) Custos Diretos",        valor: -custosDiretos, cor: C.danger, bold: false, indent: 1 },
          { label: "(=) Lucro Bruto",           valor: lucroBruto,    cor: lucroBruto >= 0 ? C.sage : C.danger, bold: true, indent: 0 },
          { label: "(−) Despesas Operacionais", valor: -despOp,       cor: C.danger, bold: false, indent: 1 },
          { label: "(=) Resultado Líquido",     valor: resultado,     cor: resultado >= 0 ? C.sage : C.danger, bold: true, indent: 0, margem: true },
        ];
        return (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg,16px)", padding: 20, border: "1px solid var(--line)", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase" }}>DRE Simplificado</div>
              <div style={{ display: "flex", gap: 3, background: "var(--surface-2,#faf8f4)", border: "1px solid var(--line)", borderRadius: 9, padding: 3 }}>
                {Object.entries(periodos).map(([k, p]) => (
                  <button key={k} onClick={() => setDrePeriodo(k)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, border: "none", background: drePeriodo === k ? "var(--surface)" : "transparent", color: drePeriodo === k ? "var(--ink,#26231f)" : "var(--muted)", boxShadow: drePeriodo === k ? "0 1px 2px rgba(40,30,20,.05)" : "none", transition: "all .12s" }}>{p.label}</button>
                ))}
              </div>
            </div>
            <div style={{ maxWidth: 480 }}>
              {linhas.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", paddingLeft: l.indent ? 16 : 0, borderBottom: i < linhas.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ fontSize: 12, fontWeight: l.bold ? 700 : 400, color: l.bold ? "var(--ink,#26231f)" : "var(--muted)" }}>{l.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="num" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: l.bold ? 700 : 500, color: l.cor }}>{fmtD(Math.abs(l.valor))}</span>
                    {l.margem && margemDre !== "—" && (
                      <span style={{ fontSize: 11, background: resultado >= 0 ? C.sage + "22" : C.danger + "22", color: resultado >= 0 ? C.sage : C.danger, borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>{margemDre}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/*  Operacional  */}
      <OperacionalKpis />

      {/*  Compliance NR  */}
      <div style={{ marginBottom: 16 }}><ComplianceNR /></div>

      {/*  Atividade Recente  */}
      {historico && historico.length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg,16px)", padding: 20, marginBottom: 16, border: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <IC.Clock /> Atividade Recente
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {historico.slice(0, 5).map((h, i) => (
              <div key={h.id || i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 10, borderBottom: i < 4 ? "1px solid var(--line)" : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brick-soft,#f3e7e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#981915" }}>
                  <IC.Clock />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{h.descricao || h.titulo || "Ação registrada"}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>{h.created_at ? new Date(h.created_at).toLocaleDateString("pt-BR") : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  Progresso das obras  */}
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg,16px)", boxShadow: "0 1px 2px rgba(40,30,20,.05)", padding: 20, border: "1px solid var(--line)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: "var(--muted)", textTransform: "uppercase", marginBottom: 16 }}>Progresso das obras</div>
        {obras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--brick-soft,#f3e7e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#981915" }}><IC.Building /></div>
            Nenhuma obra cadastrada
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {obras.map((o) => {
              const prazoFim = o.prazo_fim ? new Date(o.prazo_fim) : null;
              const atrasada = prazoFim && prazoFim < hoje && o.status !== "Concluída";
              const medObra  = (medicoes[o.id] || []).filter((m) => m.status === "Pendente");
              const finObra  = allLancamentos.filter(l => l.obra_id === o.id);
              const diarObra = (diario[o.id] || []);
              const score    = calcularStickScore(o, { financeiro: finObra, medicoes: medicoes[o.id] || [], diario: diarObra });
              const prog     = o.progresso || 0;
              return (
                <div key={o.id} style={{ background: "var(--surface)", borderRadius: 12, border: "1px solid var(--line)", padding: "12px 14px", boxShadow: "0 1px 4px rgba(40,30,20,.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink,#26231f)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.nome?.split("—")[0]?.trim()}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{o.fase || "—"}</div>
                    </div>
                    <StickScoreInline score={score} />
                  </div>
                  <div style={{ height: 5, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: 5, width: `${prog}%`, background: prog >= 75 ? C.sage : prog >= 40 ? C.ochre : C.red, borderRadius: 3, transition: "width .4s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                    <span>{prog}% concluído</span>
                    <span style={{ display: "flex", gap: 8 }}>
                      {medObra.length > 0 && <span style={{ color: C.ochre }}>{medObra.length} med. pendente{medObra.length > 1 ? "s" : ""}</span>}
                      {prazoFim && <span style={{ color: atrasada ? C.danger : "var(--muted)" }}>{atrasada ? "Atrasada" : `até ${prazoFim.toLocaleDateString("pt-BR")}`}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 26, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 11.5, color: "var(--muted)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>Dashboard · dados em tempo real</span>
        <span>Stick Frame · Sistema de Gestão</span>
      </footer>
    </div>
  );
}
