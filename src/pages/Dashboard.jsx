import { useEffect } from "react";
import { C, CATEGORIAS_DESPESA, FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { mesAno } from "../utils/date";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

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
          return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map((d, i) => <span key={i} style={{ fontSize: 9, color: C.muted }}>{d.label}</span>)}
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

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  useModuleLoad("clientes");
  useModuleLoad("orcamentos");
  useModuleLoad("obras");
  useModuleLoad("financeiro");

  const clientes    = useAppStore((s) => s.clientes);
  const orcamentos  = useAppStore((s) => s.orcamentos);
  const obras       = useAppStore((s) => s.obras);
  const financeiro  = useAppStore((s) => s.financeiro);
  const medicoes    = useAppStore((s) => s.medicoes);
  const loadMedicoes = useAppStore((s) => s.loadMedicoes);

  // Carrega medições de todas as obras
  useEffect(() => {
    obras.forEach((o) => loadMedicoes(o.id));
  }, [obras, loadMedicoes]);

  // ── Cálculos financeiros ────────────────────────────────────────────────
  const allLancamentos = Object.values(financeiro).flatMap((f) => f.lancamentos || []);
  const totalRec       = allLancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
  const totalDesp      = allLancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
  const saldo          = totalRec - totalDesp;
  const margem         = totalRec > 0 ? ((saldo / totalRec) * 100).toFixed(1) : "0.0";

  const pipelineOrc = orcamentos
    .filter((o) => !["Recusado"].includes(o.status))
    .reduce((a, o) => a + (o.valor || 0), 0);

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

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Dashboard</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>Visão consolidada — {mesAno()}</p>
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Atualizado agora</div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-6" style={{ marginBottom: 20 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
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
