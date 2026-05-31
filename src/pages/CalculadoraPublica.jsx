import { useState } from "react";
import { sb } from "../services/supabase";

// Pricing constants
const STEEL_FRAME = { "Econômico": 2800, "Padrão": 3500, "Alto Padrão": 5200 };
const ALVENARIA   = { "Econômico": 2200, "Padrão": 2900, "Alto Padrão": 4200 };
const PAVIMENTOS  = { "Térreo": 1, "2 pavimentos": 1.85, "3 pavimentos": 2.65 };

const PRAZOS_SF = { "Econômico": "4–6 meses", "Padrão": "5–7 meses", "Alto Padrão": "6–9 meses" };

const PADROES = [
  {
    key: "Econômico",
    title: "Econômico",
    desc: "Acabamentos básicos, funcional e acessível",
  },
  {
    key: "Padrão",
    title: "Padrão",
    desc: "Bom acabamento, equilíbrio custo-benefício",
  },
  {
    key: "Alto Padrão",
    title: "Alto Padrão",
    desc: "Acabamentos premium, materiais superiores",
  },
];

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function applyPhoneMask(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  return value;
}

export default function CalculadoraPublica() {
  // Step: "form" | "result" | "success"
  const [step, setStep] = useState("form");

  // Form values
  const [area, setArea] = useState(120);
  const [pavimentos, setPavimentos] = useState("Térreo");
  const [padrao, setPadrao] = useState("Padrão");
  const [cidade, setCidade] = useState("");

  // Results
  const [sfMin, setSfMin] = useState(0);
  const [sfMax, setSfMax] = useState(0);
  const [alMin, setAlMin] = useState(0);
  const [alMax, setAlMax] = useState(0);
  const [sfMidValue, setSfMidValue] = useState(0);

  // Contact
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  function handleCalculate(e) {
    e.preventDefault();
    const areaTotal = area * PAVIMENTOS[pavimentos];
    const sfValor = areaTotal * STEEL_FRAME[padrao];
    const alValor = areaTotal * ALVENARIA[padrao];
    setSfMin(Math.round(sfValor * 0.92));
    setSfMax(Math.round(sfValor * 1.12));
    setAlMin(Math.round(alValor * 0.92));
    setAlMax(Math.round(alValor * 1.12));
    setSfMidValue(Math.round(sfValor));
    setStep("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleContact(e) {
    e.preventDefault();
    setSendError("");
    setSending(true);
    try {
      const sfValor = area * PAVIMENTOS[pavimentos] * STEEL_FRAME[padrao];
      const { error } = await sb.rpc("captar_lead_publico", {
        p_nome: nome,
        p_contato: whatsapp,
        p_email: email || null,
        p_cidade: cidade || null,
        p_area: area,
        p_padrao: padrao,
        p_valor_estimado: sfMidValue,
        p_origem: "Calculadora",
        p_pavimentos: pavimentos,
        p_valor_min: Math.round(sfValor * 0.92),
        p_valor_max: Math.round(sfValor * 1.12),
      });
      if (error) throw error;

      // Open WhatsApp notification to empresa owner
      try {
        const msg = `🔔 *Novo lead via Calculadora!*\n\n👤 *${nome}*\n📱 ${whatsapp}\n📍 ${cidade || "—"}\n\n🏗️ *Projeto:*\n• Área: ${area}m² · ${pavimentos}\n• Padrão: ${padrao}\n• Estimativa: R$ ${Math.round(sfValor * 0.92).toLocaleString("pt-BR")} – R$ ${Math.round(sfValor * 1.12).toLocaleString("pt-BR")}\n\nAcesse o sistema para responder: https://stickframe.com.br`;
        const { data: waNum } = await sb.rpc("get_empresa_whatsapp_alertas");
        const numLimpo = (waNum || "").replace(/\D/g, "");
        if (numLimpo) {
          window.open(`https://wa.me/${numLimpo.startsWith("55") ? numLimpo : "55" + numLimpo}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      } catch (_) { /* WhatsApp notification is non-critical */ }

      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSendError("Erro ao enviar. Tente novamente.");
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function handleReset() {
    setArea(120);
    setPavimentos("Térreo");
    setPadrao("Padrão");
    setCidade("");
    setNome("");
    setWhatsapp("");
    setSendError("");
    setStep("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Speedup comparison
  const alMid = (alMin + alMax) / 2;
  const sfMid = (sfMin + sfMax) / 2;
  const speedPct = alMid > 0 ? Math.round(((alMid - sfMid) / alMid) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .calc-root *, .calc-root *::before, .calc-root *::after { box-sizing: border-box; }
        .calc-root {
          font-family: 'DM Sans', sans-serif;
          background: #f4f4f4;
          min-height: 100vh;
          color: #1A1A1A;
        }
        .calc-header {
          background: #1A1A1A;
          padding: 16px 20px;
          text-align: center;
        }
        .calc-logo {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 2px;
        }
        .calc-logo span { color: #981915; }
        .calc-body {
          max-width: 560px;
          margin: 0 auto;
          padding: 24px 16px 48px;
        }
        .calc-card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          margin-bottom: 16px;
        }
        .calc-title {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .calc-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0 0 24px;
        }
        .calc-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #333;
        }
        .calc-input {
          width: 100%;
          border: 1.5px solid #ddd;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color .15s;
          margin-bottom: 16px;
        }
        .calc-input:focus { border-color: #981915; }
        .calc-select {
          width: 100%;
          border: 1.5px solid #ddd;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          background: #fff;
          cursor: pointer;
          transition: border-color .15s;
          margin-bottom: 16px;
        }
        .calc-select:focus { border-color: #981915; }
        .padrao-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }
        .padrao-card {
          border: 2px solid #ddd;
          border-radius: 10px;
          padding: 10px 8px;
          cursor: pointer;
          text-align: center;
          transition: border-color .15s, background .15s;
          user-select: none;
        }
        .padrao-card.selected {
          border-color: #981915;
          background: #fff5f5;
        }
        .padrao-card-title {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .padrao-card-desc {
          font-size: 11px;
          color: #666;
          line-height: 1.4;
        }
        .calc-btn {
          width: 100%;
          background: #981915;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background .15s;
        }
        .calc-btn:hover { background: #7a1210; }
        .calc-btn:disabled { background: #ccc; cursor: not-allowed; }
        .result-headline {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 20px;
          text-align: center;
        }
        .result-card {
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 12px;
        }
        .result-card.sf {
          border: 2px solid #981915;
          background: #fff;
        }
        .result-card.al {
          border: 2px solid #ddd;
          background: #fafafa;
        }
        .result-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .result-card-name {
          font-size: 15px;
          font-weight: 700;
        }
        .result-badge {
          background: #981915;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .result-faixa-label {
          font-size: 12px;
          color: #888;
          margin-bottom: 2px;
        }
        .result-faixa {
          font-size: 20px;
          font-weight: 700;
          color: #1A1A1A;
          margin-bottom: 8px;
        }
        .result-prazo {
          font-size: 13px;
          color: #555;
          margin-bottom: 10px;
        }
        .result-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .result-tag {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          color: #444;
        }
        .result-tag.green { background: #e8f5e9; color: #2e7d32; }
        .comparison-note {
          text-align: center;
          font-size: 13px;
          color: #666;
          margin: 4px 0 20px;
          padding: 10px;
          background: #fff8e1;
          border-radius: 8px;
        }
        .cta-heading {
          font-size: 17px;
          font-weight: 700;
          margin: 0 0 6px;
        }
        .cta-sub {
          font-size: 13px;
          color: #666;
          margin: 0 0 20px;
        }
        .error-msg {
          color: #c0392b;
          font-size: 13px;
          margin-bottom: 10px;
        }
        .success-icon {
          font-size: 48px;
          text-align: center;
          margin-bottom: 12px;
        }
        .success-title {
          font-size: 22px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 8px;
        }
        .success-msg {
          font-size: 15px;
          color: #555;
          text-align: center;
          margin-bottom: 28px;
          line-height: 1.6;
        }
        .btn-outline {
          width: 100%;
          background: transparent;
          color: #981915;
          border: 2px solid #981915;
          border-radius: 8px;
          padding: 13px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background .15s, color .15s;
        }
        .btn-outline:hover { background: #981915; color: #fff; }
        .divider { height: 1px; background: #eee; margin: 20px 0; }
        .back-link {
          display: inline-block;
          font-size: 13px;
          color: #981915;
          cursor: pointer;
          margin-bottom: 16px;
          text-decoration: none;
          font-weight: 500;
        }
        .back-link:hover { text-decoration: underline; }
      `}</style>

      <div className="calc-root">
        <header className="calc-header">
          <div className="calc-logo">STICK<span>FRAME</span></div>
        </header>

        <div className="calc-body">

          {/* ============ STEP: FORM ============ */}
          {step === "form" && (
            <div className="calc-card">
              <h1 className="calc-title">Calcule o custo da sua obra</h1>
              <p className="calc-subtitle">Compare Steel Frame vs Alvenaria em segundos</p>

              <form onSubmit={handleCalculate}>
                <label className="calc-label">Área construída (m²)</label>
                <input
                  className="calc-input"
                  type="number"
                  min={40}
                  max={2000}
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  required
                />

                <label className="calc-label">Pavimentos</label>
                <select
                  className="calc-select"
                  value={pavimentos}
                  onChange={(e) => setPavimentos(e.target.value)}
                >
                  <option>Térreo</option>
                  <option>2 pavimentos</option>
                  <option>3 pavimentos</option>
                </select>

                <label className="calc-label">Padrão de acabamento</label>
                <div className="padrao-grid">
                  {PADROES.map((p) => (
                    <div
                      key={p.key}
                      className={`padrao-card${padrao === p.key ? " selected" : ""}`}
                      onClick={() => setPadrao(p.key)}
                    >
                      <div className="padrao-card-title">{p.title}</div>
                      <div className="padrao-card-desc">{p.desc}</div>
                    </div>
                  ))}
                </div>

                <label className="calc-label">Cidade</label>
                <input
                  className="calc-input"
                  type="text"
                  placeholder="Ex: São Paulo – SP"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />

                <button className="calc-btn" type="submit">
                  Calcular agora →
                </button>
              </form>
            </div>
          )}

          {/* ============ STEP: RESULT ============ */}
          {step === "result" && (
            <>
              <span className="back-link" onClick={handleReset}>← Nova simulação</span>

              <div className="calc-card">
                <p className="result-headline">Sua estimativa está pronta!</p>

                {/* Steel Frame */}
                <div className="result-card sf">
                  <div className="result-card-header">
                    <span className="result-card-name">Steel Frame</span>
                    <span className="result-badge">Recomendado</span>
                  </div>
                  <div className="result-faixa-label">Faixa de investimento</div>
                  <div className="result-faixa">{formatBRL(sfMin)} – {formatBRL(sfMax)}</div>
                  <div className="result-prazo">Prazo médio: {PRAZOS_SF[padrao]}</div>
                  <div className="result-tags">
                    <span className="result-tag green">✓ Mais leve</span>
                    <span className="result-tag green">✓ Menos resíduos</span>
                    <span className="result-tag green">✓ Alta precisão</span>
                  </div>
                </div>

                {/* Alvenaria */}
                <div className="result-card al">
                  <div className="result-card-header">
                    <span className="result-card-name">Alvenaria Convencional</span>
                  </div>
                  <div className="result-faixa-label">Faixa de investimento</div>
                  <div className="result-faixa">{formatBRL(alMin)} – {formatBRL(alMax)}</div>
                  <div className="result-prazo">Prazo médio: 8–14 meses</div>
                  <div className="result-tags">
                    <span className="result-tag">• Método convencional</span>
                  </div>
                </div>

                {speedPct > 0 && (
                  <div className="comparison-note">
                    ⚡ Steel Frame pode ser até <strong>{speedPct}% mais rápido</strong> que a alvenaria convencional
                  </div>
                )}

                <div className="divider" />

                <div className="cta-heading">Quer uma proposta detalhada e sem compromisso?</div>
                <p className="cta-sub">Preencha abaixo e nossa equipe entra em contato em até 24h.</p>

                <form onSubmit={handleContact}>
                  <label className="calc-label">Nome completo</label>
                  <input
                    className="calc-input"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />

                  <label className="calc-label">WhatsApp</label>
                  <input
                    className="calc-input"
                    type="tel"
                    placeholder="Ex: (11) 99999-9999 ou +1 555 000-0000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                  />

                  <label className="calc-label">E-mail <span style={{color:"#888",fontWeight:400}}>(opcional)</span></label>
                  <input
                    className="calc-input"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  {sendError && <p className="error-msg">{sendError}</p>}

                  <button className="calc-btn" type="submit" disabled={sending}>
                    {sending ? "Enviando..." : "Receber proposta grátis"}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ============ STEP: SUCCESS ============ */}
          {step === "success" && (
            <div className="calc-card">
              <div className="success-icon">✅</div>
              <div className="success-title">Recebemos seu contato!</div>
              <p className="success-msg">
                Nossa equipe vai entrar em contato em até 24h pelo WhatsApp <strong>{whatsapp}</strong>.
              </p>
              <button className="btn-outline" onClick={handleReset}>
                Fazer outra simulação
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
