import { PRECOS } from "../utils/constants";
import { fmt } from "../utils/format";

export function enviarWhatsApp(telefone, mensagem) {
  const num = (telefone || "").replace(/\D/g, "");
  const url = `https://wa.me/${num.startsWith("55") ? num : "55" + num}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

export function msgOrcamento(o) {
  return `Olá ${o.cliente}! \n\nSegue a proposta da *Stick Frame Sistemas Construtivos*:\n\n *Ref:* ${o.ref}\n *Projeto:* ${o.unidades} unid. · ${o.area} m² · ${PRECOS[o.padrao]?.label || "Padrão"}\n *Valor total:* ${fmt(o.valor)}\n *Valor/unid.:* ${fmt(o.valor / o.unidades)}\n\nPara dúvidas ou aprovação, entre em contato!\n\nStick Frame Sistemas Construtivos\nSanto André/SP`;
}

export function msgContrato(c) {
  return `Olá ${c.cliente}! \n\nSeu contrato está pronto para assinatura:\n\n *Ref:* ${c.ref}\n *Obra:* ${c.obra}\n *Valor:* ${fmt(c.valor)}\n *Prazo:* ${c.prazo}\n\nCondições: 30% assinatura · 40% estrutura · 30% entrega.\n\nStick Frame Sistemas Construtivos`;
}

export function msgCliente(c) {
  const msg =
    c.status === "Lead"
      ? "Gostaria de apresentar nossas soluções em Steel Frame para seu projeto."
      : c.status === "Em negociação"
      ? "Dando continuidade à nossa negociação, estou à disposição."
      : c.status === "Proposta enviada"
      ? "Verificando se recebeu nossa proposta e se há dúvidas."
      : "Obrigado pela confiança! Estamos à disposição.";
  return `Olá ${c.nome}! \n\n${msg}\n\nStick Frame Sistemas Construtivos\nSanto André/SP`;
}
