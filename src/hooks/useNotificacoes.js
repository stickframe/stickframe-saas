import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAppStore from "../store/useAppStore";
import {
  listarNotificacoes,
  marcarLida,
  marcarTodasLidas,
  subscribeNotificacoes,
} from "../services/repositories/notificacoesRepository";

export function useNotificacoes() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = ["notificacoes", user?.uid];

  // ── Busca com cache automático ───────────────────────────────────────────
  const { data: notificacoes = [] } = useQuery({
    queryKey,
    queryFn: () => listarNotificacoes(user.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 2, // 2 min — revalida em background
  });

  // ── Marcar uma como lida (optimistic update) ─────────────────────────────
  const { mutate: marcar } = useMutation({
    mutationFn: (id) => marcarLida(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old = []) =>
        old.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(queryKey, ctx?.previous);
    },
  });

  // ── Marcar todas como lidas (optimistic update) ───────────────────────────
  const { mutate: marcarTodas } = useMutation({
    mutationFn: () => marcarTodasLidas(user?.uid),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old = []) =>
        old.map((n) => ({ ...n, lida: true }))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(queryKey, ctx?.previous);
    },
  });

  // ── Realtime: injeta nova notificação direto no cache ────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const channel = subscribeNotificacoes(user.uid, (payload) => {
      if (payload.eventType === "INSERT") {
        queryClient.setQueryData(queryKey, (old = []) => [payload.new, ...old]);
      }
    });

    return () => { channel?.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return {
    notificacoes,
    marcar,
    marcarTodas,
    quantidadeNaoLidas: notificacoes.filter((n) => !n.lida).length,
  };
}
