import { useEffect, useState } from "react";
import { CheckCircle } from "../components/ui/Icon";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { fmt } from "../utils/format";
import { LOGO_STICKFRAME } from "../utils/cdn";

export default function ContratoOnline() {
  const { token } = useParams();
  const [dados,    setDados]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [aceite,   setAceite]   = useState({ nome: "", aceito: false });
  const [enviando, setEnviando] = useState(false);
  const [assinado, setAssinado] = useState(false);
  const hoje = new Date().toLocaleDateString("pt-BR");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await sb.rpc("get_contrato_data", { p_token: token });
        if (data) setDados(data);
      } finally { setLoading(false); }
    })();
  }, [token]);

  async function confirmarAssinatura() {
    if (!aceite.nome.trim() || !aceite.aceito) return;
    setEnviando(true);
    try {
      await sb.from("contratos").update({
        assinatura_nome: aceite.nome.trim(),
        assinatura_data: new Date().toISOString(),
        status: "Assinado",
      }).eq("contrato_token", token);
      setAssinado(true);
    } finally { setEnviando(false); }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #ddd", borderTop: "3px solid #981915", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 13, color: "#888" }}>Carregando contrato...</div>
    </div>
  );

  if (!dados) return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}></div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0" }}>Contrato não encontrado</div>
      <div style={{ fontSize: 13, color: "#888", textAlign: "center" }}>O link pode ter expirado ou ser inválido.</div>
    </div>
  );

  const { contrato: c, empresa: emp } = dados;
  const jaAssinado = !!c.assinatura_nome || assinado;
  const logoUrl = emp?.logo_url || LOGO_STICKFRAME;

  const fases = [
    { nome: "Projeto executivo", pct: 8 },
    { nome: "Fundação", pct: 12 },
    { nome: "Estrutura Steel Frame", pct: 35 },
    { nome: "Fechamentos e painéis", pct: 20 },
    { nome: "Instalações elétricas e hidráulicas", pct: 12 },
    { nome: "Acabamento e entrega", pct: 13 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0f0", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Header */}
      <div style={{ background: "#1A1A1A", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logoUrl} alt="Logo" style={{ height: 32, borderRadius: 6 }} onError={(e) => { e.target.style.display = "none"; }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>
              <span style={{ color: "#555" }}>STICK</span><span style={{ color: "#981915" }}>FRAME</span>
            </div>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 1.5 }}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#444" }}>Contrato de Prestação de Serviços</div>
          <div style={{ fontSize: 10, color: "#333" }}>{c.ref} · {c.data || hoje}</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#981915,#6e1210)", padding: "28px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, opacity: .7, marginBottom: 6 }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Construção em Steel Frame</div>
          <div style={{ fontSize: 14, opacity: .85, marginBottom: 20 }}>Cliente: <strong>{c.cliente}</strong></div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
            {[
              ["Referência", c.ref],
              ["Obra", c.obra || "—"],
              ["Padrão", c.padrao || "—"],
              ["Prazo", c.prazo || "—"],
            ].map(([l, v]) => (
              <div key={l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,.15)" }}>
                <div style={{ fontSize: 9, opacity: .7, marginBottom: 4, letterSpacing: 1 }}>{l.toUpperCase()}</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>

        {/* Valor */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 8 }}>VALOR TOTAL DO CONTRATO</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#981915", lineHeight: 1 }}>{fmt(c.valor)}</div>
          {c.unidades > 1 && (
            <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
              {c.unidades} unidades · {c.area} m² · {fmt(c.valor / c.unidades)}/unid.
            </div>
          )}
          {c.unidades <= 1 && c.area > 0 && (
            <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
              {c.area} m² · {fmt(c.valor / c.area)}/m²
            </div>
          )}
        </div>

        {/* Objeto do contrato */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 16 }}>OBJETO DO CONTRATO</div>
          <p style={{ fontSize: 13, color: "#444", lineHeight: 1.8, marginBottom: 12 }}>
            O presente instrumento tem por objeto a prestação de serviços de construção em sistema <strong>Steel Frame</strong> para a obra <strong>{c.obra || "descrita acima"}</strong>,
            pelo valor global de <strong style={{ color: "#981915" }}>{fmt(c.valor)}</strong>,
            conforme especificações técnicas acordadas entre as partes.
          </p>
          <p style={{ fontSize: 13, color: "#444", lineHeight: 1.8 }}>
            A execução abrangerá projeto executivo, fornecimento de materiais, mão de obra especializada e entrega da obra no prazo
            de <strong>{c.prazo || "conforme cronograma"}</strong>, incluindo todas as etapas descritas no cronograma abaixo.
          </p>
        </div>

        {/* Cronograma financeiro */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 16 }}>CRONOGRAMA FÍSICO-FINANCEIRO</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                {["Etapa", "Fase", "%", "Valor"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Etapa" || h === "Fase" ? "left" : "right", padding: "6px 8px", fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fases.map((f, i) => (
                <tr key={f.nome} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "10px 8px", color: "#888", fontSize: 12 }}>{i + 1}</td>
                  <td style={{ padding: "10px 8px", fontSize: 12 }}>{f.nome}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 12, color: "#981915", fontWeight: 700 }}>{f.pct}%</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>{fmt(c.valor * f.pct / 100)}</td>
                </tr>
              ))}
              <tr style={{ background: "#f9f9f9" }}>
                <td colSpan={2} style={{ padding: "12px 8px", fontWeight: 700, fontSize: 13 }}>Total</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>100%</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 800, fontSize: 15, color: "#981915" }}>{fmt(c.valor)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Condições gerais */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 14 }}>CONDIÇÕES GERAIS</div>
          {[
            ["Reajuste", "Os valores são fixos e não sofrerão reajuste durante a execução, salvo aditivos formalizados por escrito."],
            ["Responsabilidade técnica", "A construtora assume responsabilidade técnica pela execução, com ART registrada no CREA/CAU."],
            ["Garantia", "Os serviços executados têm garantia de 5 anos para estrutura e 1 ano para acabamentos, conforme NBR 17170."],
            ["Pagamentos", "Os pagamentos serão realizados conforme cronograma físico-financeiro, mediante medição aprovada."],
            ["Rescisão", "Em caso de rescisão por qualquer das partes, serão devidos os valores proporcionais ao serviço executado."],
          ].map(([titulo, texto]) => (
            <div key={titulo} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f5f5f5" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{titulo}</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{texto}</div>
            </div>
          ))}
        </div>

        {/* Assinatura digital */}
        <div style={{
          background: jaAssinado ? "#f0fdf4" : "#fff",
          borderRadius: 14, padding: 24, marginBottom: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,.06)",
          border: jaAssinado ? "1px solid #86efac" : "1px solid #f0f0f0",
        }}>
          {jaAssinado ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}><CheckCircle size={14} /></div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#3f7a4b", marginBottom: 6 }}>Contrato assinado!</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
                Assinatura digital de <strong>{c.assinatura_nome || aceite.nome}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                {c.assinatura_data
                  ? new Date(c.assinatura_data).toLocaleString("pt-BR")
                  : new Date().toLocaleString("pt-BR")}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: "#888" }}>
                Nossa equipe entrará em contato para dar continuidade ao projeto.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 14 }}>ASSINATURA DIGITAL</div>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
                Ao assinar digitalmente, você declara que leu e concorda integralmente com todos os termos e condições
                deste contrato, incluindo valores, cronograma, escopo de serviços e condições gerais descritas acima.
              </p>
              <input
                value={aceite.nome}
                onChange={(e) => setAceite((a) => ({ ...a, nome: e.target.value }))}
                placeholder="Digite seu nome completo para assinar"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 8,
                  border: "1px solid #ddd", fontSize: 13, fontFamily: "inherit",
                  marginBottom: 12, outline: "none",
                }}
              />
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 18 }}>
                <input
                  type="checkbox"
                  checked={aceite.aceito}
                  onChange={(e) => setAceite((a) => ({ ...a, aceito: e.target.checked }))}
                  style={{ marginTop: 3, flexShrink: 0, accentColor: "#981915" }}
                />
                <span style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>
                  Confirmo que sou <strong>{c.cliente}</strong>, li o contrato na íntegra e aceito todos os termos,
                  pelo valor de <strong style={{ color: "#981915" }}>{fmt(c.valor)}</strong>.
                </span>
              </label>
              <button
                onClick={confirmarAssinatura}
                disabled={!aceite.nome.trim() || !aceite.aceito || enviando}
                style={{
                  width: "100%", padding: 14, borderRadius: 10, border: "none",
                  background: (!aceite.nome.trim() || !aceite.aceito) ? "#ccc" : "linear-gradient(135deg,#981915,#6e1210)",
                  color: "#fff", fontSize: 14, fontWeight: 800,
                  cursor: (!aceite.nome.trim() || !aceite.aceito) ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {enviando ? "Registrando assinatura..." : " Assinar contrato digitalmente"}
              </button>
              <p style={{ fontSize: 10, color: "#aaa", marginTop: 10, textAlign: "center" }}>
                Assinatura eletrônica com validade legal · data e hora registradas automaticamente
              </p>
            </>
          )}
        </div>

        {/* Rodapé */}
        {emp?.telefone && (
          <div style={{ background: "#1A1A1A", borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, marginBottom: 8 }}>DÚVIDAS SOBRE O CONTRATO?</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Fale com nossa equipe</div>
            <a
              href={`https://wa.me/55${emp.telefone.replace(/\D/g, "")}?text=Olá! Tenho dúvidas sobre o contrato ${c.ref}`}
              target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#3f7a4b", color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
            >
               WhatsApp
            </a>
          </div>
        )}

        <div style={{ textAlign: "center", padding: "12px 0 28px", fontSize: 11, color: "#aaa" }}>
          <strong style={{ color: "#555" }}>{emp?.nome || "Stick Frame Sistemas Construtivos"}</strong><br />
          Contrato {c.ref} · Emitido em {c.data || hoje}
        </div>
      </div>
    </div>
  );
}
