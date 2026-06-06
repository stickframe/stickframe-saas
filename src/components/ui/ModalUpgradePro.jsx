import { useState } from "react";
import { sb } from "../../services/supabase";
import { C } from "../../utils/constants";

export default function ModalUpgradePro({ onClose }) {
  const [nome,      setNome]      = useState("");
  const [email,     setEmail]     = useState("");
  const [cpfCnpj,   setCpfCnpj]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [erro,      setErro]      = useState("");

  async function handleUpgrade(e) {
    e.preventDefault();
    setErro(""); setLoading(true);
    try {
      const { data, error } = await sb.functions.invoke("upgrade-pro", {
        body: { nome, email, cpfCnpj: cpfCnpj || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.link) window.open(data.link, "_blank");
      onClose?.();
    } catch (err) {
      setErro(err.message || "Erro ao gerar cobrança. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: "100%", padding: "10px 12px", fontSize: 14,
    border: `1px solid ${C.border}`, borderRadius: 8,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
    background: C.darker, color: C.text,
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Fazer upgrade para Pro</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>R$ 297/mês · obras ilimitadas · até 10 usuários</div>
        </div>

        {/* Benefícios resumidos */}
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          {["Obras ilimitadas", "Até 10 usuários", "Relatórios PDF", "CRM de clientes", "Suporte prioritário"].map((b) => (
            <div key={b} style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span>✓</span> {b}
            </div>
          ))}
        </div>

        {erro && (
          <div style={{ background: C.danger + "15", border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.danger, marginBottom: 14 }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleUpgrade}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 5 }}>NOME COMPLETO *</div>
            <input style={inp} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João Silva" required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 5 }}>E-MAIL *</div>
            <input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@empresa.com.br" required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 5 }}>CPF / CNPJ (opcional)</div>
            <input style={inp} value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="000.000.000-00 ou 00.000.000/0001-00" />
          </div>

          <button
            type="submit"
            disabled={loading || !nome || !email}
            style={{ width: "100%", padding: "14px 0", background: loading ? "#94a3b8" : C.red, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", marginBottom: 10 }}
          >
            {loading ? "Gerando link de pagamento…" : "Gerar link de pagamento →"}
          </button>
          <button type="button" onClick={onClose} style={{ width: "100%", padding: "10px 0", background: "transparent", color: C.muted, border: "none", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Cancelar
          </button>
        </form>

        <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 12 }}>
          Você será redirecionado para o link de pagamento seguro (PIX, boleto ou cartão).
        </div>
      </div>
    </div>
  );
}
