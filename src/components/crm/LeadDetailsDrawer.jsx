import { useState, useEffect, useMemo } from "react";
import { C } from "../../utils/constants";
import { calcularTemperatura, resolverOrigem, STATUS_CONFIG, calcularLeadScore } from "../../utils/crm";
import { sb } from "../../services/supabase";
import { adicionarHistoricoLead, listarHistoricoLead } from "../../services/repositories/leadHistoricoRepository";
import { criarEvento } from "../../services/repositories/agendaRepository";
import { useToast } from "../../hooks/useToast";
import useAppStore from "../../store/useAppStore";
import CrmTimeline from "./CrmTimeline";
import CrmIaAdvisor from "./CrmIaAdvisor";
import CrmWhatsAppChat from "./CrmWhatsAppChat";

export default function LeadDetailsDrawer({ lead, onClose, onUpdateStatus, onConvert, onReactivate }) {
  const user = useAppStore((s) => s.user);
  const { show: showToast } = useToast();

  // Estados locais
  const [activeTab, setActiveTab] = useState("cadastro"); // "cadastro" | "timeline" | "ia" | "whatsapp"
  const [observacao, setObservacao] = useState("");
  const [statusTemp, setStatusTemp] = useState(lead.status);
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  // Estados da Próxima Ação
  const [proximaAcao, setProximaAcao] = useState(lead.proxima_acao || "");
  const [proximaAcaoData, setProximaAcaoData] = useState(lead.proxima_acao_data || "");
  const [savingAction, setSavingAction] = useState(false);

  const temp = calcularTemperatura(lead);
  const orig = resolverOrigem(lead.origem);
  const scoreObj = calcularLeadScore(lead, timeline);

  useEffect(() => {
    setStatusTemp(lead.status);
    setObservacao("");
    carregarTimeline();
  }, [lead.id, lead.status]);

  async function carregarTimeline() {
    setLoadingTimeline(true);
    try {
      const logs = await listarHistoricoLead(lead.id);
      setTimeline(logs || []);
    } catch (e) {
      console.warn("Erro ao carregar timeline:", e);
    } finally {
      setLoadingTimeline(false);
    }
  }

  // Grava mudança de status comercial
  async function salvarStatus(novoStatus) {
    if (novoStatus === lead.status) return;
    try {
      const userNome = user?.nome || "Vendedor";
      const log = await adicionarHistoricoLead(lead.id, lead.status, novoStatus, observacao.trim(), userNome, "status_change");
      setTimeline(prev => [log, ...prev]);
      await onUpdateStatus(lead.id, novoStatus);
      setObservacao("");
    } catch (e) {
      console.error("Erro ao salvar status:", e);
    }
  }

  // Adiciona logs manuais (Nota, Telefonema, Reunião, Visita)
  async function handleAddLog(tipo, textoLog) {
    const userNome = user?.nome || "Vendedor";
    const log = await adicionarHistoricoLead(lead.id, lead.status, lead.status, textoLog, userNome, tipo);
    setTimeline(prev => [log, ...prev]);
    showToast("Interação comercial registrada com sucesso!");
  }

  // Envia ou simula recebimento de mensagens WhatsApp
  async function handleWhatsAppMessage(tipo, textoMsg, autorNome = null) {
    const userNome = autorNome || user?.nome || "Vendedor";
    const log = await adicionarHistoricoLead(lead.id, lead.status, lead.status, textoMsg, userNome, tipo, { status: "entregue" });
    setTimeline(prev => [log, ...prev]);
  }

  // Salva lembrete e sincroniza com a agenda
  async function handleSaveNextAction() {
    if (!proximaAcao) return;
    setSavingAction(true);
    try {
      await sb.from("pre_orcamentos").update({
        proxima_acao: proximaAcao,
        proxima_acao_data: proximaAcaoData || null
      }).eq("id", lead.id);

      if (proximaAcaoData) {
        await criarEvento({
          titulo: `Ação Lead: ${proximaAcao} — ${lead.nome}`,
          descricao: `Follow-up comercial com lead ${lead.nome}. Cidade: ${lead.cidade || "Não informada"}. Contato: ${lead.contato}`,
          data: proximaAcaoData,
          hora: "09:00",
          tipo: proximaAcao.includes("visita") ? "Visita de obra" : "Reunião com cliente",
          cor: C.purple,
          cliente_id: lead.cliente_id || null
        });
      }

      const userNome = user?.nome || "Vendedor";
      const logText = `Ação comercial agendada: "${proximaAcao}" para ${proximaAcaoData ? new Date(proximaAcaoData + "T00:00:00").toLocaleDateString("pt-BR") : "sem data"}`;
      const log = await adicionarHistoricoLead(lead.id, lead.status, lead.status, logText, userNome, "note");
      setTimeline(prev => [log, ...prev]);

      showToast("Lembrete comercial salvo e sincronizado na Agenda!");
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAction(false);
    }
  }

  // SLA Comercial Calculado
  const slaStats = useMemo(() => {
    const dataCadastro = new Date(lead.created_at);
    const horasCadastro = (Date.now() - dataCadastro.getTime()) / 36e5;
    
    let tempoUltimoContato = "Sem contato";
    let horasUltimoContato = 999;
    if (timeline.length > 0) {
      const maisRecente = new Date(timeline[0].created_at);
      horasUltimoContato = (Date.now() - maisRecente.getTime()) / 36e5;
      tempoUltimoContato = horasUltimoContato < 24
        ? `${Math.floor(horasUltimoContato)}h atrás`
        : `${Math.floor(horasUltimoContato / 24)} dias atrás`;
    }

    let slaCor = C.success;
    let desc = "Dentro do prazo";
    
    if (lead.status === "Novo") {
      if (horasCadastro > 24) { slaCor = C.danger; desc = "SLA Estourado (>24h)"; }
      else if (horasCadastro > 4) { slaCor = C.warning; desc = "SLA Crítico (>4h)"; }
    } else if (["Em Atendimento", "Negociação", "Orçamento Enviado"].includes(lead.status)) {
      if (horasUltimoContato > 168) { slaCor = C.danger; desc = "Sem contato há 7 dias"; }
      else if (horasUltimoContato > 72) { slaCor = C.warning; desc = "Sem contato há 3 dias"; }
    }

    return {
      cadastro: horasCadastro < 24 ? `${Math.floor(horasCadastro)}h atrás` : `${Math.floor(horasCadastro / 24)} dias atrás`,
      ultimoContato: tempoUltimoContato,
      cor: slaCor,
      desc
    };
  }, [lead.created_at, lead.status, timeline]);

  const tabs = [
    { key: "cadastro", label: "Cadastro", icon: "📋" },
    { key: "timeline", label: "Timeline", icon: "⏱️" },
    { key: "ia", label: "✨ IA Advisor", icon: "" },
    { key: "whatsapp", label: "WhatsApp", icon: "💬" }
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 990 }} />

      <aside
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "92vw",
          background: C.surface, zIndex: 991, borderLeft: `1px solid ${C.border}`,
          boxShadow: "-8px 0 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column",
          animation: "slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
      >
        {/* Cabeçalho */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: orig.cor + "14", color: orig.cor, border: `1px solid ${orig.cor}2e` }}>
                {orig.dot} {orig.label}
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: scoreObj.cor + "14", color: scoreObj.cor, border: `1px solid ${scoreObj.cor}2e` }}>
                ⭐ {scoreObj.score} — {scoreObj.nivel}
              </span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>{lead.nome}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: C.muted, padding: 0 }}>×</button>
        </div>

        {/* Abas Internas */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1, padding: "10px 4px", fontSize: 11, fontWeight: 700,
                border: "none", background: activeTab === t.key ? C.surface : "transparent",
                color: activeTab === t.key ? C.purple : C.muted,
                borderBottom: activeTab === t.key ? `2px solid ${C.purple}` : "none",
                cursor: "pointer", fontFamily: "inherit"
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Corpo do Drawer */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          
          {/* Cadastro Tab */}
          {activeTab === "cadastro" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Seção SLA */}
              <div style={{ display: "flex", justifyItems: "center", gap: 10, padding: "10px 14px", background: slaStats.cor + "0f", border: `1px solid ${slaStats.cor}33`, borderRadius: 8 }}>
                <span style={{ fontSize: 16 }}>SLA</span>
                <div style={{ flex: 1, fontSize: 11 }}>
                  <div>Entrada: <strong>{slaStats.cadastro}</strong> · Último contato: <strong>{slaStats.ultimoContato}</strong></div>
                  <div style={{ fontWeight: 700, color: slaStats.cor, marginTop: 2 }}>{slaStats.desc}</div>
                </div>
              </div>

              {/* Informações Básicas */}
              <div>
                <h3 style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>📞 Dados de Contato</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                  <div>
                    <div style={{ color: C.muted, fontSize: 9 }}>WhatsApp / Telefone</div>
                    <div style={{ fontWeight: 600 }}>{lead.contato}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 9 }}>E-mail</div>
                    <div style={{ fontWeight: 600 }}>{lead.email || "Não informado"}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 9 }}>Cidade</div>
                    <div style={{ fontWeight: 600 }}>{lead.cidade || "Não informada"}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 9 }}>Empresa</div>
                    <div style={{ fontWeight: 600 }}>{lead.empresa_lead || "Não informada"}</div>
                  </div>
                </div>
              </div>

              {/* Detalhes do Projeto */}
              <div>
                <h3 style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>📐 Dimensionamento</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                  <div>
                    <div style={{ color: C.muted, fontSize: 9 }}>Área</div>
                    <div style={{ fontWeight: 600 }}>{lead.area || lead.area_m2 || "—"} m²</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 9 }}>Padrão</div>
                    <div style={{ fontWeight: 600 }}>{lead.padrao || "Padrão"}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: 9 }}>Custo Estimado</div>
                    <div style={{ fontWeight: 700, color: C.success }}>
                      R$ {Number(lead.valor_min || 0).toLocaleString("pt-BR")} – R$ {Number(lead.valor_max || 0).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulador de Próxima Ação */}
              <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px" }}>
                <h3 style={{ fontSize: 10, fontWeight: 800, color: C.purple, letterSpacing: 0.8, textTransform: "uppercase", margin: "0 0 10px" }}>📅 Agendar Próxima Ação</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <select
                    value={proximaAcao}
                    onChange={(e) => setProximaAcao(e.target.value)}
                    style={{ padding: "8px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit" }}
                  >
                    <option value="">— Selecione a Ação —</option>
                    <option value="Ligar amanhã">Ligar amanhã</option>
                    <option value="Enviar proposta">Enviar proposta</option>
                    <option value="Agendar visita">Agendar visita</option>
                    <option value="Enviar memorial">Enviar memorial</option>
                    <option value="Aguardar retorno">Aguardar retorno</option>
                  </select>

                  <input
                    type="date"
                    value={proximaAcaoData}
                    onChange={(e) => setProximaAcaoData(e.target.value)}
                    style={{ padding: "8px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit" }}
                  />

                  <button
                    onClick={handleSaveNextAction}
                    disabled={!proximaAcao || savingAction}
                    style={{
                      padding: "8px", background: C.purple, color: "#fff", border: "none",
                      borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
                    }}
                  >
                    {savingAction ? "Sincronizando..." : "Salvar e Sincronizar na Agenda"}
                  </button>
                </div>
              </div>

              {/* Status do Lead */}
              <div>
                <h3 style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>⚙️ Gestão de Status</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.keys(STATUS_CONFIG).map(st => {
                    const cfg = STATUS_CONFIG[st];
                    const active = statusTemp === st;
                    return (
                      <button
                        key={st}
                        onClick={() => setStatusTemp(st)}
                        style={{
                          padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                          cursor: "pointer", border: `1px solid ${active ? cfg.cor : C.border}`,
                          background: active ? cfg.bg : "transparent",
                          color: active ? cfg.cor : C.muted,
                          fontFamily: "inherit"
                        }}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>

                {statusTemp !== lead.status && (
                  <div style={{ marginTop: 10, animation: "fadeIn 0.15s ease-out" }}>
                    <textarea
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Motivo da alteração de status..."
                      rows={2}
                      style={{
                        width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${C.border}`,
                        fontSize: 11, fontFamily: "inherit", resize: "none", boxSizing: "border-box"
                      }}
                    />
                    <button
                      onClick={() => salvarStatus(statusTemp)}
                      style={{
                        width: "100%", padding: "8px", background: STATUS_CONFIG[statusTemp].cor,
                        color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700,
                        cursor: "pointer", marginTop: 4, fontFamily: "inherit"
                      }}
                    >
                      Confirmar Mudança
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <CrmTimeline
              lead={lead}
              timeline={timeline}
              onAddLog={handleAddLog}
            />
          )}

          {/* IA Advisor Tab */}
          {activeTab === "ia" && (
            <CrmIaAdvisor
              lead={lead}
              timeline={timeline}
            />
          )}

          {/* WhatsApp Tab */}
          {activeTab === "whatsapp" && (
            <CrmWhatsAppChat
              lead={lead}
              timeline={timeline}
              onSendMessage={handleWhatsAppMessage}
            />
          )}

        </div>

        {/* Rodapé Fixo */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, background: C.surface2, display: "flex", flexDirection: "column", gap: 6 }}>
          {["Novo", "Em Atendimento", "Negociação"].includes(lead.status) && (
            <button
              onClick={() => onConvert(lead)}
              style={{
                width: "100%", padding: "10px", background: C.success, color: "#fff", border: "none",
                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}
            >
              📋 Converter em Orçamento Comercial
            </button>
          )}

          {["Convertido", "Perdido", "Arquivado"].includes(lead.status) && (
            <button
              onClick={() => onReactivate(lead.id)}
              style={{
                width: "100%", padding: "10px", background: C.red, color: "#fff", border: "none",
                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}
            >
              🔄 Reativar Lead (Voltar para Novo)
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
