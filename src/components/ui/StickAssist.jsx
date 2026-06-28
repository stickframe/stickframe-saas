import { useState, useEffect, useRef } from "react";
import { sb, getEmpresaId } from "../../services/supabase";
import useAppStore from "../../store/useAppStore";

function buildSystemPrompt(obras, financeiro) {
  const obrasArr = Array.isArray(obras) ? obras : [];
  const obrasAtivas = obrasArr.filter((o) => o.status !== "Concluída");
  // financeiro é um objeto keyed por obraId: { [obraId]: { contrato, lancamentos: [] } }.
  // Achatamos todos os lançamentos para somar receita/despesa da empresa.
  const lancamentos = Object.values(financeiro || {}).flatMap((f) => f?.lancamentos || []);
  const receita = lancamentos.filter((l) => l.tipo === "Receita").reduce((s, l) => s + (l.valor || 0), 0);
  const despesa = lancamentos.filter((l) => l.tipo === "Despesa").reduce((s, l) => s + (l.valor || 0), 0);
  const margem = receita > 0 ? (((receita - despesa) / receita) * 100).toFixed(1) : "?";

  return `Você é o StickAssist™, copiloto de inteligência do StickFrame — SaaS para construtoras de Steel Frame no Brasil.

DADOS DA EMPRESA (hoje):
- Total de obras: ${obrasArr.length} (${obrasAtivas.length} ativas)
- Obras: ${obrasArr.slice(0, 10).map((o) => `${o.nome} (${o.status}, ${o.progresso || 0}%)`).join("; ")}
- Receita registrada: ${receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
- Despesa registrada: ${despesa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
- Margem bruta estimada: ${margem}%

INSTRUÇÕES:
- Responda sempre em português brasileiro, de forma objetiva e profissional
- Use os dados da empresa quando relevantes para a resposta
- Para perguntas técnicas de Steel Frame, use seu conhecimento
- Seja conciso: prefira respostas de 2-4 frases
- Não invente dados que não foram fornecidos`;
}

export default function StickAssist() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [aiCfg, setAiCfg]    = useState(null);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Olá! Sou o StickAssist™, seu copiloto de obras. Posso responder perguntas sobre suas obras, margens, cronogramas e muito mais. Como posso ajudar?" },
  ]);

  const obras      = useAppStore((s) => s.obras);
  const financeiro = useAppStore((s) => s.financeiro);
  const endRef     = useRef(null);

  useEffect(() => {
    const empId = getEmpresaId();
    if (!empId) return;
    sb.from("ia_config")
      .select("openai_key, modelo_openai")
      .eq("empresa_id", empId)
      .single()
      .then(({ data }) => {
        if (data?.openai_key) setAiCfg({ key: data.openai_key, model: data.modelo_openai || "gpt-4o-mini" });
      });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      if (!aiCfg) throw new Error("Configure a chave OpenAI em Configurações > IA para usar o StickAssist™.");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${aiCfg.key}` },
        body: JSON.stringify({
          model: aiCfg.model,
          messages: [
            { role: "system", content: buildSystemPrompt(obras, financeiro) },
            ...messages.filter((m) => m.role !== "system"),
            userMsg,
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Não consegui gerar uma resposta.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="StickAssist™ — Copiloto de obras"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: "50%",
          background: open ? "#7d1411" : "#981915",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(152,25,21,0.4)",
          fontSize: 22, transition: "background 0.15s",
          fontFamily: "inherit",
        }}
      >
        {open ? "×" : "🤖"}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 1000,
          width: 320, height: 480,
          background: "#ffffff", borderRadius: 16,
          border: "1px solid #e7e1d8",
          boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          fontFamily: "'Hanken Grotesk', sans-serif",
        }}>
          {/* Header */}
          <div style={{ background: "#981915", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>StickAssist™</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, letterSpacing: 0.5 }}>COPILOTO DE OBRAS</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0 }}
            >×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "86%",
                  background: m.role === "user" ? "#981915" : "#f4f1ec",
                  color: m.role === "user" ? "#fff" : "#26231f",
                  borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  padding: "9px 13px",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: "flex-start", background: "#f4f1ec",
                borderRadius: "12px 12px 12px 2px",
                padding: "9px 13px", fontSize: 13, color: "#8c847a",
              }}>
                ✦ Pensando...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #e7e1d8", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Pergunte sobre suas obras..."
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 8,
                border: "1px solid #e7e1d8", fontSize: 13,
                fontFamily: "inherit", outline: "none",
                background: "#faf8f4",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: "#981915", border: "none", borderRadius: 8,
                color: "#fff", padding: "0 14px", cursor: "pointer",
                fontSize: 16, opacity: loading || !input.trim() ? 0.45 : 1,
                transition: "opacity 0.15s",
              }}
            >↑</button>
          </div>
        </div>
      )}
    </>
  );
}
