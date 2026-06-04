import { useEffect, useRef, useState } from "react";
import { sb } from "../services/supabase";
import useAppStore from "../store/useAppStore";

export function usePresence() {
  const [online, setOnline] = useState([]);
  const user = useAppStore((s) => s.user);
  const empresaId = useAppStore((s) => s.empresaId);
  const activePage = useAppStore((s) => s.activePage);
  const channelRef = useRef(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || !empresaId) return;

    const channel = sb.channel(`empresa:${empresaId}:presence`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;
    subscribedRef.current = false;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flatMap((v) => v);
        setOnline(users.filter((u) => u.id !== user.id));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          subscribedRef.current = true;
          await channel.track({
            id: user.id,
            nome: user.nome || user.email || "Usuário",
            pagina: activePage,
            ts: Date.now(),
          });
        }
      });

    return () => {
      subscribedRef.current = false;
      channelRef.current = null;
      sb.removeChannel(channel);
    };
  }, [user?.id, empresaId]);

  // Atualiza página rastreada só se já estiver subscrito
  useEffect(() => {
    if (!user?.id || !subscribedRef.current || !channelRef.current) return;
    channelRef.current.track({
      id: user.id,
      nome: user.nome || user.email || "Usuário",
      pagina: activePage,
      ts: Date.now(),
    });
  }, [activePage, user?.id]);

  return online;
}
