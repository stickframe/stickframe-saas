import { useEffect, useState, lazy, Suspense } from "react";
import { listarMonitorados } from "../services/repositories/precosRepository";
import { C, CATEGORIAS_DESPESA, FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { mesAno } from "../utils/date";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

const DashboardComercial   = lazy(() => import("./DashboardComercial"));
const DashboardEngenheiro  = lazy(() => import("./DashboardEngenheiro"));
const DashboardFinanceiro  = lazy(() => import("./DashboardFinanceiro"));

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
function KpiCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 12, padding: "16px 14px",
      border: `1px solid ${C.border}`, borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>{label.toUpperCase()}</div>
        <div style={{ fontSize: 13, color: accent, fontWeight: 700 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: accent === C.border ? C.text : accent }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{sub}</div>
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
  if (perfil === "comercial")  return <Suspense fallback={null}><DashboardComercial /></Suspense>;
  if (perfil === "engenheiro") return <Suspense fallback={null}><DashboardEngenheiro /></Suspense>;
  if (perfil === "financeiro") return <Suspense fallback={null}><DashboardFinanceiro /></Suspense>;
  return <DashboardDiretor />;
}

function DashboardDiretor() {
  useModuleLoad("clientes");
  useModuleLoad("orcamentos");
  useModuleLoad("obras");
  useModuleLoad("financeiro");
  useModuleLoad("contratos");

  const clientes    = useAppStore((s) => s.clientes);
  const orcamentos  = useAppStore((s) => s.orcamentos);
  const obras       = useAppStore((s) => s.obras);
  const financeiro  = useAppStore((s) => s.financeiro);
  const contratos   = useAppStore((s) => s.contratos);
  const medicoes    = useAppStore((s) => s.medicoes);
  const loadMedicoes = useAppStore((s) => s.loadMedicoes);

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
  const vgvFunil = [
    {
      label:   "Pipeline CRM",
      sublabel: "leads + negociações",
      valor:   clientes.filter((c) => c.status !== "Fechado").reduce((a, c) => a + (c.valor || 0), 0),
      count:   clientes.filter((c) => c.status !== "Fechado").length,
      color:   "#4a9eff",
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
  const vgvTotal = vgvFunil.reduce((a, f) => a + f.valor, 0);

  // ── Medições pendentes ────────────────────────────────────────────────────
  const allMedicoes     = Object.values(medicoes).flat();
  const medPendentes    = allMedicoes.filter((m) => m.status === "Pendente");
  const valorPendente   = medPendentes.reduce((a, m) => a + (m.valor || 0), 0);

  // ── Prazo das obras ───────────────────────────────────────────────────────
  const hoje       = new Date();
  const obrasComPrazo = obras.filter((o) => o.prazo_fim && o.status !== "Concluída");
  const atrasadas  = obrasComPrazo.filter((o) => new Date(o.prazo_fim) < hoje);
  const noPrazo    = obrasComPrazo.filter((o) => new Date(o.prazo_fim) >= hoje);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const obrasAtivas = obras.filter((o) => o.status === "Em andamento").length;

  const kpis = [
    { label: "Clientes",     value: String(clientes.length),  sub: `${clientes.filter(c => c.status === "Fechado").length} fechados`,    accent: "#4a9eff",    icon: "◈" },
    { label: "Orçamentos",   value: String(orcamentos.length),sub: `pipeline ${fmt(pipelineOrc)}`,                                        accent: C.warning,    icon: "◻" },
    { label: "Obras ativas", value: String(obrasAtivas),      sub: `de ${obras.length} total`,                                            accent: C.red,        icon: "◆" },
    { label: "Receitas",     value: fmt(totalRec),            sub: "total recebido",                                                       accent: C.success,    icon: "↑" },
    { label: "Despesas",     value: fmt(totalDesp),           sub: "total lançado",                                                        accent: C.danger,     icon: "↓" },
    { label: "Margem",       value: `${margem}%`,             sub: `saldo ${fmt(saldo)}`,                                                  accent: Number(margem) >= 20 ? C.success : C.warning, icon: "%" },
  ];

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
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head>
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
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 600);
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Dashboard</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>Visão consolidada — {mesAno()}</p>
        </div>
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
      </div>

      {/* VGV — Funil financeiro */}
      <div style={{ background: C.surface, borderRadius: 14, padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 20, borderTop: `3px solid ${C.red}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.muted }}>VGV — VALOR GERAL DE VENDAS</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.text, marginTop: 4 }}>{fmt(vgvTotal)}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>soma de todo o pipeline até as obras concluídas</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Receita realizada</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.success }}>{fmt(totalRec)}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{totalRec > 0 && vgvTotal > 0 ? `${((totalRec / vgvTotal) * 100).toFixed(0)}% do VGV` : "—"}</div>
          </div>
        </div>

        {/* Barra de funil */}
        <div style={{ display: "flex", gap: 3, height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 14 }}>
          {vgvFunil.map((f, i) => {
            const pct = vgvTotal > 0 ? (f.valor / vgvTotal) * 100 : 0;
            if (pct < 1) return null;
            return (
              <div key={i} style={{ width: `${pct}%`, background: f.color, minWidth: 4, transition: "width .4s ease" }} />
            );
          })}
          {vgvTotal === 0 && <div style={{ flex: 1, background: C.darker }} />}
        </div>

        {/* Etapas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {vgvFunil.map((f, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${f.color}`, paddingLeft: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: f.color, letterSpacing: 1, marginBottom: 2 }}>{f.label.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{fmt(f.valor)}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{f.count} {f.count === 1 ? "item" : "itens"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-6" style={{ marginBottom: 20 }}>
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* KPIs secundários */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {/* Medições pendentes */}
        <div style={{ background: C.surface, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.warning}` }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>MEDIÇÕES PENDENTES</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.warning }}>{medPendentes.length}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {medPendentes.length > 0 ? `${fmt(valorPendente)} aguardando aprovação` : "Nenhuma pendente"}
          </div>
        </div>

        {/* Prazo das obras */}
        <div style={{ background: C.surface, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${atrasadas.length > 0 ? C.danger : C.success}` }}>
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
        <div style={{ background: C.surface, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid #4a9eff` }}>
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
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
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
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
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
      </div>

      {/* Gráficos linha 2 */}
      <div className="three-col" style={{ marginBottom: 16 }}>
        {/* Obras por fase */}
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
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
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
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
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
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
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>📅 AGENDA DO DIA</div>
                {followUps.length > 0 && (
                  <span style={{ background: C.danger + "22", color: C.danger, borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>
                    {followUps.length} pendente{followUps.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {followUps.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
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
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>📈 MONITOR DE PREÇOS</div>
              {emAlta.length === 0 && emBaixa.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                  Nenhuma variação registrada ainda
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {emAlta.map((p) => (
                    <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "7px 10px", background: "#fef2f2", borderRadius: 7, borderLeft: "3px solid #dc2626" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome_produto}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{p.loja || "—"} · R$ {Number(p.preco_anterior).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} → R$ {Number(p.preco_atual).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", flexShrink: 0 }}>+{p.var.toFixed(1)}%</span>
                    </div>
                  ))}
                  {emBaixa.map((p) => (
                    <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "7px 10px", background: "#f0fdf4", borderRadius: 7, borderLeft: "3px solid #16a34a" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome_produto}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{p.loja || "—"}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", flexShrink: 0 }}>{p.var.toFixed(1)}%</span>
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
        <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#991b1b" }}>
                Atenção: {inadimplentes.length} obra{inadimplentes.length > 1 ? "s" : ""} com pagamento atrasado em relação ao progresso
              </div>
              <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>
                Progresso da obra supera % recebido em mais de 25 pontos
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inadimplentes.map((o) => (
              <div key={o.id} style={{ background: "#fff", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{o.nome}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{o.fase} · {o.status}</div>
                  </div>
                  <span style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 6, fontSize: 11, fontWeight: 700, padding: "3px 10px" }}>
                    +{o.gapPagamento.toFixed(0)}% gap
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11 }}>
                  <div>
                    <div style={{ color: "#888", marginBottom: 2 }}>Progresso</div>
                    <div style={{ fontWeight: 700, color: "#1a1a1a" }}>{o.progresso || 0}%</div>
                  </div>
                  <div>
                    <div style={{ color: "#888", marginBottom: 2 }}>% Pago</div>
                    <div style={{ fontWeight: 700, color: "#991b1b" }}>{o.pctRecebido.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div style={{ color: "#888", marginBottom: 2 }}>Recebido</div>
                    <div style={{ fontWeight: 700, color: "#2e9e5b" }}>{fmt(o.rec)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888", marginBottom: 3 }}>
                    <span>Pago</span><span style={{ color: "#991b1b" }}>Progresso {o.progresso}% / Pago {o.pctRecebido.toFixed(0)}%</span>
                  </div>
                  <div style={{ position: "relative", height: 8, background: "#fee2e2", borderRadius: 4, overflow: "visible" }}>
                    <div style={{ height: 8, width: `${Math.min(o.pctRecebido, 100)}%`, background: "#2e9e5b", borderRadius: 4 }} />
                    <div style={{ position: "absolute", top: 0, left: `${Math.min(o.progresso, 100)}%`, height: 8, width: 2, background: "#991b1b", transform: "translateX(-1px)" }} title={`Progresso: ${o.progresso}%`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rentabilidade por obra */}
      {rentabilidade.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
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

      {/* Progresso das obras */}
      <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
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
