import { C } from "../../utils/constants";

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
      <div style={{ fontSize: 13, color: C.muted }}>Carregando...</div>
    </div>
  );
}
