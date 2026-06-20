import React from "react";

const STEPS = [
  { label: "Calculadora",  sub: "Estimativa de custo" },
  { label: "Orçamento",    sub: "Proposta formal" },
  { label: "Proposta",     sub: "Aceite do cliente" },
];

export default function FluxoOrcamentoStepper({ step, onGo }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: "#faf8f4", border: "1px solid #e7e1d8",
      borderRadius: 12, padding: "10px 20px", marginBottom: 24,
    }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <div
            onClick={() => onGo && i < step && onGo(i)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "6px 16px",
              cursor: onGo && i < step ? "pointer" : "default",
              opacity: i > step ? 0.4 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: i < step ? "#3f7a4b" : i === step ? "#981915" : "#e7e1d8",
                color: i <= step ? "#fff" : "#8c847a",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800,
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 13, fontWeight: i === step ? 800 : 600,
                color: i === step ? "#981915" : i < step ? "#3f7a4b" : "#8c847a",
              }}>
                {s.label}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "#8c847a", marginTop: 2, paddingLeft: 29 }}>{s.sub}</div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < step ? "#3f7a4b55" : "#e7e1d8", minWidth: 20 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
