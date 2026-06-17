import useAppStore from "../../store/useAppStore";

function fmtBRL(v) {
  const abs = Math.abs(v || 0);
  const str = abs.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  return `${v < 0 ? "-" : ""}R$ ${str}`;
}

export function DRE({ obraId }) {
  const financeiro = useAppStore(s => s.financeiro);

  // Get lancamentos — either for specific obra or all
  let lancamentos = [];
  if (obraId) {
    lancamentos = financeiro?.[obraId]?.lancamentos || [];
  } else {
    Object.values(financeiro || {}).forEach(f => {
      if (f?.lancamentos) lancamentos = [...lancamentos, ...f.lancamentos];
    });
  }

  const receitas = lancamentos.filter(l => l.tipo === "receita");
  const despesas = lancamentos.filter(l => l.tipo === "despesa");

  // Group despesas by categoria
  const categorias = {};
  despesas.forEach(d => {
    const cat = d.categoria || "Outros";
    if (!categorias[cat]) categorias[cat] = 0;
    categorias[cat] += (d.valor || 0);
  });

  const totalReceitas = receitas.reduce((a, l) => a + (l.valor || 0), 0);
  const totalDespesas = despesas.reduce((a, l) => a + (l.valor || 0), 0);
  const lucroOperacional = totalReceitas - totalDespesas;
  const margem = totalReceitas > 0 ? (lucroOperacional / totalReceitas) * 100 : 0;

  const Row = ({ label, valor, bold, indent, color }) => (
    <tr>
      <td style={{ padding: "8px 12px", fontSize: 13, paddingLeft: indent ? 28 : 12, fontWeight: bold ? 700 : 400 }}>{label}</td>
      <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", fontWeight: bold ? 700 : 400, color: color || "inherit" }}>
        {fmtBRL(valor)}
      </td>
      <td style={{ padding: "8px 12px", fontSize: 12, textAlign: "right", color: "var(--text-muted)" }}>
        {totalReceitas > 0 ? `${((valor / totalReceitas) * 100).toFixed(1)}%` : "—"}
      </td>
    </tr>
  );

  const Separator = ({ label }) => (
    <tr style={{ background: "var(--bg-hover)" }}>
      <td colSpan={3} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{label}</td>
    </tr>
  );

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}> DRE — Demonstrativo de Resultado</h3>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Resultado</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: lucroOperacional >= 0 ? "#22c55e" : "#ef4444" }}>{fmtBRL(lucroOperacional)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Margem</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: margem >= 0 ? "#22c55e" : "#ef4444" }}>{margem.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Item</th>
            <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Valor</th>
            <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>% Receita</th>
          </tr>
        </thead>
        <tbody>
          <Separator label="Receitas" />
          <Row label="Receita bruta" valor={totalReceitas} color="#22c55e" />
          <Row label="(–) Total de deduções" valor={0} indent />
          <Row label="Receita líquida" valor={totalReceitas} bold color="#22c55e" />

          <Separator label="Custos e Despesas" />
          {Object.entries(categorias).map(([cat, val]) => (
            <Row key={cat} label={cat} valor={val} indent color="#ef4444" />
          ))}
          <Row label="Total de despesas" valor={totalDespesas} bold color="#ef4444" />

          <Separator label="Resultado" />
          <Row label="Lucro / Prejuízo Operacional" valor={lucroOperacional} bold color={lucroOperacional >= 0 ? "#22c55e" : "#ef4444"} />
          <tr style={{ borderTop: "2px solid var(--border)", background: lucroOperacional >= 0 ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)" }}>
            <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 14 }}>Margem líquida</td>
            <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, fontSize: 14, color: margem >= 0 ? "#22c55e" : "#ef4444" }}>{margem.toFixed(2)}%</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
