import { useState, useEffect, useMemo } from "react";
import { sb } from "../services/supabase";
import useAppStore from "../store/useAppStore";
import { C } from "../utils/constants";
import { calcularStickScore } from "../utils/stickScore";

const fmt = (v) => "R$ " + (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtPct = (v) => (v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(1) + "%");
const clampPct = (v) => Math.min(100, Math.max(0, v || 0));

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? clampPct((value / max) * 100) : 0;
  return (
    <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
}

function KpiCard({ label, value, sub, color = C.text, icon }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>}
    </div>
  );
}

function ObraCard({ obra, fins }) {
  const receita = fins.filter(f => f.tipo === "receita").reduce((s, f) => s + (f.valor || 0), 0);
  const custoReal = fins.filter(f => f.tipo === "despesa").reduce((s, f) => s + (f.valor || 0), 0);
  const custoPrev = obra.orcamento || 0;
  const lucroPrev = custoPrev > 0 ? (receita - custoPrev) : null;
  const lucroReal = receita > 0 ? (receita - custoReal) : null;
  const margemReal = receita > 0 ? ((lucroReal / receita) * 100) : null;
  const desvioCusto = custoPrev > 0 ? (((custoReal - custoPrev) / custoPrev) * 100) : null;

  const margemCor = margemReal == null ? C.muted : margemReal >= 20 ? "#3f7a4b" : margemReal >= 10 ? "#b07a1e" : "#981915";
  const desvioCor = desvioCusto == null ? C.muted : desvioCusto <= 0 ? "#3f7a4b" : desvioCusto <= 10 ? "#b07a1e" : "#981915";

  const score = calcularStickScore(obra, { financeiro: fins });
  const maxVal = Math.max(custoPrev, custoReal, receita, 1);

  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 20,
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 2 }}>{obra.nome}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{obra.cliente || "Sem cliente"} · {obra.status}</div>
        </div>
        <div style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800,
          background: score.cor + "18", color: score.cor, border: `1px solid ${score.cor}30`,
          whiteSpace: "nowrap", flexShrink: 0, marginLeft: 8,
        }}>
          {score.total} · {score.nivel}
        </div>
      </div>

      {/* Barras comparativas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Receita Contratada", value: receita, color: "#3f7a4b" },
          { label: "Custo Previsto (Orç.)", value: custoPrev, color: "#3b6ea5" },
          { label: "Custo Real", value: custoReal, color: custoReal > custoPrev && custoPrev > 0 ? "#981915" : "#b07a1e" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{fmt(value)}</span>
            </div>
            <MiniBar value={value} max={maxVal} color={color} />
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: margemCor + "10", border: `1px solid ${margemCor}25`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: margemCor, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Margem Real</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: margemCor }}>{margemReal != null ? margemReal.toFixed(1) + "%" : "—"}</div>
          {lucroReal != null && <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{fmt(lucroReal)} de lucro</div>}
        </div>
        <div style={{ background: desvioCor + "10", border: `1px solid ${desvioCor}25`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: desvioCor, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Desvio de Custo</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: desvioCor }}>{desvioCusto != null ? fmtPct(desvioCusto) : "—"}</div>
          {custoPrev > 0 && <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>vs. orçado {fmt(custoPrev)}</div>}
        </div>
      </div>

      {/* Alerta estouro */}
      {desvioCusto != null && desvioCusto > 15 && (
        <div style={{
          padding: "8px 12px", borderRadius: 8,
          background: "#981915" + "12", border: `1px solid #981915` + "30",
          fontSize: 11, color: "#981915", fontWeight: 600,
        }}>
           Custo real {fmtPct(desvioCusto)} acima do orçamento
        </div>
      )}
    </div>
  );
}

