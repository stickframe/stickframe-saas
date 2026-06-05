import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { sb } from "../services/supabase";
import useAppStore from "../store/useAppStore";
import { fmt } from "../utils/format";
import { C } from "../utils/constants";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function getSixMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 5);
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

function monthLabel(yyyymm) {
  const [y, m] = yyyymm.split("-");
  return `${MESES[Number(m) - 1]}/${String(y).slice(2)}`;
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, color }) {
  const pct = Math.min(Math.max(value || 0, 0), 100);
  const barColor = pct >= 75 ? C.success : pct >= 40 ? C.warning : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: C.darker, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: 6, background: color || barColor, borderRadius: 3, transition: "width .4s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, minWidth: 30, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 16, padding: "18px 16px",
      border: `1px solid ${C.border}`, borderTop: `3px solid ${accent}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: accent }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 16, padding: "20px 24px",
      border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      marginBottom: 20,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.muted, marginBottom: 18 }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardAnalytics() {
  const empresaId = useAppStore((s) => s.empresaId);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [obrasPorStatus, setObrasPorStatus] = useState([]);
  const [top5, setTop5] = useState([]);
  const [alertas, setAlertas] = useState([]);

  // KPI state
  const [kpis, setKpis] = useState({
    obrasAtivas: 0,
    carteira: 0,
    receitaMes: 0,
    despesaMes: 0,
  });

  useEffect(() => {
    if (!empresaId) return;

    async function load() {
      setLoading(true);
      const sixMonthsAgo = getSixMonthsAgo();

      const [{ data: obrasData, error: obrasErr }, { data: lans, error: lansErr }] = await Promise.all([
        sb.from("obras")
          .select("id, nome, status, contrato, progresso, prazo_fim")
          .eq("empresa_id", empresaId),
        sb.from("lancamentos")
          .select("obra_id, tipo, valor, data")
          .eq("empresa_id", empresaId)
          .gte("data", sixMonthsAgo),
      ]);

      if (obrasErr || lansErr) {
        setLoading(false);
        return;
      }

      const obrasArr = obrasData || [];
      const lansArr = lans || [];

      setObras(obrasArr);

      // ── KPIs ───────────────────────────────────────────────────────────────
      const ativas = obrasArr.filter((o) => o.status === "Em andamento");
      const carteira = ativas.reduce((sum, o) => sum + (o.contrato || 0), 0);

      const now = new Date();
      const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const lansDoMes = lansArr.filter((l) => l.data && l.data.substring(0, 7) === mesAtual);
      const receitaMes = lansDoMes.filter((l) => l.tipo === "receita").reduce((sum, l) => sum + (l.valor || 0), 0);
      const despesaMes = lansDoMes.filter((l) => l.tipo === "despesa").reduce((sum, l) => sum + (l.valor || 0), 0);

      setKpis({
        obrasAtivas: ativas.length,
        carteira,
        receitaMes,
        despesaMes,
      });

      // ── Obras por status ──────────────────────────────────────────────────
      const STATUS_LIST = ["Planejamento", "Em andamento", "Pausada", "Concluída"];
      setObrasPorStatus(STATUS_LIST.map((s) => ({
        status: s,
        count: obrasArr.filter((o) => o.status === s).length,
      })));

      // ── Monthly receitas vs despesas (last 6 months) ──────────────────────
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months.push(key);
      }

      const monthly = months.map((key) => {
        const slice = lansArr.filter((l) => l.data && l.data.substring(0, 7) === key);
        return {
          mes: monthLabel(key),
          Receitas: slice.filter((l) => l.tipo === "receita").reduce((s, l) => s + (l.valor || 0), 0),
          Despesas: slice.filter((l) => l.tipo === "despesa").reduce((s, l) => s + (l.valor || 0), 0),
        };
      });
      setMonthlyData(monthly);

      // ── Top 5 obras por contrato ──────────────────────────────────────────
      const sorted = [...obrasArr]
        .filter((o) => o.contrato > 0)
        .sort((a, b) => b.contrato - a.contrato)
        .slice(0, 5)
        .map((o) => ({
          nome: o.nome?.split("—")[0]?.trim()?.substring(0, 22) || "Obra",
          contrato: o.contrato,
        }));
      setTop5(sorted);

      // ── Alertas de desvio — despesas > 80% do contrato ───────────────────
      const { data: allLans } = await sb.from("lancamentos")
        .select("obra_id, tipo, valor")
        .eq("empresa_id", empresaId)
        .eq("tipo", "despesa");

      const despByObra = {};
      (allLans || []).forEach((l) => {
        despByObra[l.obra_id] = (despByObra[l.obra_id] || 0) + (l.valor || 0);
      });

      const alertList = obrasArr
        .filter((o) => o.contrato > 0 && o.status !== "Concluída")
        .map((o) => ({ ...o, totalDesp: despByObra[o.id] || 0 }))
        .filter((o) => o.totalDesp > o.contrato * 0.8)
        .sort((a, b) => b.totalDesp / b.contrato - a.totalDesp / a.contrato);
      setAlertas(alertList);

      setLoading(false);
    }

    load();
  }, [empresaId]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: C.muted, fontSize: 14 }}>
        Carregando analytics...
      </div>
    );
  }

  const tooltipStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Analytics Executivo</h2>
        <p style={{ color: C.muted, fontSize: 13 }}>Visao consolidada de todos os projetos</p>
      </div>

      {/* ── 1. KPI Row ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Obras Ativas" value={kpis.obrasAtivas} sub="em andamento" accent={C.red} />
        <KpiCard label="Valor em Carteira" value={fmt(kpis.carteira)} sub="contratos ativos" accent="#4a9eff" />
        <KpiCard label="Receitas do Mes" value={fmt(kpis.receitaMes)} sub="lancadas este mes" accent={C.success} />
        <KpiCard label="Despesas do Mes" value={fmt(kpis.despesaMes)} sub="lancadas este mes" accent={C.danger} />
      </div>

      {/* ── 2. Obras por status ─────────────────────────────────────────────── */}
      <Section title="Obras por Status">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={obrasPorStatus} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="status" tick={{ fontSize: 11, fill: C.muted }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Obras" fill={C.red} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── 3. Receitas vs Despesas por mes ──────────────────────────────────── */}
      <Section title="Receitas vs Despesas - Ultimos 6 Meses">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: C.muted }} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => fmt(value)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Receitas" fill={C.success} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill={C.red} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── 4. Top 5 obras por valor de contrato ─────────────────────────────── */}
      <Section title="Top 5 Obras por Valor de Contrato">
        {top5.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: C.muted, fontSize: 13 }}>Sem dados de contratos</div>
        ) : (
          <ResponsiveContainer width="100%" height={top5.length * 52 + 20}>
            <BarChart
              data={top5}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 11, fill: C.muted }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} />
              <Bar dataKey="contrato" name="Contrato" fill="#4a9eff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── 5. Alertas de desvio ──────────────────────────────────────────────── */}
      <Section title="Alertas de Desvio Orcamentario">
        {alertas.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f0fdf4", borderRadius: 10, border: `1px solid ${C.success}33` }}>
            <span style={{ fontSize: 18 }}>checkmark</span>
            <span style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>Nenhuma obra com risco de estouro orcamentario ({">"}80% do contrato)</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alertas.map((o) => {
              const pct = ((o.totalDesp / o.contrato) * 100).toFixed(1);
              const isCritical = o.totalDesp >= o.contrato;
              return (
                <div key={o.id} style={{
                  display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 16,
                  padding: "14px 16px", background: isCritical ? "#fff5f5" : "#fffbeb",
                  borderRadius: 10, border: `1px solid ${isCritical ? "#fca5a5" : "#fde68a"}`,
                  borderLeft: `4px solid ${isCritical ? C.danger : C.warning}`,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{o.nome}</div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.muted }}>
                      <span>Contrato: <strong style={{ color: C.text }}>{fmt(o.contrato)}</strong></span>
                      <span>Despesas: <strong style={{ color: isCritical ? C.danger : C.warning }}>{fmt(o.totalDesp)}</strong></span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <ProgressBar
                        value={Math.min((o.totalDesp / o.contrato) * 100, 100)}
                        color={isCritical ? C.danger : C.warning}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <span style={{
                      fontSize: 15, fontWeight: 900,
                      color: isCritical ? C.danger : "#b97a00",
                      display: "block",
                    }}>{pct}%</span>
                    <span style={{ fontSize: 10, color: C.muted }}>consumido</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── 6. Progresso geral das obras ativas ──────────────────────────────── */}
      <Section title="Progresso Geral das Obras">
        {obras.filter((o) => o.status === "Em andamento").length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: C.muted, fontSize: 13 }}>Nenhuma obra em andamento</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.darker }}>
                  {["Obra", "Status", "Progresso", "Prazo"].map((h) => (
                    <th key={h} style={{
                      padding: "8px 14px", textAlign: h === "Obra" ? "left" : "center",
                      fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {obras
                  .filter((o) => o.status === "Em andamento")
                  .sort((a, b) => (b.progresso || 0) - (a.progresso || 0))
                  .map((o, i) => {
                    const prazo = o.prazo_fim ? new Date(o.prazo_fim + "T00:00") : null;
                    const atrasada = prazo && prazo < new Date() && o.status !== "Concluída";
                    return (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? C.darker : "transparent" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, maxWidth: 220 }}>
                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {o.nome?.split("—")[0]?.trim()}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                            background: C.red + "22", color: C.red,
                          }}>{o.status}</span>
                        </td>
                        <td style={{ padding: "10px 14px", minWidth: 160 }}>
                          <ProgressBar value={o.progresso} />
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, color: atrasada ? C.danger : C.muted, fontWeight: atrasada ? 700 : 400 }}>
                          {prazo
                            ? (atrasada ? "! " : "") + prazo.toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
