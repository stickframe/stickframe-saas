import { useEffect } from "react";
import useAppStore from "../store/useAppStore";

const MODULOS_VALIDOS = new Set([
  "clientes", "fornecedores", "obras", "contratos", "orcamentos",
  "financeiro", "cotacoes", "diario", "medicoes", "arquivos",
  "notificacoes", "atividades", "historico",
]);

export function useModuleLoad(modulo, id = null) {
  const store = useAppStore();

  useEffect(() => {
    if (!MODULOS_VALIDOS.has(modulo)) {
      console.warn(`[useModuleLoad] módulo desconhecido: "${modulo}"`);
      return;
    }
    const fnName = `load${modulo.charAt(0).toUpperCase()}${modulo.slice(1)}`;
    if (typeof store[fnName] === "function") {
      store[fnName](id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulo, id]);

  return { loading: store.loading[modulo] || false };
}