export default function Rentabilidade() {
  const empresaId = useAppStore((s) => s.empresaId);
  const obras = useAppStore((s) => s.obras);
  const plano = useAppStore((s) => s.user?.plano);

  const [financeiro, setFinanceiro] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");

  useEffect(() => {
    if (!empresaId) return;
    sb.from("financeiro").select("obra_id, tipo, valor, data").eq("empresa_id", empresaId)
      .then(({ data }) => { setFinanceiro(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [empresaId]);

  const finsMap = useMemo(() => {
    const m = {};
    financeiro.forEach((f) => {
      if (!m[f.obra_id]) m[f.obra_id] = [];
      m[f.obra_id].push(f);
    });
    return m;
  }, [financeiro]);

  const obrasComDados = useMemo(() => {
    return obras
      .filter((o) => filtroStatus === "todos" || o.status === filtroStatus)
      .map((o) => {
        const fins = finsMap[o.id] || [];
        const receita = fins.filter(f => f.tipo === "receita").reduce((s, f) => s + (f.valor || 0), 0);
        const custo = fins.filter(f => f.tipo === "despesa").reduce((s, f) => s + (f.valor || 0), 0);
        const margem = receita > 0 ? ((receita - custo) / receita) * 100 : null;
        return { ...o, receita, custo, margem };
      })
      .sort((a, b) => (b.margem ?? -999) - (a.margem ?? -999));
  }, [obras, finsMap, filtroStatus]);

  // Totais globais
  const totalReceita = obrasComDados.reduce((s, o) => s + o.receita, 0);
  const totalCusto = obrasComDados.reduce((s, o) => s + o.custo, 0);
  const totalLucro = totalReceita - totalCusto;
  const margemGeral = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;

  const statusOpts = ["todos", "Em andamento", "Concluída", "Planejamento"];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: C.muted, fontSize: 13 }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 4 }}>Central de Rentabilidade</div>
        <div style={{ fontSize: 13, color: C.muted }}>Visão consolidada de receita, custo e margem por obra</div>
      </div>

      {/* KPIs globais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Receita Total" value={fmt(totalReceita)} icon="" color="#3f7a4b" />
        <KpiCard label="Custo Total" value={fmt(totalCusto)} icon="" color={C.text} />
        <KpiCard label="Lucro Total" value={fmt(totalLucro)} icon="" color={totalLucro >= 0 ? "#3f7a4b" : "#981915"} />
        <KpiCard
          label="Margem Geral"
          value={margemGeral.toFixed(1) + "%"}
          icon=""
          color={margemGeral >= 20 ? "#3f7a4b" : margemGeral >= 10 ? "#b07a1e" : "#981915"}
          sub={`${obrasComDados.length} obra${obrasComDados.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Ranking rápido */}
      {obrasComDados.length > 1 && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
             Ranking de Obras
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {obrasComDados.slice(0, 5).map((o, i) => {
              const margemCor = o.margem == null ? C.muted : o.margem >= 20 ? "#3f7a4b" : o.margem >= 10 ? "#b07a1e" : "#981915";
              return (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: i === 0 ? "#fbbf24" : i === 1 ? "#9ca3af" : i === 2 ? "#c97e2e" : C.border,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 900, color: i < 3 ? "#fff" : C.muted,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.nome}</div>
                    <MiniBar value={clampPct(o.margem)} max={100} color={margemCor} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: margemCor, flexShrink: 0 }}>
                    {o.margem != null ? o.margem.toFixed(1) + "%" : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtro */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {statusOpts.map((s) => (
          <button key={s} onClick={() => setFiltroStatus(s)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: filtroStatus === s ? C.red : "#fff",
            color: filtroStatus === s ? "#fff" : C.muted,
            border: `1px solid ${filtroStatus === s ? C.red : C.border}`,
            fontFamily: "inherit",
          }}>
            {s === "todos" ? "Todas" : s}
          </button>
        ))}
      </div>

      {/* Alertas globais */}
      {obrasComDados.some(o => o.custo > (o.orcamento || 0) && o.orcamento > 0) && (
        <div style={{
          marginBottom: 16, padding: "10px 16px", borderRadius: 10,
          background: "#981915" + "10", border: `1px solid #981915` + "25",
          fontSize: 12, color: "#981915", fontWeight: 600,
        }}>
           {obrasComDados.filter(o => o.custo > (o.orcamento || 0) && o.orcamento > 0).length} obra(s) com custo acima do orçamento
        </div>
      )}

      {/* Cards de obras */}
      {obrasComDados.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: C.muted, fontSize: 13 }}>
          Nenhuma obra encontrada para o filtro selecionado.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {obrasComDados.map((o) => (
            <ObraCard key={o.id} obra={o} fins={finsMap[o.id] || []} />
          ))}
        </div>
      )}
    </div>
  );
}
