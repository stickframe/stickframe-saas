// ─────────────────────────────────────────────────────────────────────────────
// StickQuote™ AI Vision Engine
// Interpreta visualmente uma planta arquitetônica (PDF imagem / PNG / JPG) e
// extrai elementos para alimentar o mesmo pipeline de orçamento Steel Frame.
//
// Fluxo:  Imagem da planta → OpenAI Vision → elementos → StickTrust™ → revisão
//         humana → calcMotorComposicao()
//
// PRIVACIDADE: enviamos APENAS a imagem do desenho técnico (geometria) para a IA.
// O prompt instrui o modelo a extrair somente medidas/quantidades — nunca dados
// pessoais, senhas ou informações privadas.
// ─────────────────────────────────────────────────────────────────────────────

import { sb } from "../services/supabase";

async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjsLib;
}

// Converte o arquivo enviado em uma ou mais imagens (data URL base64).
// - Imagem (PNG/JPG): usa direto.
// - PDF: renderiza até `maxPaginas` páginas em canvas de alta resolução.
async function arquivoParaImagens(file, maxPaginas = 3) {
  if (file.type.startsWith("image/")) {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    return [dataUrl];
  }

  if (file.type === "application/pdf") {
    const pdfjsLib = await loadPdfJs();
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const total = Math.min(pdf.numPages, maxPaginas);
    const imgs = [];
    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      // Escala alvo ~1600px de largura para boa leitura de cotas pela IA.
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2.5, Math.max(1.2, 1600 / base.width));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      imgs.push(canvas.toDataURL("image/jpeg", 0.85));
    }
    return imgs;
  }

  throw new Error("Formato não suportado. Envie PNG, JPG ou PDF.");
}

// Traduz erros comuns da OpenAI em mensagens claras com o próximo passo.
function mensagemErroOpenAI(status, code, raw) {
  if (status === 429 || code === "insufficient_quota") {
    return "Sua conta OpenAI está sem saldo (erro de cota). Adicione crédito em platform.openai.com/account/billing — a API é pré-paga e separada do ChatGPT. Com US$ 5 você analisa centenas de plantas.";
  }
  if (status === 401 || code === "invalid_api_key") {
    return "Chave OpenAI inválida ou revogada. Gere uma nova em platform.openai.com/api-keys e atualize em Configurações → IA.";
  }
  if (status === 403) {
    return "A chave OpenAI não tem permissão para este modelo. Verifique as permissões da chave (precisa de acesso a modelos de visão como gpt-4o).";
  }
  if (status === 400 && /image|content|invalid/i.test(raw || "")) {
    return "A imagem da planta não pôde ser processada. Tente um PDF/PNG/JPG mais nítido ou com menos páginas.";
  }
  if (status === 413) {
    return "Arquivo grande demais para a IA. Envie uma planta com resolução menor ou menos páginas.";
  }
  if (status >= 500) {
    return "A OpenAI está temporariamente indisponível. Tente novamente em alguns instantes.";
  }
  return `Falha na análise por IA (erro ${status}). Tente novamente; se persistir, verifique sua chave e saldo em Configurações → IA.`;
}

const PROMPT_SISTEMA = `Você é um especialista em leitura de plantas arquitetônicas e levantamento de quantitativos para construção em Steel Frame (LSF). Receberá imagem(ns) de uma planta baixa. Analise VISUALMENTE o desenho e extraia apenas informações geométricas e de quantidades. NUNCA inclua nomes de pessoas, endereços, telefones ou qualquer dado pessoal — apenas medidas e contagens.

Responda EXCLUSIVAMENTE com um objeto JSON válido (sem markdown, sem cercas de código) no formato:
{
  "ambientes": [{ "nome": "Sala", "area": 20.5 }],
  "areaConstruida": 0,
  "areaConstruidaOrigem": "texto" | "calculo" | "inferencia",
  "perimetroExterno": 0,
  "peDireito": 2.7,
  "paredesExternas_m2": 0,
  "paredesInternas_m2": 0,
  "aberturas": { "portas": 0, "janelas": 0 },
  "cotasEncontradas": 0,
  "textoLegivel": true,
  "escalaIdentificada": true,
  "observacoes": "breve nota técnica"
}

Regras:
- areaConstruida: priorize valor escrito na planta (ex.: "Área construída: 303 m²"); senão some as áreas dos ambientes; senão estime e marque origem "inferencia".
- Se houver cotas (ex.: 5,00  3,20), use-as para estimar perímetro e paredes. paredesExternas_m2 ≈ perímetroExterno × peDireito. paredesInternas_m2 ≈ estimativa pela divisão interna.
- Conte portas e janelas pelos símbolos.
- peDireito: use 2,70 se não houver indicação.
- Use ponto decimal. Todos os números em metros / m². Se não conseguir um campo, use 0 (ou false para os booleanos).`;

