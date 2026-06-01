import { useState, useEffect } from "react";
import { C } from "../../utils/constants";

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("pwa_banner_dismissed") === "1");

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

  return (
    <>
      {offline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#b45309", color: "#fff",
          padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 600, gap: 8,
        }}>
          <span>📡</span> Sem conexão — modo offline
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
