import { C } from "../../utils/constants";

// Loader inline para Suspense dentro do AppLayout (não ocupa a tela inteira)
export function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, flexDirection: "column", gap: 14 }}>
      <div style={{
        width: 32, height: 32,
        border: `2px solid ${C.border}`,
        borderTop: `2px solid ${C.red}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// LoadingScreen completo — apenas para o boot inicial do app
export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: C.dark,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16,
    }}>
      <div style={{
        width: 40, height: 40,
        border: `3px solid ${C.border}`,
        borderTop: `3px solid ${C.red}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
