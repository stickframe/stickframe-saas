import { useCallback } from "react";
import useAppStore from "../store/useAppStore";

const NIVEL_RANK = { visualizador: 1, colaborador: 2, responsavel: 3 };

/**
 * Returns permission helpers for a given obra.
 *
 * Backward-compat rule:
 *   - Diretor → always full access
 *   - Obra com sem membros → todos da empresa têm acesso (comportamento atual)
 *   - Obra com membros → só membros acessam, no nivel atribuído
 */
export function useObraPermission(obraId) {
  const perfil = useAppStore((s) => s.user?.perfil);
  const uid    = useAppStore((s) => s.user?.uid);
  const obraMembros = useAppStore((s) => s.obraMembros);

  const nivel = useCallback(() => {
    if (perfil === "diretor") return "responsavel";
    const membros = obraMembros[obraId] || [];
    if (membros.length === 0) return "colaborador"; // sem membros → acesso livre
    const membro = membros.find((m) => m.usuario_id === uid);
    return membro?.nivel || null; // null = sem acesso
  }, [perfil, uid, obraMembros, obraId]);

  const temAcesso   = useCallback(() => nivel() !== null, [nivel]);
  const podeEditar  = useCallback(() => NIVEL_RANK[nivel()] >= NIVEL_RANK.colaborador, [nivel]);
  const podeGerenciar = useCallback(() => NIVEL_RANK[nivel()] >= NIVEL_RANK.responsavel, [nivel]);

  return { nivel, temAcesso, podeEditar, podeGerenciar };
}

/**
 * Filter a list of obras by the user's membership.
 * Obras sem membros são visíveis para todos (retrocompat).
 */
export function useObrasVisiveis(obras) {
  const perfil = useAppStore((s) => s.user?.perfil);
  const uid    = useAppStore((s) => s.user?.uid);
  const obraMembros = useAppStore((s) => s.obraMembros);

  if (perfil === "diretor") return obras;

  return obras.filter((o) => {
    const membros = obraMembros[o.id] || [];
    if (membros.length === 0) return true; // sem membros → visível para todos
    return membros.some((m) => m.usuario_id === uid);
  });
}
