import useAppStore from "../store/useAppStore";

export function useTrial() {
  const trialEndsAt = useAppStore((s) => s.trialEndsAt);
  const plano = useAppStore((s) => s.user?.plano);

  if (!trialEndsAt || plano === "pro") return { isTrial: false, isExpired: false, daysLeft: null };

  const now = new Date();
  const end = new Date(trialEndsAt);
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const isTrial = daysLeft > 0;
  const isExpired = daysLeft <= 0;

  return { isTrial, isExpired, daysLeft };
}
