import useAppStore from "../store/useAppStore";

export function useTrial() {
  const trialEndsAt = useAppStore((s) => s.trialEndsAt);
  // planoReal é o plano contratado; user.plano pode ser "pro" temporário
  // durante o trial (acesso liberado), então o banner usa planoReal.
  const planoReal = useAppStore((s) => s.planoReal ?? s.user?.plano);

  if (!trialEndsAt || planoReal === "pro" || planoReal === "enterprise") return { isTrial: false, isExpired: false, daysLeft: null };

  const now = new Date();
  const end = new Date(trialEndsAt);
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const isTrial = daysLeft > 0;
  const isExpired = daysLeft <= 0;

  return { isTrial, isExpired, daysLeft };
}
