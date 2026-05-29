import { useEffect, useRef, useState } from "react";
import useAppStore from "../store/useAppStore";
import {
  listarNotificacoes, marcarLida, marcarTodasLidas, subscribeNotificacoes,
} from "../services/repositories/notificacoesRepository";

export function useNotificacoes() {
  const user = useAppStore((s) => s.user);
  const [notificacoes, setNotificacoes] = useState([]);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;
    listarNotificacoes(user.uid).then(setNotificacoes).catch(() => {});

    channelRef.current = subscribeNotificacoes(user.uid, (payload) => {
      if (payload.eventType === "INSERT") {
        setNotificacoes((prev) => [payload.new, ...prev]);
      }
    });

    return () => { channelRef.current?.unsubscribe(); };
  }, [user?.uid]);

  const marcar = async (id) => {
    await marcarLida(id);
    setNotificacoes((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n));
  };

  const marcarTodas = async () => {
    if (!user?.uid) return;
    await marcarTodasLidas(user.uid);
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  return { notificacoes, marcar, marcarTodas };
}
