import { C } from "./constants";

/**
 * Calcula a temperatura do lead baseado na completude do cadastro,
 * valor do orçamento e idade da última interação (data de criação).
 */
export function calcularTemperatura(p) {
  let score = 0;
  
  // 1. Completude do cadastro (máx 6 pontos)
  if (p.nome) score += 1;
  if (p.contato) score += 1;
  if (p.email) score += 1;
  if (p.cidade) score += 1;
  if (p.empresa_lead) score += 1;
  if (p.tipo_obra) score += 1;
  
  // 2. Valor do orçamento (máx 1 ponto)
  const val = Number(p.valor_min || p.valor_max);
  if (val > 0) score += 1;
  
  // 3. Recência / Última interação (máx 3 pontos)
  const ageH = p.created_at ? (Date.now() - new Date(p.created_at).getTime()) / 36e5 : 999;
  if (ageH <= 24) score += 3;
  else if (ageH <= 72) score += 2;
  else if (ageH <= 168) score += 1;
  
  if (score >= 7) return { nivel: "Quente", icon: "🔥", cor: C.danger, score };
  if (score >= 4) return { nivel: "Morno",  icon: "🟡", cor: C.warning, score };
  return { nivel: "Frio", icon: "❄️", cor: C.steel, score };
}

/**
 * Mapeia as origens do lead para badges padronizados.
 */
export function resolverOrigem(origem = "") {
  const o = String(origem).toLowerCase();
  if (o.includes("calculadora")) return { label: "Calculadora", cor: C.success, dot: "🎯" };
  if (o.includes("pdf")) return { label: "PDF", cor: C.danger, dot: "📄" };
  if (o.includes("dwg")) return { label: "DWG", cor: C.steel, dot: "📐" };
  if (o.includes("vision") || o.includes("ia")) return { label: "AI Vision", cor: C.purple, dot: "🤖" };
  if (o.includes("bim")) return { label: "BIM", cor: "#805ad5", dot: "🧊" };
  if (o.includes("portal")) return { label: "Portal", cor: "#3182ce", dot: "🌐" };
  if (o.includes("manual")) return { label: "Manual", cor: C.muted, dot: "✍️" };
  
  // Default fallback
  return { label: origem || "Outra", cor: C.muted, dot: "🔗" };
}

/**
 * Cores e ícones dos status de lead para os badges e abas do CRM.
 */
export const STATUS_CONFIG = {
  "Novo": {
    label: "Novos",
    icon: "🔥",
    cor: C.danger,
    bg: C.danger + "18",
    border: C.danger + "33"
  },
  "Em Atendimento": {
    label: "Atendimento",
    icon: "🟡",
    cor: C.warning,
    bg: C.warning + "18",
    border: C.warning + "33"
  },
  "Orçamento Enviado": {
    label: "Orçamentos",
    icon: "📄",
    cor: C.purple,
    bg: C.purple + "18",
    border: C.purple + "33"
  },
  "Negociação": {
    label: "Negociação",
    icon: "🤝",
    cor: C.ochre,
    bg: C.ochre + "18",
    border: C.ochre + "33"
  },
  "Convertido": {
    label: "Convertidos",
    icon: "✅",
    cor: C.success,
    bg: C.success + "18",
    border: C.success + "33"
  },
  "Perdido": {
    label: "Perdidos",
    icon: "❌",
    cor: "#c53030",
    bg: "#c5303018",
    border: "#c5303033"
  },
  "Arquivado": {
    label: "Arquivados",
    icon: "📦",
    cor: C.muted,
    bg: C.muted + "18",
    border: C.muted + "33"
  }
};

/**
 * Calcula o Score Inteligente do Lead (0-100) com base em múltiplos critérios.
 */
export function calcularLeadScore(lead, timeline = []) {
  let score = 0;

  // 1. Completude do cadastro (máx 20 pontos)
  if (lead.nome) score += 3;
  if (lead.contato) score += 3;
  if (lead.email) score += 3;
  if (lead.cidade) score += 3;
  if (lead.empresa_lead) score += 4;
  if (lead.tipo_obra) score += 4;

  // 2. Valor Estimado do Orçamento (máx 20 pontos)
  const val = Number(lead.valor_min || lead.valor_max || 0);
  if (val >= 500000) score += 20;
  else if (val >= 250000) score += 15;
  else if (val >= 100000) score += 10;
  else if (val > 0) score += 5;

  // 3. Origem do Lead (máx 15 pontos)
  const orig = String(lead.origem || "").toLowerCase();
  if (orig.includes("bim") || orig.includes("dwg")) score += 15;
  else if (orig.includes("calculadora") || orig.includes("portal")) score += 12;
  else if (orig.includes("vision") || orig.includes("ia")) score += 10;
  else score += 5;

  // 4. Quantidade de Interações na Timeline (máx 15 pontos)
  const interacoes = timeline.length;
  if (interacoes >= 5) score += 15;
  else if (interacoes >= 3) score += 10;
  else if (interacoes >= 1) score += 5;

  // 5. Visualizações e downloads de PDF do Orçamento (máx 15 pontos)
  const pdfEvents = timeline.filter(t => ["pdf_opened", "pdf_downloaded"].includes(t.tipo)).length;
  if (pdfEvents >= 3) score += 15;
  else if (pdfEvents === 2) score += 10;
  else if (pdfEvents === 1) score += 5;

  // 6. Recência (Tempo sem contato) (máx 15 pontos)
  const ageH = lead.created_at ? (Date.now() - new Date(lead.created_at).getTime()) / 36e5 : 999;
  if (ageH <= 24) score += 15;
  else if (ageH <= 72) score += 10;
  else if (ageH <= 168) score += 5;

  // Limita o score máximo a 100
  score = Math.min(score, 100);

  if (score >= 75) return { score, nivel: "Excelente", rotulo: "Excelente", cor: C.success };
  if (score >= 45) return { score, nivel: "Bom", rotulo: "Bom", cor: C.warning };
  return { score, nivel: "Baixo", rotulo: "Baixo", cor: C.danger };
}

/**
 * Mapeia todos os tipos de eventos suportados na timeline comercial expandida.
 */
export const TIMELINE_EVENTOS = {
  "status_change": { label: "Mudança de Status", icon: "🔄", cor: C.purple },
  "lead_created": { label: "Lead Criado", icon: "🚀", cor: C.success },
  "quote_sent": { label: "Orçamento Enviado", icon: "📄", cor: C.purple },
  "pdf_opened": { label: "PDF Visualizado", icon: "👁️", cor: C.warning },
  "pdf_downloaded": { label: "PDF Baixado", icon: "📥", cor: C.warning },
  "pdf_signed": { label: "Contrato Assinado", icon: "✍️", cor: C.success },
  "pdf_declined": { label: "Orçamento Recusado", icon: "❌", cor: C.danger },
  "whatsapp_sent": { label: "WhatsApp Enviado", icon: "💬", cor: "#25D366" },
  "whatsapp_received": { label: "WhatsApp Recebido", icon: "📥", cor: "#25D366" },
  "comment": { label: "Comentário", icon: "💬", cor: C.muted },
  "note": { label: "Observação", icon: "📝", cor: C.muted },
  "call": { label: "Telefonema", icon: "📞", cor: "#3182ce" },
  "meeting": { label: "Reunião", icon: "👥", cor: "#3182ce" },
  "visit": { label: "Visita Técnica", icon: "📐", cor: C.ochre },
  "contract_created": { label: "Contrato Criado", icon: "📜", cor: C.success },
  "work_created": { label: "Obra Iniciada", icon: "🏗️", cor: C.success },
};
