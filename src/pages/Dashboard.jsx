import { useEffect, useState, lazy, Suspense } from "react";
import { sb, getEmpresaId } from "../services/supabase";
import { AlertTriangle, BarChart2, CalendarDays, CheckCircle, TrendingUp } from "../components/ui/Icon";
import { listarMonitorados } from "../services/repositories/precosRepository";
import { C, CATEGORIAS_DESPESA, FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { mesAno } from "../utils/date";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { useToast } from "../hooks/useToast";
import { emailAlertaInadimplencia } from "../services/emailService";
import { gerarRelatorioMensal as gerarPdfMensal } from "../services/relatorioService";
import SmartAlerts from "../components/ui/SmartAlerts";
import DashboardKPIs from "../components/Dashboard/DashboardKPIs";
import ComplianceNR from "../components/Dashboard/ComplianceNR";
import CalculadoraRapida from "../components/ui/CalculadoraRapida";

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data = [], color = C.success, height = 32, width = 64 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height * 0.85);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width, height, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sp-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${pts.join(" L ")} L ${width},${height} L 0,${height} Z`} fill={`url(#sp-${color.replace("#","")})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// Reloads page on chunk fetch failure (stale service worker cache after deploy)
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

// ─── Gráfico de barras ────────────────────────────────────────────────────────
function GraficoBarras({ data, height = 120 }) {
  if (!data.length) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 12 }}>
      Sem dados
    </div>
  );
  const max = Math.max(...data.map((d) => Math.max(d.rec || 0, d.desp || 0, d.value || 0)), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          {d.rec !== undefined ? (
            <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: height - 20 }}>
              <div style={{ flex: 1, height: `${(d.rec  / max) * 100}%`, background: C.success, borderRadius: "3px 3px 0 0", minHeight: 2, opacity: .9 }} />
              <div style={{ flex: 1, height: `${(d.desp / max) * 100}%`, background: C.red,     borderRadius: "3px 3px 0 0", minHeight: 2, opacity: .9 }} />
            </div>
          ) : (
            <div style={{ width: "100%", height: `${(d.value / max) * 100}%`, background: d.color || C.red, borderRadius: "3px 3px 0 0", minHeight: 2, opacity: .85 }} />
          )}
          <span style={{ fontSize: 9, color: C.muted, textAlign: "center", lineHeight: 1.2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Gráfico de linha ─────────────────────────────────────────────────────────
function GraficoLinha({ data, height = 80, color = C.red }) {
  if (data.length < 2) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 12 }}>
      Sem histórico suficiente
    </div>
  );
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100, h = height;
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
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity=".35" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineGrad)" />
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * w;
          const y = h - (d.value / max) * (h * 0.85);
          return <circle key={d.label ?? i} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map((d, i) => <span key={d.label ?? i} style={{ fontSize: 9, color: C.muted }}>{d.label}</span>)}
      </div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, icon, trend, sparkData }) {
  const [hovered, setHovered] = useState(false);
  const isPositive = trend && trend >= 0;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface,
        borderRadius: 16,
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.05)",
        padding: "16px 14px",
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${accent}`,
        transition: "box-shadow .2s ease, transform .2s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 18, color: accent, opacity: 0.8 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: accent === C.border ? C.text : accent, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>
          {trend !== undefined && trend !== null && (
            <div style={{ fontSize: 11, fontWeight: 700, color: isPositive ? C.success : C.danger, marginTop: 4, display: "flex", alignItems: "center", gap: 2 }}>
              {isPositive ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs mês ant.
            </div>
          )}
        </div>
        {sparkData && sparkData.length >= 2 && (
          <Sparkline data={sparkData} color={accent} height={28} width={56} />
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function evolucaoMensal(lancamentos, tipo = "receita", mesesAtras = 6) {
  const agora  = new Date();
  const result = [];
  for (let i = mesesAtras - 1; i >= 0; i--) {
    const d     = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const ano   = d.getFullYear();
    const mes   = d.getMonth();
    const label = `${MESES[mes]}/${String(ano).slice(2)}`;
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

// ─── Dashboard (roteador por perfil) ─────────────────────────────────────────
export default function Dashboard() {
  const perfil = useAppStore((s) => s.user?.perfil);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const [tab, setTab] = useState("visao-geral");

  if (perfil === "comercial")  return <Suspense fallback={null}><DashboardComercial /></Suspense>;
  if (perfil === "engenheiro") return <Suspense fallback={null}><DashboardEngenheiro /></Suspense>;
  if (perfil === "financeiro") return <Suspense fallback={null}><DashboardFinanceiro /></Suspense>;

  // Diretor: tab switcher
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setTab("visao-geral")}
          style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: tab === "visao-geral" ? 800 : 500,
            cursor: "pointer", fontFamily: "inherit",
            background: tab === "visao-geral" ? C.red : "transparent",
            color: tab === "visao-geral" ? "#fff" : C.muted,
            border: `1.5px solid ${tab === "visao-geral" ? C.red : C.border}`,
            transition: "all .15s ease",
          }}
        >
          Visao geral
        </button>
        <button
          onClick={() => setTab("analytics")}
          style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: tab === "analytics" ? 800 : 500,
            cursor: "pointer", fontFamily: "inherit",
            background: tab === "analytics" ? C.red : "transparent",
            color: tab === "analytics" ? "#fff" : C.muted,
            border: `1.5px solid ${tab === "analytics" ? C.red : C.border}`,
            transition: "all .15s ease",
          }}
        >
          Analytics
        </button>
      </div>
      {tab === "analytics" ? (
        <Suspense fallback={<div style={{ color: C.muted, fontSize: 13 }}>Carregando...</div>}>
          <DashboardAnalytics />
        </Suspense>
      ) : (
        <DashboardDiretor />
      )}
    </div>
  );
}

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
        : "∞";

      setKpis({
        diasSemAcidente,
        episVencidos: episList.filter(e => e.validade < hoje).length,
        episVencendo: episList.filter(e => e.validade >= hoje).length,
        incAbertos: incList.length,
        pedPendentes: pedsList.filter(p => p.status === "Pendente").length,
        pedCriticos: pedsList.filter(p => p.urgencia === "Crítico").length,
        estoqueAbaixo: estList.filter(e => e.quantidade <= e.estoque_minimo).length,
      });
    }).catch(() => {});
  }, []);

  if (!kpis) return null;

  const kpiOp = [
    { label: "Dias sem acidente", value: kpis.diasSemAcidente, icon: "🦺", cor: kpis.diasSemAcidente === "∞" || kpis.diasSemAcidente > 30 ? C.success : kpis.diasSemAcidente > 7 ? C.warning : C.danger },
    { label: "EPIs vencidos", value: kpis.episVencidos, icon: "⛔", cor: kpis.episVencidos > 0 ? C.danger : C.success },
    { label: "EPIs vencendo 30d", value: kpis.episVencendo, icon: "⏰", cor: kpis.episVencendo > 0 ? C.warning : C.success },
    { label: "Incidentes abertos", value: kpis.incAbertos, icon: "⚠️", cor: kpis.incAbertos > 0 ? C.danger : C.success },
    { label: "Pedidos pendentes", value: kpis.pedPendentes, icon: "📦", cor: kpis.pedPendentes > 0 ? C.warning : C.success },
    { label: "Pedidos críticos", value: kpis.pedCriticos, icon: "🚨", cor: kpis.pedCriticos > 0 ? C.danger : C.success },
    { label: "Estoque abaixo mín", value: kpis.estoqueAbaixo, icon: "🏭", cor: kpis.estoqueAbaixo > 0 ? C.warning : C.success },
  ];

  return (
    <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 14 }}>SST & SUPRIMENTOS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {kpiOp.map(k => (
          <div key={k.label} style={{ background: k.cor + "12", borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${k.cor}` }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{k.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: k.cor }}>{k.value}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const empresa     = useAppStore((s) => s.empresa);
  const historico   = useAppStore((s) => s.historico);
  const { toast: toastInadimpl, mostrarToast: toastMsg } = useToast();
  const loadMedicoes = useAppStore((s) => s.loadMedicoes);
  const setActivePage = useAppStore((s) => s.setActivePage);

  // Carrega medições de todas as obras
  useEffect(() => {
    obras.forEach((o) => loadMedicoes(o.id));
  }, [obras, loadMedicoes]);

  // Carrega preços monitorados para o widget de preços em alta
  const [precosMon, setPrecosMon] = useState([]);
  useEffect(() => {
    listarMonitorados().then(setPrecosMon).catch(() => {});
  }, []);

  // ── Cálculos financeiros ────────────────────────────────────────────────
  const allLancamentos = Object.values(financeiro).flatMap((f) => f.lancamentos || []);
  const totalRec       = allLancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
  const totalDesp      = allLancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
  const saldo          = totalRec - totalDesp;
  const margem         = totalRec > 0 ? ((saldo / totalRec) * 100).toFixed(1) : "0.0";

  const pipelineOrc = orcamentos
    .filter((o) => !["Recusado"].includes(o.status))
    .reduce((a, o) => a + (o.valor || 0), 0);

  // ── VGV — funil financeiro completo ──────────────────────────────────────
  // "Qualificados" = Negociação, Proposta Enviada, Em Execução (excluindo leads brutos)
  const STATUS_QUALIFICADO = ["Negociação", "Proposta Enviada", "Em Execução"];
  const leadsQualificados  = clientes.filter((c) => STATUS_QUALIFICADO.includes(c.status));
  const leadsBrutos        = clientes.filter((c) => c.status === "Lead");

  const vgvFunil = [
    {
      label:    "Oportunidades",
      sublabel: "negociação + proposta enviada",
      valor:    leadsQualificados.reduce((a, c) => a + (c.valor || 0), 0),
      count:    leadsQualificados.length,
      color:    "#4a9eff",
    },
    {
      label:    "Leads novos",
      sublabel: "aguardando qualificação",
      valor:    leadsBrutos.reduce((a, c) => a + (c.valor || 0), 0),
      count:    leadsBrutos.length,
      color:    "#94a3b8",
      bruto:    true,
    },
    {
      label:   "Orçamentos",
      sublabel: "em aberto + aprovados",
      valor:   orcamentos.filter((o) => o.status !== "Recusado").reduce((a, o) => a + (o.valor || 0), 0),
      count:   orcamentos.filter((o) => o.status !== "Recusado").length,
      color:   C.warning,
    },
    {
      label:   "Contratos",
      sublabel: "assinados",
      valor:   contratos.reduce((a, c) => a + (c.valor || 0), 0),
      count:   contratos.length,
      color:   "#9b59b6",
    },
    {
      label:   "Obras em execução",
      sublabel: "valor contratado",
      valor:   obras.filter((o) => o.status === "Em andamento").reduce((a, o) => a + (o.contrato || 0), 0),
      count:   obras.filter((o) => o.status === "Em andamento").length,
      color:   C.red,
    },
    {
      label:   "Obras concluídas",
      sublabel: "receita realizada",
      valor:   obras.filter((o) => o.status === "Concluída").reduce((a, o) => {
        const fin = financeiro[o.id] || { lancamentos: [] };
        return a + fin.lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + (l.valor || 0), 0);
      }, 0),
      count:   obras.filter((o) => o.status === "Concluída").length,
      color:   C.success,
    },
  ];
  // VGV = só oportunidades qualificadas (exclui leads brutos que distorcem o número)
  const vgvTotal = vgvFunil.filter((f) => !f.bruto).reduce((a, f) => a + f.valor, 0);
  const vgvComLeads = vgvFunil.reduce((a, f) => a + f.valor, 0);

  // ── Medições pendentes ────────────────────────────────────────────────────
  const allMedicoes     = Object.values(medicoes).flat();
  const medPendentes    = allMedicoes.filter((m) => m.status === "Pendente");
  const valorPendente   = medPendentes.reduce((a, m) => a + (m.valor || 0), 0);

  // ── Prazo das obras ───────────────────────────────────────────────────────
  const hoje       = new Date();
  const obrasComPrazo = obras.filter((o) => o.prazo_fim && o.status !== "Concluída");
  const atrasadas  = obrasComPrazo.filter((o) => new Date(o.prazo_fim) < hoje);
  const noPrazo    = obrasComPrazo.filter((o) => new Date(o.prazo_fim) >= hoje);

  // ── Compras Preditivas ───────────────────────────────────────────────────
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
      const inicio   = new Date(o.prazo_inicio);
      const fim      = new Date(o.prazo_fim);
      const duracaoTotal = (fim - inicio) / 86400000;
      if (duracaoTotal <= 0) return [];
      const alerts = [];
      FASE_THRESHOLDS.forEach((fz) => {
        const diasFaseInicio = (fz.min / 100) * duracaoTotal;
        const dataFase = new Date(inicio.getTime() + diasFaseInicio * 86400000);
        const diasAte  = Math.round((dataFase - hoje) / 86400000);
        const progAtual = o.progresso || 0;
        if (diasAte >= 0 && diasAte <= 15 && progAtual < fz.max) {
          alerts.push({ obra: o, fase: fz.fase, diasAte, materiais: fz.materiais });
        }
      });
      return alerts;
    })
    .sort((a, b) => a.diasAte - b.diasAte);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const obrasAtivas = obras.filter((o) => o.status === "Em andamento").length;

  // ── Trend: comparar mês atual vs mês anterior ─────────────────────────────
  const agora2 = new Date();
  const mesAtual   = agora2.getMonth();
  const anoAtual   = agora2.getFullYear();
  const mesPrev    = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoPrev    = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  function somarMes(tipo, mes, ano) {
    return allLancamentos
      .filter((l) => {
        const d = new Date(l.created_at || l.data);
        return l.tipo === tipo && d.getMonth() === mes && d.getFullYear() === ano;
      })
      .reduce((a, l) => a + (l.valor || 0), 0);
  }
  const recAtual  = somarMes("receita",  mesAtual, anoAtual);
  const recPrev   = somarMes("receita",  mesPrev,  anoPrev);
  const despAtual = somarMes("despesa",  mesAtual, anoAtual);
  const despPrev  = somarMes("despesa",  mesPrev,  anoPrev);

  function trend(atual, prev) {
    if (prev === 0) return null;
    return ((atual - prev) / prev) * 100;
  }

  // ── Sparklines: últimos 6 meses ───────────────────────────────────────────
  const sparkRec  = evolucaoMensal(allLancamentos, "receita",  6).map((d) => d.value);
  const sparkDesp = evolucaoMensal(allLancamentos, "despesa",  6).map((d) => d.value);

  const kpis = [
    { label: "Clientes",     value: String(clientes.length),  sub: `${clientes.filter(c => c.status === "Fechado").length} fechados`,    accent: "#4a9eff",    icon: "◈", trend: null },
    { label: "Orçamentos",   value: String(orcamentos.length),sub: `pipeline ${fmt(pipelineOrc)}`,                                        accent: C.warning,    icon: "◻", trend: null },
    { label: "Obras ativas", value: String(obrasAtivas),      sub: `de ${obras.length} total`,                                            accent: C.red,        icon: "◆", trend: null },
    { label: "Receitas",     value: fmt(totalRec),            sub: "total recebido",                                                       accent: C.success,    icon: "↑", trend: trend(recAtual, recPrev),  sparkData: sparkRec },
    { label: "Despesas",     value: fmt(totalDesp),           sub: "total lançado",                                                        accent: C.danger,     icon: "↓", trend: trend(despAtual, despPrev), sparkData: sparkDesp },
    { label: "Margem",       value: `${margem}%`,             sub: `saldo ${fmt(saldo)}`,                                                  accent: Number(margem) >= 20 ? C.success : C.warning, icon: "%", trend: null },
  ];

  // ── Exportar PDF via window.print() ──────────────────────────────────────
  function exportarPdf() {
    document.body.classList.add("printing");
    window.print();
    // afterprint é disparado quando o diálogo de impressão fecha
    const cleanup = () => {
      document.body.classList.remove("printing");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
  }

  // ── Relatório executivo mensal ────────────────────────────────────────────
  function gerarRelatorioMensal() {
    const mes = mesAno();
    const obrasAndamento = obras.filter((o) => o.status === "Em andamento");
    const obrasConcluidas = obras.filter((o) => o.status === "Concluída");
    const linhasObras = obrasAndamento.map((o) => {
      const fin  = financeiro[o.id] || { lancamentos: [] };
      const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
      const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${o.nome}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${o.fase || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${o.progresso || 0}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#2e9e5b">${fmt(rec)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#981915">${fmt(desp)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${fmt(rec - desp)}</td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>Relatório Executivo — ${mes}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, sans-serif; color: #1a1a1a; padding: 40px; max-width: 900px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #981915; }
  .logo { font-size: 22px; font-weight: 900; color: #981915; letter-spacing: -0.5px; }
  .logo span { font-weight: 300; }
  .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .title { font-size: 18px; font-weight: 700; color: #4b4b4b; }
  .date-block { text-align: right; font-size: 12px; color: #6b7280; }
  h2 { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; color: #6b7280; text-transform: uppercase; margin: 28px 0 14px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
  .kpi { background: #f9f9fb; border: 1px solid #e4e4ea; border-radius: 10px; padding: 14px 16px; }
  .kpi-label { font-size: 10px; font-weight: 700; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
  .kpi-value { font-size: 20px; font-weight: 900; }
  .kpi-sub { font-size: 11px; color: #6b7280; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; background: #fff; border: 1px solid #e4e4ea; border-radius: 10px; overflow: hidden; }
  th { background: #f0f0f3; padding: 10px 12px; text-align: left; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #6b7280; font-weight: 700; }
  th.r { text-align: right; } th.c { text-align: center; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e4e4ea; font-size: 11px; color: #6b7280; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<div class="header">
  <div>
    <div class="logo">Stick<span>Frame</span></div>
    <div class="subtitle">Gestão de Obras Steel Frame</div>
  </div>
  <div class="date-block">
    <div class="title">Relatório Executivo Mensal</div>
    <div>${mes}</div>
    <div>Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
  </div>
</div>

<h2>Visão Geral</h2>
<div class="kpis">
  <div class="kpi"><div class="kpi-label">Obras Ativas</div><div class="kpi-value" style="color:#981915">${obrasAndamento.length}</div><div class="kpi-sub">${obrasConcluidas.length} concluídas</div></div>
  <div class="kpi"><div class="kpi-label">Receita Total</div><div class="kpi-value" style="color:#2e9e5b">${fmt(totalRec)}</div><div class="kpi-sub">lançada no sistema</div></div>
  <div class="kpi"><div class="kpi-label">Despesa Total</div><div class="kpi-value" style="color:#981915">${fmt(totalDesp)}</div><div class="kpi-sub">lançada no sistema</div></div>
  <div class="kpi"><div class="kpi-label">Margem</div><div class="kpi-value" style="color:${Number(margem) >= 20 ? "#2e9e5b" : "#b97a00"}">${margem}%</div><div class="kpi-sub">saldo ${fmt(saldo)}</div></div>
</div>
<div class="kpis" style="margin-top:12px">
  <div class="kpi"><div class="kpi-label">Orçamentos</div><div class="kpi-value">${orcamentos.length}</div><div class="kpi-sub">pipeline ${fmt(pipelineOrc)}</div></div>
  <div class="kpi"><div class="kpi-label">Clientes</div><div class="kpi-value">${clientes.length}</div><div class="kpi-sub">${fechados} fechados</div></div>
  <div class="kpi"><div class="kpi-label">Medições Pend.</div><div class="kpi-value" style="color:#b97a00">${medPendentes.length}</div><div class="kpi-sub">${fmt(valorPendente)} a receber</div></div>
  <div class="kpi"><div class="kpi-label">Obras Atrasadas</div><div class="kpi-value" style="color:${atrasadas.length > 0 ? "#981915" : "#2e9e5b"}">${atrasadas.length}</div><div class="kpi-sub">${noPrazo.length} no prazo</div></div>
</div>

${obrasAndamento.length > 0 ? `
<h2>Obras em Andamento</h2>
<table>
  <thead><tr>
    <th>Obra</th><th class="c">Fase</th><th class="c">Progresso</th>
    <th class="r">Receita</th><th class="r">Despesa</th><th class="r">Saldo</th>
  </tr></thead>
  <tbody>${linhasObras}</tbody>
</table>` : ""}

<div class="footer">StickFrame SaaS · Relatório gerado automaticamente · ${new Date().toLocaleDateString("pt-BR")}</div>
</body></html>`;
    printHtml(html, `relatorio-executivo-${mes}`);
  }

  // ── Gráfico receita vs despesa por obra ───────────────────────────────────
  const graficoObras = obras.map((o) => {
    const fin  = financeiro[o.id] || { lancamentos: [] };
    const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
    const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
    const nome = o.nome?.split("—")[0]?.trim()?.split(" ")[0] || "Obra";
    return { label: nome.length > 8 ? nome.slice(0, 7) + "." : nome, rec, desp };
  }).filter((d) => d.rec > 0 || d.desp > 0);

  // ── Obras por fase ────────────────────────────────────────────────────────
  const obrasPorFase = FASES.map((fase, i) => ({
    label: fase.split(" ")[0],
    value: obras.filter((o) => o.fase === fase).length,
    color: `hsl(${(i / FASES.length) * 200 + 10}, 65%, 50%)`,
  })).filter((d) => d.value > 0);

  // ── Pipeline CRM por status ───────────────────────────────────────────────
  const STATUS_CRM = ["Lead", "Em negociação", "Proposta enviada", "Fechado"];
  const statusCRM = STATUS_CRM.map((s) => ({
    label: s.split(" ")[0],
    fullLabel: s,
    value: clientes.filter((c) => c.status === s).reduce((a, c) => a + (c.valor || 0), 0),
    count: clientes.filter((c) => c.status === s).length,
    color: s === "Fechado" ? C.success : C.red,
  }));
  const totalLeads = clientes.length || 1;
  const fechados   = clientes.filter((c) => c.status === "Fechado").length;
  const taxaConv   = ((fechados / totalLeads) * 100).toFixed(0);

  // ── Evolução mensal de receitas ───────────────────────────────────────────
  const evolucao = evolucaoMensal(allLancamentos, "receita", 6);

  // ── Propostas por mês (enviadas vs aprovadas) ─────────────────────────────
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

  // ── Despesas por categoria ────────────────────────────────────────────────
  const despCats = CATEGORIAS_DESPESA.map((cat) => ({
    label: cat.split(" ")[0],
    value: allLancamentos.filter((l) => l.tipo === "despesa" && l.categoria === cat).reduce((a, l) => a + (l.valor || 0), 0),
    color: C.red,
  })).filter((d) => d.value > 0);

  // ── Rentabilidade por obra ────────────────────────────────────────────────
  const rentabilidade = obras
    .filter((o) => o.contrato > 0)
    .map((o) => {
      const fin  = financeiro[o.id] || { lancamentos: [] };
      const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
      const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
      const saldoObra   = rec - desp;
      const margemReal  = rec > 0 ? (saldoObra / rec) * 100 : 0;
      const pctRecebido = o.contrato > 0 ? (rec / o.contrato) * 100 : 0;
      const gapPagamento = (o.progresso || 0) - pctRecebido;
      return { ...o, rec, desp, saldoObra, margemReal, pctRecebido, gapPagamento };
    })
    .sort((a, b) => a.margemReal - b.margemReal);

  const inadimplentes = rentabilidade.filter((o) => o.gapPagamento > 25 && o.status !== "Concluída");

  return (
    <div>
      {toastInadimpl && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#1a1a1a", color: "#fff", border: "1px solid #444", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006" }}>
          {toastInadimpl}
        </div>
      )}
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{
            fontSize: 28, fontWeight: 900, marginBottom: 2,
            background: "linear-gradient(135deg, #981915 0%, #c0392b 50%, #4a9eff 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Dashboard</h2>
          <p style={{ color: C.muted, fontSize: 13, letterSpacing: 0.3 }}>Visão consolidada — {mesAno()}</p>
        </div>
        <div className="dashboard-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={exportarPdf}
            style={{
              padding: "8px 18px", background: "#4a9eff", border: "none",
              borderRadius: 8, color: "#fff", fontWeight: 700,
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            🖨️ Exportar PDF
          </button>
          <button
            onClick={gerarRelatorioMensal}
            style={{
              padding: "8px 18px", background: "#981915", border: "none",
              borderRadius: 8, color: "#fff", fontWeight: 700,
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            📄 Relatório Mensal
          </button>
          <button
            onClick={async () => {
              try {
                const { error } = await sb.functions.invoke("relatorio-mensal");
                if (error) throw error;
                alert("Relatório enviado por email com sucesso!");
              } catch (e) {
                alert("Erro ao enviar relatório: " + (e?.message || String(e)));
              }
            }}
            style={{
              padding: "8px 18px", background: "#1a6e3c", border: "none",
              borderRadius: 8, color: "#fff", fontWeight: 700,
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            📊 Enviar relatório
          </button>
        </div>
      </div>

      {/* Cabeçalho visível apenas na impressão */}
      <div className="print-header" style={{ display: "none" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#981915", letterSpacing: -0.5 }}>
            Stick<span style={{ fontWeight: 300 }}>Frame</span>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Gestão de Obras Steel Frame</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#4b4b4b" }}>Relatório Executivo Mensal</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{mesAno()}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            Gerado em {new Date().toLocaleDateString("pt-BR")} às{" "}
            {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Smart Alerts */}
      <div data-no-print="true">
        <SmartAlerts onNavigate={setActivePage} />
      </div>

      {/* VGV — Funil financeiro */}
      <div style={{ background: `linear-gradient(135deg, rgba(152,25,21,0.04) 0%, transparent 60%)`, borderRadius: 14, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 20, borderTop: `3px solid ${C.red}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.muted }}>VGV — VALOR GERAL DE VENDAS</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.text, marginTop: 4 }}>{fmt(vgvTotal)}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>oportunidades qualificadas · pipeline até obras concluídas</div>
            {vgvComLeads > vgvTotal && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                + {fmt(vgvComLeads - vgvTotal)} em leads não qualificados
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Receita realizada</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.success }}>{fmt(totalRec)}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{totalRec > 0 && vgvTotal > 0 ? `${((totalRec / vgvTotal) * 100).toFixed(0)}% do VGV` : "—"}</div>
          </div>
        </div>

        {/* Barra de funil — com rótulos de % */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 0, height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 4, background: C.darker }}>
            {vgvFunil.map((f, i) => {
              const base = vgvComLeads > 0 ? vgvComLeads : 1;
              const pct = (f.valor / base) * 100;
              if (pct < 0.5) return null;
              return (
                <div key={i} title={`${f.label}: ${pct.toFixed(1)}%`} style={{
                  width: `${pct}%`, minWidth: 6,
                  background: f.bruto
                    ? `repeating-linear-gradient(45deg, ${f.color}55, ${f.color}55 4px, ${f.color}33 4px, ${f.color}33 8px)`
                    : `linear-gradient(90deg, ${f.color}dd, ${f.color})`,
                  transition: "width .4s ease",
                  borderRight: i < vgvFunil.length - 1 ? "1px solid rgba(255,255,255,0.2)" : "none",
                }} />
              );
            })}
            {vgvComLeads === 0 && <div style={{ flex: 1, background: C.darker }} />}
          </div>
          {/* Labels de % */}
          <div style={{ display: "flex", gap: 0, marginTop: 2 }}>
            {vgvFunil.map((f, i) => {
              const base = vgvComLeads > 0 ? vgvComLeads : 1;
              const pct = (f.valor / base) * 100;
              if (pct < 0.5) return null;
              return (
                <div key={i} style={{ width: `${pct}%`, minWidth: 6, display: "flex", justifyContent: "center" }}>
                  {pct >= 5 && (
                    <span style={{ fontSize: 9, color: f.bruto ? C.muted : f.color, fontWeight: 700 }}>
                      {pct.toFixed(0)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Etapas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
          {vgvFunil.map((f, i) => (
            <div key={i} style={{
              borderLeft: `3px solid ${f.color}`, paddingLeft: 10,
              opacity: f.bruto ? 0.6 : 1,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: f.color, letterSpacing: 1, marginBottom: 2 }}>
                {f.label.toUpperCase()}
                {f.bruto && <span style={{ marginLeft: 4, fontSize: 8, color: "#94a3b8" }}>NÃO QUALIF.</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: f.bruto ? C.muted : C.text }}>{fmt(f.valor)}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{f.sublabel}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{f.count} {f.count === 1 ? "item" : "itens"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulação Rápida */}
      <div style={{ marginBottom: 20 }}><CalculadoraRapida /></div>

      {/* Novos KPIs principais com a tipografia Barlow Condensed */}
      <div style={{ marginBottom: 20 }}><DashboardKPIs /></div>

      {/* KPIs */}
      <div className="kpi-grid-6" style={{ marginBottom: 20 }}>
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* KPIs secundários */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {/* Medições pendentes */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: "14px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.warning}` }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>MEDIÇÕES PENDENTES</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.warning }}>{medPendentes.length}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {medPendentes.length > 0 ? `${fmt(valorPendente)} aguardando aprovação` : "Nenhuma pendente"}
          </div>
        </div>

        {/* Prazo das obras */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: "14px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${atrasadas.length > 0 ? C.danger : C.success}` }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PRAZOS DAS OBRAS</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.danger }}>{atrasadas.length}</div>
              <div style={{ fontSize: 10, color: C.muted }}>atrasadas</div>
            </div>
            <div style={{ width: 1, height: 32, background: C.border }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.success }}>{noPrazo.length}</div>
              <div style={{ fontSize: 10, color: C.muted }}>no prazo</div>
            </div>
            {obrasComPrazo.length === 0 && (
              <div style={{ fontSize: 11, color: C.muted }}>Sem prazo definido</div>
            )}
          </div>
        </div>

        {/* Taxa de conversão CRM */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: "14px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid #4a9eff` }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>CONVERSÃO CRM</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#4a9eff" }}>{taxaConv}%</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {fechados} fechados de {clientes.length} clientes
          </div>
        </div>
      </div>

      {/* Gráficos linha 1 */}
      <div className="two-col" style={{ marginBottom: 16 }}>
        {/* Receita vs Despesa por obra */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>RECEITA VS DESPESA / OBRA</div>
            <div style={{ display: "flex", gap: 12, fontSize: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.success }}>
                <span style={{ width: 8, height: 8, background: C.success, borderRadius: 2, display: "inline-block" }} />Receita
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.red }}>
                <span style={{ width: 8, height: 8, background: C.red, borderRadius: 2, display: "inline-block" }} />Despesa
              </span>
            </div>
          </div>
          {graficoObras.length === 0 ? (
            <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 12 }}>
              Sem obras com lançamentos
            </div>
          ) : (
            <GraficoBarras data={graficoObras} height={130} />
          )}
        </div>

        {/* Evolução mensal de receitas */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 4 }}>
            EVOLUÇÃO DE RECEITAS — 6 MESES
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.success, marginBottom: 14 }}>{fmt(totalRec)}</div>
          {evolucao.every((d) => d.value === 0) ? (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 22, opacity: .4 }}>↑</div>
              <div style={{ fontSize: 12, color: C.muted }}>Nenhum lançamento nos últimos 6 meses</div>
            </div>
          ) : (
            <GraficoLinha data={evolucao} height={80} color={C.success} />
          )}
        </div>
        {/* Evolução mensal de propostas */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 4 }}>PROPOSTAS — 6 MESES</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: C.success, marginRight: 4 }} />Enviadas</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: C.red, marginRight: 4 }} />Aprovadas</div>
          </div>
          <GraficoBarras data={evolucaoPropostas} height={80} />
        </div>
      </div>

      {/* Gráficos linha 2 */}
      <div className="three-col" style={{ marginBottom: 16 }}>
        {/* Obras por fase */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>OBRAS POR FASE</div>
          {obras.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: C.muted, fontSize: 12 }}>Nenhuma obra cadastrada</div>
          ) : obrasPorFase.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: C.muted, fontSize: 12 }}>Fases não definidas</div>
          ) : (
            <>
              <GraficoBarras data={obrasPorFase} height={90} />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {FASES.map((fase) => {
                  const count = obras.filter((o) => o.fase === fase).length;
                  if (!count) return null;
                  return (
                    <div key={fase} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: C.muted }}>{fase}</span>
                      <span style={{ fontWeight: 700, color: C.text }}>{count} obra{count > 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pipeline CRM */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>PIPELINE CRM</div>
            <div style={{ fontSize: 11, color: "#4a9eff", fontWeight: 700 }}>{taxaConv}% conv.</div>
          </div>
          <GraficoBarras data={statusCRM} height={90} />
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {statusCRM.map((s) => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: C.muted }}>{s.fullLabel}</span>
                <span style={{ fontWeight: 700, color: s.color }}>
                  {s.count} · {s.value > 0 ? fmt(s.value) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas por categoria */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>DESPESAS POR CATEGORIA</div>
          {despCats.length > 0 ? (
            <>
              <GraficoBarras data={despCats} height={90} />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {despCats.slice(0, 5).map((d) => (
                  <div key={d.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: C.muted }}>{d.label}</span>
                    <span style={{ fontWeight: 700, color: C.red }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "28px 0", color: C.muted, fontSize: 12 }}>Sem despesas lançadas</div>
          )}
        </div>
      </div>

      {/* Agenda do dia + Preços em alta */}
      {(() => {
        const hojeStr = new Date().toISOString().split("T")[0];

        // Agenda: follow-ups do CRM com prazo hoje ou atrasado
        const followUps = clientes.filter((c) =>
          c.proximo_contato && c.proximo_contato <= hojeStr &&
          c.status !== "Fechado" && c.status !== "Em execução"
        ).sort((a, b) => a.proximo_contato.localeCompare(b.proximo_contato));

        // Preços em alta: top 5 maiores variações positivas
        const emAlta = precosMon
          .filter((p) => p.preco_atual && p.preco_anterior && p.preco_atual > p.preco_anterior)
          .map((p) => ({ ...p, var: ((p.preco_atual - p.preco_anterior) / p.preco_anterior) * 100 }))
          .sort((a, b) => b.var - a.var)
          .slice(0, 6);

        const emBaixa = precosMon
          .filter((p) => p.preco_atual && p.preco_anterior && p.preco_atual < p.preco_anterior)
          .map((p) => ({ ...p, var: ((p.preco_atual - p.preco_anterior) / p.preco_anterior) * 100 }))
          .sort((a, b) => a.var - b.var)
          .slice(0, 4);

        if (followUps.length === 0 && emAlta.length === 0 && emBaixa.length === 0) return null;

        return (
          <div className="two-col" style={{ marginBottom: 16 }}>
            {/* Agenda do dia */}
            <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}><CalendarDays size={13} /> AGENDA DO DIA</div>
                {followUps.length > 0 && (
                  <span style={{ background: C.danger + "22", color: C.danger, borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>
                    {followUps.length} pendente{followUps.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {followUps.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}><CheckCircle size={14} /></div>
                  Nenhum follow-up pendente para hoje
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {followUps.map((c) => {
                    const atrasado = c.proximo_contato < hojeStr;
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: atrasado ? C.danger + "0e" : C.darker, borderRadius: 8, borderLeft: `3px solid ${atrasado ? C.danger : C.warning}` }}>
                        <span style={{ fontSize: 18 }}>{atrasado ? "⚠️" : "📞"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>
                            {c.status} · {c.contato || c.email || "—"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: atrasado ? C.danger : C.warning, fontWeight: 700 }}>
                            {atrasado ? "Atrasado" : "Hoje"}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted }}>
                            {new Date(c.proximo_contato + "T12:00:00").toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Preços em alta / baixa */}
            <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}><TrendingUp size={13} /> MONITOR DE PREÇOS</div>
              {emAlta.length === 0 && emBaixa.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}><BarChart2 size={36} /></div>
                  Nenhuma variação registrada ainda
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {emAlta.map((p) => (
                    <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "7px 10px", background: C.danger + "0f", borderRadius: 7, borderLeft: "3px solid " + C.danger }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome_produto}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{p.loja || "—"} · R$ {Number(p.preco_anterior).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} → R$ {Number(p.preco_atual).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.danger, flexShrink: 0 }}>+{p.var.toFixed(1)}%</span>
                    </div>
                  ))}
                  {emBaixa.map((p) => (
                    <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "7px 10px", background: C.success + "0f", borderRadius: 7, borderLeft: "3px solid " + C.success }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome_produto}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{p.loja || "—"}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.success, flexShrink: 0 }}>{p.var.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Alerta de Inadimplência */}
      {inadimplentes.length > 0 && (
        <div style={{ background: C.danger + "0d", border: `1px solid ${C.danger}33`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}><AlertTriangle size={14} /></span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.danger }}>
                  Atenção: {inadimplentes.length} obra{inadimplentes.length > 1 ? "s" : ""} com pagamento atrasado em relação ao progresso
                </div>
                <div style={{ fontSize: 11, color: C.danger, marginTop: 2 }}>
                  Progresso da obra supera % recebido em mais de 25 pontos
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                const hoje = new Date().toISOString().slice(0, 10);
                const vencidos = Object.values(financeiro).flatMap((f) => {
                  const obraObj = obras.find((o) => f.lancamentos?.length && financeiro[o.id] === f);
                  return (f.lancamentos || []).filter((l) =>
                    l.data_vencimento && l.data_vencimento < hoje && l.status !== "Pago" && l.status !== "Recebido"
                  ).map((l) => ({ ...l, obra: obraObj?.nome || "—" }));
                });
                if (!empresa?.email) { toastMsg("❌ Email da empresa não configurado"); return; }
                if (vencidos.length === 0) { toastMsg("Nenhum lançamento vencido encontrado"); return; }
                try {
                  await emailAlertaInadimplencia({ email: empresa.email, lancamentos: vencidos });
                  toastMsg("✅ Alerta enviado!");
                } catch (e) {
                  toastMsg(`❌ Erro ao enviar: ${e?.message}`);
                }
              }}
              style={{ padding: "7px 14px", background: C.danger + "22", border: `1px solid ${C.danger}44`, color: C.danger, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              📧 Enviar alerta por email
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inadimplentes.map((o) => (
              <div key={o.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{o.nome}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{o.fase} · {o.status}</div>
                  </div>
                  <span style={{ background: C.danger + "22", color: C.danger, borderRadius: 6, fontSize: 11, fontWeight: 700, padding: "3px 10px" }}>
                    +{o.gapPagamento.toFixed(0)}% gap
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11 }}>
                  <div>
                    <div style={{ color: C.muted, marginBottom: 2 }}>Progresso</div>
                    <div style={{ fontWeight: 700, color: C.text }}>{o.progresso || 0}%</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, marginBottom: 2 }}>% Pago</div>
                    <div style={{ fontWeight: 700, color: C.danger }}>{o.pctRecebido.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, marginBottom: 2 }}>Recebido</div>
                    <div style={{ fontWeight: 700, color: C.success }}>{fmt(o.rec)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 3 }}>
                    <span>Pago</span><span style={{ color: C.danger }}>Progresso {o.progresso}% / Pago {o.pctRecebido.toFixed(0)}%</span>
                  </div>
                  <div style={{ position: "relative", height: 8, background: C.danger + "22", borderRadius: 4, overflow: "visible" }}>
                    <div style={{ height: 8, width: `${Math.min(o.pctRecebido, 100)}%`, background: C.success, borderRadius: 4 }} />
                    <div style={{ position: "absolute", top: 0, left: `${Math.min(o.progresso, 100)}%`, height: 8, width: 2, background: C.danger, transform: "translateX(-1px)" }} title={`Progresso: ${o.progresso}%`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compras Preditivas */}
      {alertasCompra.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 16, padding: 20, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>Alertas de Compras — {alertasCompra.length} fase(s) se aproximando</div>
              <div style={{ fontSize: 11, color: "#b45309" }}>Materiais a requisitar nos próximos 15 dias</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alertasCompra.map((a, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{a.obra.nome?.split("—")[0]?.trim()}</div>
                    <div style={{ fontSize: 11, color: "#92400e" }}>
                      Entrando em <strong>{a.fase}</strong> em {a.diasAte === 0 ? "hoje" : `${a.diasAte} dia${a.diasAte > 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <span style={{ background: a.diasAte <= 3 ? "#fee2e2" : "#fef9ec", color: a.diasAte <= 3 ? "#991b1b" : "#92400e", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                    {a.diasAte === 0 ? "🔴 Hoje" : a.diasAte <= 3 ? `🟠 ${a.diasAte}d` : `🟡 ${a.diasAte}d`}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {a.materiais.map((m) => (
                    <span key={m} style={{ background: "#fef9ec", border: "1px solid #fde68a", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#78350f" }}>📦 {m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rentabilidade por obra */}
      {rentabilidade.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>RENTABILIDADE POR OBRA</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.darker }}>
                  {["Obra", "Contrato", "Receita", "Despesa", "Saldo", "Margem", "% Pago", "Situação"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Obra" ? "left" : "right", fontWeight: 700, fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rentabilidade.map((o, i) => {
                  const margemColor = o.margemReal >= 20 ? C.success : o.margemReal >= 10 ? C.warning : C.danger;
                  const situacao = o.gapPagamento > 25 ? { label: "⚠ Atrasado", color: "#991b1b", bg: "#fee2e2" }
                    : o.margemReal < 0 ? { label: "📉 Negativo", color: C.danger, bg: "#fff0f0" }
                    : o.margemReal >= 20 ? { label: "✓ Saudável", color: C.success, bg: "#f0fff4" }
                    : { label: "⚡ Atenção", color: C.warning, bg: "#fffbeb" };
                  return (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? C.darker : "transparent" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, maxWidth: 180 }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.nome?.split("—")[0]?.trim()}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{o.fase}</div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmt(o.contrato)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.success, fontWeight: 600 }}>{fmt(o.rec)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.danger }}>{fmt(o.desp)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: o.saldoObra >= 0 ? C.success : C.danger }}>{fmt(o.saldoObra)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: margemColor }}>{o.margemReal.toFixed(1)}%</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{o.pctRecebido.toFixed(0)}%</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span style={{ background: situacao.bg, color: situacao.color, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{situacao.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DRE Simplificado */}
      {(() => {
        const [drePeriodo, setDrePeriodo] = useState("mes");
        const fmtD = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

        const agora = new Date();
        const periodos = {
          mes:  { label: "Este mês",        meses: 1  },
          tri:  { label: "Últimos 3 meses", meses: 3  },
          sem:  { label: "Últimos 6 meses", meses: 6  },
          ano:  { label: "Este ano",        meses: 12 },
        };
        const { meses } = periodos[drePeriodo];
        const limite = new Date(agora.getFullYear(), agora.getMonth() - meses + 1, 1);

        const lans = Object.values(financeiro).flatMap((f) => f.lancamentos || [])
          .filter((l) => l.data && new Date(l.data + "T00:00") >= limite);

        const recBruta = lans.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
        const CUSTOS_DIRETOS = ["Materiais", "Mão de obra", "Equipamentos", "Transporte"];
        const custosDiretos = lans.filter((l) => l.tipo === "despesa" && CUSTOS_DIRETOS.includes(l.categoria)).reduce((a, l) => a + (l.valor || 0), 0);
        const lucroBruto = recBruta - custosDiretos;
        const despOp = lans.filter((l) => l.tipo === "despesa" && !CUSTOS_DIRETOS.includes(l.categoria)).reduce((a, l) => a + (l.valor || 0), 0);
        const resultado = lucroBruto - despOp;
        const margem = recBruta > 0 ? ((resultado / recBruta) * 100).toFixed(1) : "—";

        const linhas = [
          { label: "Receita Bruta",          valor: recBruta,      cor: C.success, bold: true, indent: 0 },
          { label: "(−) Custos Diretos",      valor: -custosDiretos, cor: C.danger,  bold: false, indent: 1 },
          { label: "(=) Lucro Bruto",         valor: lucroBruto,    cor: lucroBruto >= 0 ? C.success : C.danger, bold: true, indent: 0 },
          { label: "(−) Despesas Operacionais", valor: -despOp,     cor: C.danger,  bold: false, indent: 1 },
          { label: "(=) Resultado Líquido",   valor: resultado,     cor: resultado >= 0 ? C.success : C.danger, bold: true, indent: 0, margem: true },
        ];

        return (
          <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>DRE SIMPLIFICADO</div>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(periodos).map(([k, p]) => (
                  <button key={k} onClick={() => setDrePeriodo(k)} style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                    fontFamily: "inherit", fontWeight: drePeriodo === k ? 700 : 400,
                    border: `1px solid ${drePeriodo === k ? C.red : C.border}`,
                    background: drePeriodo === k ? C.red + "18" : "transparent",
                    color: drePeriodo === k ? C.text : C.muted,
                  }}>{p.label}</button>
                ))}
              </div>
            </div>
            <div style={{ maxWidth: 480 }}>
              {linhas.map((l, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 0", borderBottom: i < linhas.length - 1 ? `1px solid ${C.border}` : "none",
                  paddingLeft: l.indent ? 16 : 0,
                }}>
                  <span style={{ fontSize: 12, fontWeight: l.bold ? 700 : 400, color: l.bold ? C.text : C.muted }}>{l.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: l.bold ? 800 : 500, color: l.cor }}>{fmtD(Math.abs(l.valor))}</span>
                    {l.margem && margem !== "—" && (
                      <span style={{ fontSize: 11, background: resultado >= 0 ? C.success + "22" : C.danger + "22", color: resultado >= 0 ? C.success : C.danger, borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>{margem}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Operacional: SST + Suprimentos ── */}
      <OperacionalKpis />

      {/* Alertas de Certificação NR (Novo componente) */}
      <div style={{ marginBottom: 16 }}><ComplianceNR /></div>

      {/* Atividade Recente */}
      {historico && historico.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, marginTop: 0, marginBottom: 16, border: `1px solid ${C.border}` }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>🕐 Atividade Recente</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {historico.slice(0, 5).map((h, i) => (
              <div key={h.id || i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 10, borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.darker, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {h.tipo === "obra" ? "🏗️" : h.tipo === "cliente" ? "👤" : h.tipo === "financeiro" ? "💰" : "📋"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{h.descricao || h.titulo || "Ação registrada"}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>{h.created_at ? new Date(h.created_at).toLocaleDateString("pt-BR") : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progresso das obras */}
      <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 20, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>PROGRESSO DAS OBRAS</div>
        {obras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: C.muted }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>◆</div>
            <div style={{ fontSize: 12 }}>Nenhuma obra cadastrada</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px 24px" }}>
            {obras.map((o) => {
              const prazoFim   = o.prazo_fim ? new Date(o.prazo_fim) : null;
              const atrasada   = prazoFim && prazoFim < hoje && o.status !== "Concluída";
              const medObra    = (medicoes[o.id] || []).filter((m) => m.status === "Pendente");
              return (
                <div key={o.id} style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{o.nome?.split("—")[0]?.trim()}</span>
                    <span style={{ fontSize: 11, color: o.progresso >= 50 ? C.success : C.muted }}>{o.progresso || 0}%</span>
                  </div>
                  <div style={{ height: 6, background: C.dark, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: 6,
                      width: `${o.progresso || 0}%`,
                      background: o.progresso >= 75 ? C.success : o.progresso >= 40 ? C.warning : C.red,
                      borderRadius: 3,
                      transition: "width .4s ease",
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 3 }}>
                    <span>{o.fase || "—"}</span>
                    <span style={{ display: "flex", gap: 8 }}>
                      {medObra.length > 0 && (
                        <span style={{ color: C.warning }}>⚠ {medObra.length} med. pendente{medObra.length > 1 ? "s" : ""}</span>
                      )}
                      {prazoFim && (
                        <span style={{ color: atrasada ? C.danger : C.muted }}>
                          {atrasada ? "⚠ Atrasada" : `até ${prazoFim.toLocaleDateString("pt-BR")}`}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
