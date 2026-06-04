import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import useAppStore from "../../store/useAppStore";

function fmtBRL(v) {
  const abs = Math.abs(v || 0);
  if (abs >= 1000000) return `R$ ${(v/1000000).toFixed(1)}M`;
  if (abs >= 1000) return `R$ ${(v/1000).toFixed(0)}k`;
  return `R$ ${(v||0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

export function FluxoCaixa({ obraId }) {
  const financeiro = useAppStore(s => s.financeiro);

  let lancamentos = [];
  if (obraId) {
    lancamentos = financeiro?.[obraId]?.lancamentos || [];
  } else {
    Object.values(financeiro || {}).forEach(f => {
      if (f?.lancamentos) lancamentos = [...lancamentos, ...f.lancamentos];
    });
  }

  const dados = useMemo(() => {
    const meses = {};
    lancamentos.forEach(l => {
      const mes = (l.data || "").substring(0, 7);
      if (!mes) return;
      if (!meses[mes]) meses[mes] = { mes, entradas: 0, saidas: 0 };
      if (l.tipo === "receita") meses[mes].entradas += (l.valor || 0);
      else meses[mes].saidas += (l.valor || 0);
    });
    return Object.values(meses)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map(m => ({ ...m, saldo: m.entradas - m.saidas }));
  }, [lancamentos]);

  // Running balance
  let acumulado = 0;
  const dadosComAcum = dados.map(d => {
    acumulado += d.saldo;
    return { ...d, acumulado };
  });

  const saldoAtual = dadosComAcum[dadosComAcum.length - 1]?.acumulado || 0;
  const totalEntradas = dados.reduce((a, d) => a + d.entradas, 0);
  const totalSaidas = dados.reduce((a, d) => a + d.saidas, 0);

  if (dados.length === 0) return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
      <p style={{ fontSize: 32, margin: "0 0 8px" }}>💸</p>
      <p>Nenhum lançamento encontrado para gerar o fluxo de caixa.</p>
    </div>
  );

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>💸 Fluxo de Caixa</h3>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Total entradas", valor: totalEntradas, color: "#22c55e" },
            { label: "Total saídas", valor: totalSaidas, color: "#ef4444" },
            { label: "Saldo acumulado", valor: saldoAtual, color: saldoAtual >= 0 ? "#22c55e" : "#ef4444" },
          ].map(({ label, valor, color }) => (
            <div key={label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color }}>{fmtBRL(valor)}</div>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={dadosComAcum} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={fmtBRL} tick={{ fontSize: 10 }} width={72} />
          <Tooltip formatter={(v, n) => [fmtBRL(v), n]} />
          <Legend />
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={2} />
          <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4,4,0,0]} />
          <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Monthly table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            {["Mês","Entradas","Saídas","Saldo","Acumulado"].map(h => (
              <th key={h} style={{ padding: "7px 10px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", textAlign: h === "Mês" ? "left" : "right" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dadosComAcum.map((d, i) => (
            <tr key={d.mes} style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "var(--bg-hover)" : "transparent" }}>
              <td style={{ padding: "7px 10px", fontSize: 13 }}>{d.mes}</td>
              <td style={{ padding: "7px 10px", fontSize: 13, textAlign: "right", color: "#22c55e" }}>{fmtBRL(d.entradas)}</td>
              <td style={{ padding: "7px 10px", fontSize: 13, textAlign: "right", color: "#ef4444" }}>{fmtBRL(d.saidas)}</td>
              <td style={{ padding: "7px 10px", fontSize: 13, textAlign: "right", fontWeight: 600, color: d.saldo >= 0 ? "#22c55e" : "#ef4444" }}>{fmtBRL(d.saldo)}</td>
              <td style={{ padding: "7px 10px", fontSize: 13, textAlign: "right", fontWeight: 700, color: d.acumulado >= 0 ? "#22c55e" : "#ef4444" }}>{fmtBRL(d.acumulado)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
