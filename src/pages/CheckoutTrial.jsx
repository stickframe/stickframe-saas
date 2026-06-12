import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sb } from "../services/supabase";

const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

const PLANOS_CHECKOUT = {
  profissional: { label: "Profissional", valor: 197 },
  essencial:    { label: "Essencial",    valor: 97 },
};

function maskCpfCnpj(v) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
            .replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3")
            .replace(/(\d{3})(\d{1,3})/, "$1.$2");
  }
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
          .replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4")
          .replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3")
          .replace(/(\d{2})(\d{1,3})/, "$1.$2");
}

const s = {
  root: { minHeight: "100vh", background: "#0e0505", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Hanken Grotesk', sans-serif", padding: "24px 16px" },
  box:  { width: "100%", maxWidth: 480 },
  card: { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "32px 28px" },
  inp:  { width: "100%", padding: "11px 14px", fontSize: 15, background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.15)", borderRadius: 8, color: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 },
  lbl:  { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "rgba(255,255,255,.5)", textTransform: "uppercase", marginBottom: 6, display: "block" },
  btn:  { width: "100%", background: "linear-gradient(135deg,#981915,#7d1411)", color: "#fff", border: "none", borderRadius: 10, padding: 15, fontSize: 16, fontWeight: 800, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 20px rgba(152,25,21,.4)" },
};

export default function CheckoutTrial() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get("plan") || "profissional";
  const plano = PLANOS_CHECKOUT[planKey] || PLANOS_CHECKOUT.profissional;
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  const [nome,     setNome]     = useState("");
  const [cpfCnpj,  setCpfCnpj]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState("");
  const [sucesso,  setSucesso]  = useState(null); // { link, trialEndsAt }

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/cadastro?plan=profissional");
      } else {
        setSession(data.session);
        setChecking(false);
      }
    });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    const digitos = cpfCnpj.replace(/\D/g, "");
    if (digitos.length !== 11 && digitos.length !== 14) {
      setErro("CPF (11 dígitos) ou CNPJ (14 dígitos) inválido.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await sb.functions.invoke("upgrade-pro", {
        body: {
          nome,
          email: session.user.email,
          cpfCnpj: digitos,
          trial: true,
          plano: planKey,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setSucesso({ link: data.link, trialEndsAt: data.trialEndsAt, nextDueDate: data.nextDueDate });
    } catch (err) {
      setErro(err.message || "Erro ao ativar trial. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  const trialDate = sucesso?.nextDueDate
    ? new Date(sucesso.nextDueDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div style={s.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800;900&display=swap');`}</style>

      <div style={s.box}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={LOGO} alt="StickFrame" style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover", marginBottom: 12 }} />
          <div style={{ fontWeight: 900, letterSpacing: 3, fontSize: 17, color: "#fff" }}>
            STICK<span style={{ color: "#981915" }}>FRAME</span>
          </div>
        </div>

        {/* Plan badge */}
        <div style={{ background: "rgba(152,25,21,.15)", border: "1px solid rgba(152,25,21,.3)", borderRadius: 10, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 2 }}>Plano {plano.label} — 14 dias grátis</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>Depois R$ {plano.valor}/mês · cancele antes sem custo</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#981915", fontFamily: "sans-serif" }}>🎯</div>
        </div>

        <div style={s.card}>
          {sucesso ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🚀</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 10 }}>Trial ativado!</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.6)", lineHeight: 1.7, marginBottom: 24 }}>
                Você tem <strong style={{ color: "#fff" }}>14 dias de acesso completo</strong> ao plano {plano.label}.<br />
                Primeiro pagamento:{" "}
                <strong style={{ color: "#e08a84" }}>{trialDate}</strong><br />
                Escolha PIX, boleto ou cartão no link abaixo.
              </div>

              {sucesso.link && (
                <a
                  href={sucesso.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", width: "100%", background: "linear-gradient(135deg,#981915,#7d1411)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 0", fontSize: 15, fontWeight: 800, fontFamily: "inherit", cursor: "pointer", textDecoration: "none", marginBottom: 10, boxSizing: "border-box" }}
                >
                  Registrar forma de pagamento →
                </a>
              )}

              <button
                onClick={() => navigate("/login")}
                style={{ width: "100%", background: "transparent", color: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
              >
                Entrar no sistema agora →
              </button>

              <p style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 16, lineHeight: 1.6 }}>
                Se não registrar pagamento agora, você receberá o link por e-mail antes do vencimento. Sem cobrança surpresa.
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Ativar trial gratuito</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 24 }}>Precisamos do seu CPF ou CNPJ para emissão da nota e boleto futuro.</div>

              {erro && (
                <div style={{ background: "rgba(220,38,38,.15)", border: "1px solid rgba(220,38,38,.4)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ff8a80", marginBottom: 16 }}>
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label style={s.lbl}>Nome completo *</label>
                <input
                  style={s.inp}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como aparece no CPF/CNPJ"
                  required
                />

                <label style={s.lbl}>CPF ou CNPJ *</label>
                <input
                  style={s.inp}
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  required
                />

                <button
                  type="submit"
                  disabled={loading || !nome || !cpfCnpj}
                  style={{ ...s.btn, opacity: loading || !nome || !cpfCnpj ? .6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                >
                  {loading ? "Ativando..." : "Ativar meu trial gratuito →"}
                </button>
              </form>

              <ul style={{ marginTop: 20, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {[`14 dias de acesso ao ${plano.label} completo`, "Sem cobrança agora — primeiro pagamento em 14 dias", "Cancele antes sem custo, sem multa"].map((it) => (
                  <li key={it} style={{ fontSize: 12, color: "rgba(255,255,255,.45)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#3f7a4b", flexShrink: 0 }}>✓</span>{it}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "rgba(255,255,255,.2)" }}>
          Stick Frame Sistemas Construtivos · Santo André/SP
        </div>
      </div>
    </div>
  );
}
