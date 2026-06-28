import { C } from "../../utils/constants";
import { useTrial } from "../../hooks/useTrial";

export default function TrialProgress({ activationPct, activationSteps }) {
  const { isTrial, daysLeft } = useTrial();
  if (!isTrial) return null;

  const steps = activationSteps || [
    { key: "empresa", label: "Empresa", done: false },
    { key: "cliente", label: "Cliente", done: false },
    { key: "orcamento", label: "Orçamento", done: false },
    { key: "obra", label: "Obra", done: false },
    { key: "brain", label: "StickBrain", done: false },
  ];
  const doneSteps = steps.filter((s) => s.done).length;

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a1a 0%, #26231f 100%)",
      borderRadius: 14, padding: "18px 20px", marginBottom: 16,
      border: "1px solid rgba(255,255,255,.08)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "rgba(255,255,255,.5)", textTransform: "uppercase" }}>
            Período de Trial
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1.1, marginTop: 2 }}>
            {daysLeft > 0 ? `${daysLeft} dias restantes` : "Último dia"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: activationPct >= 80 ? "#4ade80" : activationPct >= 40 ? "#fbbf24" : "#f87171", fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1 }}>
            {activationPct}%
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 1 }}>ativo</div>
        </div>
      </div>

      <div style={{ height: 6, background: "rgba(255,255,255,.1)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: 6, width: `${Math.min(activationPct, 100)}%`, background: "linear-gradient(90deg, #fbbf24, #4ade80)", borderRadius: 3, transition: "width .5s ease" }} />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {steps.map((step) => {
          const isDone = step.done;
          return (
            <div key={step.key} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 6,
              background: isDone ? "rgba(74,222,128,.15)" : "rgba(255,255,255,.05)",
              fontSize: 11, fontWeight: 600,
              color: isDone ? "#4ade80" : "rgba(255,255,255,.4)",
            }}>
              <span style={{ fontSize: 12 }}>{isDone ? "✓" : "○"}</span>
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
