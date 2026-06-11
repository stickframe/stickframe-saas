import { useState, useMemo } from "react";
import { C, FASES } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

const STATUS_COR = {
  "Em andamento": "#981915",
  "Planejamento": "#4a9eff",
  "Pausada":      "#b97a00",
  "Concluída":    "#2e9e5b",
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

export default function Cronograma() {
  useModuleLoad("obras");
  const obras      = useAppStore((s) => s.obras);
  const updateObra = useAppStore((s) => s.updateObra);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ prazo_inicio: "", prazo_fim: "" });
  const [saving, setSaving]   = useState(false);

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
    </>
  );
}
