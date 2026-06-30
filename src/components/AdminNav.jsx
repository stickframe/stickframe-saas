// Navegação compartilhada entre os painéis admin (/admin, /admin/growth,
// /admin/health, /admin/mobile). As rotas existem mas eram órfãs — sem
// nenhum link entre elas. Estilo neutro (vermelho da marca + bordas
// translúcidas) para funcionar tanto no tema claro do /admin quanto no
// tema escuro dos sub-painéis.
const LINKS = [
  ["/admin", "Visão geral"],
  ["/admin/growth", "Growth"],
  ["/admin/conversion", "Conversão"],
  ["/admin/health", "Health"],
  ["/admin/mobile", "Mobile"],
];

export default function AdminNav() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/admin";
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
      {LINKS.map(([href, label]) => {
        const ativo = path === href;
        return (
          <a key={href} href={href} style={{
            fontSize: 13, fontWeight: 600, textDecoration: "none",
            padding: "8px 14px", borderRadius: 8,
            border: `1px solid ${ativo ? "#981915" : "rgba(128,128,128,.35)"}`,
            background: ativo ? "#981915" : "transparent",
            color: ativo ? "#fff" : "inherit",
          }}>{label}</a>
        );
      })}
    </div>
  );
}
