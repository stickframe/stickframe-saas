import { lazy, Suspense } from "react";
import { C, OBRA_TOKENS } from "./utils/constants";
import useAppStore from "./store/useAppStore";
import AppLayout from "./components/layout/AppLayout";
import LoginScreen from "./pages/LoginScreen";

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

const PAGES = {
  dashboard:  <Dashboard />,
  agenda:     <Agenda />,
  crm:        <CRM />,
  orcamentos: <Orcamentos />,
  obras:      <GestaoObras />,
  medicoes:   <Medicoes />,
  diario:     <DiarioObra />,
  financeiro: <Financeiro />,
  contratos:  <Contratos />,
  historico:  <Historico />,
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=DM+Sans:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.dark};color:${C.text};font-family:'DM Sans',sans-serif;}
  input:focus,select:focus{border-color:${C.red}!important;}
  ::-webkit-scrollbar{width:6px;}
  ::-webkit-scrollbar-track{background:${C.dark};}
  ::-webkit-scrollbar-thumb{background:#2e2e2e;border-radius:3px;}

  .app-layout{display:flex;min-height:100vh;}
  .sidebar-desktop{width:220px;flex-shrink:0;}
  .main-area{flex:1;display:flex;flex-direction:column;min-width:0;}
  .topbar{padding:12px 38px;border-bottom:1px solid ${C.border};display:flex;justify-content:space-between;align-items:center;background:${C.darker};gap:12px;}
  .main-content{flex:1;padding:34px 38px;overflow:auto;}
  .hamburger{display:none;background:none;border:none;color:${C.text};font-size:22px;cursor:pointer;padding:4px 8px;}
  .mobile-overlay{display:none;}

  .kpi-grid-6{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:22px;}
  .kpi-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:26px;}
  .kpi-grid-5{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
  .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}

  @media(max-width:768px){
    .sidebar-desktop{position:fixed;top:0;left:-220px;height:100vh;z-index:95;transition:left .25s ease;}
    .sidebar-desktop.open{left:0;}
    .hamburger{display:block;}
    .topbar{padding:10px 16px;}
    .main-content{padding:16px 14px;}
    .mobile-overlay{display:block;position:fixed;inset:0;background:#000a;z-index:90;}
    .kpi-grid-6,.kpi-grid-4,.kpi-grid-5{grid-template-columns:repeat(2,1fr);gap:10px;}
    .two-col,.three-col{grid-template-columns:1fr;}
    .modal-inner{width:95vw!important;max-width:95vw!important;}
  }
`;

export default function App() {
  const { user, activePage } = useAppStore();

  // Portal público — não precisa de login
  const hash = window.location.hash;
  if (hash.startsWith("#/portal/")) {
    return (
      <Suspense fallback={<div style={{color:"#fff",padding:32}}>Carregando...</div>}>
        <PortalOnline />
      </Suspense>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      {!user ? (
        <LoginScreen />
      ) : (
        <AppLayout>
          <Suspense fallback={<div style={{color:C.muted,padding:32,textAlign:"center"}}>Carregando...</div>}>
            {PAGES[activePage] || <Dashboard />}
          </Suspense>
        </AppLayout>
      )}
    </>
  );
}
