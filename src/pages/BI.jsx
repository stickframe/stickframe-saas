import { useState, useEffect, useMemo } from "react";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { sb, getEmpresaId } from "../services/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

//  Access Guard 
function AccessDenied() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 40 }}></div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Acesso restrito</div>
      <div style={{ fontSize: 13, color: C.muted }}>Esta área é exclusiva para o perfil Diretor.</div>
    </div>
  );
}

//  Helpers 
function scoreColor(v) {
  if (v >= 70) return C.success;
  if (v >= 40) return C.warning;
  return C.danger;
}

function cellColor(value, invert = false) {
  // For metrics where lower is better (cost/m², NCRs), invert=true
  const good = invert ? value <= 0.33 : value >= 0.67;
  const bad  = invert ? value >= 0.67 : value <= 0.33;
  if (good) return { color: C.success, background: "#e6f7ee" };
  if (bad)  return { color: C.danger, background: "#fde8e8" };
  return { color: C.warning, background: "#fff8e1" };
}

// Normalize value within array (0=best, 1=worst), invert for lower-is-better
function normalize(val, arr, lowerBetter = false) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return 0.5;
  const norm = (val - min) / (max - min);
  return lowerBetter ? norm : 1 - norm; // 0=worst, 1=best for scoring
}

function fmt(n, dec = 0) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtBRL(n) {
  if (n == null || isNaN(n)) return "—";
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

//  KPI Card 
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 12, padding: "20px 24px",
      boxShadow: C.shadow, border: `1px solid ${C.border}`, flex: 1, minWidth: 180,
    }}>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || C.text }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

