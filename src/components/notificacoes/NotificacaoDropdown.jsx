import { useState, useMemo } from "react";
import { C } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";
import { useNotificacoes } from "../../hooks/useNotificacoes";

const TIPO_ICON = { info: "ℹ️", sucesso: "✅", alerta: "⚠️", erro: "⛔" };
const CAT_LABELS = { prazo: "Prazos", medicao: "Medições", vistoria: "Vistorias", orcamento: "Orçamentos", bim: "BIM" };
const CAT_ICONS  = { prazo: "⏰", medicao: "📐", vistoria: "🔍", orcamento: "📋", bim: "🧊" };

function useAlertas() {
  const obras           = useAppStore((s) => s.obras);
  const orcamentos      = useAppStore((s) => s.orcamentos);
  const medicoes        = useAppStore((s) => s.medicoes);
  const vistorias       = useAppStore((s) => s.vistorias);
  const bimApontamentos = useAppStore((s) => s.bimApontamentos);

  return useMemo(() => {
    const alertas = [];
    const hoje = new Date();

    // 1. Prazos de obra
    obras.forEach((obra) => {
      if (!obra.prazo_fim || obra.status === "Concluída") return;
      const prazoDate = new Date(obra.prazo_fim + "T00:00");
      const diffDias  = Math.ceil((prazoDate - hoje) / 86400000);
      const nome      = obra.nome.split("—")[0].trim();
      if (diffDias < 0)
        alertas.push({ categoria: "prazo", tipo: "erro",   cor: C.danger,  icon: "⛔", titulo: "Obra atrasada",  texto: `${nome} — prazo encerrado há ${Math.abs(diffDias)} dia(s)` });
      else if (diffDias <= 14)
        alertas.push({ categoria: "prazo", tipo: "erro",   cor: "#c0392b", icon: "🚨", titulo: "Prazo urgente",  texto: `${nome} — vence em ${diffDias} dia(s)` });
      else if (diffDias <= 45)
        alertas.push({ categoria: "prazo", tipo: "alerta", cor: C.warning, icon: "⏰", titulo: "Prazo próximo",  texto: `${nome} — vence em ${diffDias} dias` });
    });

    // 2. Medições pendentes
    Object.entries(medicoes).forEach(([obraId, lista]) => {
      const obra = obras.find((o) => o.id === obraId);
      const nomeObra = obra?.nome?.split("—")[0]?.trim() || "Obra";
      (lista || []).filter((m) => m.status === "Pendente").forEach((m) => {
        const criado  = new Date(m.created_at || m.data || hoje);
        const diasPend = Math.ceil((hoje - criado) / 86400000);
        alertas.push({ categoria: "medicao", tipo: "alerta", cor: "#4a9eff", icon: "📐", titulo: "Medição pendente", texto: `${nomeObra} — ${m.descricao || m.fase || "Medição"} (${diasPend > 0 ? `${diasPend}d pendente` : "hoje"})` });
      });
    });

    // 3. Vistorias reprovadas / com ressalvas
    Object.entries(vistorias).forEach(([, lista]) => {
      (lista || []).filter((v) => v.resultado === "Reprovado" || v.resultado === "Aprovado com ressalvas").forEach((v) => {
        const obra = obras.find((o) => o.id === v.obra_id);
        const nomeObra = obra?.nome?.split("—")[0]?.trim() || "Obra";
        const isRep = v.resultado === "Reprovado";
        alertas.push({ categoria: "vistoria", tipo: isRep ? "erro" : "alerta", cor: isRep ? C.danger : C.warning, icon: isRep ? "🔴" : "🟡", titulo: `Vistoria ${v.resultado}`, texto: `${nomeObra} — ${v.tipo_servico || v.fase || "FVS"} (${v.data ? new Date(v.data + "T00:00").toLocaleDateString("pt-BR") : "—"})` });
      });
    });

    // 4. Orçamentos sem resposta há +7 dias
    orcamentos.filter((o) => o.status === "Aguardando resposta").forEach((o) => {
      const criado  = new Date(o.created_at || hoje);
      const diasSem = Math.ceil((hoje - criado) / 86400000);
      if (diasSem >= 7)
        alertas.push({ categoria: "orcamento", tipo: "alerta", cor: C.warning, icon: "📋", titulo: "Orçamento sem resposta", texto: `${o.cliente} (${o.ref || "—"}) — sem retorno há ${diasSem} dia(s)` });
    });

    // 5. Apontamentos BIM alta prioridade em aberto
    Object.entries(bimApontamentos).forEach(([obraId, lista]) => {
      const obra = obras.find((o) => o.id === obraId);
      const nomeObra = obra?.nome?.split("—")[0]?.trim() || "Obra";
      const criticos = (lista || []).filter((a) => a.prioridade === "Alta" && a.status === "Aberto");
      if (criticos.length > 0)
        alertas.push({ categoria: "bim", tipo: "alerta", cor: "#9b59b6", icon: "🧊", titulo: "Apontamentos BIM críticos", texto: `${nomeObra} — ${criticos.length} apontamento(s) Alta prioridade em aberto` });
    });

    return alertas;
  }, [obras, orcamentos, medicoes, vistorias, bimApontamentos]);
}

