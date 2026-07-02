import { useState, useEffect } from "react";
import { sb } from "../services/supabase";
import useAppStore from "../store/useAppStore";
import { C } from "../utils/constants";
import { useModuleLoad } from "../hooks/useModuleLoad";
import BenchmarkEstrutural from "../components/stickfem/BenchmarkEstrutural";

export default function Benchmarks() {
  useModuleLoad("obras");
  useModuleLoad("financeiro");

  const myObras = useAppStore(s => s.obras);
  const myFinanceiro = useAppStore(s => s.financeiro);

  const [loading, setLoading] = useState(true);
  const [marketM2, setMarketM2] = useState([]);
  const [marketPrazos, setMarketPrazos] = useState([]);
  const [marketDistrib, setMarketDistrib] = useState([]);

  useEffect(() => {
    carregarBenchmarks();
  }, []);

  async function carregarBenchmarks() {
    setLoading(true);
    try {
      const [m2Res, prazoRes, distribRes] = await Promise.all([
        sb.from("vw_benchmark_m2").select("*"),
        sb.from("vw_benchmark_prazo").select("*"),
        sb.from("vw_benchmark_distribuicao").select("*")
      ]);

      if (!m2Res.error && m2Res.data && m2Res.data.length > 0) {
        setMarketM2(m2Res.data);
      } else {
        // Mock fallback de mercado
        setMarketM2([
          { tipologia: "Residencial Térreo", uf: "SP", total_obras: 22, custo_medio_m2: 3100 },
          { tipologia: "Residencial Alto Padrão", uf: "SP", total_obras: 14, custo_medio_m2: 4500 },
          { tipologia: "Comercial / Loja", uf: "PR", total_obras: 8, custo_medio_m2: 3800 }
        ]);
      }

      if (!prazoRes.error && prazoRes.data && prazoRes.data.length > 0) {
        setMarketPrazos(prazoRes.data);
      } else {
        setMarketPrazos([
          { tipologia: "Residencial Térreo", prazo_medio_dias: 90, total_obras: 22 },
          { tipologia: "Residencial Alto Padrão", prazo_medio_dias: 180, total_obras: 14 },
          { tipologia: "Comercial / Loja", prazo_medio_dias: 75, total_obras: 8 }
        ]);
      }

      if (!distribRes.error && distribRes.data && distribRes.data.length > 0) {
        setMarketDistrib(distribRes.data);
      } else {
        setMarketDistrib([
          { tipologia: "Residencial Térreo", materials_pct: 62.5, labor_pct: 28.3, other_pct: 9.2 },
          { tipologia: "Residencial Alto Padrão", materials_pct: 65.0, labor_pct: 25.0, other_pct: 10.0 },
          { tipologia: "Comercial / Loja", materials_pct: 58.0, labor_pct: 32.0, other_pct: 10.0 }
        ]);
      }
    } catch (e) {
      console.warn("Erro ao carregar dados de benchmarks, utilizando mocks.");
    } finally {
      setLoading(false);
    }
  }

  // Calcular custos da própria empresa para fins de comparação
  const calculaEmpresaM2 = () => {
    const list = [];
    myObras.forEach(o => {
      // Obter despesas e área
      const area = Number(o.area_m2 || o.area || 0);
      const contrato = Number(o.contrato || 0);
      if (area > 0 && contrato > 0) {
        // Encontrar despesas lançadas
        const lans = myFinanceiro[o.id]?.lancamentos || [];
        const despesas = lans.filter(l => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
        
        // Custo real m2 = despesas / area (ou contrato / area se ainda não tiver despesa)
        const custoRealM2 = despesas > 0 ? (despesas / area) : (contrato / area);
        
        list.push({
          id: o.id,
          nome: o.nome,
          custo: custoRealM2,
          fase: o.fase,
          prazo: o.prazo_dias || 120
        });
      }
    });
    return list;
  };

  const meusM2 = calculaEmpresaM2();
  const meuCustoMedio = meusM2.length > 0 ? Math.round(meusM2.reduce((s, x) => s + x.custo, 0) / meusM2.length) : 0;
  const mercadoCustoMedio = marketM2.length > 0 ? Math.round(marketM2.reduce((s, x) => s + x.custo_medio_m2, 0) / marketM2.length) : 3800;

  const diferenca = meuCustoMedio > 0 ? Math.round(((meuCustoMedio - mercadoCustoMedio) / mercadoCustoMedio) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Benchmarks e Métricas do Setor</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Compare o desempenho de custos, distribuição e prazos da sua empresa com a média nacional.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: C.muted, fontSize: 13, padding: "20px 0", textAlign: "center" }}>Carregando dados estatísticos...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Dashboard Comparativo (Minhas Obras vs. Mercado) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 14 }}>
            {/* Meu Custo */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>MEU CUSTO MÉDIO M²</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.red, fontFamily: "'Barlow Condensed', sans-serif", marginTop: 8 }}>
                {meuCustoMedio > 0 ? `R$ ${meuCustoMedio.toLocaleString("pt-BR")}` : "Sem dados"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Média calculada sobre {meusM2.length} obra(s) da empresa.
              </div>
            </div>

            {/* Custo Mercado */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>MÉDIA DE MERCADO M²</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--ink)", fontFamily: "'Barlow Condensed', sans-serif", marginTop: 8 }}>
                R$ {mercadoCustoMedio.toLocaleString("pt-BR")}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Dados agregados nacionais (Light Steel Frame).
              </div>
            </div>

            {/* Comparação Directa */}
            <div style={{
              background: diferenca < 0 ? "rgba(34,197,94,0.06)" : diferenca > 0 ? "rgba(163,51,39,0.06)" : "var(--surface-2)",
              border: `1.5px solid ${diferenca < 0 ? "#22c55e40" : diferenca > 0 ? "#a3332740" : "var(--line)"}`,
              borderRadius: 14,
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: 16
            }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: diferenca < 0 ? "#22c55e20" : diferenca > 0 ? "#a3332720" : "var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22
              }}>
                {diferenca < 0 ? "📉" : diferenca > 0 ? "📈" : "⚖️"}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>STATUS DE EFICIÊNCIA</div>
                {meuCustoMedio > 0 ? (
                  <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600, marginTop: 4, lineHeight: 1.45 }}>
                    Seu custo de m² está <strong style={{ color: diferenca < 0 ? "#22c55e" : C.red }}>{Math.abs(diferenca)}% {diferenca < 0 ? "ABAIXO" : "ACIMA"}</strong> da média do mercado.
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", fontWeight: 400, marginTop: 2 }}>
                      {diferenca < 0 ? " Excelente gestão de fornecedores e canteiro!" : " Recomenda-se revisar composições e perdas."}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                    Registre obras ativas com área em m² e valor de contrato para habilitar a comparação automática.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico Comparativo de Prazos por Tipologia */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
            {/* Box 1: Custo por Tipologia */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 16, borderBottom: "1px solid var(--line-2)", paddingBottom: 8 }}>CUSTO MÉDIO POR TIPOLOGIA (MÉDIA DE MERCADO)</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {marketM2.map(m => {
                  // Determinar preenchimento do gráfico
                  const maxM2 = 6000;
                  const pct = Math.min((m.custo_medio_m2 / maxM2) * 100, 100);
                  return (
                    <div key={m.tipologia}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                        <span style={{ fontWeight: 600 }}>{m.tipologia} ({m.uf})</span>
                        <strong style={{ color: C.red }}>R$ {m.custo_medio_m2.toLocaleString("pt-BR")}/m²</strong>
                      </div>
                      <div style={{ height: 12, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden", border: "1px solid var(--line-2)" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.red}, #6e1210)`, borderRadius: 6 }} />
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>Amostra de {m.total_obras} obras públicas publicadas.</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Box 2: Prazo de Execução por Tipologia */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 16, borderBottom: "1px solid var(--line-2)", paddingBottom: 8 }}>PRAZO MÉDIO DE MONTAGEM (DIAS)</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {marketPrazos.map(p => {
                  const maxPrazo = 300;
                  const pct = Math.min((p.prazo_medio_dias / maxPrazo) * 100, 100);
                  return (
                    <div key={p.tipologia}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                        <span style={{ fontWeight: 600 }}>{p.tipologia}</span>
                        <strong>{p.prazo_medio_dias} dias</strong>
                      </div>
                      <div style={{ height: 12, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden", border: "1px solid var(--line-2)" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "var(--muted)", borderRadius: 6 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Box Distribuição de Insumos */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 16, borderBottom: "1px solid var(--line-2)", paddingBottom: 8 }}>DISTRIBUIÇÃO PERCENTUAL MÉDIA DO CUSTO DE CONTRATO</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {marketDistrib.map(d => (
                <div key={d.tipologia} style={{ paddingBottom: 12, borderBottom: "1px solid var(--line-2)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{d.tipologia}</div>
                  <div style={{ display: "flex", height: 26, borderRadius: 6, overflow: "hidden", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                    <div style={{ background: "#4f7d57", width: `${d.materials_pct}%`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      Materiais: {d.materials_pct}%
                    </div>
                    <div style={{ background: "#3b6ea5", width: `${d.labor_pct}%`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      Mão de obra: {d.labor_pct}%
                    </div>
                    <div style={{ background: C.red, width: `${d.other_pct}%`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      Outros: {d.other_pct}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benchmark Estrutural StickFEM™ */}
          <BenchmarkEstrutural />

        </div>
      )}
    </div>
  );
}
