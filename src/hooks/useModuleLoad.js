import { useEffect } from "react";
import useAppStore from "../store/useAppStore";

/**
 * Hook que carrega dados de um módulo na primeira vez que a página abre.
 * Cada página chama seu próprio hook — nada carrega antes de ser necessário.
 *
 * Uso:
 *   useModuleLoad("clientes") → chama store.loadClientes()
 *   useModuleLoad("financeiro") → chama store.loadFinanceiro()
 *   useModuleLoad("diario", obraId) → chama store.loadDiario(obraId)
 */
export function useModuleLoad(modulo, id = null) {
  const store = useAppStore();

  useEffect(() => {
    const fnName = `load${modulo.charAt(0).toUpperCase()}${modulo.slice(1)}`;
    if (typeof store[fnName] === "function") {
      store[fnName](id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulo, id]);

  return {
    loading: id
      ? (store.loading[modulo] || false)
      : (store.loading[modulo] || false),
  };
}
