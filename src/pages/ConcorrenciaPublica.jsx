import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { LOGO_STICKFRAME } from "../utils/cdn";

const ST = {
  bg: "#f8f8f8", card: "#fff", red: "#981915", border: "#e5e7eb",
  muted: "#888", success: "#3f7a4b", text: "#1a1a1a",
};

export default function ConcorrenciaPublica() {
  const { token } = useParams();
  const [dados,    setDados]   = useState(null);
  const [precos,   setPrecos]  = useState({});  // { [item_id]: { preco, obs } }
  const [loading,  setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado,  setEnviado] = useState(false);
  const [erro,     setErro]    = useState(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    sb.rpc("concorrencia_get_dados", { p_token: token })
      .then(({ data, error }) => {
        if (error || !data) { setErro("Link inválido ou expirado."); setLoading(false); return; }
        setDados(data);
        // Pré-preencher com propostas já enviadas
        const init = {};
        (data.propostas || []).forEach((p) => {
          init[p.concorrencia_item_id] = { preco: p.preco_unitario ?? "", obs: p.observacao || "" };
        });
        setPrecos(init);
        if (data.participante?.respondido) setEnviado(true);
        setLoading(false);
      });
  }, [token]);

  async function enviar() {
    setEnviando(true);
    const payload = dados.itens.map((it) => ({
      concorrencia_item_id: it.id,
      preco_unitario: parseFloat(String(precos[it.id]?.preco || "0").replace(/\./g, "").replace(",", ".")) || null,
      observacao: precos[it.id]?.obs || null,
    }));
    const { error } = await sb.rpc("concorrencia_enviar_proposta", { p_token: token, p_propostas: payload });
    if (error) { setErro("Erro ao enviar: " + error.message); setEnviando(false); return; }
    setEnviado(true);
    setEnviando(false);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: ST.bg, fontFamily: "Inter, sans-serif" }}>
      <div style={{ color: ST.muted }}>Carregando...</div>
    </div>
  );

  if (erro) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: ST.bg, fontFamily: "Inter, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}></div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{erro}</div>
      </div>
    </div>
  );

  const { concorrencia, participante, itens } = dados;
  const prazo = concorrencia.prazo_resposta ? new Date(concorrencia.prazo_resposta + "T00:00") : null;
  const encerrada = concorrencia.status !== "Aberta";

  return (
    <div style={{ minHeight: "100vh", background: ST.bg, fontFamily: "Inter, system-ui, sans-serif", padding: "0 0 60px" }}>

      {/* Header */}
      <div style={{ background: ST.red, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <img src={LOGO_STICKFRAME} alt="Stick Frame" style={{ height: 32, filter: "brightness(0) invert(1)" }} onError={(e) => { e.target.style.display = "none"; }} />
        <div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>Portal de Concorrência</div>
          <div style={{ color: "#ffffff99", fontSize: 12 }}>Proposta de fornecimento</div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>

        {/* Info da concorrência */}
        <div style={{ background: ST.card, borderRadius: 14, border: `1px solid ${ST.border}`, padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ST.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Processo de Cotação</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>{concorrencia.titulo}</div>
          {concorrencia.descricao && <div style={{ fontSize: 13, color: ST.muted, marginBottom: 10, lineHeight: 1.6 }}>{concorrencia.descricao}</div>}
          <div style={{ display: "flex", gap: 20, fontSize: 12, color: ST.muted }}>
            <span> {participante.nome_fornecedor}</span>
            {prazo && <span> Prazo: <strong style={{ color: new Date() > prazo ? "#a33327" : ST.text }}>{prazo.toLocaleDateString("pt-BR")}</strong></span>}
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10, background: encerrada ? "#eee" : ST.success + "22", color: encerrada ? ST.muted : ST.success }}>{concorrencia.status}</span>
          </div>
        </div>

        {/* Estado: já enviado ou encerrado */}
        {(enviado || encerrada) ? (
          <div style={{ background: enviado ? ST.success + "12" : "#f5f5f5", border: `1px solid ${enviado ? ST.success + "44" : ST.border}`, borderRadius: 14, padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{enviado ? "" : ""}</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{enviado ? "Proposta enviada com sucesso!" : "Concorrência encerrada"}</div>
            <div style={{ fontSize: 13, color: ST.muted }}>
              {enviado ? "Obrigado! Sua proposta foi recebida e será analisada." : "Este processo de cotação já foi encerrado."}
            </div>
            {enviado && (
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {itens.map((it) => (
                  <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${ST.border}` }}>
                    <span>{it.descricao}</span>
                    <span style={{ fontWeight: 700 }}>
                      {precos[it.id]?.preco ? `R$ ${parseFloat(String(precos[it.id].preco).replace(",", ".")).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/${it.unidade}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Tabela de itens para preencher */}
            <div style={{ background: ST.card, borderRadius: 14, border: `1px solid ${ST.border}`, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${ST.border}`, background: "#fafafa" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Preencha seus preços</div>
                <div style={{ fontSize: 11, color: ST.muted, marginTop: 2 }}>Informe o preço unitário para cada item abaixo</div>
              </div>

              {itens.map((it, i) => (
                <div key={it.id} style={{ padding: "16px 20px", borderBottom: i < itens.length - 1 ? `1px solid ${ST.border}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{it.descricao}</div>
                      {it.quantidade && (
                        <div style={{ fontSize: 12, color: ST.muted, marginTop: 2 }}>
                          Quantidade: <strong>{it.quantidade} {it.unidade}</strong>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, background: "#f0f0f0", borderRadius: 6, padding: "3px 8px", color: ST.muted }}>{it.unidade}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: ST.muted, marginBottom: 4 }}>PREÇO UNITÁRIO (R$) *</div>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: ST.muted, pointerEvents: "none" }}>R$</span>
                        <input
                          type="text" inputMode="decimal"
                          value={precos[it.id]?.preco ?? ""}
                          onChange={(e) => setPrecos((p) => ({ ...p, [it.id]: { ...p[it.id], preco: e.target.value } }))}
                          placeholder="0,00"
                          style={{ width: "100%", padding: "10px 12px 10px 32px", border: `1px solid ${ST.border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", fontWeight: 700 }}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: ST.muted, marginBottom: 4 }}>OBSERVAÇÃO</div>
                      <input
                        type="text"
                        value={precos[it.id]?.obs ?? ""}
                        onChange={(e) => setPrecos((p) => ({ ...p, [it.id]: { ...p[it.id], obs: e.target.value } }))}
                        placeholder="Ex: prazo de entrega, marca..."
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${ST.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  {it.quantidade && precos[it.id]?.preco > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: ST.success, fontWeight: 700 }}>
                      Total do item: R$ {(Number(precos[it.id].preco) * Number(it.quantidade)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Resumo + Enviar */}
            <div style={{ background: ST.card, borderRadius: 14, border: `1px solid ${ST.border}`, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Resumo da proposta</div>
              {itens.map((it) => (
                <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid #f5f5f5`, color: precos[it.id]?.preco > 0 ? ST.text : ST.muted }}>
                  <span>{it.descricao}</span>
                  <span style={{ fontWeight: 600 }}>{precos[it.id]?.preco > 0 ? `R$ ${Number(precos[it.id].preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span>
                </div>
              ))}
              {(() => {
                const totalGeral = itens.reduce((acc, it) => {
                  const p = Number(precos[it.id]?.preco || 0);
                  const q = Number(it.quantidade || 1);
                  return acc + p * q;
                }, 0);
                return totalGeral > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `2px solid ${ST.border}`, fontSize: 15, fontWeight: 900 }}>
                    <span>Total estimado</span>
                    <span style={{ color: ST.red }}>R$ {totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null;
              })()}

              <button
                disabled={enviando || itens.every((it) => !precos[it.id]?.preco || precos[it.id]?.preco === "0" || precos[it.id]?.preco === "0,00")}
                onClick={enviar}
                style={{
                  marginTop: 20, width: "100%", padding: "14px",
                  background: enviando || itens.every((it) => !precos[it.id]?.preco || precos[it.id]?.preco === "0" || precos[it.id]?.preco === "0,00") ? "#ccc" : ST.red,
                  border: "none", borderRadius: 10, color: "#fff",
                  fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                  transition: "background .15s",
                }}
              >
                {enviando ? "Enviando proposta..." : " Enviar proposta"}
              </button>
              <div style={{ fontSize: 11, color: ST.muted, textAlign: "center", marginTop: 8 }}>
                Você pode renviar antes do prazo — a última proposta substitui a anterior.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
