import { sb, getEmpresaId } from "../supabase";

export async function getTrialHealth() {
  const empresaId = await getEmpresaId();
  if (!empresaId) return null;

  const { data } = await sb.from("vw_trial_health")
    .select("*")
    .eq("empresa_id", empresaId)
    .single();

  return data || null;
}

export async function getActivationScore() {
  const empresaId = await getEmpresaId();
  if (!empresaId) return null;

  const { data } = await sb.from("vw_activation_score")
    .select("*")
    .eq("empresa_id", empresaId)
    .single();

  return data || null;
}

export function computeTrialReadiness(activationPct, hasClientes, hasOrcamentos, hasObras) {
  if (activationPct >= 80) return { ready: true, label: "Pronto para converter", color: "#4ade80" };
  if (activationPct >= 60) return { ready: true, label: "Quase lá", color: "#fbbf24" };
  if (activationPct >= 40) return { ready: false, label: "Em progresso", color: "#fb923c" };
  return { ready: false, label: "Iniciando", color: "#f87171" };
}
