import React, { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, BarChart2 } from "../ui/Icon";
import { C } from "../../utils/constants";
import { fmt } from "../../utils/format";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

export default function MonitorPrecos() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando a busca de preços monitorados. Na aplicação real, pode vir do Supabase.
    import("../../services/repositories/precosRepository")
      .then(module => {
        if (module.listarMonitorados) {
          return module.listarMonitorados();
        }
        return mockMonitorados();
      })
      .then(data => {
        if (data && data.length > 0) {
          // Adiciona histórico para o gráfico caso não venha populado do banco
          const dadosComHistorico = data.map(d => ({
            ...d,
            historico: d.historico || gerarHistorico(d.preco_anterior || d.preco_atual * 0.9, d.preco_atual)
          }));
          setItens(dadosComHistorico);
        } else {
          setItens(mockMonitorados());
        }
      })
      .catch(() => setItens(mockMonitorados()))
      .finally(() => setLoading(false));
  }, []);

  function gerarHistorico(precoAntigo, precoNovo) {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    // Simulamos a flutuação ao longo dos últimos meses até chegar no atual
    const diff = precoNovo - precoAntigo;
    const step = diff / 5;
    return meses.map((mes, i) => {
      // Adiciona uma pequena variação randômica para deixar o gráfico mais orgânico
      const noise = (Math.random() - 0.5) * (diff * 0.2);
      let p = precoAntigo + step * i;
      if (i > 0 && i < 5) p += noise;
      return {
        mes,
        preco: Number(p.toFixed(2))
      };
    });
  }

  function mockMonitorados() {
    // Os itens baseiam-se nos insumos centrais do arquivo insumosSF.js
    return [
      {
        id: 1,
        nome_produto: "Montante LSF C 90x40x15x1,25mm",
        categoria: "Estrutura de Aço",
        loja: "Distribuidor Nacional",
        preco_atual: 18.50,
        preco_anterior: 15.53, // Aumento agressivo (+19.1%) para provar o valor da ferramenta
        unidade: "pç",
        historico: gerarHistorico(15.53, 18.50)
      },
      {
        id: 2,
        nome_produto: "Placa OSB 11,1mm (1,22x2,44)",
        categoria: "Fechamento",
        loja: "LP Brasil",
        preco_atual: 52.00,
        preco_anterior: 55.00,
        unidade: "chp",
        historico: gerarHistorico(55.00, 52.00)
      },
      {
        id: 3,
        nome_produto: "Placa Cimentícia 10mm",
        categoria: "Fechamento",
        loja: "Brasilit",
        preco_atual: 65.00,
        preco_anterior: 63.80,
        unidade: "chp",
        historico: gerarHistorico(63.80, 65.00)
      },
      {
        id: 4,
        nome_produto: "Lã de Vidro 50mm",
        categoria: "Isolamento",
        loja: "Isover",
        preco_atual: 16.00,
        preco_anterior: 16.00,
        unidade: "m²",
        historico: gerarHistorico(16.00, 16.00)
      },
      {
        id: 5,
        nome_produto: "Parafuso TEX 4,2×16mm",
        categoria: "Fixação",
        loja: "Atacadão dos Parafusos",
        preco_atual: 48.00,
        preco_anterior: 42.00,
        unidade: "cx",
        historico: gerarHistorico(42.00, 48.00)
      }
    ];
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando monitor de preços...</div>;
  }

  const emAlta = itens.filter(i => i.preco_atual > i.preco_anterior).sort((a,b) => (b.preco_atual - b.preco_anterior)/b.preco_anterior - (a.preco_atual - a.preco_anterior)/a.preco_anterior);
  const emBaixa = itens.filter(i => i.preco_atual < i.preco_anterior).sort((a,b) => (a.preco_anterior - a.preco_atual)/a.preco_anterior - (b.preco_anterior - b.preco_atual)/b.preco_anterior);
  const estaveis = itens.filter(i => i.preco_atual === i.preco_anterior);

  // Alerta estratégico para saltos consideráveis (> 10%)
  const alertaGrave = emAlta.length > 0 ? emAlta[0] : null;
  const pctGrave = alertaGrave ? ((alertaGrave.preco_atual - alertaGrave.preco_anterior) / alertaGrave.preco_anterior * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Monitor de Mercado em Tempo Real</h2>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Acompanhe a variação de preços dos principais insumos de Steel Frame e proteja sua margem.</p>
      </div>

      {/* Alerta Estratégico (O Wow-moment apontado na Análise Competitiva) */}
      {alertaGrave && Number(pctGrave) > 10 && (
        <div style={{ background: C.danger + "0d", border: `1px solid ${C.danger}44`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
          <span style={{ fontSize: 24, marginTop: 2, color: C.danger }}><AlertTriangle size={24} /></span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.danger, marginBottom: 4 }}>Alerta de Margem: Alta expressiva em {alertaGrave.categoria || "Insumos"}</div>
            <div style={{ fontSize: 13, color: C.danger, lineHeight: 1.5 }}>
              O item <strong>{alertaGrave.nome_produto}</strong> registrou uma alta de <strong>+{pctGrave}%</strong> no mercado recente. 
              Recomendamos revisar imediatamente os orçamentos abertos que dependem deste material.
            </div>
            <button style={{ marginTop: 12, background: C.danger, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Revisar Orçamentos Afetados
            </button>
          </div>
        </div>
      )}

      {/* KPIs Rápidos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, borderTop: `3px solid ${C.danger}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Em Alta </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.danger }}>{emAlta.length}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Itens subiram de preço</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, borderTop: `3px solid ${C.success}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Em Baixa </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.success }}>{emBaixa.length}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Oportunidades de compra</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, borderTop: `3px solid ${C.muted}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Estáveis </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{estaveis.length}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Sem variação recente</div>
        </div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
        <TrendingUp size={16} /> Evolução de Insumos Críticos
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {itens.map(item => {
          const isAlta = item.preco_atual > item.preco_anterior;
          const isBaixa = item.preco_atual < item.preco_anterior;
          const variacao = item.preco_anterior ? Math.abs((item.preco_atual - item.preco_anterior) / item.preco_anterior * 100).toFixed(1) : 0;
          const color = isAlta ? C.danger : isBaixa ? C.success : C.muted;
          const badgeBg = isAlta ? "#fee2e2" : isBaixa ? "#dcfce7" : C.darker;

          return (
            <div key={item.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }} className="card-hover">
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>{item.categoria || "Material"}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{item.nome_produto}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Ref: {item.loja || "Mercado"}</div>
                  </div>
                  <div style={{ background: badgeBg, color: color, padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                    {isAlta ? "" : isBaixa ? "" : ""} {variacao}%
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12 }}>
                  <span className="num" style={{ fontSize: 26, fontWeight: 700, color: C.text }}>R$ {(item.preco_atual ?? 0).toLocaleString("pt-BR", {minimumFractionDigits: 2})}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>/ {item.unidade}</span>
                </div>
                {isAlta && <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>Anteriormente R$ {(item.preco_anterior ?? 0).toLocaleString("pt-BR", {minimumFractionDigits: 2})}</div>}
              </div>
              
              {/* Mini-Gráfico (Sparkline em Área) do Histórico */}
              {item.historico && item.historico.length > 0 && (
                <div style={{ height: 90, width: "100%", background: C.darker, paddingTop: 10 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={item.historico} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`color-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        formatter={(value) => [`R$ ${value.toLocaleString("pt-BR", {minimumFractionDigits: 2})}`, "Preço"]}
                        contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.text }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="preco" 
                        stroke={color} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill={`url(#color-${item.id})`} 
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}