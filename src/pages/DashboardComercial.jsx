import { useState, useEffect } from "react";
import { Phone } from "../components/ui/Icon";
import { useToast } from "../hooks/useToast";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { enviarWhatsApp } from "../services/whatsappService";

const FUNIL = ["Lead", "Em negociação", "Proposta enviada", "Fechado"];
const FUNIL_COR = {
  "Lead":             "#6b7280",
  "Em negociação":    "#4a9eff",
  "Proposta enviada": "#b97a00",
  "Fechado":          "#2e9e5b",
};

function KpiCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "16px 18px",
      border: `1px solid ${C.border}`, borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function FunilCard({ label, count, valor, cor, isAtivo, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: isAtivo ? cor + "12" : "#fff",
      borderRadius: 12, padding: "16px 18px",
      border: `1px solid ${isAtivo ? cor : C.border}`,
      borderTop: `3px solid ${cor}`,
      cursor: "pointer", transition: "all .15s",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: cor, letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900 }}>{count}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{fmt(valor)}</div>
    </div>
  );
}

export default function DashboardComercial() {
  useModuleLoad("clientes");
  useModuleLoad("orcamentos");

  const clientes   = useAppStore((s) => s.clientes);
  const orcamentos = useAppStore((s) => s.orcamentos);
  const user       = useAppStore((s) => s.user);
  const updateCliente = useAppStore((s) => s.updateCliente);

    const { toast, mostrarToast } = useToast();

  const [filtroFunil, setFiltroFunil] = useState(null);

  //  Cálculos 
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const followups = clientes.filter((c) => {
    if (!c.proximo_contato || c.status === "Fechado" || c.status === "Recusado") return false;
    const d = new Date(c.proximo_contato + "T00:00");
    return d <= hoje;
  }).sort((a, b) => new Date(a.proximo_contato) - new Date(b.proximo_contato));

  const semResposta = orcamentos.filter((o) => {
    if (o.status !== "Aguardando resposta") return false;
    const criado = new Date(o.created_at || 0);
    return (Date.now() - criado.getTime()) > 5 * 24 * 60 * 60 * 1000;
  });

  const pipeline = clientes.filter((c) => !["Fechado", "Recusado"].includes(c.status));
  const valorPipeline = pipeline.reduce((a, c) => a + (c.valor || 0), 0);
  const taxaConv = clientes.length > 0
    ? ((clientes.filter((c) => c.status === "Fechado").length / clientes.length) * 100).toFixed(0)
    : 0;

  const clientesFiltrados = filtroFunil
    ? clientes.filter((c) => c.status === filtroFunil)
    : followups.length > 0 ? followups : clientes.filter((c) => c.status !== "Fechado" && c.status !== "Recusado");

  async function marcarContatoFeito(cliente) {
    // Reagenda automaticamente para +7 dias
    const proxData = new Date();
    proxData.setDate(proxData.getDate() + 7);
    const proxISO = proxData.toISOString().slice(0, 10);
    await updateCliente(cliente.id, { proximo_contato: proxISO });
    mostrarToast(` Feito! Próximo contato com ${cliente.nome.split(" ")[0]} reagendado para ${proxData.toLocaleDateString("pt-BR")}`);
  }

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <>
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: "#fff", border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 32px #0006",
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>
          {saudacao()}, {user?.nome?.split(" ")[0] || "Comercial"} 
        </h2>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Alertas urgentes */}
      {(followups.length > 0 || semResposta.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {followups.length > 0 && (
            <div style={{
              background: C.warning + "12", border: `1px solid ${C.warning}44`,
              borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 18 }}></span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.warning }}>
                  {followups.length} follow-up{followups.length > 1 ? "s" : ""} pendente{followups.length > 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {followups.map((c) => c.nome.split(" ")[0]).join(", ")}
                </div>
              </div>
            </div>
          )}
          {semResposta.length > 0 && (
            <div style={{
              background: C.danger + "10", border: `1px solid ${C.danger}33`,
              borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 18 }}>⏰</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.danger }}>
                  {semResposta.length} proposta{semResposta.length > 1 ? "s" : ""} sem resposta há +5 dias
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {semResposta.map((o) => o.cliente).join(", ")}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Meu pipeline"   value={fmt(valorPipeline)} sub={`${pipeline.length} leads ativos`}           accent={C.red}     icon="" />
        <KpiCard label="Leads totais"   value={String(clientes.length)} sub={`${clientes.filter(c => c.status === "Fechado").length} fechados`} accent="#4a9eff" icon="" />
        <KpiCard label="Tx. conversão"  value={`${taxaConv}%`}          sub="leads → fechados"                         accent={C.success}  icon="%" />
        <KpiCard label="Orçamentos"     value={String(orcamentos.filter(o => o.status !== "Recusado").length)} sub="em aberto" accent={C.warning} icon="" />
      </div>

      {/* Funil Kanban */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
          Funil de prospecção
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          {FUNIL.map((etapa) => {
            const count = clientes.filter((c) => c.status === etapa).length;
            const valor = clientes.filter((c) => c.status === etapa).reduce((a, c) => a + (c.valor || 0), 0);
            return (
              <FunilCard
                key={etapa}
                label={etapa}
                count={count}
                valor={valor}
                cor={FUNIL_COR[etapa]}
                isAtivo={filtroFunil === etapa}
                onClick={() => setFiltroFunil(filtroFunil === etapa ? null : etapa)}
              />
            );
          })}
        </div>
      </div>

      {/* Lista de leads/follow-ups */}
      <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{
          padding: "12px 18px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: C.darker,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>
            {filtroFunil ? `${filtroFunil} (${clientesFiltrados.length})` :
              followups.length > 0 ? `Follow-ups do dia (${followups.length})` :
              `Leads ativos (${clientesFiltrados.length})`}
          </div>
          {filtroFunil && (
            <button onClick={() => setFiltroFunil(null)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: C.muted, fontFamily: "inherit",
            }}> Limpar filtro</button>
          )}
        </div>

        {clientesFiltrados.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
            Nenhum lead nesta etapa.
          </div>
        ) : (
          <div>
            {clientesFiltrados.map((c, i) => {
              const atrasado = c.proximo_contato && new Date(c.proximo_contato + "T00:00") < hoje;
              const hoje2    = c.proximo_contato && new Date(c.proximo_contato + "T00:00").getTime() === hoje.getTime();
              return (
                <div key={c.id} style={{
                  padding: "14px 18px",
                  borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                  display: "flex", alignItems: "center", gap: 14,
                  background: atrasado ? C.warning + "05" : "transparent",
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: FUNIL_COR[c.status] || C.muted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: "#fff",
                  }}>
                    {(c.nome || "?")[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{c.nome}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {c.cidade && <span>{c.cidade} · </span>}
                      {c.valor ? fmt(c.valor) : "Valor não definido"}
                    </div>
                    {c.proximo_contato && (
                      <div style={{ fontSize: 10, marginTop: 3, color: atrasado ? C.danger : hoje2 ? C.warning : C.success, fontWeight: 700 }}>
                        <Phone size={12} /> {atrasado ? "Atrasado · " : hoje2 ? "Hoje · " : ""}
                        {new Date(c.proximo_contato + "T00:00").toLocaleDateString("pt-BR")}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, flexShrink: 0,
                    background: (FUNIL_COR[c.status] || C.muted) + "18",
                    color: FUNIL_COR[c.status] || C.muted,
                    border: `1px solid ${(FUNIL_COR[c.status] || C.muted)}33`,
                  }}>
                    {c.status}
                  </span>

                  {/* Ações */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {c.contato && (
                      <button
                        onClick={() => enviarWhatsApp(c.contato, `Olá ${c.nome.split(" ")[0]}! Tudo bem?`)}
                        style={{
                          padding: "5px 10px", background: "#25D36622", border: "1px solid #25D36644",
                          borderRadius: 6, color: "#25D366", fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      ></button>
                    )}
                    {c.proximo_contato && new Date(c.proximo_contato + "T00:00") <= hoje && (
                      <button
                        onClick={() => marcarContatoFeito(c)}
                        style={{
                          padding: "5px 10px", background: C.success + "22", border: `1px solid ${C.success}44`,
                          borderRadius: 6, color: C.success, fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      > Feito</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
