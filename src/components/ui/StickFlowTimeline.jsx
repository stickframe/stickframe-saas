// 
// StickFrame StickFlowTimeline Component
// 

import { useState, useEffect } from "react";
import { sb } from "../../services/supabase";
import { C } from "../../utils/constants";

// Helper para formatar a data e hora de forma legível
function formatarDataHora(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}

const CONFIG_EVENTOS = {
  LEAD_CRIADO:           { cor: "#981915", icone: "🎯", label: "Lead Captado" },
  LEAD_SCORE_ALTERADO:   { cor: "#b07a1e", icone: "📈", label: "Lead Qualificado" },
  LEAD_CONVERTIDO:       { cor: "#3f7a4b", icone: "🤝", label: "Lead Convertido" },
  ORCAMENTO_ENVIADO:     { cor: "#3b6ea5", icone: "📄", label: "Proposta Enviada" },
  ORCAMENTO_APROVADO:    { cor: "#3f7a4b", icone: "✅", label: "Proposta Aprovada" },
  ORCAMENTO_REJEITADO:   { cor: "#981915", icone: "❌", label: "Proposta Rejeitada" },
  CONTRATO_ASSINADO:     { cor: "#3f7a4b", icone: "✍️", label: "Contrato Assinado" },
  PROJETO_INICIADO:      { cor: "#7a3b83", icone: "📐", label: "Projeto Iniciado" },
  IFC_IMPORTADO:         { cor: "#7a3b83", icone: "📦", label: "Modelo BIM/IFC Importado" },
  CORTE_GERADO:          { cor: "#b07a1e", icone: "⚡", label: "Plano de Corte Gerado" },
  COMPRA_REALIZADA:      { cor: "#b07a1e", icone: "🛒", label: "Compra Aprovada" },
  MATERIAL_RECEBIDO:     { cor: "#3b6ea5", icone: "🚚", label: "Material Entregue" },
  OBRA_INICIADA:         { cor: "#3f7a4b", icone: "🏗️", label: "Obra Iniciada" },
  FOTO_DIARIA:           { cor: "#3b6ea5", icone: "📸", label: "Foto do Canteiro" },
  RDO_CRIADO:            { cor: "#57514a", icone: "📝", label: "Diário de Obra preenchido" },
  MEDICAO_APROVADA:      { cor: "#3f7a4b", icone: "💰", label: "Medição Aprovada" },
  ENTREGA_REALIZADA:     { cor: "#3f7a4b", icone: "🔑", label: "Obra Entregue" },
  GARANTIA_INICIADA:     { cor: "#3b6ea5", icone: "🛡️", label: "Garantia Ativada" }
};

const DEFAULT_CONFIG =   { cor: "#57514a", icone: "⚙️", label: "Evento" };

export default function StickFlowTimeline({ stickflowId, portalMode = false }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stickflowId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const carregarEventos = async () => {
      try {
        let query = sb
          .from("stickflow_eventos")
          .select("*")
          .eq("stickflow_id", stickflowId)
          .order("criado_em", { ascending: false });

        if (portalMode) {
          query = query.in("visibilidade", ["CLIENTE", "PUBLICO"]);
        }

        const { data, error } = await query;
        if (error) throw error;
        setEventos(data || []);
      } catch (err) {
        console.error("[StickFlowTimeline] Erro ao carregar eventos:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarEventos();

    // Inscrição Realtime no canal do Supabase para timeline dinâmica
    const channel = sb.channel(`stickflow-events-realtime-${stickflowId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "stickflow_eventos",
        filter: `stickflow_id=eq.${stickflowId}`
      }, (payload) => {
        const novoEvento = payload.new;
        
        // Se portalMode, verificar se o evento tem visibilidade de cliente/público
        if (portalMode && !["CLIENTE", "PUBLICO"].includes(novoEvento.visibilidade)) {
          return;
        }

        setEventos((prev) => {
          if (prev.find((e) => e.id === novoEvento.id)) return prev;
          return [novoEvento, ...prev];
        });
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [stickflowId, portalMode]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #ccc", borderTop: "2px solid #981915", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted || "#888", fontSize: 13, fontStyle: "italic" }}>
        Nenhum evento registrado nesta jornada.
      </div>
    );
  }

  return (
    <div style={{ position: "relative", paddingLeft: 30, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Linha vertical da Timeline */}
      <div style={{ 
        position: "absolute", 
        left: 10, 
        top: 8, 
        bottom: 8, 
        width: 2, 
        backgroundColor: C.border || "#e5e7eb",
        zIndex: 1
      }} />

      {eventos.map((ev, idx) => {
        const config = CONFIG_EVENTOS[ev.evento_tipo] || DEFAULT_CONFIG;
        return (
          <div key={ev.id} style={{ 
            position: "relative", 
            zIndex: 2,
            animation: "fadeInUp 0.3s ease-out"
          }}>
            {/* Marcador redondo na linha */}
            <div style={{
              position: "absolute",
              left: -30,
              top: 3,
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: config.cor,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              zIndex: 3
            }}>
              {config.icone}
            </div>

            {/* Card com os dados do evento */}
            <div 
              className="timeline-card"
              style={{
                backgroundColor: C.surface || "#fff",
                border: `1px solid ${C.border || "#e5e7eb"}`,
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text || "#1a1a1a" }}>
                  {config.label}
                </span>
                <span style={{ fontSize: 11, color: C.muted || "#6b7280" }}>
                  {formatarDataHora(ev.criado_em)}
                </span>
              </div>
              
              <p style={{ fontSize: 12, color: C.muted || "#57514a", margin: 0, lineHeight: 1.4 }}>
                {ev.descricao}
              </p>

              {/* Tag opcional do Módulo de Origem */}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span style={{ 
                  fontSize: 9, 
                  fontWeight: 600, 
                  backgroundColor: "rgba(0,0,0,0.03)", 
                  padding: "2px 6px", 
                  borderRadius: 4, 
                  color: C.muted || "#6b7280" 
                }}>
                  {ev.origem}
                </span>
                {ev.event_version > 1 && (
                  <span style={{ fontSize: 9, color: C.muted || "#999" }}>
                    v{ev.event_version}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .timeline-card:hover {
          transform: translateX(3px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.04);
        }
      `}</style>
    </div>
  );
}
