import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { fmt } from "../utils/format";

const FASES_OBRA = [
  "Projeto executivo","Fundação","Estrutura Steel Frame",
  "Fechamentos","Instalações","Acabamento","Entrega"
];

export default function PropostaOnline() {
  const { token } = useParams();
  const [orc,     setOrc]     = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aceite,  setAceite]  = useState({ nome: "", aceito: false });
  const [enviando,setEnviando]= useState(false);
  const [aceiteFeito, setAceiteFeito] = useState(false);
  const hoje = new Date().toLocaleDateString("pt-BR");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await sb.rpc("get_proposta_data", { p_token: token });
        if (data) { setOrc(data.orcamento); setCliente(data.cliente); }
      } finally { setLoading(false); }
    })();
  }, [token]);

  async function confirmarAceite() {
    if (!aceite.nome.trim() || !aceite.aceito) return;
    setEnviando(true);
    try {
      await sb.from("orcamentos").update({
        aceite_nome: aceite.nome,
        aceite_data: new Date().toISOString(),
        status: "Aprovado",
      }).eq("proposta_token", token);
      setAceiteFeito(true);
    } finally { setEnviando(false); }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #ddd", borderTop: "3px solid #981915", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 13, color: "#888" }}>Carregando proposta...</div>
    </div>
  );

  if (!orc) return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0" }}>Proposta não encontrada</div>
      <div style={{ fontSize: 13, color: "#888", textAlign: "center" }}>O link pode ter expirado ou ser inválido.</div>
    </div>
  );

  const jaAceito = !!orc.aceite_nome || aceiteFeito;
  const validade = orc.validade_dias || 30;

  const itens = [
    { desc: "Projeto executivo Steel Frame", un: "vb", qtd: 1, unit: orc.valor_total * 0.08 },
    { desc: `Fundação (${orc.area} m²)`, un: "m²", qtd: orc.area, unit: (orc.valor_total * 0.12) / orc.area },
    { desc: `Estrutura Steel Frame (${orc.unidades}x ${orc.area} m²)`, un: "m²", qtd: orc.area * orc.unidades, unit: (orc.valor_total * 0.35) / (orc.area * orc.unidades) },
    { desc: "Fechamentos e painéis", un: "m²", qtd: orc.area * orc.unidades, unit: (orc.valor_total * 0.20) / (orc.area * orc.unidades) },
    { desc: "Instalações elétricas e hidráulicas", un: "vb", qtd: 1, unit: orc.valor_total * 0.12 },
    { desc: "Acabamento e entrega", un: "vb", qtd: 1, unit: orc.valor_total * 0.13 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Header */}
      <div style={{ background: "#1A1A1A", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#414141 50%,#981915 50%)", borderRadius: 7, border: "1px solid #333" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>
              <span style={{ color: "#555" }}>STICK</span><span style={{ color: "#981915" }}>FRAME</span>
            </div>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 1.5 }}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#444" }}>Proposta Comercial</div>
          <div style={{ fontSize: 10, color: "#333" }}>{hoje}</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#981915,#6e1210)", padding: "32px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, opacity: .7, marginBottom: 8 }}>PROPOSTA COMERCIAL PERSONALIZADA</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
            Residência em Steel Frame
          </div>
          <div style={{ fontSize: 14, opacity: .85 }}>
            Preparada para: <strong>{cliente?.nome || orc.cliente_nome || "Cliente"}</strong>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 24 }}>
            {[
              ["Padrão", orc.padrao],
              ["Área total", `${(orc.area * (orc.unidades || 1)).toLocaleString("pt-BR")} m²`],
              ["Validade", `${validade} dias`],
            ].map(([l, v]) => (
              <div key={l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,.15)" }}>
                <div style={{ fontSize: 9, opacity: .7, marginBottom: 4, letterSpacing: 1 }}>{l.toUpperCase()}</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px" }}>

        {/* Valor destaque */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 8 }}>INVESTIMENTO TOTAL</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#981915", lineHeight: 1 }}>{fmt(orc.valor_total)}</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
            {fmt(orc.valor_m2 || (orc.valor_total / orc.area))}/m² · {orc.area} m² · {orc.unidades || 1} unidade(s)
          </div>
        </div>

        {/* Detalhamento */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 14 }}>COMPOSIÇÃO DO INVESTIMENTO</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                {["Serviço","Un","Qtd","Unit.","Total"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Serviço" ? "left" : "right", padding: "6px 8px", fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((it, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "10px 8px", fontSize: 12 }}>{it.desc}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#888", fontSize: 11 }}>{it.un}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 12 }}>{it.qtd}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 12 }}>{fmt(it.unit)}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700, fontSize: 12 }}>{fmt(it.unit * it.qtd)}</td>
                </tr>
              ))}
              <tr style={{ background: "#f9f9f9" }}>
                <td colSpan={4} style={{ padding: "12px 8px", fontWeight: 700, fontSize: 13 }}>Total</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 800, fontSize: 15, color: "#981915" }}>{fmt(orc.valor_total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cronograma de fases */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 14 }}>CRONOGRAMA DE EXECUÇÃO</div>
          {FASES_OBRA.map((f, i) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < FASES_OBRA.length - 1 ? "1px solid #f5f5f5" : "none" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#981915", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13 }}>{f}</div>
              <div style={{ fontSize: 11, color: "#888" }}>~{[2, 3, 6, 4, 4, 3, 1][i]} sem.</div>
            </div>
          ))}
        </div>

        {/* Diferenciais */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 14 }}>POR QUE STEEL FRAME?</div>
          {[
            ["⚡", "Obra até 50% mais rápida", "Estrutura a seco sem espera de cura"],
            ["🌱", "Sustentabilidade", "Materiais recicláveis e menor desperdício"],
            ["🔇", "Conforto acústico e térmico", "Desempenho superior ao alvenaria"],
            ["📐", "Precisão milimétrica", "Peças fabricadas em fábrica com controle de qualidade"],
            ["🏗", "Acompanhamento digital", "Portal do cliente com atualização em tempo real"],
          ].map(([ic, t, d]) => (
            <div key={t} style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#981915", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{ic}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Aceite digital */}
        <div style={{ background: jaAceito ? "#f0fdf4" : "#fff", borderRadius: 14, padding: "24px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: jaAceito ? "1px solid #86efac" : "1px solid #f0f0f0" }}>
          {jaAceito ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#2e9e5b", marginBottom: 6 }}>Proposta aceita!</div>
              <div style={{ fontSize: 13, color: "#555" }}>
                Aceite registrado por <strong>{orc.aceite_nome || aceite.nome}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Nossa equipe entrará em contato em breve.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", marginBottom: 16 }}>ACEITE DIGITAL</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 1.6 }}>
                Ao aceitar, você confirma que leu e concorda com os termos desta proposta comercial, incluindo valores, prazo e escopo de serviços descritos acima.
              </div>
              <input
                value={aceite.nome}
                onChange={(e) => setAceite((a) => ({ ...a, nome: e.target.value }))}
                placeholder="Digite seu nome completo para assinar"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, fontFamily: "inherit", marginBottom: 12, outline: "none" }}
              />
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 16 }}>
                <input type="checkbox" checked={aceite.aceito} onChange={(e) => setAceite((a) => ({ ...a, aceito: e.target.checked }))} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
                  Confirmo que sou <strong>{cliente?.nome || "o cliente"}</strong> e aceito os termos desta proposta no valor de <strong>{fmt(orc.valor_total)}</strong>.
                </span>
              </label>
              <button
                onClick={confirmarAceite}
                disabled={!aceite.nome.trim() || !aceite.aceito || enviando}
                style={{
                  width: "100%", padding: "14px", borderRadius: 10, border: "none",
                  background: (!aceite.nome.trim() || !aceite.aceito) ? "#ccc" : "#981915",
                  color: "#fff", fontSize: 14, fontWeight: 800,
                  cursor: (!aceite.nome.trim() || !aceite.aceito) ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {enviando ? "Registrando aceite..." : "✅ Aceitar proposta"}
              </button>
            </>
          )}
        </div>

        {/* Contato */}
        <div style={{ background: "#1A1A1A", borderRadius: 14, padding: "20px", textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, marginBottom: 8 }}>DÚVIDAS SOBRE A PROPOSTA?</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Fale com nossa equipe</div>
          <a href="https://wa.me/5511940000000" target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            💬 WhatsApp
          </a>
        </div>

        <div style={{ textAlign: "center", padding: "12px 0 24px", fontSize: 10, color: "#aaa" }}>
          <strong style={{ color: "#555" }}>Stick Frame Sistemas Construtivos</strong><br />
          Proposta válida por {validade} dias · {hoje}
        </div>
      </div>
    </div>
  );
}
