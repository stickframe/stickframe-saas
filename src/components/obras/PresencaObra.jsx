import { useEffect, useRef, useState } from "react";
import { sb } from "../../services/supabase";
import useAppStore from "../../store/useAppStore";
import { C } from "../../utils/constants";

const MAX_VISIBLE = 5;

function iniciais(nome = "") {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tempoDecorrido(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins === 1) return "há 1 min";
  return `há ${mins} min`;
}

// Deterministic hue from string
function avatarBg(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return `hsl(${h % 360}, 55%, 42%)`;
}

function Avatar({ user, style }) {
  const [tooltip, setTooltip] = useState(false);
  return (
    <div
      style={{ position: "relative", ...style }}
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: avatarBg(user.userId),
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          border: `2px solid ${C.surface}`,
          cursor: "default",
          userSelect: "none",
        }}
      >
        {iniciais(user.nome)}
      </div>
      {/* Green presence dot */}
      <span
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: C.success,
          border: `1.5px solid ${C.surface}`,
        }}
      />
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: C.text,
            color: C.surface,
            borderRadius: 6,
            padding: "4px 8px",
            fontSize: 11,
            whiteSpace: "nowrap",
            zIndex: 999,
            pointerEvents: "none",
            boxShadow: C.shadow,
          }}
        >
          <div style={{ fontWeight: 600 }}>{user.nome}</div>
          <div style={{ color: "#ccc", marginTop: 1 }}>{tempoDecorrido(user.entrou_em)}</div>
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: "4px 4px 0",
              borderStyle: "solid",
              borderColor: `${C.text} transparent transparent`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function PresencaObra({ obraId }) {
  const user = useAppStore((s) => s.user);
  const [presentes, setPresentes] = useState([]);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!obraId || !user?.id) return;

    const channelName = `obra-${obraId}`;
    const ch = sb.channel(channelName, { config: { presence: { key: user.id } } });
    channelRef.current = ch;

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      const lista = Object.values(state)
        .flat()
        .map((p) => ({
          userId: p.userId,
          nome: p.nome || "Usuário",
          perfil: p.perfil || "",
          entrou_em: p.entrou_em || new Date().toISOString(),
        }));
      setPresentes(lista);
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({
          userId: user.id,
          nome: user.nome || "Usuário",
          perfil: user.perfil || "",
          entrou_em: new Date().toISOString(),
        });
      }
    });

    return () => {
      ch.untrack().finally(() => sb.removeChannel(ch));
      channelRef.current = null;
    };
  }, [obraId, user?.id]);

  if (presentes.length === 0) return null;

  const visible = presentes.slice(0, MAX_VISIBLE);
  const overflow = presentes.length - MAX_VISIBLE;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 11, color: C.muted, marginRight: 4 }}>Ativos:</span>
      {visible.map((u, i) => (
        <Avatar
          key={u.userId}
          user={u}
          style={{ zIndex: MAX_VISIBLE - i, marginLeft: i === 0 ? 0 : -8 }}
        />
      ))}
      {overflow > 0 && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: C.border,
            color: C.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            border: `2px solid ${C.surface}`,
            marginLeft: -8,
            userSelect: "none",
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
