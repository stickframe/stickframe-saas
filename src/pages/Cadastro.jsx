import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sb } from "../services/supabase";

const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";

export default function Cadastro() {
  const navigate = useNavigate();

  const [nomeEmpresa,  setNomeEmpresa]  = useState("");
  const [nomeUsuario,  setNomeUsuario]  = useState("");
  const [email,        setEmail]        = useState("");
  const [senha,        setSenha]        = useState("");
  const [confirmar,    setConfirmar]    = useState("");
  const [show,         setShow]         = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [erro,         setErro]         = useState("");
  const [sucesso,      setSucesso]      = useState(false);

  async function handleCadastro(e) {
    e.preventDefault();
    setErro("");
    if (senha !== confirmar) { setErro("As senhas não coincidem."); return; }
    if (senha.length < 6)    { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const { data, error } = await sb.functions.invoke("cadastrar-empresa", {
        body: { nomeEmpresa, nomeUsuario, email: email.trim().toLowerCase(), senha },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSucesso(true);
    } catch (err) {
      setErro(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", fontSize: 15,
    background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.15)",
    borderRadius: 8, color: "#fff", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "rgba(255,255,255,.5)", textTransform: "uppercase", marginBottom: 6, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "#0e0505", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: "24px 16px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');`}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO} alt="StickFrame" style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", marginBottom: 14 }} />
          <div style={{ fontWeight: 900, letterSpacing: 3, fontSize: 18, color: "#fff" }}>
            STICK<span style={{ color: "#981915" }}>FRAME</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,.35)", marginTop: 4 }}>SISTEMAS CONSTRUTIVOS</div>
        </div>

        <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "32px 28px" }}>
          {sucesso ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 10 }}>Conta criada com sucesso!</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.55)", marginBottom: 28, lineHeight: 1.6 }}>
                Sua empresa foi cadastrada no plano <strong style={{ color: "#fff" }}>Free</strong>.<br />
                Agora é só entrar no sistema.
              </div>
              <button
                onClick={() => navigate("/login")}
                style={{ width: "100%", background: "linear-gradient(135deg,#b91c1c,#7f1d1d)", color: "#fff", border: "none", borderRadius: 10, padding: 15, fontSize: 16, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
              >
                Entrar no sistema →
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Criar conta gratuita</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 24 }}>Plano Free · 2 obras ativas · sem cartão</div>

              {erro && (
                <div style={{ background: "rgba(220,38,38,.15)", border: "1px solid rgba(220,38,38,.4)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ff8a80", marginBottom: 16 }}>
                  {erro}
                </div>
              )}

              <form onSubmit={handleCadastro} autoComplete="off">
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Nome da empresa *</label>
                  <input style={inputStyle} value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Ex: Becker Engenharia Ltda." autoComplete="off" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Seu nome *</label>
                  <input style={inputStyle} value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} placeholder="Ex: João Silva" autoComplete="off" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>E-mail *</label>
                  <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@empresa.com.br" autoComplete="off" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Senha *</label>
                  <div style={{ position: "relative" }}>
                    <input style={{ ...inputStyle, paddingRight: 80 }} type={show ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" required />
                    <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.5)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      {show ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Confirmar senha *</label>
                  <input style={inputStyle} type={show ? "text" : "password"} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} placeholder="Repita a senha" autoComplete="new-password" required />
                </div>

                <button
                  type="submit"
                  disabled={loading || !nomeEmpresa || !nomeUsuario || !email || !senha || !confirmar}
                  style={{ width: "100%", background: loading ? "#444" : "linear-gradient(135deg,#b91c1c,#7f1d1d)", color: "#fff", border: "none", borderRadius: 10, padding: 15, fontSize: 16, fontWeight: 800, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 20px rgba(152,25,21,.4)" }}
                >
                  {loading ? "Criando conta…" : "Criar conta gratuita →"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,.4)" }}>
                Já tem conta?{" "}
                <Link to="/login" style={{ color: "#ff6b6b", fontWeight: 700, textDecoration: "none" }}>Entrar</Link>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,.2)" }}>
          Stick Frame Sistemas Construtivos · Santo André/SP
        </div>
      </div>
    </div>
  );
}
