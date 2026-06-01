import { useEffect, useState } from "react";
import { BarChart2, Brain, TrendingUp } from "../components/ui/Icon";
import { sb, getEmpresaId } from "../services/supabase";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";

const PADROES = ["Econômico", "Padrão", "Alto Padrão"];
const PADRAO_COLOR = { "Econômico": "#4a9eff", "Padrão": "#2e9e5b", "Alto Padrão": "#9b59b6" };

const PERIODO_OPTS = [
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
  { label: "Últimos 12 meses", days: 365 },
  { label: "Todo período", days: 0 },
];

export default function Inteligencia() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [obras, setObras] = useState([]);
  const [funil, setFunil] = useState({ leads: 0, orcamentos: 0, obras: 0, concluidas: 0 });
  const [periodo, setPeriodo] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const empresaId = getEmpresaId();
      const desde = periodo > 0
        ? new Date(Date.now() - periodo * 86400000).toISOString()
        : "2000-01-01";

      const [{ data: orcs }, { data: obs }, { count: leads }, { count: orcCount }, { count: obrasCount }, { count: conclCount }] = await Promise.all([
        sb.from("orcamentos").select("area, valor, padrao, status, criado").eq("empresa_id", empresaId),
        sb.from("obras").select("fase, progresso, prazo_inicio, prazo_fim, status, nome").eq("empresa_id", empresaId),
        sb.from("pre_orcamentos").select("*", { count: "exact", head: true }).eq("empresa_id", empresaId).gte("created_at", desde),
        sb.from("orcamentos").select("*", { count: "exact", head: true }).eq("empresa_id", empresaId).gte("created_at", desde),
        sb.from("obras").select("*", { count: "exact", head: true }).eq("empresa_id", empresaId).gte("created_at", desde),
        sb.from("obras").select("*", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("status", "Concluída").gte("created_at", desde),
      ]);
      setOrcamentos(orcs || []);
      setObras(obs || []);
      setFunil({ leads: leads || 0, orcamentos: orcCount || 0, obras: obrasCount || 0, concluidas: conclCount || 0 });
      setLoading(false);
    })();
  }, [periodo]);

  // ── Análise por padrão ─────────────────────────────────────────────────────
  const stats = PADROES.map((pad) => {
    const items = orcamentos.filter((o) => o.padrao === pad && o.area > 0 && o.valor > 0);
    if (!items.length) return { pad, count: 0, avgM2: 0, minM2: 0, maxM2: 0, avgArea: 0, total: 0 };
    const m2s   = items.map((o) => o.valor / o.area);
    const areas = items.map((o) => o.area);
    return {
      pad, count: items.length,
      avgM2:  m2s.reduce((a, v) => a + v, 0) / m2s.length,
      minM2:  Math.min(...m2s),
      maxM2:  Math.max(...m2s),
      avgArea: areas.reduce((a, v) => a + v, 0) / areas.length,
      total:  items.reduce((a, o) => a + o.valor, 0),
    };
  });

  // Trend: recent 3 months vs older
  const tresMesesAtras = new Date(Date.now() - 90 * 86400000).toISOString();
  const recentes = orcamentos.filter((o) => o.criado >= tresMesesAtras && o.area > 0 && o.valor > 0);
  const antigos  = orcamentos.filter((o) => o.criado < tresMesesAtras  && o.area > 0 && o.valor > 0);
  const avgRecente = recentes.length ? recentes.reduce((a, o) => a + o.valor / o.area, 0) / recentes.length : 0;
  const avgAntigo  = antigos.length  ? antigos.reduce((a, o) => a + o.valor / o.area, 0) / antigos.length : 0;
  const emAlta = avgRecente > avgAntigo && recentes.length > 0 && antigos.length > 0;

  const maxAvg = Math.max(...stats.map((s) => s.avgM2), 1);

  // ── Análise de prazo ───────────────────────────────────────────────────────
  const concluidas = obras.filter(
    (o) => o.status === "Concluída" && o.prazo_inicio && o.prazo_fim,
  );
  const duracoes = concluidas.map((o) => {
    const d = Math.ceil((new Date(o.prazo_fim) - new Date(o.prazo_inicio)) / 86400000);
    return { nome: o.nome, dias: d };
  });
  const avgDuracao = duracoes.length
    ? Math.round(duracoes.reduce((a, d) => a + d.dias, 0) / duracoes.length)
    : null;

  const emAndamento = obras.filter((o) => o.status === "Em andamento" && o.prazo_inicio);

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>Carregando...</div>
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}><Brain size={13} /> Inteligência de Negócios</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Análise histórica de custos e prazos</div>
      </div>

      {/* ── Funil de Conversão ────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}><BarChart2 size={13} /> Funil de Conversão</div>
          <select value={periodo} onChange={(e) => setPeriodo(Number(e.target.value))} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, background: C.surface, color: C.text, cursor: "pointer" }}>
            {PERIODO_OPTS.map((o) => <option key={o.days} value={o.days}>{o.label}</option>)}
          </select>
        </div>
        {(() => {
          const etapas = [
            { label: "Leads", icon: "🎯", count: funil.leads, color: "#4a9eff" },
            { label: "Orçamentos", icon: "📋", count: funil.orcamentos, color: "#9b59b6" },
            { label: "Obras", icon: "🏗", count: funil.obras, color: C.red },
            { label: "Concluídas", icon: "✅", count: funil.concluidas, color: "#2e9e5b" },
          ];
          const maxCount = Math.max(...etapas.map((e) => e.count), 1);
          return (
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
                {etapas.map((e, i) => {
                  const pct = Math.max((e.count / maxCount) * 100, e.count > 0 ? 8 : 0);
                  const conv = i > 0 && etapas[i - 1].count > 0
                    ? Math.round((e.count / etapas[i - 1].count) * 100)
                    : null;
                  return (
                    <div key={e.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      {conv !== null && (
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>↓ {conv}%</div>
                      )}
                      <div style={{ width: "100%", background: e.color + "22", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 120, position: "relative" }}>
                        <div style={{ background: e.color, borderRadius: 8, height: `${pct}%`, minHeight: e.count > 0 ? 24 : 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {e.count > 0 && <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{e.count}</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>{e.icon} {e.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
                {[
                  { label: "Lead → Orçamento", val: funil.leads > 0 ? Math.round((funil.orcamentos / funil.leads) * 100) : 0 },
                  { label: "Orçamento → Obra", val: funil.orcamentos > 0 ? Math.round((funil.obras / funil.orcamentos) * 100) : 0 },
                  { label: "Obra → Conclusão", val: funil.obras > 0 ? Math.round((funil.concluidas / funil.obras) * 100) : 0 },
                ].map((t) => (
                  <div key={t.label} style={{ background: C.dark, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: t.val >= 30 ? "#2e9e5b" : t.val >= 10 ? "#b97a00" : C.red }}>{t.val}%</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Seção 1: Custo por m² ─────────────────────────────────────────────── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Custo por m² por Tipologia</div>
          {emAlta && (
            <span style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#166534" }}>
              <TrendingUp size={13} /> Em alta
            </span>
          )}
        </div>

        {/* Bar chart SVG */}
        <svg width="100%" height="160" style={{ display: "block", marginBottom: 20, overflow: "visible" }}>
          {stats.map((s, i) => {
            const barH = maxAvg > 0 ? (s.avgM2 / maxAvg) * 120 : 0;
            const x = 60 + i * 180;
            const color = PADRAO_COLOR[s.pad] || C.red;
            return (
              <g key={s.pad}>
                <rect x={x} y={130 - barH} width={100} height={barH} rx={6} fill={color + "cc"} stroke={color} strokeWidth={1} />
                {s.count > 0 && (
                  <text x={x + 50} y={130 - barH - 6} textAnchor="middle" fontSize={11} fontWeight="700" fill={color}>
                    {fmt(s.avgM2)}/m²
                  </text>
                )}
                <text x={x + 50} y={148} textAnchor="middle" fontSize={10} fill={C.muted}>{s.pad}</text>
                <text x={x + 50} y={160} textAnchor="middle" fontSize={9} fill={C.muted}>{s.count} orç.</text>
              </g>
            );
          })}
        </svg>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Padrão", "Qtd", "Média /m²", "Mínimo /m²", "Máximo /m²", "Área média", "Volume total"].map((h) => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: .5 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.pad} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px 10px", fontWeight: 700, color: PADRAO_COLOR[s.pad] }}>{s.pad}</td>
                <td style={{ padding: "10px 10px", color: C.muted }}>{s.count}</td>
                <td style={{ padding: "10px 10px", fontWeight: 700 }}>{s.count ? fmt(s.avgM2) : "—"}</td>
                <td style={{ padding: "10px 10px", color: C.muted }}>{s.count ? fmt(s.minM2) : "—"}</td>
                <td style={{ padding: "10px 10px", color: C.muted }}>{s.count ? fmt(s.maxM2) : "—"}</td>
                <td style={{ padding: "10px 10px", color: C.muted }}>{s.count ? `${s.avgArea.toFixed(0)} m²` : "—"}</td>
                <td style={{ padding: "10px 10px" }}>{s.count ? fmt(s.total) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Seção 2: Previsão de Prazo ────────────────────────────────────────── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Previsão de Prazo</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
          {avgDuracao
            ? `Duração média de obras concluídas: ${avgDuracao} dias (${duracoes.length} obra${duracoes.length !== 1 ? "s" : ""})`
            : "Nenhuma obra concluída com datas registradas ainda."}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Obra", "Progresso", "Dias decorridos", "Previsão conclusão", "Status"].map((h) => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: .5 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...concluidas.map((o) => ({ ...o, _tipo: "concluida" })), ...emAndamento.map((o) => ({ ...o, _tipo: "andamento" }))].map((o, i) => {
              const inicio = new Date(o.prazo_inicio);
              const hoje = new Date();
              const diasDecorridos = Math.ceil((hoje - inicio) / 86400000);
              let previsao = "—";
              if (o._tipo === "concluida" && o.prazo_fim) {
                previsao = new Date(o.prazo_fim).toLocaleDateString("pt-BR");
              } else if (o._tipo === "andamento" && avgDuracao && o.progresso > 0) {
                const progresso = o.progresso || 1;
                const diasTotaisEstimados = (diasDecorridos / progresso) * 100;
                const conclusaoEstimada = new Date(inicio.getTime() + diasTotaisEstimados * 86400000);
                previsao = conclusaoEstimada.toLocaleDateString("pt-BR") + " (est.)";
              }
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 10px", fontWeight: 600 }}>{o.nome || "—"}</td>
                  <td style={{ padding: "10px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: C.dark, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${o.progresso || 0}%`, height: "100%", background: o._tipo === "concluida" ? C.success : C.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: C.muted, width: 32 }}>{o.progresso || 0}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 10px", color: C.muted }}>{diasDecorridos > 0 ? `${diasDecorridos}d` : "—"}</td>
                  <td style={{ padding: "10px 10px" }}>{previsao}</td>
                  <td style={{ padding: "10px 10px" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: o._tipo === "concluida" ? "#dcfce7" : "#fff7ed",
                      color: o._tipo === "concluida" ? "#166534" : "#92400e",
                    }}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {concluidas.length === 0 && emAndamento.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: C.muted, fontSize: 12 }}>Nenhuma obra com dados de prazo encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
