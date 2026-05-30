import { useState } from "react";
import { C } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";
import { useNotificacoes } from "../../hooks/useNotificacoes";

const TIPO_ICON = { info: "ℹ️", sucesso: "✅", alerta: "⚠️", erro: "⛔" };

function calcAlerta(obra) {
  const MESES = { Jan:0,Fev:1,Mar:2,Abr:3,Mai:4,Jun:5,Jul:6,Ago:7,Set:8,Out:9,Nov:10,Dez:11 };
  if (!obra.prazo || obra.prazo === "—") return null;
  const [mesStr, ano] = obra.prazo.split("/");
  const mes = MESES[mesStr];
  if (mes === undefined || !ano) return null;
  const prazoDate = new Date(Number(ano), mes, 1);
  const diffDias  = Math.ceil((prazoDate - new Date()) / (1000 * 60 * 60 * 24));
  if (obra.status === "Pausada" || obra.progresso === 100) return null;
  const nome = obra.nome.split("—")[0].trim();
  if (diffDias < 0)   return { tipo: "erro",   titulo: "Obra atrasada",  texto: `${nome} está ATRASADA (${obra.prazo})`,               cor: C.danger };
  if (diffDias <= 30) return { tipo: "alerta",  titulo: "Prazo urgente",  texto: `${nome} — prazo em ${diffDias} dias (${obra.prazo})`, cor: C.warning };
  if (diffDias <= 90) return { tipo: "alerta",  titulo: "Prazo próximo",  texto: `${nome} — prazo em ${Math.ceil(diffDias/30)} meses (${obra.prazo})`, cor: C.red };
  return null;
}

function tempoAtras(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)    return "agora";
  if (diff < 3600)  return `${Math.floor(diff/60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h atrás`;
  return `${Math.floor(diff/86400)}d atrás`;
}

export default function NotificacaoDropdown() {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba]       = useState("sistema");
  const obras = useAppStore((s) => s.obras);
  const { notificacoes, marcar, marcarTodas } = useNotificacoes();

  const alertas    = obras.map(calcAlerta).filter(Boolean);
  const naoLidas   = notificacoes.filter((n) => !n.lida).length;
  const totalBadge = naoLidas + alertas.length;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setAberto((v) => !v)} style={{
        position: "relative", background: "none", border: `1px solid ${totalBadge > 0 ? C.warning : C.border}`,
        borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: totalBadge > 0 ? C.warning : C.muted,
        fontSize: 16, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "all .2s",
      }}>
        🔔
        {totalBadge > 0 && (
          <span style={{ position: "absolute", top: -6, right: -6, background: C.danger, color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {totalBadge}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setAberto(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width: 360, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, zIndex: 99, boxShadow: "0 8px 32px #00000022", overflow: "hidden" }}>

            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Notificações</span>
              {naoLidas > 0 && (
                <button onClick={marcarTodas} style={{ fontSize: 11, color: C.red, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
              {[
                { key: "sistema", label: "Sistema", count: naoLidas },
                { key: "prazos",  label: "Prazos",  count: alertas.length },
              ].map((a) => (
                <button key={a.key} onClick={() => setAba(a.key)} style={{
                  flex: 1, padding: "10px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  background: "none", border: "none", borderBottom: aba === a.key ? `2px solid ${C.red}` : "2px solid transparent",
                  color: aba === a.key ? C.red : C.muted, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  {a.label}
                  {a.count > 0 && (
                    <span style={{ background: C.danger, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{a.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {aba === "sistema" && (
                notificacoes.length === 0
                  ? <div style={{ padding: "24px 18px", textAlign: "center", color: C.muted, fontSize: 13 }}>✅ Nenhuma notificação.</div>
                  : notificacoes.map((n) => (
                    <div key={n.id} onClick={() => !n.lida && marcar(n.id)} style={{
                      padding: "12px 18px", borderBottom: `1px solid ${C.border}`,
                      background: n.lida ? "transparent" : C.red + "08",
                      cursor: n.lida ? "default" : "pointer",
                      display: "flex", gap: 10, alignItems: "flex-start",
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{TIPO_ICON[n.tipo] || "ℹ️"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: n.lida ? 500 : 700, color: C.text, marginBottom: 2 }}>{n.titulo}</div>
                        {n.mensagem && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{n.mensagem}</div>}
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{tempoAtras(n.created_at)}</div>
                      </div>
                      {!n.lida && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  ))
              )}

              {aba === "prazos" && (
                alertas.length === 0
                  ? <div style={{ padding: "24px 18px", textAlign: "center", color: C.muted, fontSize: 13 }}>✅ Nenhum prazo crítico.</div>
                  : alertas.map((a, i) => (
                    <div key={i} style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${a.cor}`, background: a.cor + "0a" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: a.cor, marginBottom: 3 }}>{TIPO_ICON[a.tipo]} {a.titulo}</div>
                      <div style={{ fontSize: 12, color: C.text }}>{a.texto}</div>
                    </div>
                  ))
              )}
            </div>

            <div style={{ padding: "10px 18px", background: C.darker, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.muted }}>{totalBadge === 0 ? "Tudo em dia ✓" : `${totalBadge} notificação(ões) pendente(s)`}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
