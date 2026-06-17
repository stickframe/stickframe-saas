import { useState, useEffect } from "react";
import { C } from "../../utils/constants";

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("pwa_banner_dismissed") === "1");
  const [notifState, setNotifState] = useState(() => {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const [notifDismissed, setNotifDismissed] = useState(() => localStorage.getItem("notif_dismissed") === "1");

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  };

  const dismiss = () => { setDismissed(true); localStorage.setItem("pwa_banner_dismissed", "1"); };

  const ativarNotificacoes = async () => {
    const result = await Notification.requestPermission();
    setNotifState(result);
    if (result === "granted" && "serviceWorker" in navigator) {
      const { subscribePush } = await import("../../services/pushService");
      const empresaId = localStorage.getItem("empresa_id");
      const userId = localStorage.getItem("user_id");
      if (empresaId && userId) await subscribePush(empresaId, userId);
    }
  };

  const dispensarNotif = () => { setNotifDismissed(true); localStorage.setItem("notif_dismissed", "1"); };

  const showNotifBanner = notifState === "default" && !notifDismissed && "Notification" in window;

  return (
    <>
      {offline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#b45309", color: "#fff",
          padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 600, gap: 8,
        }}>
          <span></span> Sem conexão — modo offline
        </div>
      )}

      {showNotifBanner && (
        <div style={{
          position: "fixed", bottom: prompt && !dismissed ? 100 : 16, left: 16, right: 16, zIndex: 9997,
          background: "#fff", border: "2px solid #2563eb",
          borderRadius: 12, padding: "14px 16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 28 }}></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#2563eb" }}>Ativar notificações</div>
            <div style={{ fontSize: 12, color: "#555" }}>Receba aviso quando um lead novo chegar</div>
          </div>
          <button onClick={ativarNotificacoes} style={{
            background: "#2563eb", color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>Ativar</button>
          <button onClick={dispensarNotif} style={{
            background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#999", lineHeight: 1,
          }}>×</button>
        </div>
      )}

      {prompt && !dismissed && (
        <div style={{
          position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 9998,
          background: "#fff", border: `2px solid ${C.red}`,
          borderRadius: 12, padding: "14px 16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <img src="/logo-transparente-122x122.png" alt="" width={40} height={40} style={{ borderRadius: 8 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.red }}>Instalar Stickframe</div>
            <div style={{ fontSize: 12, color: "#555" }}>Acesse rápido pelo celular, funciona offline</div>
          </div>
          <button onClick={install} style={{
            background: C.red, color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>Instalar</button>
          <button onClick={dismiss} style={{
            background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#999", lineHeight: 1,
          }}>×</button>
        </div>
      )}
    </>
  );
}
