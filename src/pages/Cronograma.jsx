import { useState, useMemo } from "react";
import { C, FASES } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { fmt } from "../utils/format";

const STATUS_COR = {
  "Em andamento": "#981915",
  "Planejamento": "#3b6ea5",
  "Pausada":      "#b07a1e",
  "Concluída":    "#3f7a4b",
};

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function diffDays(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// Sigmoid S-curve: given normalized time t (0→1) returns planned % (0→100)
function sCurve(t) {
  const k = 10; // steepness
  return (1 / (1 + Math.exp(-k * (t - 0.5)))) * 100;
}

// Normalize sigmoid so it starts at 0% and ends at 100%
const S0 = sCurve(0), S1 = sCurve(1);
function sCurveNorm(t) {
  return ((sCurve(t) - S0) / (S1 - S0)) * 100;
}

function CurvaSChart({ obra }) {
  const inicio = new Date(obra.prazo_inicio);
  const fim    = new Date(obra.prazo_fim);
  const hoje   = new Date();
  hoje.setHours(0, 0, 0, 0);

  const totalMs  = fim - inicio;
  const elapsedMs = Math.min(hoje - inicio, totalMs);
  const tAtual   = Math.max(0, Math.min(1, elapsedMs / totalMs));
  const progAtual = obra.progresso || 0;

  // Generate 40 evenly-spaced points
  const N = 40;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    const planejado = sCurveNorm(t);
    const dataPoint = new Date(inicio.getTime() + t * totalMs);
    // Real curve: linear from 0% at inicio to progAtual% at hoje (only for past/today)
    const real = t <= tAtual ? (tAtual > 0 ? (t / tAtual) * progAtual : 0) : null;
    return { t, planejado, real, dataPoint };
  });

  // SVG dimensions
  const W = 520, H = 180, PL = 40, PT = 10, PB = 30, PR = 10;
  const cW = W - PL - PR, cH = H - PT - PB;

  function px(t)  { return PL + t * cW; }
  function py(pct){ return PT + cH - (pct / 100) * cH; }

  const planejadoPts = pts.map((p) => `${px(p.t)},${py(p.planejado)}`).join(" ");
  const realPts      = pts.filter((p) => p.real !== null).map((p) => `${px(p.t)},${py(p.real)}`).join(" ");
  const tHoje        = px(tAtual);
  const deltaVsPlano = progAtual - sCurveNorm(tAtual);
  const atrasado     = deltaVsPlano < -3;

  // Y axis ticks
  const yTicks = [0, 25, 50, 75, 100];
  // X axis labels: inicio, meio, fim
  const xLabels = [
    { t: 0,   label: inicio.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) },
    { t: 0.5, label: new Date(inicio.getTime() + totalMs / 2).toLocaleDateString("pt-BR", { month: "short" }) },
    { t: 1,   label: fim.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) },
  ];

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ height: 3, width: 28, borderRadius: 2, background: C.red }} />
            <div style={{ fontSize: 14, fontWeight: 800 }}>Curva-S</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>PLANEJADO × REAL</div>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>{obra.nome}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: atrasado ? "#fff5f5" : "#f0fdf4",
            color: atrasado ? C.danger : C.success,
            border: `1px solid ${atrasado ? "#fca5a5" : "#86efac"}`,
          }}>
            {atrasado ? `⚠ Atraso ${Math.abs(deltaVsPlano).toFixed(0)}pp` : `✓ No prazo (+${deltaVsPlano.toFixed(0)}pp)`}
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ display: "block" }}>
          {/* Grid Y */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PL} y1={py(v)} x2={W - PR} y2={py(v)} stroke={C.border} strokeWidth={1} strokeDasharray="4,4" />
              <text x={PL - 5} y={py(v) + 4} textAnchor="end" fontSize={9} fill={C.muted}>{v}%</text>
            </g>
          ))}

          {/* Shaded gap between real and planned (when real < planned) */}
          {tAtual > 0 && atrasado && (
            <polygon
              fill="#981915"
              fillOpacity={0.07}
              points={[
                ...pts.filter((p) => p.real !== null).map((p) => `${px(p.t)},${py(p.real)}`),
                ...pts.filter((p) => p.real !== null).reverse().map((p) => `${px(p.t)},${py(p.planejado)}`),
              ].join(" ")}
            />
          )}

          {/* Planned S-curve */}
          <polyline fill="none" stroke={C.steel} strokeWidth={2} strokeDasharray="6,3" points={planejadoPts} />

          {/* Real curve */}
          {realPts && <polyline fill="none" stroke={C.red} strokeWidth={2.5} points={realPts} />}

          {/* Today line */}
          <line x1={tHoje} y1={PT} x2={tHoje} y2={PT + cH} stroke="#981915" strokeWidth={1.5} strokeDasharray="3,3" opacity={0.6} />
          <text x={tHoje + 3} y={PT + 10} fontSize={9} fill="#981915" fontWeight={700}>Hoje</text>

          {/* Current actual dot */}
          <circle cx={tHoje} cy={py(progAtual)} r={5} fill={atrasado ? C.danger : C.success} />

          {/* X axis labels */}
          {xLabels.map(({ t, label }) => (
            <text key={t} x={px(t)} y={H - 4} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"} fontSize={9} fill={C.muted}>{label}</text>
          ))}

          {/* Legend */}
          <line x1={PL}      y1={H - 16} x2={PL + 20}  y2={H - 16} stroke={C.steel} strokeWidth={2} strokeDasharray="6,3" />
          <text x={PL + 24}  y={H - 12}  fontSize={9} fill={C.muted}>Planejado (Curva-S)</text>
          <line x1={PL + 130} y1={H - 16} x2={PL + 150} y2={H - 16} stroke={C.red} strokeWidth={2.5} />
          <text x={PL + 154}  y={H - 12}  fontSize={9} fill={C.muted}>Realizado</text>
        </svg>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
        {[
          { label: "Progresso real", value: `${progAtual}%`, color: atrasado ? C.danger : C.success },
          { label: "Progresso planejado", value: `${sCurveNorm(tAtual).toFixed(0)}%`, color: C.steel },
          { label: "Variação", value: `${deltaVsPlano >= 0 ? "+" : ""}${deltaVsPlano.toFixed(1)}pp`, color: atrasado ? C.danger : C.success },
          { label: "Dias p/ entrega", value: Math.max(0, Math.round((fim - hoje) / 86400000)) + "d", color: C.muted },
        ].map((k) => (
          <div key={k.label} style={{ background: C.dark, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{k.label.toUpperCase()}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Cronograma() {
  useModuleLoad("obras");
  const obras      = useAppStore((s) => s.obras);
  const updateObra = useAppStore((s) => s.updateObra);

  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState({ prazo_inicio: "", prazo_fim: "" });
  const [saving, setSaving]     = useState(false);
  const [curvaSObra, setCurvaSObra] = useState(null); // obra id for Curva-S

  // Obras com datas definidas
  const obrasComData = useMemo(
    () => obras.filter((o) => o.prazo_inicio && o.prazo_fim),
    [obras]
  );
  const obrasSemData = obras.filter((o) => !o.prazo_inicio || !o.prazo_fim);

  // Range do gráfico: 1 mês antes do menor início até 1 mês depois do maior fim
  const { ganttStart, ganttEnd, totalDias } = useMemo(() => {
    if (obrasComData.length === 0) {
      const hoje = new Date();
      const s = startOfMonth(addMonths(hoje, -1));
      const e = startOfMonth(addMonths(hoje, 7));
      return { ganttStart: s, ganttEnd: e, totalDias: diffDays(s, e) };
    }
    const starts = obrasComData.map((o) => new Date(o.prazo_inicio));
    const ends   = obrasComData.map((o) => new Date(o.prazo_fim));
    const minS   = new Date(Math.min(...starts));
    const maxE   = new Date(Math.max(...ends));
    const s = startOfMonth(addMonths(minS, -1));
    const e = startOfMonth(addMonths(maxE,  1));
    return { ganttStart: s, ganttEnd: e, totalDias: diffDays(s, e) };
  }, [obrasComData]);

  // Meses do cabeçalho
  const meses = useMemo(() => {
    const list = [];
    let cur = new Date(ganttStart);
    while (cur < ganttEnd) {
      const next = startOfMonth(addMonths(cur, 1));
      const dias = diffDays(cur, next < ganttEnd ? next : ganttEnd);
      list.push({ label: `${MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}`, dias, pct: (dias / totalDias) * 100 });
      cur = next;
    }
    return list;
  }, [ganttStart, ganttEnd, totalDias]);

  const hoje     = new Date();
  const hojePct  = totalDias > 0 ? Math.max(0, Math.min(100, (diffDays(ganttStart, hoje) / totalDias) * 100)) : 0;

  function barProps(o) {
    const start  = new Date(o.prazo_inicio);
    const end    = new Date(o.prazo_fim);
    const left   = Math.max(0, (diffDays(ganttStart, start) / totalDias) * 100);
    const width  = Math.max(0.5, (diffDays(start, end) / totalDias) * 100);
    const cor    = STATUS_COR[o.status] || C.muted;
    return { left, width, cor };
  }

  function abrirEdit(o) {
    setEditId(o.id);
    setEditForm({
      prazo_inicio: o.prazo_inicio || "",
      prazo_fim:    o.prazo_fim    || "",
    });
  }

  async function salvarDatas() {
    setSaving(true);
    try {
      await updateObra(editId, {
        prazo_inicio: editForm.prazo_inicio || null,
        prazo_fim:    editForm.prazo_fim    || null,
      });
      setEditId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Modal de datas */}
      {editId && (() => {
        const o = obras.find((x) => x.id === editId);
        return (
          <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 380 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{o?.nome}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Definir datas do cronograma</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {[["Início da obra", "prazo_inicio"], ["Entrega prevista", "prazo_fim"]].map(([label, key]) => (
                  <div key={key}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>{label.toUpperCase()}</div>
                    <input
                      type="date"
                      value={editForm[key]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setEditId(null)} style={{ padding: "9px 18px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={salvarDatas} disabled={saving || !editForm.prazo_inicio || !editForm.prazo_fim} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.5 : 1 }}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Cronograma</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{obras.length} obra{obras.length !== 1 ? "s" : ""} · clique na barra para editar datas</p>
        </div>
        {/* Legenda */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {Object.entries(STATUS_COR).map(([s, cor]) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: cor }} />
              {s}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
            <div style={{ width: 2, height: 12, background: "#981915" }} />
            Hoje
          </div>
        </div>
      </div>

      {obras.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: C.muted, fontSize: 13 }}>Nenhuma obra cadastrada.</div>
      ) : (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>

          {/* Obras com data */}
          {obrasComData.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 700 }}>

                {/* Cabeçalho de meses */}
                <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${C.border}`, padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>OBRA</div>
                  <div style={{ flex: 1, display: "flex", position: "relative" }}>
                    {meses.map((m, i) => (
                      <div key={i} style={{ width: `${m.pct}%`, padding: "10px 8px", fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .5, borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap", overflow: "hidden" }}>
                        {m.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Linhas das obras */}
                {obrasComData.map((o) => {
                  const { left, width, cor } = barProps(o);
                  const duracaoDias = diffDays(new Date(o.prazo_inicio), new Date(o.prazo_fim));
                  return (
                    <div key={o.id} style={{ display: "flex", borderBottom: `1px solid ${C.border}`, minHeight: 52 }}>
                      {/* Nome */}
                      <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${C.border}`, padding: "12px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.nome?.split("—")[0]?.trim()}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{o.cliente || "—"}</div>
                      </div>
                      {/* Barra */}
                      <div style={{ flex: 1, position: "relative", padding: "10px 0" }}>
                        {/* Grade de meses */}
                        {meses.map((m, i) => {
                          let acc = meses.slice(0, i).reduce((s, x) => s + x.pct, 0);
                          return <div key={i} style={{ position: "absolute", left: `${acc}%`, top: 0, bottom: 0, borderLeft: `1px solid ${C.border}`, opacity: .4 }} />;
                        })}
                        {/* Linha de hoje */}
                        <div style={{ position: "absolute", left: `${hojePct}%`, top: 0, bottom: 0, borderLeft: "2px dashed #981915", opacity: .7, zIndex: 2 }} />
                        {/* Barra da obra */}
                        <button
                          onClick={() => abrirEdit(o)}
                          title={`${o.prazo_inicio} → ${o.prazo_fim} (${duracaoDias}d) · clique para editar`}
                          style={{
                            position: "absolute",
                            left: `${left}%`,
                            width: `${width}%`,
                            top: "50%", transform: "translateY(-50%)",
                            height: 28,
                            background: cor,
                            borderRadius: 6,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: 8,
                            overflow: "hidden",
                            zIndex: 3,
                          }}
                        >
                          {/* Progresso */}
                          <div style={{ position: "absolute", inset: 0, background: "#fff3", width: `${o.progresso || 0}%`, borderRadius: "6px 0 0 6px" }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", position: "relative", zIndex: 1 }}>
                            {width > 8 ? `${o.progresso || 0}%` : ""}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Obras sem data */}
          {obrasSemData.length > 0 && (
            <div style={{ borderTop: obrasComData.length > 0 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, background: C.dark }}>
                SEM DATAS DEFINIDAS ({obrasSemData.length})
              </div>
              {obrasSemData.map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{o.nome?.split("—")[0]?.trim()}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{o.cliente || "—"} · {o.status}</div>
                  </div>
                  <button
                    onClick={() => abrirEdit(o)}
                    style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    + Definir datas
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Curva-S Planejado × Real */}
      {obrasComData.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                Curva-S™
                <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginLeft: 8 }}>Planejado × Real por obra</span>
              </h3>
            </div>
            <select
              value={curvaSObra || obrasComData[0]?.id || ""}
              onChange={(e) => setCurvaSObra(e.target.value)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.text, fontSize: 13,
                fontFamily: "inherit", cursor: "pointer", outline: "none",
              }}
            >
              {obrasComData.map((o) => (
                <option key={o.id} value={o.id}>{o.nome?.split("—")[0]?.trim()}</option>
              ))}
            </select>
          </div>
          {(() => {
            const obra = obrasComData.find((o) => o.id === (curvaSObra || obrasComData[0]?.id));
            return obra ? <CurvaSChart obra={obra} /> : null;
          })()}
        </div>
      )}
    </>
  );
}
