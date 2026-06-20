import { useState, useEffect } from "react";
import { sb } from "../../services/supabase";
import useAppStore from "../../store/useAppStore";
import { C } from "../../utils/constants";
import { printHtml } from "../../utils/printHtml";
import Btn from "./Btn";
import Modal from "./Modal";
import { useToast } from "../../hooks/useToast";

export default function FormAiMemorial({ orcamento, onClose }) {
  const empresaId = useAppStore((s) => s.empresaId);
  const { mostrarToast } = useToast();
  const [openaiConfig, setOpenaiConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loading, setLoading] = useState(false);
  const [memorialText, setMemorialText] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "Analisando parâmetros do orçamento...",
    "Dimensionando radier de concreto armado...",
    "Especificando estrutura em perfis de aço Z275...",
    "Estruturando fechamento externo com Glasroc X...",
    "Detelhando isolamento termoacústico...",
    "Definindo instalações elétricas e hidráulicas PEX...",
    "Ajustando memorial para padrão " + (orcamento.padrao || "Padrão") + "...",
    "Finalizando redação técnica do documento..."
  ];

  useEffect(() => {
    if (empresaId) {
      sb.from("ia_config")
        .select("*")
        .eq("empresa_id", empresaId)
        .single()
        .then(({ data }) => {
          if (data && data.openai_key) {
            setOpenaiConfig(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingConfig(false));
    } else {
      setLoadingConfig(false);
    }
  }, [empresaId]);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((s) => (s + 1) % loadingMessages.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  async function gerarMemorial() {
    if (!openaiConfig || !openaiConfig.openai_key) return;
    setLoading(true);
    setLoadingStep(0);
    try {
      const prompt = `Você é um engenheiro civil sênior especializado em sistemas construtivos inovadores, em especial Light Steel Frame (LSF).
Gere um Memorial Descritivo Técnico extremamente completo, profissional e detalhado para um cliente interessado em construir.

Dados do Projeto:
- Cliente: ${orcamento.cliente || "Não informado"}
- Área Privativa: ${orcamento.area} m² por unidade
- Quantidade de Unidades: ${orcamento.unidades || 1} unidades (Área total de ${orcamento.area * (orcamento.unidades || 1)} m²)
- Padrão Construtivo: ${orcamento.padrao || "Padrão"}
- Cidade/Localidade: ${orcamento.cidade || "Sorocaba/SP"}

O documento deve ser estruturado em seções numeradas, detalhando rigorosamente:
1. INTRODUÇÃO E DADOS GERAIS (apresentação do sistema LSF e dos dados acima)
2. SERVIÇOS PRELIMINARES E CANTEIRO (limpeza do terreno, instalações provisórias, locação da obra)
3. INFRAESTRUTURA / FUNDAÇÃO (dimensionamento típico de fundação em radier de concreto armado para Steel Frame, espessura típica de 12cm a 15cm, malha de aço, tubulações hidrossanitárias embutidas)
4. ESTRUTURA LIGHT STEEL FRAME (detalhamento dos perfis de aço estrutural galvanizado Z275, montantes com espessuras de 0.90mm a 1.25mm espaçados a cada 400mm ou 600mm, guias, ligações parafusadas com parafusos ponta broca/agulha, contraventamentos com fitas de aço galvanizado)
5. FECHAMENTO EXTERNO (placa OSB estrutural de 11.1mm, barreira de vapor/água transpirável tipo Tyvek, placa cimentícia ou placa Glasroc X de 12.5mm, tratamento de juntas com fita de fibra de vidro e base coat)
6. ISOLAMENTO TERMOACÚSTICO (lã de rocha ou lã de vidro nos vãos de montantes, espessura mínima de 50mm, garantindo conforto térmico e acústico superior)
7. FECHAMENTO INTERNO / PAREDES (placas de gesso acartonado Drywall de 12.5mm: placas Standard - ST nas áreas secas, placas Resistentes à Umidade - RU nas áreas molhadas, tratamento de juntas com fita de papel e massa própria)
8. INSTALAÇÕES ELÉTRICAS E HIDROSSANITÁRIAS (instalações elétricas com mangueiras corrugadas anti-chamas por dentro dos painéis, fiação de cobre de alta qualidade. Instalações hidráulicas em tubulações de PEX ou CPVC, garantindo baixíssimo ruído e flexibilidade física)
9. COBERTURA (estrutura de tesouras em Steel Frame ou perfis metálicos, isolamento termoacústico, subtelha/telha termoacústica de aço ou telhas de concreto/fibrocimento conforme padrão construtivo)
10. PADRÕES E MATERIAIS DE ACABAMENTO (adequado ao padrão construtivo ${orcamento.padrao || "Padrão"}: especifique o tipo de louças, revestimentos cerâmicos/porcelanatos, esquadrias de alumínio ou PVC, pintura acrílica, etc.)
11. PRAZOS DE GARANTIA E ASSISTÊNCIA TÉCNICA (garantia de 5 anos para problemas estruturais, 1 ano para instalações e impermeabilizações de acordo com a norma NBR 15575 de desempenho)

Escreva o texto em português, com termos formais e de engenharia civil, com alto teor técnico e sem abreviações informais. Retorne apenas o texto do memorial formatado em markdown limpo (use títulos #, ##, listas e negritos) e sem blocos de código markdown (\`\`\`markdown) ao redor do texto.`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiConfig.openai_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openaiConfig.modelo_openai || "gpt-4o-mini",
          messages: [
            { role: "system", content: "Você é um assistente de engenharia civil especializado em LSF. Retorne apenas o texto do memorial descritivo em formato markdown limpo, sem códigos de bloco markdown." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chamada OpenAI falhou com status ${res.status}`);
      }

      const resData = await res.json();
      const content = resData.choices?.[0]?.message?.content?.trim() || "";
      const cleanMarkdown = content.replace(/^```markdown/, "").replace(/```$/, "").trim();
      setMemorialText(cleanMarkdown);
    } catch (err) {
      console.error(err);
      mostrarToast(`❌ Erro no processamento por IA: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  function copiarParaTransferencia() {
    navigator.clipboard.writeText(memorialText);
    mostrarToast(" Memorial copiado para a área de transferência!");
  }

  function imprimirPdf() {
    // Convert markdown headers/lists to nice HTML for print
    let formattedHtml = memorialText
      .replace(/### (.*)/g, "<h3 style='font-size: 14px; font-weight: 800; color: #1a1a1a; margin-top: 14px; margin-bottom: 6px; text-transform: uppercase;'>$1</h3>")
      .replace(/## (.*)/g, "<h2 style='font-size: 16px; font-weight: 800; color: #981915; margin-top: 24px; margin-bottom: 10px; border-bottom: 2px solid #981915; padding-bottom: 4px; text-transform: uppercase;'>$1</h2>")
      .replace(/# (.*)/g, "<h1 style='font-size: 22px; font-weight: 900; color: #981915; margin-top: 30px; margin-bottom: 15px; border-bottom: 3px solid #981915; padding-bottom: 6px; text-align: center; text-transform: uppercase;'>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n- (.*)/g, "<li style='font-size: 12.5px; line-height: 1.6; margin-left: 20px;'>$1</li>")
      .replace(/\n\n/g, "<p style='font-size: 12.5px; line-height: 1.7; color: #374151; margin-bottom: 12px; text-align: justify;'></p>")
      .replace(/\n/g, "<br/>");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Memorial Descritivo — ${orcamento.cliente || "Obra"}</title>
<style>
  @page { size: A4 portrait; margin: 25mm 20mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; margin: 0; padding: 0; }
  .document { max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 30px; }
  .header h4 { font-size: 10px; color: #9ca3af; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
  .header h3 { font-size: 14px; font-weight: 800; color: #981915; margin: 4px 0 0 0; }
  .footer { border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 40px; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
  }
</style>
</head><body>
<div class="document">
  <div class="header">
    <div>
      <h4>Stick Frame Sistemas Construtivos</h4>
      <h3>MEMORIAL DESCRITIVO DE OBRA</h3>
    </div>
    <div style="text-align: right;">
      <h4 style="color: #1a1a1a;">${orcamento.cliente || "Cliente"}</h4>
      <p style="font-size: 9px; color: #9ca3af; margin: 2px 0 0 0;">Área: ${orcamento.area} m² · Unidades: ${orcamento.unidades || 1}</p>
    </div>
  </div>
  
  <div class="content">
    ${formattedHtml}
  </div>
  
  <div class="footer">
    <span>Stick Frame Sistemas Construtivos</span>
    <span>powered by stickframe.com.br</span>
  </div>
</div>
</body></html>`;

    printHtml(html, `memorial-descritivo-${(orcamento.cliente || "obra").replace(/\s+/g,"-").toLowerCase()}`);
  }

  if (loadingConfig) {
    return (
      <Modal title=" Memorial Descritivo via IA" onClose={onClose}>
        <div style={{ padding: 24, textAlign: "center", color: C.muted }}>
          Carregando configurações...
        </div>
      </Modal>
    );
  }

  if (!openaiConfig || !openaiConfig.openai_key) {
    return (
      <Modal title=" Memorial Descritivo via IA" onClose={onClose}>
        <div style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}></div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>Chave OpenAI não configurada</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 20 }}>
            Para gerar memoriais técnicos via IA, você precisa cadastrar sua chave de API da OpenAI nas configurações do sistema.
          </div>
          <Btn variant="ghost" onClick={onClose}>Fechar</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title=" Memorial Descritivo via IA" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 320, maxWidth: 680 }}>
        {/* Info do orçamento */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: C.dark, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: C.muted, fontWeight: 600 }}>Cliente:</span> <strong style={{ color: C.text }}>{orcamento.cliente}</strong>
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: C.muted, fontWeight: 600 }}>Padrão:</span> <strong style={{ color: C.text }}>{orcamento.padrao}</strong>
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: C.muted, fontWeight: 600 }}>Área:</span> <strong style={{ color: C.text }}>{orcamento.area} m²</strong>
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: C.muted, fontWeight: 600 }}>Unidades:</span> <strong style={{ color: C.text }}>{orcamento.unidades || 1}</strong>
          </div>
        </div>

        {/* Estado da Geração */}
        {!memorialText && !loading && (
          <div style={{ padding: "30px 20px", textAlign: "center", border: `1.5px dashed ${C.border}`, borderRadius: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}></div>
            <div style={{ fontWeight: 800, fontSize: 17, color: C.text, marginBottom: 6 }}>Gerador de Memorial Construtivo</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 24, maxWidth: 460, margin: "0 auto" }}>
              Nossa inteligência artificial analisará os dados do orçamento para gerar uma especificação técnica formal da fundação, estrutura, vedações, coberturas e prazos de garantia.
            </div>
            <Btn onClick={gerarMemorial} style={{ margin: "0 auto" }}>
               Gerar Memorial Descritivo
            </Btn>
          </div>
        )}

        {loading && (
          <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 42, height: 42, border: `3.5px solid ${C.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{loadingMessages[loadingStep]}</div>
            <div style={{ fontSize: 12, color: C.muted }}>Esta operação pode levar de 30 a 60 segundos dependendo da API.</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {memorialText && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              maxHeight: "380px", overflowY: "auto", background: C.dark,
              border: `1px solid ${C.border}`, borderRadius: 12, padding: 18,
              fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 13.5, lineHeight: 1.6,
              color: C.text, boxSizing: "border-box", textAlign: "justify"
            }}>
              {memorialText.split("\n").map((line, idx) => {
                if (line.startsWith("### ")) {
                  return <h3 key={idx} style={{ fontSize: 13.5, fontWeight: 700, marginTop: 12, marginBottom: 4, textTransform: "uppercase" }}>{line.replace("### ", "")}</h3>;
                }
                if (line.startsWith("## ")) {
                  return <h2 key={idx} style={{ fontSize: 14.5, fontWeight: 800, color: C.red, marginTop: 18, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 2, textTransform: "uppercase" }}>{line.replace("## ", "")}</h2>;
                }
                if (line.startsWith("# ")) {
                  return <h1 key={idx} style={{ fontSize: 18, fontWeight: 900, color: C.red, marginTop: 20, marginBottom: 12, textAlign: "center", textTransform: "uppercase" }}>{line.replace("# ", "")}</h1>;
                }
                if (line.startsWith("- ")) {
                  return <li key={idx} style={{ marginLeft: 16, marginBottom: 4 }}>{line.replace("- ", "")}</li>;
                }
                if (!line.trim()) return <div key={idx} style={{ height: 8 }} />;
                return <p key={idx} style={{ marginBottom: 8 }}>{line}</p>;
              })}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setMemorialText("")}>
                ↺ Refazer
              </Btn>
              <Btn variant="ghost" onClick={copiarParaTransferencia}>
                 Copiar Texto
              </Btn>
              <Btn onClick={imprimirPdf}>
                 Imprimir / Salvar PDF
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
