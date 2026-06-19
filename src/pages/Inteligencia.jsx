import { useMemo } from "react";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

/*  Lucide icons (viewBox 0 0 24 24)  */
function Ic({ n, w = 16, c = "currentColor" }) {
  const P = {
    brain: <g><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></g>,
    trendU: <g><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></g>,
    trendD: <g><path d="M3 7l6 6 4-4 8 8"/><path d="M17 17h4v-4"/></g>,
    activity: <g><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></g>,
    clock: <g><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></g>,
    barchart: <g><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></g>,
    sparkle: <g><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></g>,
    obra: <g><path d="M3 21h18M6 21V9M10 21V9"/><path d="M4 9h16l-2-5H8z"/></g>,
    dollar: <g><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></g>,
    arrow: <g><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></g>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: w, height: w, flexShrink: 0 }}>
      {P[n]}
    </svg>
  );
}

const cond = "'Barlow Condensed', 'Hanken Grotesk', sans-serif";

export default function Inteligencia() {
  useModuleLoad("obras");
  useModuleLoad("financeiro");

  const obras = useAppStore((s) => s.obras);
  const financeiro = useAppStore((s) => s.financeiro);
  const setActivePage = useAppStore((s) => s.setActivePage);

  const {
    custoMedio,
    dadosPadrao,
    prazoMedio,
    tendencia,
    obrasAnalisadas,
    projetadoM2
  } = useMemo(() => {
    const concluidas = obras.filter((o) => o.status === "Concluída" && o.area);
    const emAndamento = obras.filter((o) => o.status === "Em andamento" && o.progresso > 0 && o.area);

    let totalArea = 0;
    let totalCusto = 0;
    let diasTotal = 0;
    let obrasComPrazo = 0;
    const porPadrao = {};

    concluidas.forEach((o) => {
      const fin = financeiro[o.id] || { lancamentos: [] };
      const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);

      totalArea += o.area;
      totalCusto += desp;

      const padrao = o.padrao || "Padrão";
      if (!porPadrao[padrao]) porPadrao[padrao] = { area: 0, custo: 0, count: 0 };
      porPadrao[padrao].area  += o.area;
      porPadrao[padrao].custo += desp;
      porPadrao[padrao].count += 1;

      if (o.prazo_inicio && o.prazo_fim) {
        const dias = (new Date(o.prazo_fim) - new Date(o.prazo_inicio)) / (1000 * 60 * 60 * 24);
        if (dias > 0) { diasTotal += dias; obrasComPrazo += 1; }
      }
    });

    let areaProj = 0;
    let custoProj = 0;
    emAndamento.forEach((o) => {
      const fin = financeiro[o.id] || { lancamentos: [] };
      const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
      custoProj += desp / (o.progresso / 100);
      areaProj  += o.area;
    });

    const cm     = totalArea > 0 ? totalCusto / totalArea : 0;
    const pm     = obrasComPrazo > 0 ? Math.round(diasTotal / obrasComPrazo) : 0;
    const projM2 = areaProj > 0 ? custoProj / areaProj : 0;

    const dp = Object.entries(porPadrao)
      .map(([padrao, d]) => ({ padrao, custoM2: d.area > 0 ? d.custo / d.area : 0, count: d.count }))
      .sort((a, b) => b.custoM2 - a.custoM2);

    let tend = "Estável";
    if (cm > 0 && projM2 > 0) {
      if (projM2 > cm * 1.05) tend = "Alta";
      else if (projM2 < cm * 0.95) tend = "Baixa";
    }

    return { custoMedio: cm, dadosPadrao: dp, prazoMedio: pm, tendencia: tend, obrasAnalisadas: concluidas.length, projetadoM2: projM2 };
  }, [obras, financeiro]);

  const tendCor = tendencia === "Alta" ? C.danger : tendencia === "Baixa" ? C.success : C.muted;
  const tendIcon = tendencia === "Alta" ? "trendU" : tendencia === "Baixa" ? "trendD" : "activity";

  /*  Header (sempre visível)  */
  const Header = (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontFamily: cond, fontWeight: 700, fontSize: 28, color: C.text, marginBottom: 4 }}>
        Inteligência Artificial
      </h1>
      <p style={{ fontSize: 13, color: C.muted }}>
        Histórico e projeções baseadas no custo real de execução
      </p>
    </div>
  );

  /*  Empty state contextual  */
  if (obrasAnalisadas === 0 && projetadoM2 === 0) {
    return (
      <div>
        {Header}
        <div className="card" style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "56px 24px"
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: C.brickSoft,
            display: "grid", placeItems: "center", marginBottom: 16
          }}>
            <Ic n="brain" w={28} c={C.red} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 8 }}>
            Sem dados para analisar ainda
          </div>
          <div style={{ fontSize: 13, color: C.muted, maxWidth: 460, lineHeight: 1.6, marginBottom: 24 }}>
            O StickBrain™ cruza os lançamentos do <strong>Financeiro</strong> com o progresso da{" "}
            <strong>Gestão de Obras</strong>. Conclua ao menos uma obra ou registre despesas em uma
            obra em andamento para visualizar o custo histórico real e as projeções de mercado.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => setActivePage("financeiro")} style={btnPrimary}>
              <Ic n="dollar" w={15} c="#fff" /> Registrar no Financeiro <Ic n="arrow" w={15} c="#fff" />
            </button>
            <button onClick={() => setActivePage("obras")} style={btnGhost}>
              <Ic n="obra" w={15} c={C.text} /> Ir para Gestão de Obras
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {Header}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
        <KpiCard
          accent={C.red} icon="trendU"
          label="Custo histórico geral"
          val={custoMedio > 0 ? fmt(custoMedio) : "—"} unit={custoMedio > 0 ? "/m²" : ""}
          sub={`Média real de ${obrasAnalisadas} obra${obrasAnalisadas !== 1 ? "s" : ""} concluída${obrasAnalisadas !== 1 ? "s" : ""}`}
        />
        <KpiCard
          accent={C.steel} icon="barchart"
          label="Custo projetado (em andamento)"
          val={projetadoM2 > 0 ? fmt(projetadoM2) : "—"} unit={projetadoM2 > 0 ? "/m²" : ""}
          sub="Projeção atual com base no progresso físico"
        />
        <KpiCard
          accent={tendCor} icon={tendIcon}
          label="Tendência de custo"
          val={tendencia}
          sub="Obras atuais vs Histórico consolidado"
        />
        <KpiCard
          accent={C.ochre} icon="clock"
          label="Prazo médio de entrega"
          val={prazoMedio > 0 ? prazoMedio : "—"} unit={prazoMedio > 0 ? " dias" : ""}
          sub="Tempo real médio de execução"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        {/* Custo por padrão */}
        <div className="card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.darker}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.brickSoft, display: "grid", placeItems: "center" }}>
              <Ic n="barchart" w={15} c={C.red} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Custo histórico por padrão</div>
          </div>

          {dadosPadrao.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <Ic n="barchart" w={30} c={C.border} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.muted, margin: "12px 0 5px" }}>
                Sem obras concluídas
              </div>
              <div style={{ fontSize: 12, color: C.muted, maxWidth: 280, margin: "0 auto 16px", lineHeight: 1.5 }}>
                Conclua obras com despesas registradas para gerar o benchmark de custo por padrão construtivo.
              </div>
              <button onClick={() => setActivePage("obras")} style={btnLink}>
                <Ic n="obra" w={14} c={C.red} /> Gerenciar obras <Ic n="arrow" w={14} c={C.red} />
              </button>
            </div>
          ) : (
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
              {dadosPadrao.map((d, i) => {
                const pct = (d.custoM2 / dadosPadrao[0].custoM2) * 100;
                return (
                  <div key={d.padrao}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: C.text }}>
                        {d.padrao}{" "}
                        <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>
                          ({d.count} obra{d.count !== 1 ? "s" : ""})
                        </span>
                      </span>
                      <span className="num" style={{ fontFamily: cond, fontWeight: 700, color: C.text }}>
                        {fmt(d.custoM2)}/m²
                      </span>
                    </div>
                    <div style={{ height: 8, background: C.darker, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? C.red : C.clay, borderRadius: 4, transition: "width .5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.darker}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.brickSoft, display: "grid", placeItems: "center" }}>
              <Ic n="sparkle" w={15} c={C.red} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Insights gerados pela IA</div>
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            {insights({ dadosPadrao, projetadoM2, custoMedio, tendencia, prazoMedio }).map((node, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: C.surface2, borderRadius: 9, border: `1px solid ${C.darker}` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, flexShrink: 0, marginTop: 7 }} />
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{node}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/*  KPI Card  */
function KpiCard({ accent, icon, label, val, unit, sub }) {
  return (
    <div className="card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ height: 3, width: 28, borderRadius: 2, background: accent }} />
        <Ic n={icon} w={16} c={accent} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div className="num" style={{ fontFamily: cond, fontSize: 30, fontWeight: 700, lineHeight: 1, color: accent, marginBottom: 4 }}>
        {val}
        {unit && <span style={{ fontSize: 15, fontWeight: 600, color: C.muted }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11.5, color: C.muted }}>{sub}</div>
    </div>
  );
}

/*  Insights (lógica preservada)  */
function insights({ dadosPadrao, projetadoM2, custoMedio, tendencia, prazoMedio }) {
  const out = [];
  if (dadosPadrao.length > 0) {
    out.push(
      <>O padrão <strong>{dadosPadrao[0].padrao}</strong> é o que apresenta o maior custo de execução histórico ({fmt(dadosPadrao[0].custoM2)}/m²).</>
    );
  }
  if (projetadoM2 > 0 && custoMedio > 0) {
    out.push(
      <>As obras em andamento estão com o custo {tendencia === "Alta" ? "acima" : tendencia === "Baixa" ? "abaixo" : "próximo"} da média histórica.{tendencia === "Alta" ? " Recomendamos revisar os gastos com materiais." : ""}</>
    );
  }
  if (prazoMedio > 0) {
    out.push(
      <>O prazo médio de entrega real é de <strong>{prazoMedio} dias</strong>. Utilize este valor nos cronogramas comerciais para alinhar expectativas.</>
    );
  } else {
    out.push(
      <>Não há dados suficientes de datas de início e fim para calcular o prazo médio de execução.</>
    );
  }
  out.push(
    <>Ao fechar orçamentos, considere os custos reais apresentados acima para proteger a margem de lucro da sua construtora.</>
  );
  return out;
}

/*  Botões  */
const btnBase = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px",
  borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer",
  fontFamily: "'Hanken Grotesk', sans-serif", border: "1px solid transparent",
};
const btnPrimary = { ...btnBase, background: C.red, color: "#fff" };
const btnGhost = { ...btnBase, background: C.surface, color: C.text, border: `1px solid ${C.border}` };
const btnLink = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
  borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
  fontFamily: "'Hanken Grotesk', sans-serif", background: C.brickSoft, color: C.red, border: "none",
};
