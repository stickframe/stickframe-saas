import { C, CATEGORIAS_DESPESA } from "../utils/constants";
import { fmt, fmtPct } from "../utils/format";
import { mesAno } from "../utils/date";
import useAppStore from "../store/useAppStore";

function GraficoBarras({ data, height = 120 }) {
  const max = Math.max(...data.map((d) => Math.max(d.rec || 0, d.desp || 0, d.value || 0)), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          {d.rec !== undefined ? (
            <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: height - 20 }}>
              <div style={{ flex: 1, height: `${(d.rec / max) * 100}%`, background: C.success, borderRadius: "3px 3px 0 0", minHeight: 2, opacity: .9 }} />
              <div style={{ flex: 1, height: `${(d.desp / max) * 100}%`, background: C.red,     borderRadius: "3px 3px 0 0", minHeight: 2, opacity: .9 }} />
            </div>
          ) : (
            <div style={{ width: "100%", height: `${(d.value / max) * 100}%`, background: d.color || C.red, borderRadius: "3px 3px 0 0", minHeight: 2, opacity: .85 }} />
          )}
          <span style={{ fontSize: 9, color: C.muted, textAlign: "center", lineHeight: 1.2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function GraficoLinha({ data, height = 80, color = C.red }) {
  if (data.length < 2) return null;
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
            <stop offset="0%" stopColor={color} stopOpacity=".3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineGrad)" />
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" />
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

export default function Dashboard() {
  const clientes   = useAppStore((s) => s.clientes);
  const orcamentos = useAppStore((s) => s.orcamentos);
  const obras      = useAppStore((s) => s.obras);
  const financeiro = useAppStore((s) => s.financeiro);

  const pipeline  = clientes.reduce((a, c) => a + (c.valor || 0), 0);
  const totalRec  = Object.values(financeiro).reduce((a, f) => a + f.lancamentos.filter((l) => l.tipo === "receita").reduce((b, l) => b + l.valor, 0), 0);
  const totalDesp = Object.values(financeiro).reduce((a, f) => a + f.lancamentos.filter((l) => l.tipo === "despesa").reduce((b, l) => b + l.valor, 0), 0);
  const saldo     = totalRec - totalDesp;
  const margem    = totalRec > 0 ? ((saldo / totalRec) * 100).toFixed(1) : "0.0";

  const kpis = [
    { label: "Pipeline",     value: fmt(pipeline),  sub: `${clientes.length} clientes`,   accent: C.red,                        icon: "◈" },
    { label: "Receitas",     value: fmt(totalRec),  sub: "total recebido",                accent: C.success,                    icon: "↑" },
    { label: "Despesas",     value: fmt(totalDesp), sub: "total lançado",                 accent: C.red,                        icon: "↓" },
    { label: "Saldo geral",  value: fmt(saldo),     sub: "resultado consolidado",         accent: saldo >= 0 ? C.success : C.danger, icon: "=" },
    { label: "Margem",       value: `${margem}%`,   sub: "sobre receitas",                accent: Number(margem) >= 20 ? C.success : C.warning, icon: "%" },
    { label: "Obras ativas", value: String(obras.filter((o) => o.status === "Em andamento").length), sub: "em execução", accent: C.graphite, icon: "◆" },
  ];

  const graficoObras = obras.map((o) => {
    const fin  = financeiro[o.id] || { lancamentos: [] };
    const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
    const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + l.valor, 0);
    return { label: o.nome.split("—")[0].trim().split(" ")[0] + "..", rec, desp };
  });

  const statusData = ["Lead", "Em negociação", "Proposta enviada", "Fechado"].map((s) => ({
    label: s.split(" ")[0],
    value: clientes.filter((c) => c.status === s).reduce((a, c) => a + (c.valor || 0), 0),
    count: clientes.filter((c) => c.status === s).length,
    color: s === "Fechado" ? C.success : C.red,
  }));

  const evolucao = [
    { label: "Dez", value: totalRec * 0.10 },
    { label: "Jan", value: totalRec * 0.22 },
    { label: "Fev", value: totalRec * 0.38 },
    { label: "Mar", value: totalRec * 0.55 },
    { label: "Abr", value: totalRec * 0.82 },
    { label: "Mai", value: totalRec },
  ];

  const despCats = CATEGORIAS_DESPESA.map((cat) => {
    const total = Object.values(financeiro).reduce((a, f) =>
      a + f.lancamentos.filter((l) => l.tipo === "despesa" && l.categoria === cat).reduce((b, l) => b + l.valor, 0), 0);
    return { label: cat.split(" ")[0], value: total, color: C.red };
  }).filter((d) => d.value > 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Dashboard</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>Visão consolidada — {mesAno()}</p>
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Atualizado agora</div>
      </div>

      <div className="kpi-grid-6">
        {kpis.map((k, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 12, padding: "16px 14px", border: `1px solid ${C.border}`, borderTop: `3px solid ${k.accent}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: k.accent, fontWeight: 700 }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: k.accent === C.border ? C.text : k.accent }}>{k.value}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>RECEITA VS DESPESA</div>
            <div style={{ display: "flex", gap: 12, fontSize: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.success }}><span style={{ width: 8, height: 8, background: C.success, borderRadius: 2, display: "inline-block" }} />Receita</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.red }}><span style={{ width: 8, height: 8, background: C.red, borderRadius: 2, display: "inline-block" }} />Despesa</span>
            </div>
          </div>
          <GraficoBarras data={graficoObras} height={130} />
        </div>
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 4 }}>EVOLUÇÃO DE RECEITAS</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.success, marginBottom: 14 }}>{fmt(totalRec)}</div>
          <GraficoLinha data={evolucao} height={80} color={C.success} />
        </div>
      </div>

      <div className="three-col">
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>PIPELINE POR ETAPA</div>
          <GraficoBarras data={statusData} height={90} />
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {statusData.filter((s) => s.count > 0).map((s) => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: C.muted }}>{["Lead","Em negociação","Proposta enviada","Fechado"].find((x) => x.startsWith(s.label)) || s.label}</span>
                <span style={{ fontWeight: 700, color: s.color }}>{s.count} · {fmt(s.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>DESPESAS POR CATEGORIA</div>
          {despCats.length > 0 ? (
            <>
              <GraficoBarras data={despCats} height={90} />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
                {despCats.slice(0, 4).map((d) => (
                  <div key={d.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: C.muted }}>{d.label}</span>
                    <span style={{ fontWeight: 700, color: C.red }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 12 }}>Sem despesas</div>
          )}
        </div>

        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>PROGRESSO DAS OBRAS</div>
          {obras.map((o) => (
            <div key={o.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{o.nome.split("—")[0].trim()}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{o.progresso}%</span>
              </div>
              <div style={{ height: 6, background: C.dark, borderRadius: 3 }}>
                <div style={{ height: 6, width: `${o.progresso}%`, background: o.progresso > 50 ? C.success : C.red, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{o.fase}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
