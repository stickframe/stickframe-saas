import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { C } from "../../utils/constants";

/** Evolução mensal: leads · vendas · receita (handoff §8). */
export default function MonthlyEvolution({ evolucao }) {
  const dados = (Array.isArray(evolucao) ? evolucao : []).map((m) => ({
    mes: (m.mes || "").slice(5),
    Leads: Number(m.leads) || 0,
    Vendas: Number(m.vendas) || 0,
    Receita: Math.round((Number(m.receita) || 0) / 1000), // em milhares
  }));

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: 19, color: C.text }}>Evolução mensal</div>
      <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 14 }}>Leads · vendas · receita (R$ mil)</div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={dados} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.border }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Leads" stroke={C.steel} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Vendas" stroke={C.success} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Receita" stroke={C.red} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
