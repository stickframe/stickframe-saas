import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import NotificacaoDropdown from "../notificacoes/NotificacaoDropdown";
import PresenceAvatars from "./PresenceAvatars";
import CommandPalette from "../ui/CommandPalette";
import PWAInstallBanner from "../ui/PWAInstallBanner";
import { subscribePush } from "../../services/pushService";
import { C, NAV } from "../../utils/constants";
import { buscarEmpresa } from "../../services/repositories/empresaRepository";
import useAppStore from "../../store/useAppStore";
import { useTrial } from "../../hooks/useTrial";
import OnboardingWizard from "../ui/OnboardingWizard";

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const empresaId  = useAppStore((s) => s.empresaId);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const activePage = useAppStore((s) => s.activePage);
  const perfil     = useAppStore((s) => s.user?.perfil);
  const activeLabel = NAV.find((n) => n.key === activePage)?.label || "";
  const loadClientes = useAppStore((s) => s.loadClientes);
  const userId = useAppStore((s) => s.user?.id);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const { isTrial, isExpired, daysLeft } = useTrial();

  useEffect(() => {
    if (empresaId && userId) {
      localStorage.setItem("empresa_id", empresaId);
      localStorage.setItem("user_id", userId);
      subscribePush(empresaId, userId);
    }
  }, [empresaId, userId]);

  // Pré-carrega clientes para o badge de follow-up do perfil comercial
  useEffect(() => {
    if (perfil === "comercial" && empresaId) loadClientes();
  }, [perfil, empresaId, loadClientes]);

  useEffect(() => {
    if (!empresaId) return;
    buscarEmpresa()
      .then((data) => {
        if (data && !data.onboarding_completo) setShowOnboarding(true);
        setCheckDone(true);
      })
      .catch(() => setCheckDone(true));
  }, [empresaId]);

  return (
    <div className="app-layout">
      {showOnboarding && checkDone && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-area">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="hamburger" onClick={() => setMenuOpen((v) => !v)}>☰</button>
            <span style={{ fontSize: 16, fontWeight: 600, color: C.muted }}>{activeLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PresenceAvatars />
            <NotificacaoDropdown />
            <button
              onClick={toggleDarkMode}
              title={darkMode ? "Modo claro" : "Modo escuro"}
              style={{
                background: "none", border: `1px solid ${C.border}`, cursor: "pointer",
                fontSize: 15, lineHeight: 1, padding: "6px 8px",
                borderRadius: 8, color: C.muted,
              }}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
        {(isTrial || isExpired) && (
          <div style={{
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "inherit",
            background: isExpired || daysLeft <= 3 ? "#dc2626" : "#f59e0b",
            color: "#fff",
          }}>
            <span>
              {isExpired
                ? "Seu trial expirou — "
                : `Seu trial Pro expira em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} — `}
            </span>
            <a
              href="/pricing"
              style={{
                background: "rgba(255,255,255,0.25)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "none",
              }}
            >
              {isExpired ? "Assinar agora" : "Fazer upgrade"}
            </a>
          </div>
        )}
        <main className="main-content">
          {children}
        </main>
      </div>
      <CommandPalette onNavigate={setActivePage} />
      <PWAInstallBanner />
    </div>
  );
}
