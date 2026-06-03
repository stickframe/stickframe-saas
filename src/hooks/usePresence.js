import { useEffect, useState } from "react";
import { sb } from "../services/supabase";
import useAppStore from "../store/useAppStore";

export function usePresence() {
  const [online, setOnline] = useState([]);
  const user = useAppStore((s) => s.user);
  const empresaId = useAppStore((s) => s.empresaId);
  const activePage = useAppStore((s) => s.activePage);

  useEffect(() => {
    if (!user?.id || !empresaId) return;

    const channel = sb.channel(`empresa:${empresaId}:presence`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flatMap((v) => v);
        setOnline(users.filter((u) => u.id !== user.id));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: user.id,
            nome: user.nome || user.email || "Usuário",
            pagina: activePage,
            ts: Date.now(),
          });
        }
      });

    return () => { sb.removeChannel(channel); };
  }, [user?.id, empresaId]);

  // Update tracked page when activePage changes
  useEffect(() => {
    if (!user?.id || !empresaId) return;
    const channel = sb.channel(`empresa:${empresaId}:presence`);
    channel.track?.({ id: user.id, nome: user.nome || user.email || "Usuário", pagina: activePage, ts: Date.now() });
  }, [activePage, user?.id, empresaId]);

  return online;
}
