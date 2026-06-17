import { sb } from "./supabase";
import { sendPush } from "./pushService";

export async function verificarAlertas(empresaId, userId) {
  try {
    const hoje = new Date().toISOString().split("T")[0];
    const em7dias = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const em30dias = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    const { data: garantias } = await sb
      .from("garantias")
      .select("item, data_fim, obra_id")
      .eq("empresa_id", empresaId)
      .neq("status", "Vencida")
      .lte("data_fim", em7dias)
      .gte("data_fim", hoje);

    if (garantias?.length) {
      await sendPush(userId, {
        title: ` ${garantias.length} garantia(s) vencendo em breve`,
        body: garantias.map(g => `${g.item}: ${new Date(g.data_fim).toLocaleDateString("pt-BR")}`).join(" · "),
        url: "/obras",
      });
    }

    const { data: followups } = await sb
      .from("clientes")
      .select("nome, proximo_contato, status")
      .eq("empresa_id", empresaId)
      .lte("proximo_contato", hoje)
      .not("status", "in", '("Fechado","Em execução")');

    if (followups?.length) {
      await sendPush(userId, {
        title: ` ${followups.length} follow-up(s) pendente(s)`,
        body: followups.slice(0, 3).map(f => f.nome).join(", ") + (followups.length > 3 ? ` e mais ${followups.length - 3}` : ""),
        url: "/crm",
      });
    }

    const { data: vencidas } = await sb
      .from("garantias")
      .select("item, data_fim")
      .eq("empresa_id", empresaId)
      .lt("data_fim", hoje)
      .neq("status", "Vencida");

    if (vencidas?.length) {
      await sendPush(userId, {
        title: ` ${vencidas.length} garantia(s) vencida(s)`,
        body: vencidas.slice(0, 3).map(g => g.item).join(", "),
        url: "/obras",
      });
    }
    // Certificações vencendo em 30 dias
    const { data: certs } = await sb
      .from("certificacoes")
      .select("nr, descricao, data_validade, colaborador:colaboradores(nome)")
      .eq("empresa_id", empresaId)
      .lte("data_validade", em30dias)
      .gte("data_validade", hoje);

    if (certs?.length) {
      await sendPush(userId, {
        title: ` ${certs.length} certificação(ões) NR vencendo`,
        body: certs.slice(0, 3).map(c => `${c.colaborador?.nome} — ${c.nr}`).join(" · "),
        url: "/equipe",
      });
    }
  } catch (e) {
    console.warn("[alertas]", e.message);
  }
}
