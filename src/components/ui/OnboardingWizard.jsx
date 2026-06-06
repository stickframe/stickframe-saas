import { useState } from "react";
import { C } from "../../utils/constants";

const STEPS = [
  {
    icon: "🏗️",
    title: "Bem-vindo à StickFrame!",
    description: "Vamos configurar sua conta em 2 minutos. Siga os passos abaixo para aproveitar tudo que a plataforma oferece.",
    action: null,
  },
  {
    icon: "🖼️",
    title: "Logo da sua empresa",
    description: "Adicione o logo da sua empresa para personalizar orçamentos, contratos e a calculadora white-label enviada aos seus clientes.",
    action: { label: "Ir para Configurações", page: "configuracoes" },
  },
  {
    icon: "🏠",
    title: "Cadastre sua primeira obra",
    description: "Centralize o acompanhamento de cronograma, financeiro, diário de obra e muito mais. Seu plano atual permite até 2 obras.",
    action: { label: "Nova Obra", page: "obras", openModal: true },
  },
  {
    icon: "🔗",
    title: "Compartilhe sua calculadora",
    description: "Envie o link da calculadora white-label para seus clientes. Eles veem o nome e logo da sua empresa e os leads chegam diretamente para você.",
    action: { label: "Ir para Configurações", page: "configuracoes", anchor: "calculadora" },
  },
];

export default function OnboardingWizard({ userId, onClose, onNavigate }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function finish() {
    const key = `onboarding_done_${userId || "user"}`;
    localStorage.setItem(key, "1");
    onClose();
  }

  function handleAction() {
    if (current.action) {
      onNavigate(current.action.page);
    }
    if (isLast) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: C.surface,
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          width: "100%",
          maxWidth: 480,
          padding: "36px 32px 28px",
          position: "relative",
        }}
      >
        <button
          onClick={finish}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.muted,
            fontSize: 20,
            lineHeight: 1,
            padding: 4,
          }}
          aria-label="Fechar"
        >
          ×
        </button>

        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? C.red : C.border,
                transition: "background .3s ease",
              }}
            />
          ))}
        </div>

        <div style={{ fontSize: 40, marginBottom: 16, textAlign: "center" }}>
          {current.icon}
        </div>

        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: C.text,
            margin: "0 0 12px",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {current.title}
        </h2>

        <p
          style={{
            fontSize: 14,
            color: C.muted,
            textAlign: "center",
            lineHeight: 1.6,
            margin: "0 0 28px",
          }}
        >
          {current.description}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {current.action ? (
            <button
              onClick={handleAction}
              style={{
                padding: "12px 20px",
                background: C.red,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background .15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.redDark)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.red)}
            >
              {current.action.label}
            </button>
          ) : null}

          {!isLast ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{
                padding: "11px 20px",
                background: "transparent",
                color: C.red,
                border: `1.5px solid ${C.red}`,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {current.action ? "Pular este passo" : "Próximo"}
            </button>
          ) : (
            <button
              onClick={finish}
              style={{
                padding: "11px 20px",
                background: "transparent",
                color: C.muted,
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Concluir
            </button>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 20, marginBottom: 0 }}>
          Passo {step + 1} de {STEPS.length}
        </p>
      </div>
    </div>
  );
}