// Calcula o StickTrust™ (0–100) a partir da qualidade da leitura visual.
function calcularStickTrust(d) {
  let s = 25; // base para visão (incerteza inerente)
  if (d.textoLegivel) s += 12;
  if (d.escalaIdentificada) s += 12;
  if ((d.cotasEncontradas || 0) >= 4) s += 18;
  else if ((d.cotasEncontradas || 0) >= 1) s += 8;
  if (d.areaConstruidaOrigem === "texto") s += 18;
  else if (d.areaConstruidaOrigem === "calculo") s += 8;
  if (Array.isArray(d.ambientes) && d.ambientes.length >= 4) s += 8;
  else if (Array.isArray(d.ambientes) && d.ambientes.length >= 1) s += 4;
  if ((d.aberturas?.portas || 0) + (d.aberturas?.janelas || 0) > 0) s += 5;
  s = Math.max(15, Math.min(95, Math.round(s)));
  const nivel = s >= 75 ? "alto" : s >= 50 ? "medio" : "baixo";
  return { confianca: s, nivel };
}

// Extrai o JSON do conteúdo retornado pela IA (tolerante a cercas/lixo).
function parseJSON(content) {
  if (!content) throw new Error("Resposta vazia da IA.");
  let txt = content.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  const ini = txt.indexOf("{");
  const fim = txt.lastIndexOf("}");
  if (ini >= 0 && fim > ini) txt = txt.slice(ini, fim + 1);
  return JSON.parse(txt);
}

/**
 * Analisa uma planta (PDF imagem / PNG / JPG) usando IA de visão.
 * @returns objeto padronizado para o pipeline StickQuote.
 */
export async function analisarVision(file, { empresaId } = {}) {
  const imagens = await arquivoParaImagens(file);

  const userContent = [
    { type: "text", text: "Analise esta(s) planta(s) e retorne o JSON de quantitativos conforme as regras." },
    ...imagens.map((url) => ({ type: "image_url", image_url: { url, detail: "high" } })),
  ];

  // A chamada à OpenAI roda no servidor (Edge Function openai-vision-proxy): o
  // navegador não pode chamar api.openai.com direto (sem CORS → "Failed to fetch").
  // A chave fica no servidor (lida de ia_config pela service role).
  const { data, error } = await sb.functions.invoke("openai-vision-proxy", {
    body: {
      empresaId,
      messages: [
        { role: "system", content: PROMPT_SISTEMA },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    },
  });

  if (error) throw new Error(`Falha ao contatar o serviço de visão: ${error.message}`);
  if (data?.error === "openai_error") throw new Error(mensagemErroOpenAI(data.status, data.code, data.raw));
  if (data?.error) throw new Error(data.error);

  const content = data?.content || "";
  const d = parseJSON(content);

  // Normaliza números
  const num = (v) => Number(v) || 0;
  const ambientes = Array.isArray(d.ambientes)
    ? d.ambientes.map((a) => ({ nome: String(a.nome || "Ambiente"), area: num(a.area) })).filter((a) => a.area >= 0)
    : [];

  const somaAmbientes = ambientes.reduce((acc, a) => acc + a.area, 0);
  const areaConstruida = num(d.areaConstruida) || somaAmbientes;
  const peDireito = num(d.peDireito) || 2.7;
  const perimetroExterno = num(d.perimetroExterno);

  let paredesExternas = num(d.paredesExternas_m2);
  if (!paredesExternas && perimetroExterno) paredesExternas = perimetroExterno * peDireito;
  if (!paredesExternas && areaConstruida) paredesExternas = Math.round(Math.sqrt(areaConstruida) * 4 * peDireito);

  let paredesInternas = num(d.paredesInternas_m2);
  if (!paredesInternas && areaConstruida) paredesInternas = Math.round(areaConstruida * 0.7 * peDireito / 3);

  const { confianca, nivel } = calcularStickTrust(d);

  return {
    origem: "VISION",
    origemDetalhe: file.type === "application/pdf" ? "PDF imagem (IA Vision)" : "Imagem (IA Vision)",
    modeloIA: modelo,
    confianca,
    nivel,

    areaConstruida: Math.round(areaConstruida * 10) / 10,
    areaConstruidaOrigem: d.areaConstruidaOrigem || (num(d.areaConstruida) ? "texto" : "calculo"),

    ambientes,
    paredesExternas: Math.round(paredesExternas),
    paredesInternas: Math.round(paredesInternas),
    forro: Math.round(areaConstruida * 10) / 10,
    cobertura: Math.round(areaConstruida * 1.15 * 10) / 10,
    alturaMedia: peDireito,
    perimetroExt: Math.round(perimetroExterno),

    aberturas: {
      portas: num(d.aberturas?.portas),
      janelas: num(d.aberturas?.janelas),
    },
    cotaCount: num(d.cotasEncontradas),
    textoLegivel: !!d.textoLegivel,
    escalaIdentificada: !!d.escalaIdentificada,

    precisaManual: areaConstruida === 0,
    observacoes: String(d.observacoes || ""),

    metadados: {
      area: { valor: Math.round(areaConstruida * 10) / 10, tipo: d.areaConstruidaOrigem === "texto" ? "extraido" : "inferido", origem: "ia_vision" },
      paredesExternas: { valor: Math.round(paredesExternas), tipo: num(d.paredesExternas_m2) ? "extraido" : "inferido", origem: "ia_vision" },
      paredesInternas: { valor: Math.round(paredesInternas), tipo: num(d.paredesInternas_m2) ? "extraido" : "inferido", origem: "ia_vision" },
    },
  };
}