function tempoAtras(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)    return "agora";
  if (diff < 3600)  return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

// Categorias de alerta relevantes por perfil
const CATS_PERFIL = {
  engenheiro: ["prazo", "medicao", "vistoria", "bim"],
  comercial:  ["orcamento"],
  financeiro: ["prazo"],
};

export default function NotificacaoDropdown() {
  const [aberto,    setAberto]    = useState(false);
  const [aba,       setAba]       = useState("alertas");
  const [catFiltro, setCatFiltro] = useState("todas");

  const perfil = useAppStore((s) => s.user?.perfil);
  const { notificacoes, marcar, marcarTodas } = useNotificacoes();
  const allAlertas = useAlertas();

  const catsPermitidas = CATS_PERFIL[perfil] || null; // null = diretor vê tudo
  const alertas = catsPermitidas
    ? allAlertas.filter((a) => catsPermitidas.includes(a.categoria))
    : allAlertas;

  const naoLidas    = notificacoes.filter((n) => !n.lida).length;
  const totalBadge  = naoLidas + alertas.length;
  const categorias  = [...new Set(alertas.map((a) => a.categoria))];
  const alertasFiltrados = catFiltro === "todas" ? alertas : alertas.filter((a) => a.categoria === catFiltro);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setAberto((v) => !v)} style={{
        position: "relative", background: "none",
        border: `1px solid ${totalBadge > 0 ? C.warning : C.border}`,
        borderRadius: 8, padding: "8px 12px", cursor: "pointer",
        color: totalBadge > 0 ? C.warning : C.muted,
        fontSize: 16, display: "flex", alignItems: "center", gap: 6,
        fontFamily: "inherit", transition: "all .2s",
      }}>
        🔔
        {totalBadge > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            background: C.danger, color: "#fff", borderRadius: "50%",
            width: 18, height: 18, fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {totalBadge > 99 ? "99+" : totalBadge}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setAberto(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            width: 400, background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, zIndex: 99, boxShadow: "0 12px 48px #00000033", overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>Notificações</span>
              {naoLidas > 0 && (
                <button onClick={marcarTodas} style={{ fontSize: 11, color: C.red, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Marcar todas lidas
                </button>
              )}
            </div>

            {/* Abas */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
              {[
                { key: "alertas", label: "Alertas",  count: alertas.length },
                { key: "sistema", label: "Sistema",  count: naoLidas },
              ].map((a) => (
                <button key={a.key} onClick={() => setAba(a.key)} style={{
                  flex: 1, padding: "10px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  background: "none", border: "none",
                  borderBottom: aba === a.key ? `2px solid ${C.red}` : "2px solid transparent",
                  color: aba === a.key ? C.red : C.muted,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  {a.label}
                  {a.count > 0 && (
                    <span style={{ background: a.key === "alertas" ? C.danger : "#4a9eff", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>
                      {a.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Aba Alertas ── */}
            {aba === "alertas" && (
              <>
                {categorias.length > 1 && (
                  <div style={{ display: "flex", gap: 5, padding: "8px 12px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                    <button onClick={() => setCatFiltro("todas")} style={{
                      padding: "3px 9px", borderRadius: 12, fontSize: 10, fontWeight: catFiltro === "todas" ? 700 : 400,
                      cursor: "pointer", fontFamily: "inherit",
                      border: `1px solid ${catFiltro === "todas" ? C.red : C.border}`,
                      background: catFiltro === "todas" ? C.red + "18" : "transparent",
                      color: catFiltro === "todas" ? C.red : C.muted,
                    }}>Todos ({alertas.length})</button>
                    {categorias.map((cat) => (
                      <button key={cat} onClick={() => setCatFiltro(cat)} style={{
                        padding: "3px 9px", borderRadius: 12, fontSize: 10, fontWeight: catFiltro === cat ? 700 : 400,
                        cursor: "pointer", fontFamily: "inherit",
                        border: `1px solid ${catFiltro === cat ? C.red : C.border}`,
                        background: catFiltro === cat ? C.red + "18" : "transparent",
                        color: catFiltro === cat ? C.red : C.muted,
                      }}>{CAT_ICONS[cat]} {CAT_LABELS[cat]} ({alertas.filter((a) => a.categoria === cat).length})</button>
                    ))}
                  </div>
                )}
                <div style={{ maxHeight: 340, overflowY: "auto" }}>
                  {alertasFiltrados.length === 0 ? (
                    <div style={{ padding: "32px 18px", textAlign: "center", color: C.muted, fontSize: 13 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                      Nenhum alerta no momento.
                    </div>
                  ) : alertasFiltrados.map((a, i) => (
                    <div key={i} style={{
                      padding: "11px 14px", borderBottom: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${a.cor}`, background: a.cor + "08",
                      display: "flex", gap: 10, alignItems: "flex-start",
                    }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{a.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: a.cor }}>{a.titulo}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: a.cor + "20", color: a.cor, whiteSpace: "nowrap", flexShrink: 0, textTransform: "uppercase" }}>
                            {CAT_LABELS[a.categoria]}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>{a.texto}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Aba Sistema ── */}
            {aba === "sistema" && (
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {notificacoes.length === 0 ? (
                  <div style={{ padding: "32px 18px", textAlign: "center", color: C.muted, fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                    Nenhuma notificação do sistema.
                  </div>
                ) : notificacoes.map((n) => (
                  <div key={n.id} onClick={() => !n.lida && marcar(n.id)} style={{
                    padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
                    background: n.lida ? "transparent" : C.red + "08",
                    cursor: n.lida ? "default" : "pointer",
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{TIPO_ICON[n.tipo] || "ℹ️"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: n.lida ? 500 : 700, marginBottom: 2 }}>{n.titulo}</div>
                      {n.mensagem && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{n.mensagem}</div>}
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{tempoAtras(n.created_at)}</div>
                    </div>
                    {!n.lida && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, flexShrink: 0, marginTop: 5 }} />}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: "10px 16px", background: C.darker, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.muted }}>
                {totalBadge === 0 ? "✓ Tudo em dia" : `${alertas.length} alerta(s) · ${naoLidas} não lida(s)`}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {["erro", "alerta"].map((tipo) => {
                  const count = alertas.filter((a) => a.tipo === tipo).length;
                  if (!count) return null;
                  return (
                    <span key={tipo} style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                      background: tipo === "erro" ? C.danger + "20" : C.warning + "20",
                      color: tipo === "erro" ? C.danger : C.warning,
                    }}>{tipo === "erro" ? "⛔" : "⚠️"} {count}</span>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
