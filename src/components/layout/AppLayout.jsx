import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import NotificacaoDropdown from "../notificacoes/NotificacaoDropdown";
import { C } from "../../utils/constants";
import { sb } from "../../services/supabase";
import useAppStore from "../../store/useAppStore";
import { lazy, Suspense } from "react";

const Onboarding = lazy(() => import("../../pages/Onboarding"));

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const empresaId = useAppStore((s) => s.empresaId);

  useEffect(() => {
    if (!empresaId) return;
    sb.from("empresas").select("onboarding_completo").eq("id", empresaId).single()
      .then(({ data }) => {
        if (data && !data.onboarding_completo) setShowOnboarding(true);
        setCheckDone(true);
      })
      .catch(() => setCheckDone(true));
  }, [empresaId]);

  return (
    <div className="app-layout">
      {showOnboarding && checkDone && (
        <Suspense fallback={null}>
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        </Suspense>
      )}

      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}
      <Sidebar open={menuOpen} />
      <div className="main-area">
        <div className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen((v) => !v)}>☰</button>
          <NotificacaoDropdown />
        </div>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
