import { useState, useEffect, useMemo } from "react";
import { sb, getEmpresaId } from "../../services/supabase";
import { C } from "../../utils/constants";
import { calcularTemperatura, resolverOrigem, STATUS_CONFIG } from "../../utils/crm";
import { playNotificationSound } from "../../utils/audio";
import { adicionarHistoricoLead } from "../../services/repositories/leadHistoricoRepository";
import useAppStore from "../../store/useAppStore";
import LeadCard from "./LeadCard";
import LeadDetailsDrawer from "./LeadDetailsDrawer";
import CrmKanban from "./CrmKanban";
import CrmDashboard from "./CrmDashboard";
import CrmAlerts from "./CrmAlerts";
import { Zap, Phone, FileText, Users, CheckCircle, XCircle, Box, Search } from "../ui/Icon";

const STATUS_ICONS = { Zap, Phone, FileText, Users, CheckCircle, XCircle, Box };

export default function CalculadoraLeadsCRM({ onConvertLead }) {
  const user = useAppStore((s) => s.user);

  // Estados principais
  const [preOrcamentos, setPreOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("Novo");
  const [leadSelecionado, setLeadSelecionado] = useState(null);
  
  // Toggle de visualização: "lista" | "kanban" | "metricas"
  const [viewMode, setViewMode] = useState("lista");

  // Estados de busca, filtros e ordenação
  const [busca, setBusca] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("todas");
  const [filtroOrigem, setFiltroOrigem] = useState("todas");
  const [filtroTemp, setFiltroTemp] = useState("todas");
  const [filtroData, setFiltroData] = useState("todas");
  const [ordenacao, setOrdenacao] = useState("recente");

  useEffect(() => {
    carregarLeads();

    const empId = getEmpresaId();
    if (!empId) return;

    const ch = sb.channel("crm-leads-realtime-ent")
      .on("postgres_changes", { event: "*", schema: "public", table: "pre_orcamentos", filter: `empresa_id=eq.${empId}` },
        (payload) => {
          carregarLeads(false);
          if (payload.eventType === "INSERT" && payload.new.status === "Novo") {
            playNotificationSound();
          }
        })
      .subscribe();

    return () => {
      ch.unsubscribe();
    };
  }, []);

  async function carregarLeads(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const empId = getEmpresaId();
      if (!empId) return;

      const { data, error } = await sb
        .from("pre_orcamentos")
        .select("*")
        .eq("empresa_id", empId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPreOrcamentos(data || []);
    } catch (e) {
      console.error("Erro ao carregar leads:", e);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  const cidadesDisponiveis = useMemo(() => {
    return [...new Set(preOrcamentos.map((x) => x.cidade).filter(Boolean))].sort();
  }, [preOrcamentos]);

  const origensDisponiveis = useMemo(() => {
    return [...new Set(preOrcamentos.map((x) => resolverOrigem(x.origem).label))].sort();
  }, [preOrcamentos]);

  const contadoresStatus = useMemo(() => {
    const counts = {};
    Object.keys(STATUS_CONFIG).forEach((st) => {
      counts[st] = preOrcamentos.filter((x) => x.status === st).length;
    });
    return counts;
  }, [preOrcamentos]);

  // Filtros aplicados em memória via useMemo
  const leadsFiltrados = useMemo(() => {
    return preOrcamentos
      .filter((lead) => {
        // Se estiver no modo lista, filtra pela aba ativa
        if (viewMode === "lista" && lead.status !== activeStatus) return false;

        if (busca) {
          const txt = busca.toLowerCase();
          const nome = String(lead.nome || "").toLowerCase();
          const contato = String(lead.contato || "").toLowerCase();
          const email = String(lead.email || "").toLowerCase();
          const cidade = String(lead.cidade || "").toLowerCase();
          if (!nome.includes(txt) && !contato.includes(txt) && !email.includes(txt) && !cidade.includes(txt)) {
            return false;
          }
        }

        if (filtroCidade !== "todas" && lead.cidade !== filtroCidade) return false;
        if (filtroOrigem !== "todas" && resolverOrigem(lead.origem).label !== filtroOrigem) return false;
        if (filtroTemp !== "todas" && calcularTemperatura(lead).nivel !== filtroTemp) return false;

        if (filtroData !== "todas") {
          const dataLead = new Date(lead.created_at);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          if (filtroData === "hoje" && dataLead < hoje) return false;
          if (filtroData === "semana" && dataLead < new Date(Date.now() - 7 * 86400000)) return false;
          if (filtroData === "mes" && dataLead < new Date(Date.now() - 30 * 86400000)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (ordenacao === "recente") return new Date(b.created_at) - new Date(a.created_at);
        if (ordenacao === "antigo") return new Date(a.created_at) - new Date(b.created_at);
        if (ordenacao === "valor_maior") return Number(b.valor_min || 0) - Number(a.valor_min || 0);
        if (ordenacao === "valor_menor") return Number(a.valor_min || 0) - Number(b.valor_min || 0);
        return 0;
      });
  }, [preOrcamentos, activeStatus, viewMode, busca, filtroCidade, filtroOrigem, filtroTemp, filtroData, ordenacao]);

  async function handleUpdateStatus(leadId, novoStatus) {
    setPreOrcamentos((prev) =>
      prev.map((x) => (x.id === leadId ? { ...x, status: novoStatus } : x))
    );
    if (leadSelecionado?.id === leadId) {
      setLeadSelecionado((prev) => ({ ...prev, status: novoStatus }));
    }
    await sb.from("pre_orcamentos").update({ status: novoStatus }).eq("id", leadId);
  }

  // Transição Drag and Drop Kanban (com log de auditoria automatizado)
  async function handleMoveLeadKanban(leadId, novoStatus) {
    const leadObj = preOrcamentos.find(x => x.id === leadId);
    if (!leadObj || leadObj.status === novoStatus) return;

    const userNome = user?.nome || "Vendedor";
    await adicionarHistoricoLead(leadId, leadObj.status, novoStatus, "Movido via Kanban Board", userNome, "status_change");
    await handleUpdateStatus(leadId, novoStatus);
  }

  async function handleReactivateLead(leadId) {
    const leadObj = preOrcamentos.find((x) => x.id === leadId);
    if (!leadObj) return;

    const userNome = user?.nome || "Vendedor";
    await adicionarHistoricoLead(leadId, leadObj.status, "Novo", "Lead reativado manualmente para novo atendimento.", userNome, "status_change");
    await handleUpdateStatus(leadId, "Novo");
  }

  async function handleConvertLead(lead) {
    const userNome = user?.nome || "Vendedor";
    await adicionarHistoricoLead(lead.id, lead.status, "Orçamento Enviado", "Lead convertido em proposta orçamentária.", userNome, "quote_sent");
    await handleUpdateStatus(lead.id, "Orçamento Enviado");
    setLeadSelecionado(null);
    if (onConvertLead) onConvertLead(lead);
  }

  const dropdownEstilo = {
    padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
    background: C.surface, color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit"
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px", marginBottom: 24, boxShadow: C.shadow }}>
      
      {/* Cabeçalho CRM */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>🎯 Funil Comercial & CRM Enterprise</h3>
          <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>Pipeline integrado com inteligência comercial e lembretes de agenda</p>
        </div>
        
        {/* Toggle Visualização */}
        <div style={{ display: "flex", gap: 4, background: C.surface2, padding: 3, borderRadius: 8 }}>
          {["lista", "kanban", "metricas"].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                background: viewMode === mode ? C.surface : "transparent",
                color: viewMode === mode ? C.purple : C.muted
              }}
            >
              {mode === "lista" ? "📋 Lista" : mode === "kanban" ? "📊 Kanban" : "📈 Métricas"}
            </button>
          ))}
        </div>
      </div>

      {/* Central de Alertas Comerciais */}
      <CrmAlerts leads={preOrcamentos} onSelectLead={setLeadSelecionado} />

      {/* Abas de Filtro de Status (Apenas no Modo Lista) */}
      {viewMode === "lista" && (
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
          {Object.keys(STATUS_CONFIG).map((st) => {
            const cfg = STATUS_CONFIG[st];
            const active = activeStatus === st;
            const IconComponent = STATUS_ICONS[cfg.icon];
            return (
              <button
                key={st}
                onClick={() => setActiveStatus(st)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  border: "none", fontFamily: "inherit", transition: "all .12s",
                  background: active ? cfg.bg : "transparent",
                  color: active ? cfg.cor : C.muted
                }}
              >
                {IconComponent && <IconComponent size={12} />}
                <span>{cfg.label}</span>
                <span style={{ background: active ? cfg.cor : C.border, color: active ? "#fff" : C.text, borderRadius: 10, padding: "1px 5px", fontSize: 9 }}>
                  {contadoresStatus[st] || 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Barra de Filtros / Busca */}
      {viewMode !== "metricas" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 150 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              style={{ width: "100%", padding: "8px 12px 8px 30px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} style={dropdownEstilo}>
            <option value="todas">Cidades: Todas</option>
            {cidadesDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filtroOrigem} onChange={(e) => setFiltroOrigem(e.target.value)} style={dropdownEstilo}>
            <option value="todas">Origem: Todas</option>
            {origensDisponiveis.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select value={filtroTemp} onChange={(e) => setFiltroTemp(e.target.value)} style={dropdownEstilo}>
            <option value="todas">Qualificação: Todas</option>
            <option value="Quente">Quente</option>
            <option value="Morno">Morno</option>
            <option value="Frio">Frio</option>
          </select>

          <select value={filtroData} onChange={(e) => setFiltroData(e.target.value)} style={dropdownEstilo}>
            <option value="todas">Período: Todos</option>
            <option value="hoje">Hoje</option>
            <option value="semana">7 dias</option>
            <option value="mes">30 dias</option>
          </select>

          {viewMode === "lista" && (
            <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} style={dropdownEstilo}>
              <option value="recente">Mais recentes</option>
              <option value="antigo">Mais antigos</option>
              <option value="valor_maior">Maior orçamento</option>
              <option value="valor_menor">Menor orçamento</option>
            </select>
          )}
        </div>
      )}

      {/* Renderização Condicional de Views */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2].map(i => <div key={i} style={{ height: 80, background: C.darker, borderRadius: 10, animation: "pulse 1.5s infinite" }} />)}
        </div>
      ) : viewMode === "lista" ? (
        leadsFiltrados.length === 0 ? (
          <div style={{ border: `1px dashed ${C.border}`, borderRadius: 12, padding: "32px 16px", textAlign: "center", color: C.muted, fontSize: 12 }}>
            Sem leads correspondentes.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {leadsFiltrados.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onClick={() => setLeadSelecionado(lead)} />
            ))}
          </div>
        )
      ) : viewMode === "kanban" ? (
        <CrmKanban
          leads={leadsFiltrados}
          onMoveLead={handleMoveLeadKanban}
          onSelectLead={setLeadSelecionado}
        />
      ) : (
        <CrmDashboard leads={preOrcamentos} />
      )}

      {/* Drawer de Detalhes */}
      {leadSelecionado && (
        <LeadDetailsDrawer
          lead={leadSelecionado}
          onClose={() => setLeadSelecionado(null)}
          onUpdateStatus={handleUpdateStatus}
          onConvert={handleConvertLead}
          onReactivate={handleReactivateLead}
        />
      )}
    </div>
  );
}
