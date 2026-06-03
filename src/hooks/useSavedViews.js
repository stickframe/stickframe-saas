import { useCallback } from "react";
import { sb } from "../services/supabase";
import useAppStore from "../store/useAppStore";

export function useSavedViews(module) {
  const empresaId = useAppStore((s) => s.empresaId);
  const savedViews = useAppStore((s) => s.savedViews);
  const setSavedViews = useAppStore((s) => s.setSavedViews);

  const views = (savedViews || []).filter((v) => v.module === module);

  const loadViews = useCallback(async () => {
    if (!empresaId) return;
    const { data } = await sb
      .from("saved_views")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("module", module)
      .order("created_at");
    if (data) setSavedViews((prev) => [
      ...(prev || []).filter((v) => v.module !== module),
      ...data,
    ]);
  }, [empresaId, module, setSavedViews]);

  const saveView = useCallback(async (label, filters) => {
    if (!empresaId) return;
    const { data, error } = await sb
      .from("saved_views")
      .insert({ empresa_id: empresaId, module, label, filters })
      .select()
      .single();
    if (!error && data) setSavedViews((prev) => [...(prev || []), data]);
    return data;
  }, [empresaId, module, setSavedViews]);

  const deleteView = useCallback(async (id) => {
    await sb.from("saved_views").delete().eq("id", id);
    setSavedViews((prev) => (prev || []).filter((v) => v.id !== id));
  }, [setSavedViews]);

  return { views, loadViews, saveView, deleteView };
}
