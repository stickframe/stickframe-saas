import { useState, useEffect } from "react";
import { C, PRECOS } from "../../utils/constants";
import { sb } from "../../services/supabase";
import useAppStore from "../../store/useAppStore";
import Btn from "./Btn";
import Input from "./Input";
import Select from "./Select";

export default function FormAiImport({ onClose, mostrarToast, addCliente, addOrcamento }) {
  const empresaId = useAppStore((s) => s.empresaId);
  const orcamentos = useAppStore((s) => s.orcamentos);

  const [step, setStep] = useState(1); // 1: Paste Text, 2: Review Form
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [openaiConfig, setOpenaiConfig] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    cidade: "",
    contato: "",
    email: "",
    origem: "IA / E-mail",
    area_m2: "",
    unidades: "1",
    padrao: "Padrão",
    observacoes: "",
  });

  useEffect(() => {
    if (empresaId) {
      sb.from("ia_config")
        .select("*")
        .eq("empresa_id", empresaId)
        .single()
        .then(({ data }) => {
          if (data && data.openai_key) {
            setOpenaiConfig(data);
            setHasApiKey(true);
          } else {
            setHasApiKey(false);
          }
        })
        .catch(() => setHasApiKey(false));
    }
  }, [empresaId]);

  function gerarRef() {
    const anoAtual = new Date().getFullYear();
    const prefix = `ORC-${anoAtual}-`;
    const numMax = orcamentos
      .filter((o) => o.ref && o.ref.startsWith(prefix))
      .map((o) => {
        const partes = o.ref.split("-");
        const numPart = parseInt(partes[partes.length - 1], 10);
        return isNaN(numPart) ? 0 : numPart;
      })
      .reduce((max, val) => Math.max(max, val), 0);
    return `${prefix}${String(numMax + 1).padStart(3, "0")}`;
  }

  async function analisarTexto() {
    if (!text.trim()) {
      mostrarToast("⚠️ Digite ou cole o texto do e-mail.");
      return;
    }
    if (!hasApiKey || !openaiConfig) {
      mostrarToast("❌ Configuração da OpenAI não encontrada.");
      return;
    }

    setLoading(true);
    try {
      const prompt = `Analise o seguinte e-mail ou proposta de orçamento de construção e extraia os dados estruturados no formato JSON abaixo. 
Escreva estritamente o objeto JSON, sem formatação markdown de código, sem blocos de código e sem explicações.

Formato do JSON de retorno:
{
  "nome_cliente": "Nome completo do cliente ou da empresa",
  "email": "E-mail de contato",
  "telefone": "Número de telefone ou celular/WhatsApp",
  "cidade": "Cidade e estado da obra (ex: Sorocaba/SP)",
  "area_m2": 150, // área estimada em m² (somente número)
  "unidades": 1, // quantidade de unidades ou pavimentos (somente número, padrão 1)
  "padrao_construtivo": "Econômico" | "Padrão" | "Alto Padrão", // classifique com base na descrição, padrão 'Padrão'
  "detalhes_projeto": "Resumo rápido das especificidades mencionadas no texto."
}

Texto para analisar:
"${text}"`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiConfig.openai_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openaiConfig.modelo_openai || "gpt-4o-mini",
          messages: [
            { role: "system", content: "Você é um assistente de extração de dados estruturados para a construção civil. Retorne apenas JSON puro." },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chamada OpenAI falhou com status ${res.status}`);
      }

      const resData = await res.json();
      const content = resData.choices?.[0]?.message?.content?.trim() || "";
      const cleanJson = content.replace(/^```json/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleanJson);

      setForm({
        nome: parsed.nome_cliente || "",
        cidade: parsed.cidade || "",
        contato: parsed.telefone || "",
        email: parsed.email || "",
        origem: "IA / E-mail",
        area_m2: parsed.area_m2 ? String(parsed.area_m2) : "",
        unidades: parsed.unidades ? String(parsed.unidades) : "1",
        padrao: ["Econômico", "Padrão", "Alto Padrão"].includes(parsed.padrao_construtivo) ? parsed.padrao_construtivo : "Padrão",
        observacoes: parsed.detalhes_projeto || "",
      });

      setStep(2);
      mostrarToast("✅ Dados analisados e extraídos!");
    } catch (err) {
      console.error(err);
      mostrarToast(`❌ Erro no processamento por IA: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvar() {
    if (!form.nome.trim()) {
      mostrarToast("⚠️ O nome do cliente é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const area = Number(form.area_m2) || 0;
      const unidades = Number(form.unidades) || 1;
      const precoInfo = PRECOS[form.padrao] || PRECOS["Padrão"];
      const valorBase = precoInfo.m2 * area * unidades;

      // 1. Cadastrar cliente no CRM
      const clienteCriado = await addCliente({
        nome: form.nome,
        cidade: form.cidade,
        contato: form.contato,
        email: form.email,
        origem: form.origem,
        status: "Lead",
        unidades: unidades,
        area_m2: area || null,
        valor: valorBase,
        observacoes: form.observacoes,
      });

      if (!clienteCriado || !clienteCriado.id) {
        throw new Error("Falha ao cadastrar cliente no CRM.");
      }

      // 2. Criar orçamento rascunho correspondente
      await addOrcamento({
        ref: gerarRef(),
        cliente: clienteCriado.nome,
        cliente_id: clienteCriado.id,
        valor: valorBase,
        unidades: unidades,
        area: area || 48,
        padrao: form.padrao,
        status: "Aguardando resposta",
        criado: new Date().toLocaleDateString("pt-BR"),
      });

      mostrarToast("🎉 Cliente cadastrado e Orçamento gerado com sucesso!");
      onClose();
    } catch (err) {
      console.error(err);
      mostrarToast(`❌ Erro ao salvar dados: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    color: C.muted,
    marginBottom: 6,
    textTransform: "uppercase",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!hasApiKey && (
        <div style={{
          background: C.danger + "11",
          border: `1px solid ${C.danger}44`,
          borderRadius: 8,
          padding: 12,
          color: C.danger,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          ⚠️ <strong>Chave da OpenAI ausente:</strong> configure sua API Key em <strong>Configurações do Sistema</strong> (aba <em>Sistema</em>) para ativar o cadastro por IA.
        </div>
      )}

      {step === 1 ? (
        <>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
            Cole o conteúdo do e-mail de solicitação de orçamento ou proposta abaixo. A inteligência artificial identificará os dados de contato e do projeto automaticamente.
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: Bom dia! Gostaria de receber uma proposta de construção de casa em Steel Frame com 150m², padrão Alto Padrão na cidade de Sorocaba/SP. Meu nome é Alexandre, e meu WhatsApp é (15) 99999-8888..."
            disabled={!hasApiKey || loading}
            style={{
              width: "100%",
              height: 180,
              padding: "12px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "#fff",
              color: C.text,
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
              resize: "none",
              transition: "border-color .15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.red)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Btn>
            <Btn
              onClick={analisarTexto}
              disabled={!hasApiKey || loading || !text.trim()}
            >
              {loading ? "🤖 Analisando proposta…" : "🤖 Analisar com IA"}
            </Btn>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, color: C.muted }}>
            Revise os dados extraídos pela inteligência artificial abaixo antes de efetuar o cadastro:
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Nome do Cliente</div>
              <Input
                value={form.nome}
                onChange={(v) => setForm((f) => ({ ...f, nome: v }))}
                placeholder="Ex: João da Silva"
              />
            </div>
            <div>
              <div style={labelStyle}>Cidade / UF</div>
              <Input
                value={form.cidade}
                onChange={(v) => setForm((f) => ({ ...f, cidade: v }))}
                placeholder="Ex: Sorocaba/SP"
              />
            </div>
            <div>
              <div style={labelStyle}>Contato (WhatsApp)</div>
              <Input
                value={form.contato}
                onChange={(v) => setForm((f) => ({ ...f, contato: v }))}
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
            <div>
              <div style={labelStyle}>E-mail</div>
              <Input
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="Ex: joao@email.com"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Área da Obra (m²)</div>
              <Input
                type="number"
                value={form.area_m2}
                onChange={(v) => setForm((f) => ({ ...f, area_m2: v }))}
                placeholder="Ex: 150"
              />
            </div>
            <div>
              <div style={labelStyle}>Unidades</div>
              <Input
                type="number"
                value={form.unidades}
                onChange={(v) => setForm((f) => ({ ...f, unidades: v }))}
                placeholder="Ex: 1"
              />
            </div>
            <div>
              <div style={labelStyle}>Padrão Construtivo</div>
              <Select
                value={form.padrao}
                onChange={(v) => setForm((f) => ({ ...f, padrao: v }))}
                options={[
                  { value: "Econômico", label: "Econômico" },
                  { value: "Padrão", label: "Padrão" },
                  { value: "Alto Padrão", label: "Alto Padrão" },
                ]}
              />
            </div>
          </div>

          <div>
            <div style={labelStyle}>Observações do Projeto</div>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              placeholder="Preferências, notas, etc."
              style={{
                width: "100%",
                height: 70,
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "#fff",
                color: C.text,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                resize: "none",
                transition: "border-color .15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = C.red)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            <Btn variant="ghost" onClick={() => setStep(1)} disabled={saving}>← Voltar</Btn>
            <Btn onClick={handleSalvar} disabled={saving}>
              {saving ? "Gravando no CRM…" : "💾 Confirmar e Cadastrar"}
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}
