import { useState } from "react";
import { C } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";

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
  if (diffDias < 0)   return { tipo: "atrasada", texto: `${nome} está ATRASADA (${obra.prazo})`,           cor: C.danger };
  if (diffDias <= 30) return { tipo: "urgente",  texto: `${nome} — prazo em ${diffDias} dias (${obra.prazo})`, cor: C.warning };
  if (diffDias <= 90) return { tipo: "atencao",  texto: `${nome} — prazo em ${Math.ceil(diffDias/30)} meses (${obra.prazo})`, cor: C.red };
  return null;
}

export default function NotificacaoDropdown() {
  const [aberto, setAberto] = useState(false);
  const obras = useAppStore((s) => s.obras);
  const alertas = obras.map(calcAlerta).filter(Boolean);
  const count   = alertas.length;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setAberto((v) => !v)} style={{
        position: "relative", background: "none", border: `1px solid ${count > 0 ? C.warning : C.border}`,
        borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: count > 0 ? C.warning : C.muted,
        fontSize: 16, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "all .2s",
      }}>
        🔔
        {count > 0 && (
          <span style={{ position: "absolute", top: -6, right: -6, background: C.danger, color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {count}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setAberto(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, zIndex: 99, boxShadow: "0 8px 32px #00000055", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Alertas de prazo</span>
              <span style={{ fontSize: 11, color: C.muted }}>{count} {count === 1 ? "alerta" : "alertas"}</span>
            </div>
            {count === 0 ? (
              <div style={{ padding: "24px 18px", textAlign: "center", color: C.muted, fontSize: 13 }}>✅ Nenhum prazo crítico.</div>
            ) : alertas.map((a, i) => (
              <div key={i} style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${a.cor}`, background: a.cor + "0a" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: a.cor, marginBottom: 3 }}>
                  {a.tipo === "atrasada" ? "⛔ ATRASADA" : a.tipo === "urgente" ? "⚠️ URGENTE" : "🔶 ATENÇÃO"}
                </div>
                <div style={{ fontSize: 12, color: C.text }}>{a.texto}</div>
              </div>
            ))}
            <div style={{ padding: "10px 18px", background: C.darker }}>
              <span style={{ fontSize: 11, color: C.muted }}>Atualizado agora</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
