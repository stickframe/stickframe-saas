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
          position: "fixed",
          bottom: `calc(${prompt && !dismissed ? 92 : 12}px + env(safe-area-inset-bottom, 0px))`,
          left: 12, right: 12, zIndex: 9997, maxWidth: 460, margin: "0 auto",
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "12px 14px",
          boxShadow: "0 6px 24px rgba(40,30,20,.16)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div aria-hidden="true" style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: C.brickSoft, color: C.red, display: "grid", placeItems: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>Ativar notificações</div>
            <div style={{ fontSize: 11, color: C.muted }}>Receba aviso quando um lead novo chegar</div>
          </div>
          <button onClick={ativarNotificacoes} style={{
            background: C.red, color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            fontFamily: "inherit", minHeight: 36,
          }}>Ativar</button>
          <button onClick={dispensarNotif} aria-label="Dispensar" title="Dispensar" style={{
            background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.muted, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>
      )}

      {prompt && !dismissed && (
        <div style={{
          position: "fixed",
          bottom: "calc(12px + env(safe-area-inset-bottom, 0px))", left: 12, right: 12, zIndex: 9998,
          maxWidth: 460, margin: "0 auto",
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "12px 14px",
          boxShadow: "0 6px 24px rgba(40,30,20,.16)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <img src="/logo-transparente-122x122.png" alt="" width={34} height={34} style={{ borderRadius: 8 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>Instalar Stickframe</div>
            <div style={{ fontSize: 11, color: C.muted }}>Acesse rápido pelo celular, funciona offline</div>
          </div>
          <button onClick={install} style={{
            background: C.red, color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            fontFamily: "inherit", minHeight: 36,
          }}>Instalar</button>
          <button onClick={dismiss} aria-label="Dispensar" title="Dispensar" style={{
            background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.muted, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>
      )}
    </>
  );
}
