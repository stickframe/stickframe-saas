import * as XLSX from "xlsx";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

//  Lista de obras 
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

//  Relatório financeiro completo 
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

//  Suprimentos — Pedidos 
export function exportarPedidosExcel(pedidos) {
  const rows = pedidos.map((p) => ({
    "Item":            p.item || "",
    "Quantidade":      p.quantidade || 0,
    "Unidade":         p.unidade || "",
    "Urgência":        p.urgencia || "",
    "Status":          p.status || "",
    "Obra":            p.obra?.nome || "",
    "Solicitante":     p.solicitante || "",
    "Data Pedido":     p.data_pedido || "",
    "Previsão Entrega": p.data_entrega || "",
    "Valor Unitário":  p.valor_unitario || 0,
    "Valor Total":     (p.valor_unitario || 0) * (p.quantidade || 0),
    "Observações":     p.obs || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [24, 12, 8, 10, 14, 24, 18, 14, 16, 14, 14, 30].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
  XLSX.writeFile(wb, `pedidos-suprimentos-${hoje()}.xlsx`);
}

//  Suprimentos — Estoque 
export function exportarEstoqueExcel(estoque, movimentos = []) {
  const wb = XLSX.utils.book_new();
  const wsEst = XLSX.utils.json_to_sheet(estoque.map((e) => ({
    "Item":            e.item || "",
    "Saldo":           e.quantidade || 0,
    "Unidade":         e.unidade || "",
    "Estoque Mínimo":  e.estoque_minimo || 0,
    "Localização":     e.localizacao || "",
    "Valor Unitário":  e.valor_unitario || 0,
    "Valor em Estoque": (e.valor_unitario || 0) * (e.quantidade || 0),
    "Status":          e.estoque_minimo > 0 && e.quantidade <= e.estoque_minimo ? "Abaixo do mínimo" : "OK",
  })));
  wsEst["!cols"] = [24, 10, 8, 14, 18, 14, 16, 18].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsEst, "Estoque");
  if (movimentos.length) {
    const wsMov = XLSX.utils.json_to_sheet(movimentos.map((m) => ({
      "Data/Hora":   m.created_at ? new Date(m.created_at).toLocaleString("pt-BR") : "",
      "Item":        m.estoque?.item || "",
      "Tipo":        m.tipo || "",
      "Quantidade":  m.tipo === "entrada" ? m.quantidade : -m.quantidade,
      "Observação":  m.obs || "",
    })));
    wsMov["!cols"] = [18, 24, 10, 12, 40].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsMov, "Movimentações");
  }
  XLSX.writeFile(wb, `estoque-suprimentos-${hoje()}.xlsx`);
}

//  SST — EPIs 
export function exportarEpisExcel(epis) {
  const rows = epis.map((e) => ({
    "Colaborador":    e.colaborador?.nome || "",
    "Item EPI":       e.item || "",
    "Quantidade":     e.quantidade || 1,
    "Data Entrega":   e.data_entrega || "",
    "Validade":       e.validade || "",
    "Status Validade": !e.validade ? "Sem validade" : new Date(e.validade) < new Date() ? "VENCIDO" : "OK",
    "Assinado":       e.assinado ? "Sim" : "Não",
    "Obra":           e.obra?.nome || "",
    "Observações":    e.obs || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [24, 22, 10, 14, 12, 16, 10, 24, 30].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "EPIs");
  XLSX.writeFile(wb, `epis-sst-${hoje()}.xlsx`);
}

//  SST — DDS 
export function exportarDdsExcel(dds) {
  const rows = dds.map((d) => ({
    "Data":           d.data || "",
    "Tema":           d.tema || "",
    "Facilitador":    d.facilitador || "",
    "Obra":           d.obra?.nome || "",
    "Participantes":  (d.participantes || []).join(", "),
    "Nº Participantes": (d.participantes || []).length,
    "Assinaturas":    d.assinaturas_count || 0,
    "Observações":    d.obs || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [12, 30, 22, 24, 40, 14, 12, 30].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DDS");
  XLSX.writeFile(wb, `dds-sst-${hoje()}.xlsx`);
}
