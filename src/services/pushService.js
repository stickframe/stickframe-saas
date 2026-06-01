import { sb } from "./supabaseClient";

const VAPID_PUBLIC = "BKT8lBsSp8WHV8893gIDOnEAYedOePXJizeucW3AzukegQaHc-_V1x8yo28NonhIvxNp4zU2G3E705x_ZkG1oFs";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribePush(empresaId, userId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
    const { endpoint, keys } = sub.toJSON();
    await sb.from("push_subscriptions").upsert(
      { empresa_id: empresaId, user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: "endpoint" }
    );
  } catch (e) {
    console.warn("Push subscribe failed:", e);
  }
}

export async function unsubscribePush() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}
