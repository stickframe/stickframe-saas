import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/globals.css";
import "./styles/responsive.css";
import useAppStore from "./store/useAppStore";
import AppLayout from "./components/layout/AppLayout";
import LoginScreen from "./pages/LoginScreen";
import LoadingScreen from "./components/ui/LoadingScreen";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

// ─── PAGES — congelado fora do componente ─────────────────────────────────────
const PAGES = Object.freeze({
  dashboard:  lazy(() => import("./pages/Dashboard")),
  agenda:     lazy(() => import("./pages/Agenda")),
  crm:        lazy(() => import("./pages/CRM")),
  orcamentos: lazy(() => import("./pages/Orcamentos")),
  obras:      lazy(() => import("./pages/GestaoObras")),
  medicoes:   lazy(() => import("./pages/Medicoes")),
  diario:     lazy(() => import("./pages/DiarioObra")),
  financeiro: lazy(() => import("./pages/Financeiro")),
  contratos:  lazy(() => import("./pages/Contratos")),
  historico:  lazy(() => import("./pages/Historico")),
});

const PortalOnline = lazy(() => import("./pages/PortalOnline"));

// ─── APP AUTENTICADO — sem lógica de negócio, só orquestração ────────────────
function AuthenticatedApp() {
  const { activePage, loadInitialData } = useAppStore((s) => ({
    activePage:      s.activePage,
    loadInitialData: s.loadInitialData,
  }));

  useEffect(() => {
    loadInitialData();
  }, []); // [] — roda só uma vez no mount

  const ActivePage = PAGES[activePage] || PAGES.dashboard;

  return (
    <AppLayout>
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <ActivePage />
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

// ─── GUARD ────────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const user = useAppStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
}

// ─── ROOT — apenas roteamento ─────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/portal/:token" element={<PortalOnline />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/*" element={
            <RequireAuth>
              <AuthenticatedApp />
            </RequireAuth>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
