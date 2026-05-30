import * as XLSX from "xlsx";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Lista de obras ───────────────────────────────────────────────────────────
export function exportarObrasExcel(obras) {
  const rows = obras.map((o) => ({
    "Nome da Obra":    o.nome || "",
    "Cliente":         o.clientes?.nome || "",
    "Status":          o.status || "",
    "Fase Atual":      o.fase || "",
    "Progresso (%)":   o.progresso || 0,
    "Contrato (R$)":   o.contrato || 0,
    "Início":          o.prazo_inicio || "",
    "Previsão Entrega": o.prazo_fim || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [30, 24, 16, 24, 14, 16, 14, 18].map((w) => ({ wch: w }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Obras");
  XLSX.writeFile(wb, `obras-stickframe-${hoje()}.xlsx`);
}

// ─── Relatório financeiro completo ────────────────────────────────────────────
export function exportarFinanceiroExcel(obras, financeiro) {
  const wb = XLSX.utils.book_new();

  // Sheet 1 — Resumo por obra
  const resumo = obras.map((o) => {
    const fin = financeiro[o.id] || { lancamentos: [] };
    const rec = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
    const dep = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
    return {
      "Obra":           o.nome || "",
      "Cliente":        o.clientes?.nome || "",
      "Contrato (R$)":  o.contrato || 0,
      "Receitas (R$)":  rec,
      "Despesas (R$)":  dep,
      "Saldo (R$)":     rec - dep,
      "Status":         o.status || "",
      "Fase":           o.fase || "",
    };
  });
  const wsResumo = XLSX.utils.json_to_sheet(resumo.length ? resumo : [{}]);
  wsResumo["!cols"] = [28, 22, 15, 15, 15, 15, 16, 22].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo por Obra");

  // Sheet 2 — Todos os lançamentos
  const lancamentos = [];
  obras.forEach((o) => {
    const fin = financeiro[o.id] || { lancamentos: [] };
    fin.lancamentos.forEach((l) => {
      lancamentos.push({
        "Obra":        o.nome || "",
        "Data":        l.data || "",
        "Tipo":        l.tipo === "receita" ? "Receita" : "Despesa",
        "Categoria":   l.categoria || "",
        "Descrição":   l.descricao || "",
        "Valor (R$)":  l.tipo === "receita" ? (l.valor || 0) : -(l.valor || 0),
      });
    });
  });
  const wsLanc = XLSX.utils.json_to_sheet(lancamentos.length ? lancamentos : [{ "Obra": "Sem lançamentos" }]);
  wsLanc["!cols"] = [28, 12, 10, 18, 32, 14].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsLanc, "Lançamentos");

  XLSX.writeFile(wb, `financeiro-stickframe-${hoje()}.xlsx`);
}
