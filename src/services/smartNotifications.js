import { sb } from "./supabase";

// Checks to run after data loads — each returns array of { tipo, titulo, mensagem, urgencia, link }
export async function gerarAlertas(empresaId) {
  const alertas = [];
  const hoje = new Date();

  try {
    // ── 1. Obras com prazo próximo mas baixo progresso ──
    const { data: obras } = await sb
      .from("obras")
      .select("id, nome, prazo, progresso, status")
      .eq("empresa_id", empresaId)
      .eq("status", "Em andamento")
      .not("prazo", "is", null);

    if (obras) {
      for (const obra of obras) {
        const diasRestantes = Math.ceil((new Date(obra.prazo) - hoje) / 86400000);
        const progresso = obra.progresso || 0;
        if (diasRestantes > 0 && diasRestantes <= 14 && progresso < 80) {
          alertas.push({
            tipo: "prazo_obra",
            titulo: `Obra "${obra.nome}" pode atrasar`,
            mensagem: `${diasRestantes} dias restantes, ${progresso}% concluído. Avalie o cronograma.`,
            urgencia: diasRestantes <= 7 ? "alta" : "media",
            link: "obras",
            obraId: obra.id,
          });
        }
      }
    }

    // ── 2. Follow-ups de clientes vencidos ──
    const { data: clientes } = await sb
      .from("clientes")
      .select("id, nome, proximo_contato, status")
      .eq("empresa_id", empresaId)
      .not("proximo_contato", "is", null)
      .lte("proximo_contato", hoje.toISOString().split("T")[0])
      .in("status", ["Lead", "Negociação"]);

    if (clientes) {
      for (const c of clientes) {
        const diasAtraso = Math.ceil((hoje - new Date(c.proximo_contato)) / 86400000);
        alertas.push({
          tipo: "followup_vencido",
          titulo: `Follow-up vencido: ${c.nome}`,
          mensagem: `Contato agendado há ${diasAtraso} dia(s). Status: ${c.status}.`,
          urgencia: diasAtraso >= 3 ? "alta" : "media",
          link: "crm",
          clienteId: c.id,
        });
      }
    }

    // ── 3. Diário de obra sem registro há mais de 15 dias ──
    const { data: diarios } = await sb
      .from("diario_obra")
      .select("obra_id, data")
      .eq("empresa_id", empresaId)
      .order("data", { ascending: false });

    if (diarios && obras) {
      const ultimoRegistro = {};
      for (const d of diarios) {
        if (!ultimoRegistro[d.obra_id]) ultimoRegistro[d.obra_id] = d.data;
      }
      for (const obra of (obras || [])) {
        const ultimo = ultimoRegistro[obra.id];
        if (!ultimo) continue;
        const dias = Math.ceil((hoje - new Date(ultimo)) / 86400000);
        if (dias >= 15) {
          alertas.push({
            tipo: "diario_parado",
            titulo: `Diário parado: ${obra.nome}`,
            mensagem: `Sem registro no Diário de Obra há ${dias} dias.`,
            urgencia: dias >= 30 ? "alta" : "media",
            link: "diario",
            obraId: obra.id,
          });
        }
      }
    }

    // ── 4. Medição não registrada há 30 dias em obra ativa ──
    const { data: medicoes } = await sb
      .from("medicoes")
      .select("obra_id, data_medicao")
      .eq("empresa_id", empresaId)
      .order("data_medicao", { ascending: false });

    if (medicoes && obras) {
      const ultimaMedicao = {};
      for (const m of medicoes) {
        if (!ultimaMedicao[m.obra_id]) ultimaMedicao[m.obra_id] = m.data_medicao;
      }
      for (const obra of (obras || [])) {
        const ultimo = ultimaMedicao[obra.id];
        if (!ultimo) continue;
        const dias = Math.ceil((hoje - new Date(ultimo)) / 86400000);
        if (dias >= 30) {
          alertas.push({
            tipo: "medicao_atrasada",
            titulo: `Medição atrasada: ${obra.nome}`,
            mensagem: `Última medição há ${dias} dias. Verifique se há serviços a medir.`,
            urgencia: "media",
            link: "medicoes",
            obraId: obra.id,
          });
        }
      }
    }
  } catch (e) {
    console.warn("smartNotifications error:", e);
  }

  return alertas;
}
