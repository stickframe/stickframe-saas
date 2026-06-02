import { useMemo } from "react";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

export default function Inteligencia() {
  useModuleLoad("obras");
  useModuleLoad("financeiro");

  const obras = useAppStore((s) => s.obras);
  const financeiro = useAppStore((s) => s.financeiro);

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
      if (projM2 > cm * 1.05) tend = "Alta 📈";
      else if (projM2 < cm * 0.95) tend = "Baixa 📉";
    }

    return { custoMedio: cm, dadosPadrao: dp, prazoMedio: pm, tendencia: tend, obrasAnalisadas: concluidas.length, projetadoM2: projM2 };
  }, [obras, financeiro]);

  if (obrasAnalisadas === 0 && projetadoM2 === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Inteligência de Dados</div>
        <div style={{ fontSize: 13, color: C.muted, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          O módulo de inteligência cruza os dados do <strong>Financeiro</strong> com o progresso das <strong>Obras</strong>.<br /><br />
          Conclua ao menos uma obra ou registre despesas em uma obra em andamento para visualizar o custo histórico real e projeções de mercado.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Inteligência & Dados</h2>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Histórico e projeções baseadas no custo real de execução</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.red}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 8 }}>CUSTO HISTÓRICO GERAL</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>
            {custoMedio > 0 ? fmt(custoMedio) : "—"}
            {custoMedio > 0 && <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>/m²</span>}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            Média real de {obrasAnalisadas} obra{obrasAnalisadas !== 1 ? "s" : ""} concluída{obrasAnalisadas !== 1 ? "s" : ""}
          </div>
        </div>

        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, borderTop: `3px solid #4a9eff` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 8 }}>CUSTO PROJETADO (EM ANDAMENTO)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#4a9eff" }}>
            {projetadoM2 > 0 ? fmt(projetadoM2) : "—"}
            {projetadoM2 > 0 && <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>/m²</span>}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Projeção atual com base no progresso físico</div>
        </div>

        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, borderTop: `3px solid ${tendencia.includes("Alta") ? C.danger : tendencia.includes("Baixa") ? C.success : C.muted}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 8 }}>TENDÊNCIA DE CUSTO</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: tendencia.includes("Alta") ? C.danger : tendencia.includes("Baixa") ? C.success : C.text }}>{tendencia}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Obras atuais vs Histórico consolidado</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>CUSTO HISTÓRICO POR PADRÃO</div>
          {dadosPadrao.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 12, fontStyle: "italic" }}>Aguardando obras concluídas...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dadosPadrao.map((d, i) => {
                const pct = (d.custoM2 / dadosPadrao[0].custoM2) * 100;
                return (
                  <div key={d.padrao}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{d.padrao} <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>({d.count} obra{d.count !== 1 ? "s" : ""})</span></span>
                      <span style={{ fontWeight: 700 }}>{fmt(d.custoM2)}/m²</span>
                    </div>
                    <div style={{ height: 8, background: C.dark, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? C.red : "#ff6b6b", borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>INSIGHTS GERADOS PELA IA</div>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 14, color: C.text, fontSize: 13, lineHeight: 1.6 }}>
            {dadosPadrao.length > 0 && (
              <li>O padrão <strong>{dadosPadrao[0].padrao}</strong> é o que apresenta o maior custo de execução histórico ({fmt(dadosPadrao[0].custoM2)}/m²).</li>
            )}
            {projetadoM2 > 0 && custoMedio > 0 && (
              <li>As obras em andamento estão com o custo {tendencia.includes("Alta") ? "acima" : tendencia.includes("Baixa") ? "abaixo" : "próximo"} da média histórica.{tendencia.includes("Alta") ? " Recomendamos revisar os gastos com materiais." : ""}</li>
            )}
            {prazoMedio > 0 ? (
              <li>O prazo médio de entrega real é de <strong>{prazoMedio} dias</strong>. Utilize este valor nos cronogramas comerciais para alinhar expectativas.</li>
            ) : (
              <li>Não há dados suficientes de datas de início e fim para calcular o prazo médio de execução.</li>
            )}
            <li>Ao fechar orçamentos, considere os custos reais apresentados acima para proteger a margem de lucro da sua construtora.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
