import { useState, useMemo } from "react";
import { C } from "../../utils/constants";

export default function CrmWhatsAppChat({ lead, timeline, onSendMessage }) {
  const [msgText, setMsgText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filtra as mensagens de WhatsApp na timeline para renderizar o chat
  const chatMessages = useMemo(() => {
    return timeline
      .filter(t => ["whatsapp_sent", "whatsapp_received"].includes(t.tipo))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // mais antiga primeiro para o chat
  }, [timeline]);

  async function handleSend() {
    if (!msgText.trim() || submitting) return;
    setSubmitting(true);
    const textToSend = msgText.trim();
    setMsgText("");

    try {
      // 1. Salva mensagem enviada pelo vendedor
      await onSendMessage("whatsapp_sent", textToSend);

      // 2. Simula resposta automática do cliente em 2.5 segundos
      setTimeout(async () => {
        const respostas = [
          "Olá! Recebi a simulação de custos, sim. Muito obrigado pelo retorno rápido.",
          "Obrigado! Vou dar uma olhada no projeto e retorno amanhã para combinarmos a reunião.",
          "Gostei do modelo de parede termoacústica. Vocês têm algum modelo construído para visitação?",
          "Legal! Vou validar o orçamento com minha esposa e retorno na segunda-feira.",
          "Estou em viagem no momento, mas na quarta-feira podemos fazer uma ligação para acertar os detalhes?"
        ];
        const respostaCliente = respostas[Math.floor(Math.random() * respostas.length)];
        
        // Salva mensagem recebida do cliente
        await onSendMessage("whatsapp_received", respostaCliente, lead.nome);
      }, 2500);

    } catch (e) {
      console.error("Erro ao simular WhatsApp:", e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "460px", background: "#efeae2", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, animation: "fadeIn 0.2s ease-out" }}>
      
      {/* Cabeçalho do Chat */}
      <div style={{ padding: "10px 14px", background: "#075e54", color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#25d366" }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{lead.nome}</div>
          <div style={{ fontSize: 10, color: "#d1ebe8" }}>WhatsApp (Arquitetura Simulação)</div>
        </div>
      </div>

      {/* Janela de Conversa */}
      <div style={{ flex: 1, padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {chatMessages.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", padding: "20px", color: "#777", fontSize: 12, background: "rgba(255,255,255,0.7)", borderRadius: 8 }}>
            💬 Sem mensagens registradas.<br />Envie a primeira mensagem para simular.
          </div>
        ) : (
          chatMessages.map(msg => {
            const isSeller = msg.tipo === "whatsapp_sent";
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isSeller ? "flex-end" : "flex-start",
                  background: isSeller ? "#dcf8c6" : "#fff",
                  color: "#303030",
                  padding: "8px 12px",
                  borderRadius: 8,
                  maxWidth: "80%",
                  fontSize: 12,
                  boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
                  lineHeight: 1.4,
                  wordBreak: "break-word"
                }}
              >
                <div>{msg.observacao}</div>
                <div style={{ fontSize: 9, color: "#888", textAlign: "right", marginTop: 4 }}>
                  {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Barra de Digitação */}
      <div style={{ padding: "8px 12px", background: "#f0f0f0", display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid #ddd" }}>
        <input
          type="text"
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
          placeholder="Digite sua mensagem de WhatsApp..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 20, border: "1px solid #ccc",
            fontSize: 12, outline: "none", fontFamily: "inherit"
          }}
        />
        <button
          onClick={handleSend}
          disabled={!msgText.trim() || submitting}
          style={{
            padding: "8px 16px", background: "#25d366", color: "#fff", border: "none",
            borderRadius: 20, fontSize: 12, fontWeight: 700,
            cursor: msgText.trim() ? "pointer" : "not-allowed", fontFamily: "inherit"
          }}
        >
          Enviar
        </button>
      </div>

    </div>
  );
}
