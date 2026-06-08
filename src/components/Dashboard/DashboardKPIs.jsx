import React from "react";
import { fmtBRL, fmtPct } from "../../utils/format";
import { C } from "../../utils/constants";

export default function DashboardKPIs() {
  const kpis = [
    {
      id: 1,
      label: "Obras Ativas",
      valor: 12,
      sub: "de 27 total",
      cor: C.red,
      icon: "◆"
    },
    {
      id: 2,
      label: "Orçamentos (Pipeline)",
      valor: fmtBRL(6200000),
      sub: "18 aguardando",
      cor: C.warning,
      icon: "◻"
    },
    {
      id: 3,
      label: "Margem Média",
      valor: fmtPct(23.4),
      sub: "Saldo R$ 1,1M",
      cor: C.success,
      icon: "%"
    },
    {
      id: 4,
      label: "Conversão CRM",
      valor: fmtPct(32),
      sub: "12 fechados",
      cor: C.steel,
      icon: "◈"
    }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
      {kpis.map((kpi) => (
        <div key={kpi.id} className="sf-card card-hover" style={{ borderTop: `3px solid ${kpi.cor}` }}>
          <div className="sf-row-between" style={{ marginBottom: 12 }}>
            <span className="sf-label" style={{ marginBottom: 0 }}>{kpi.label}</span>
            <span style={{ color: kpi.cor, fontSize: 16 }}>{kpi.icon}</span>
          </div>
          
          {/* A classe "num" garante a fonte Barlow Condensed */}
          <div className="num" style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>
            {kpi.valor}
          </div>
          
          <div className="sf-muted-sm" style={{ marginTop: 8 }}>
            {kpi.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
