/**
 * Benchmark Estrutural StickFEM™ — seção do Benchmarks (StickPulse™).
 * Compara os projetos analisados pelo StickFEM (kg aço/m², custo/m², prazo)
 * com a referência de mercado. Dados privados por empresa (RLS); referência
 * pública/anonimizada.
 */
import { useEffect, useState } from "react";
import { carregarBenchmarkEstrutural, statusVsRef } from "../../services/stickfem/benchmark";
import { C } from "../../utils/constants";

const fmtR = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function CardIndicador({ titulo, meu, mercado, unidade, status }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 22px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>{titulo}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Seu projeto</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.red, fontFamily: "'Barlow Condensed', sans-serif" }}>
            {meu ?? "—"}{meu != null && unidade ? <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 3 }}>{unidade}</span> : null}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Mercado</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {mercado ?? "—"}{mercado != null && unidade ? <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 3 }}>{unidade}</span> : null}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: status.cor }}>
        {status.emoji} {status.label}
      </div>
    </div>
  );
}

export default function BenchmarkEstrutural() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    carregarBenchmarkEstrutural().then(setDados).catch(() => setDados({ itens: [], referencia: [] }));
  }, []);

  if (!dados) return null;
  const { itens, referencia } = dados;
  const ultimo = itens[0] || null;
  const ref = ultimo
    ? referencia.find((r) => r.tipologia === ultimo.tipologia) || referencia[0]
    : referencia[0];

  const stAco   = statusVsRef(ultimo?.kg_aco_m2, ref?.media_kg_aco_m2);
  const stCusto = statusVsRef(ultimo?.custo_m2, ref?.media_custo_m2);
  const stPrazo = statusVsRef(ultimo?.prazo_estimado, ref?.media_prazo);

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4, borderBottom: "1px solid var(--line-2)", paddingBottom: 8 }}>
        BENCHMARK ESTRUTURAL STICKFEM™
        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, background: "#6d557e", color: "#fff", borderRadius: 5, padding: "2px 7px", verticalAlign: "middle" }}>🟣 ENGENHARIA</span>
      </h3>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 14px" }}>
        Indicadores dos projetos analisados pelo StickFEM™ (DXF → estrutura → quantitativo) comparados à média do setor.
      </p>

      {!ultimo ? (
        <div style={{ background: "var(--surface-2)", border: "1px dashed var(--line)", borderRadius: 12, padding: "18px 22px", fontSize: 13, color: "var(--muted)" }}>
          Nenhum projeto analisado ainda. Gere um <b>orçamento estrutural no StickFEM™</b> (informando a área construída)
          para alimentar o benchmark automaticamente.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <CardIndicador titulo="Consumo de aço"
              meu={ultimo.kg_aco_m2 ?? null} mercado={ref?.media_kg_aco_m2 ?? null} unidade="kg/m²" status={stAco} />
            <CardIndicador titulo="Custo estrutural"
              meu={ultimo.custo_m2 ? fmtR(ultimo.custo_m2) : null} mercado={ref?.media_custo_m2 ? fmtR(ref.media_custo_m2) : null}
              unidade="/m²" status={stCusto} />
            <CardIndicador titulo="Prazo de montagem"
              meu={ultimo.prazo_estimado ?? null} mercado={ref?.media_prazo ?? null} unidade="dias" status={stPrazo} />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
            Último projeto: {ultimo.tipologia || "—"} · {ultimo.area_m2 ? `${ultimo.area_m2} m² · ` : ""}
            {ultimo.peso_aco_total ? `${Math.round(ultimo.peso_aco_total)} kg de aço · ` : ""}
            {itens.length} projeto(s) no histórico · referência: {ref?.quantidade_amostras || 0} amostras ({ref?.regiao || "Nacional"}).
          </div>
        </>
      )}
    </div>
  );
}
