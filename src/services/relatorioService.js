import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function gerarRelatorioObra(obra, financeiro, medicoes = []) {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  // Header
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("STICKFRAME", 14, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Obra", 14, 20);
  doc.text(`Gerado em: ${hoje}`, 150, 20);

  // Obra info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(obra.nome || "Obra sem nome", 14, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Cliente: ${obra.cliente || "—"}`, 14, 48);
  doc.text(`Status: ${obra.status || "—"}`, 14, 54);
  doc.text(`Fase: ${obra.fase || "—"}`, 100, 48);
  doc.text(`Progresso: ${obra.progresso || 0}%`, 100, 54);

  // Progress bar
  doc.setFillColor(230, 230, 230);
  doc.rect(14, 60, 182, 6, "F");
  doc.setFillColor(180, 30, 30);
  doc.rect(14, 60, 182 * ((obra.progresso || 0) / 100), 6, "F");

  // Financial summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Resumo Financeiro", 14, 80);

  const receitas = financeiro?.filter(f => f.tipo === "receita") || [];
  const despesas = financeiro?.filter(f => f.tipo === "despesa") || [];
  const totalReceitas = receitas.reduce((a, f) => a + (f.valor || 0), 0);
  const totalDespesas = despesas.reduce((a, f) => a + (f.valor || 0), 0);
  const saldo = totalReceitas - totalDespesas;
  const contrato = obra.contrato || 0;
  const margem = contrato > 0 ? ((saldo / contrato) * 100).toFixed(1) : 0;

  autoTable(doc, {
    startY: 85,
    head: [["Item", "Valor"]],
    body: [
      ["Valor contratado", `R$ ${contrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Receitas lançadas", `R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Despesas lançadas", `R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Saldo", `R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Margem atual", `${margem}%`],
    ],
    headStyles: { fillColor: [180, 30, 30] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 1: { halign: "right" } },
  });

  // Lancamentos table
  if (financeiro?.length > 0) {
    const lastY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Lançamentos Financeiros", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [["Data", "Descrição", "Tipo", "Valor"]],
      body: financeiro.slice(0, 20).map(f => [
        f.data || "—",
        f.descricao || "—",
        f.tipo === "receita" ? "Receita" : "Despesa",
        `R$ ${(f.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ]),
      headStyles: { fillColor: [180, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: { 3: { halign: "right" } },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount} — StickFrame Sistemas Construtivos`, 14, 290);
  }

  doc.save(`relatorio-${(obra.nome || "obra").replace(/\s+/g, "-").toLowerCase()}-${hoje.replace(/\//g, "-")}.pdf`);
}

export function gerarRelatorioMensal(empresaNome, obras, clientes, financeiro) {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");
  const mesAno = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // Header
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("STICKFRAME", 14, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Relatório Mensal — ${mesAno}`, 14, 20);
  doc.text(`Gerado em: ${hoje}`, 140, 20);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(empresaNome || "Empresa", 14, 40);

  // KPIs
  const obrasAtivas = obras.filter(o => o.status === "Em execução").length;
  const totalReceitas = financeiro.filter(f => f.tipo === "receita").reduce((a, f) => a + (f.valor || 0), 0);
  const totalDespesas = financeiro.filter(f => f.tipo === "despesa").reduce((a, f) => a + (f.valor || 0), 0);

  autoTable(doc, {
    startY: 48,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de clientes", clientes.length],
      ["Obras ativas", obrasAtivas],
      ["Total de obras", obras.length],
      ["Receitas lançadas", `R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Despesas lançadas", `R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Saldo", `R$ ${(totalReceitas - totalDespesas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ],
    headStyles: { fillColor: [180, 30, 30] },
  });

  // Obras table
  if (obras.length > 0) {
    const lastY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Obras", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [["Obra", "Cliente", "Status", "Progresso", "Valor Contrato"]],
      body: obras.map(o => [
        o.nome || "—",
        o.cliente || "—",
        o.status || "—",
        `${o.progresso || 0}%`,
        `R$ ${(o.contrato || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ]),
      headStyles: { fillColor: [180, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount} — StickFrame Sistemas Construtivos`, 14, 290);
  }

  doc.save(`relatorio-mensal-${hoje.replace(/\//g, "-")}.pdf`);
}