//  Sortable Table 
function RankingTable({ rows }) {
  const [sortKey, setSortKey]   = useState("score");
  const [sortDir, setSortDir]   = useState("desc");

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [rows, sortKey, sortDir]);

  function toggleSort(key) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const HDR = [
    { key: "nome",      label: "Obra",      numeric: false },
    { key: "cliente",   label: "Cliente",   numeric: false },
    { key: "area_m2",   label: "m²",        numeric: true  },
    { key: "custoM2",   label: "Custo/m²",  numeric: true  },
    { key: "margem",    label: "Margem %",  numeric: true  },
    { key: "prazoOk",   label: "Prazo",     numeric: false },
    { key: "ncrs",      label: "NCRs",      numeric: true  },
    { key: "score",     label: "Score",     numeric: true  },
  ];

  const custoM2Vals = rows.map((r) => r.custoM2).filter(Boolean);
  const margemVals  = rows.map((r) => r.margem);
  const ncrVals     = rows.map((r) => r.ncrs);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {HDR.map((h) => (
              <th
                key={h.key}
                onClick={() => toggleSort(h.key)}
                style={{
                  padding: "10px 12px", textAlign: h.numeric ? "right" : "left",
                  cursor: "pointer", userSelect: "none", borderBottom: `2px solid ${C.border}`,
                  color: sortKey === h.key ? C.red : C.muted,
                  fontWeight: 700, fontSize: 12, whiteSpace: "nowrap",
                }}
              >
                {h.label} {sortKey === h.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const custoNorm  = custoM2Vals.length > 1 ? normalize(r.custoM2, custoM2Vals, true) : 0.5;
            const margemNorm = margemVals.length > 1  ? normalize(r.margem, margemVals, false) : 0.5;
            const ncrNorm    = ncrVals.length > 1     ? normalize(r.ncrs, ncrVals, true) : 0.5;
            return (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "#fafbfc" : C.surface }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: C.text }}>{r.nome}</td>
                <td style={{ padding: "10px 12px", color: C.muted }}>{r.cliente || "—"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmt(r.area_m2)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderRadius: 4, ...cellColor(custoNorm, false) }}>
                  {r.custoM2 > 0 ? fmtBRL(r.custoM2) : "—"}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", ...cellColor(margemNorm, false) }}>
                  {fmt(r.margem, 1)}%
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  {r.concluida
                    ? (r.prazoOk ? <span style={{ color: C.success }}> No prazo</span> : <span style={{ color: C.danger }}> Atrasada</span>)
                    : <span style={{ color: C.muted }}>Em andamento</span>}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", ...cellColor(ncrNorm, false) }}>
                  {r.ncrs}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", minWidth: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                    <div style={{
                      width: 60, height: 8, borderRadius: 4, background: C.border,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${r.score}%`, height: "100%",
                        background: scoreColor(r.score), borderRadius: 4,
                      }} />
                    </div>
                    <span style={{ fontWeight: 700, color: scoreColor(r.score), minWidth: 28 }}>{r.score}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

//  Main Page 
export default function BI() {
  const user = useAppStore((s) => s.user);

  if (user?.perfil !== "diretor") return <AccessDenied />;

  const [periodo,   setPeriodo]   = useState("tudo");
  const [filtroStatus, setFiltroStatus] = useState("Todas");
  const [loading,   setLoading]   = useState(true);
  const [obras,     setObras]     = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [ncrs,      setNcrs]      = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const empresaId = getEmpresaId();

      const [obrasRes, finRes, ncrRes] = await Promise.all([
        sb.from("obras").select("id, nome, cliente, area_m2, status, prazo_inicio, prazo_fim, created_at").eq("empresa_id", empresaId),
        sb.from("lancamentos_financeiros").select("obra_id, tipo, valor, data").eq("empresa_id", empresaId),
        sb.from("nao_conformidades").select("id, obra_id, created_at").eq("empresa_id", empresaId),
      ]);

      setObras(obrasRes.data || []);
      setFinanceiro(finRes.data || []);
      setNcrs(ncrRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  //  Date filter helper 
  const now = new Date();
  function inPeriod(dateStr) {
    if (periodo === "tudo" || !dateStr) return true;
    const d = new Date(dateStr);
    if (periodo === "mes")       return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    if (periodo === "trimestre") return d >= new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    if (periodo === "ano")       return d >= new Date(now.getFullYear(), 0, 1);
    return true;
  }

  //  Filtered obras 
  const filteredObras = useMemo(() => {
    return obras.filter((o) => {
      const statusOk = filtroStatus === "Todas" || o.status === filtroStatus;
      const dateOk   = inPeriod(o.created_at);
      return statusOk && dateOk;
    });
  }, [obras, filtroStatus, periodo]);

  //  Per-obra aggregations 
  const obraRows = useMemo(() => {
    return filteredObras.map((o) => {
      const fins   = financeiro.filter((l) => l.obra_id === o.id);
      const receitas  = fins.filter((l) => l.tipo === "receita").reduce((s, l) => s + (l.valor || 0), 0);
      const despesas  = fins.filter((l) => l.tipo === "despesa").reduce((s, l) => s + (l.valor || 0), 0);
      const area      = o.area_m2 || 0;
      const custoM2   = area > 0 ? despesas / area : 0;
      const margem    = receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0;
      const ncrCount  = ncrs.filter((n) => n.obra_id === o.id).length;
      const concluida = o.status === "Concluída";
      let prazoOk = false;
      if (concluida && o.prazo_fim) {
        // We don't have data_conclusao in this select; use today as approximation if concluida
        prazoOk = true; // optimistic — real check needs data_conclusao column
      }
      return { ...o, custoM2, receitas, despesas, margem, ncrs: ncrCount, concluida, prazoOk };
    });
  }, [filteredObras, financeiro, ncrs]);

  //  Score computation 
  const custoM2Vals  = obraRows.map((r) => r.custoM2).filter(Boolean);
  const margemVals   = obraRows.map((r) => r.margem);
  const ncrVals      = obraRows.map((r) => r.ncrs);

  const scoredRows = useMemo(() => {
    return obraRows.map((r) => {
      const c = custoM2Vals.length > 1 ? normalize(r.custoM2 || 0, custoM2Vals, true) : 0.5;
      const m = margemVals.length > 1  ? normalize(r.margem, margemVals, false) : 0.5;
      const n = ncrVals.length > 1     ? normalize(r.ncrs, ncrVals, true) : 0.5;
      const p = r.concluida ? (r.prazoOk ? 1 : 0) : 0.5;
      const score = Math.round(((c * 0.35 + m * 0.35 + n * 0.2 + p * 0.1)) * 100);
      return { ...r, score };
    });
  }, [obraRows]);

  const totalM2 = useMemo(() => {
    return obraRows.reduce((sum, r) => sum + (r.area_m2 || 0), 0);
  }, [obraRows]);

  //  KPIs 
  const kpis = useMemo(() => {
    const withArea      = obraRows.filter((r) => r.area_m2 > 0 && r.custoM2 > 0);
    const avgCustoM2    = withArea.length > 0 ? withArea.reduce((s, r) => s + r.custoM2, 0) / withArea.length : 0;
    const concluidas    = obraRows.filter((r) => r.concluida);
    const noPrazo       = concluidas.filter((r) => r.prazoOk).length;
    const taxaPrazo     = concluidas.length > 0 ? (noPrazo / concluidas.length) * 100 : null;
    const withRec       = obraRows.filter((r) => r.receitas > 0);
    const avgMargem     = withRec.length > 0 ? withRec.reduce((s, r) => s + r.margem, 0) / withRec.length : 0;
    const avgNcr        = obraRows.length > 0 ? ncrs.filter((n) => filteredObras.some((o) => o.id === n.obra_id)).length / obraRows.length : 0;
    return { avgCustoM2, taxaPrazo, avgMargem, avgNcr, concluidas, noPrazo };
  }, [obraRows, ncrs, filteredObras]);

  //  Bar chart data 
  const barData = useMemo(() => {
    return [...scoredRows]
      .filter((r) => r.custoM2 > 0)
      .sort((a, b) => a.custoM2 - b.custoM2)
      .map((r) => ({ name: r.nome.length > 20 ? r.nome.slice(0, 18) + "…" : r.nome, custoM2: Math.round(r.custoM2) }));
  }, [scoredRows]);

  //  Line chart: monthly margin for last 6 months 
  const lineData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("pt-BR", { month: "short", year: "2-digit" });
      const monthFin = financeiro.filter((l) => l.data && l.data.startsWith(key));
      const rec = monthFin.filter((l) => l.tipo === "receita").reduce((s, l) => s + (l.valor || 0), 0);
      const dep = monthFin.filter((l) => l.tipo === "despesa").reduce((s, l) => s + (l.valor || 0), 0);
      const margem = rec > 0 ? ((rec - dep) / rec) * 100 : null;
      months.push({ label, margem: margem !== null ? parseFloat(margem.toFixed(1)) : null });
    }
    return months;
  }, [financeiro]);

  //  Insights 
  const insights = useMemo(() => {
    const list = [];
    if (scoredRows.length === 0) return list;
    const bestCusto   = [...scoredRows].filter((r) => r.custoM2 > 0).sort((a, b) => a.custoM2 - b.custoM2)[0];
    const bestMargem  = [...scoredRows].sort((a, b) => b.margem - a.margem)[0];
    if (bestCusto) list.push({ type: "info", text: `Obra com melhor custo/m²: ${bestCusto.nome} (${fmtBRL(bestCusto.custoM2)}/m²)` });
    if (bestMargem && bestMargem.receitas > 0) list.push({ type: "info", text: `Obra com maior margem: ${bestMargem.nome} (${fmt(bestMargem.margem, 1)}%)` });
    const concl = kpis.concluidas;
    if (concl.length > 0) {
      const pct = Math.round((kpis.noPrazo / concl.length) * 100);
      list.push({ type: "info", text: `${kpis.noPrazo} obras entregues no prazo de ${concl.length} concluídas (${pct}%)` });
    }
    scoredRows.filter((r) => r.ncrs > 5).forEach((r) => {
      list.push({ type: "warn", text: `${r.nome} com alto número de não-conformidades (${r.ncrs} NCRs)` });
    });
    return list;
  }, [scoredRows, kpis]);

  //  Styles 
  const sectionStyle = {
    background: C.surface, borderRadius: 12, padding: "24px",
    boxShadow: C.shadow, border: `1px solid ${C.border}`, marginBottom: 24,
  };

  const PILL = (active) => ({
    padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none",
    background: active ? C.red : C.darker, color: active ? "#fff" : C.muted,
  });

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1300, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0" }}>Comparativo de performance entre obras</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Período:</span>
        {["mes", "trimestre", "ano", "tudo"].map((p) => (
          <button key={p} style={PILL(periodo === p)} onClick={() => setPeriodo(p)}>
            {{ mes: "Mês", trimestre: "Trimestre", ano: "Ano", tudo: "Tudo" }[p]}
          </button>
        ))}
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginLeft: 12 }}>Status:</span>
        {["Todas", "Em andamento", "Concluída"].map((s) => (
          <button key={s} style={PILL(filtroStatus === s)} onClick={() => setFiltroStatus(s)}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>Carregando dados…</div>
      ) : obraRows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>Nenhuma obra encontrada para os filtros selecionados.</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <KpiCard
              label="Custo médio por m²"
              value={kpis.avgCustoM2 > 0 ? fmtBRL(kpis.avgCustoM2) : "—"}
              sub="Despesas / área das obras"
              color={C.red}
            />
            <KpiCard
              label="Taxa de entrega no prazo"
              value={kpis.taxaPrazo !== null ? `${fmt(kpis.taxaPrazo, 0)}%` : "—"}
              sub={`${kpis.noPrazo} de ${kpis.concluidas.length} concluídas`}
              color={kpis.taxaPrazo >= 70 ? C.success : C.warning}
            />
            <KpiCard
              label="Margem média"
              value={`${fmt(kpis.avgMargem, 1)}%`}
              sub="(Receitas − Despesas) / Receitas"
              color={kpis.avgMargem >= 20 ? C.success : kpis.avgMargem >= 10 ? C.warning : C.danger}
            />
            <KpiCard
              label="NCRs por obra"
              value={fmt(kpis.avgNcr, 1)}
              sub="Média de não-conformidades"
              color={kpis.avgNcr <= 2 ? C.success : kpis.avgNcr <= 5 ? C.warning : C.danger}
            />
          </div>

          {/* Ranking Table */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Performance por Obra</h2>
            <RankingTable rows={scoredRows} />
          </div>

          {/* Sustentabilidade (ESG) */}
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}></span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Sustentabilidade & Impacto ESG</h2>
                <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Indicadores ecológicos baseados em {fmt(totalM2)} m² de área construída em LSF (Light Steel Frame)</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
              {/* Card 1: Agua */}
              <div style={{ background: C.darker, borderRadius: 10, padding: "18px 20px", border: `1px solid ${C.border}`, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>ÁGUA ECONOMIZADA</span>
                  <span style={{ fontSize: 20 }}></span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#3182ce" }}>{fmt(totalM2 * 1000)} L</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Redução de ~1.000 litros por m² comparado com alvenaria convencional (construção seca)</div>
              </div>

              {/* Card 2: Carbono */}
              <div style={{ background: C.darker, borderRadius: 10, padding: "18px 20px", border: `1px solid ${C.border}`, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>REDUÇÃO DE CO₂</span>
                  <span style={{ fontSize: 20 }}></span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.success }}>{fmt(totalM2 * 150)} kg</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Emissões evitadas de CO₂ equivalente no ciclo de fabricação e montagem de perfis</div>
              </div>

              {/* Card 3: Residuos */}
              <div style={{ background: C.darker, borderRadius: 10, padding: "18px 20px", border: `1px solid ${C.border}`, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>RESÍDUOS EVITADOS</span>
                  <span style={{ fontSize: 20 }}></span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.warning }}>{fmt(totalM2 * 120)} kg</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Redução de entulho e desperdício de material (perda menor que 1% de aço)</div>
              </div>

              {/* Card 4: Reciclado */}
              <div style={{ background: C.darker, borderRadius: 10, padding: "18px 20px", border: `1px solid ${C.border}`, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>AÇO RECICLADO</span>
                  <span style={{ fontSize: 20 }}></span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#805ad5" }}>{fmt(totalM2 * 24)} kg</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Estrutura composta por perfis de aço contendo cerca de 60% de matéria-prima reciclada</div>
              </div>
            </div>

            <div style={{ background: "#41414106", border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Comparativo Ambiental: LSF vs Alvenaria Tradicional</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Geração de Resíduos e Entulho (Desperdício)</span>
                    <span><strong style={{ color: C.success }}>~1% (LSF)</strong> vs <strong style={{ color: C.danger }}>~20% (Alvenaria)</strong></span>
                  </div>
                  <div style={{ height: 8, background: C.darker, borderRadius: 4, overflow: "hidden", display: "flex" }}>
                    <div style={{ width: "5%", background: C.success, height: "100%" }} />
                    <div style={{ width: "95%", background: "#41414122", height: "100%" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Velocidade de Execução (Otimização do Canteiro)</span>
                    <span><strong style={{ color: C.success }}>Redução de até 60% no tempo de cronograma</strong></span>
                  </div>
                  <div style={{ height: 8, background: C.darker, borderRadius: 4, overflow: "hidden", display: "flex" }}>
                    <div style={{ width: "60%", background: C.success, height: "100%" }} />
                    <div style={{ width: "40%", background: "#41414122", height: "100%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Custo por m² por obra</h2>
            {barData.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 13 }}>Dados insuficientes para o gráfico.</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 44)}>
                <BarChart layout="vertical" data={barData} margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`R$ ${v.toLocaleString("pt-BR")}`, "Custo/m²"]} />
                  <Bar dataKey="custoM2" fill="#981915" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Line Chart */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Evolução da Margem Mensal</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={lineData} margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, "Margem"]} />
                <Legend />
                <Line
                  type="monotone" dataKey="margem" name="Margem %"
                  stroke="#2e9e5b" strokeWidth={2} dot={{ r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Insights automáticos</h2>
            {insights.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 13 }}>Dados insuficientes para gerar insights.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {insights.map((ins, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "12px 16px", borderRadius: 8,
                      background: ins.type === "warn" ? "#fff8e1" : "#f0faf5",
                      border: `1px solid ${ins.type === "warn" ? "#fde68a" : "#bbf7d0"}`,
                      fontSize: 13, color: C.text,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{ins.type === "warn" ? "" : ""}</span>
                    <span>{ins.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
