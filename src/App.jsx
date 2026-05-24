import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/globals.css";
import "./styles/responsive.css";
import useAppStore from "./store/useAppStore";
import AppLayout from "./components/layout/AppLayout";
import LoginScreen from "./pages/LoginScreen";
import LoadingScreen from "./components/ui/LoadingScreen";

// ─── LAZY PAGES ───────────────────────────────────────────────────────────────
const Dashboard   = lazy(() => import("./pages/Dashboard"));
const Agenda      = lazy(() => import("./pages/Agenda"));
const CRM         = lazy(() => import("./pages/CRM"));
const Orcamentos  = lazy(() => import("./pages/Orcamentos"));
const GestaoObras = lazy(() => import("./pages/GestaoObras"));
const Medicoes    = lazy(() => import("./pages/Medicoes"));
const DiarioObra  = lazy(() => import("./pages/DiarioObra"));
const Financeiro  = lazy(() => import("./pages/Financeiro"));
const Contratos   = lazy(() => import("./pages/Contratos"));
const Historico   = lazy(() => import("./pages/Historico"));
const PortalOnline= lazy(() => import("./pages/PortalOnline"));

// ─── MAPA DE PÁGINAS (componentes, não elementos) ─────────────────────────────
const PAGES = {
  dashboard:  Dashboard,
  agenda:     Agenda,
  crm:        CRM,
  orcamentos: Orcamentos,
  obras:      GestaoObras,
  medicoes:   Medicoes,
  diario:     DiarioObra,
  financeiro: Financeiro,
  contratos:  Contratos,
  historico:  Historico,
};

// ─── APP AUTENTICADO ──────────────────────────────────────────────────────────
function AuthenticatedApp() {
  const activePage = useAppStore((s) => s.activePage);
  const ActivePage = PAGES[activePage] || Dashboard;

  return (
    <AppLayout>
      <Suspense fallback={<LoadingScreen />}>
        <ActivePage />
      </Suspense>
    </AppLayout>
  );
}

// ─── GUARD ───────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const user = useAppStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Portal público — sem autenticação */}
          <Route path="/portal/:token" element={<PortalOnline />} />

          {/* Login */}
          <Route path="/login" element={<LoginScreen />} />

          {/* Sistema autenticado */}
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
