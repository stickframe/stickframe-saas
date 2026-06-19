import { useState, useRef } from "react";
import { C } from "../../utils/constants";
import { uploadLogoEmpresa, atualizarEmpresa } from "../../services/repositories/empresaRepository";
import { criarObra } from "../../services/repositories/obraRepository";
import useAppStore from "../../store/useAppStore";

const TOTAL_STEPS = 3;

function StepsBar({ step }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i < step ? C.red : i === step ? C.red + "66" : C.border,
            transition: "background .3s ease",
          }}
        />
      ))}
    </div>
  );
}

function StepLabel({ step }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center", marginBottom: 20, letterSpacing: 1, textTransform: "uppercase" }}>
      Passo {step + 1} de {TOTAL_STEPS}
    </div>
  );
}

function LabelF({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

//  Passo 1: Upload do logo 
function StepLogo({ onNext, onSkip }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Selecione uma imagem (PNG, JPG, SVG).");
      return;
    }
    setError("");
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  async function handleConfirm() {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const publicUrl = await uploadLogoEmpresa(file);
      await atualizarEmpresa({ logo_url: publicUrl });
      onNext();
    } catch (err) {
      setError(err?.message || "Erro ao fazer upload do logo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}></div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: C.text }}>
          Adicione o logo da sua empresa
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          O logo aparecerá em orçamentos, contratos e na calculadora enviada aos seus clientes.
        </p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${preview ? C.red : C.border}`,
          borderRadius: 12,
          padding: "28px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: preview ? C.red + "08" : C.bg,
          transition: "all .2s ease",
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview do logo"
            style={{ maxHeight: 100, maxWidth: "100%", objectFit: "contain", borderRadius: 6 }}
          />
        ) : (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}></div>
            <div style={{ fontSize: 13, color: C.muted }}>Clique para selecionar uma imagem</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>PNG, JPG ou SVG — recomendado fundo transparente</div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
      />

      {error && (
        <div style={{ fontSize: 12, color: C.danger, padding: "8px 12px", background: C.danger + "10", borderRadius: 8 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={onSkip}
          style={{
            padding: "10px 18px", background: "none", border: `1.5px solid ${C.border}`,
            borderRadius: 8, color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Pular
        </button>
        <button
          onClick={handleConfirm}
          disabled={!file || saving}
          style={{
            padding: "10px 20px", background: !file || saving ? C.border : C.red,
            color: !file || saving ? C.muted : "#fff", border: "none",
            borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: !file || saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "background .15s",
          }}
        >
          {saving ? "Salvando…" : "Próximo →"}
        </button>
      </div>
    </div>
  );
}

//  Passo 2: Cadastro de obra 
function StepObra({ onNext, onSkip }) {
  const addObra = useAppStore((s) => s.addObra);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!nome.trim()) { setError("O nome da obra é obrigatório."); return; }
    setSaving(true);
    setError("");
    try {
      await addObra({
        nome:      nome.trim(),
        status:    "Planejamento",
        fase:      "Projeto executivo",
        progresso: 0,
        ...(endereco.trim() ? { endereco: endereco.trim() } : {}),
      });
      onNext();
    } catch (err) {
      // Se o erro for de limite de plano, pula e segue
      if (err?.message?.startsWith("LIMITE_PLANO:")) {
        onNext();
        return;
      }
      setError(err?.message || "Erro ao cadastrar obra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}></div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: C.text }}>
          Cadastre sua primeira obra
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          Centralize cronograma, financeiro, diário e muito mais em um só lugar.
        </p>
      </div>

      <div>
        <LabelF required>Nome da obra</LabelF>
        <input
          value={nome}
          onChange={(e) => { setNome(e.target.value); setError(""); }}
          placeholder="Ex: Residência Silva — São Paulo/SP"
          style={{
            width: "100%", padding: "10px 12px", border: `1.5px solid ${error && !nome ? C.danger : C.border}`,
            borderRadius: 8, fontSize: 13, color: C.text, background: C.surface,
            fontFamily: "inherit", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      <div>
        <LabelF>Endereço (opcional)</LabelF>
        <input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Ex: Rua das Flores, 123 — Bairro, Cidade/UF"
          style={{
            width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`,
            borderRadius: 8, fontSize: 13, color: C.text, background: C.surface,
            fontFamily: "inherit", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: C.danger, padding: "8px 12px", background: C.danger + "10", borderRadius: 8 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={onSkip}
          style={{
            padding: "10px 18px", background: "none", border: `1.5px solid ${C.border}`,
            borderRadius: 8, color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Pular
        </button>
        <button
          onClick={handleConfirm}
          disabled={saving}
          style={{
            padding: "10px 20px", background: saving ? C.border : C.red,
            color: saving ? C.muted : "#fff", border: "none",
            borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "background .15s",
          }}
        >
          {saving ? "Salvando…" : "Próximo →"}
        </button>
      </div>
    </div>
  );
}

//  Passo 3: Conclusão 
function StepDone({ onComplete }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: 56 }}></div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>
        Tudo pronto!
      </h2>
      <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 340 }}>
        Sua conta está configurada. Explore o sistema, cadastre obras, gere orçamentos e muito mais.
      </p>
      <button
        onClick={onComplete}
        style={{
          padding: "14px 36px", background: C.red, color: "#fff",
          border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit", marginTop: 8,
          transition: "background .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = C.redDark)}
        onMouseLeave={(e) => (e.currentTarget.style.background = C.red)}
      >
        Começar →
      </button>
    </div>
  );
}

//  Componente principal 
export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0);

  async function finish() {
    try {
      await atualizarEmpresa({ onboarding_completo: true });
    } catch (_) { /* silencia: onComplete fecha o modal de qualquer forma */ }
    onComplete();
  }

  function next() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.60)",
        backdropFilter: "blur(3px)",
        zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: C.surface,
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          width: "100%",
          maxWidth: 480,
          padding: "36px 32px 32px",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* Steps bar */}
        <StepsBar step={step} />

        {/* Step label */}
        <StepLabel step={step} />

        {/* Step content */}
        {step === 0 && <StepLogo onNext={next} onSkip={next} />}
        {step === 1 && <StepObra onNext={next} onSkip={next} />}
        {step === 2 && <StepDone onComplete={finish} />}
      </div>
    </div>
  );
}
