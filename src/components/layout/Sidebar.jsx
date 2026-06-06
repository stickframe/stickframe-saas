import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { C, NAV, PERFIS } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";
import { sb, getEmpresaId } from "../../services/supabase";
import { LOGO_STICKFRAME } from "../../utils/cdn";

function NavIcon({ name, size = 16, color }) {
  const Icon = LucideIcons[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={1.75} />;
}

export default function Sidebar({ open, onClose }) {
  const user          = useAppStore((s) => s.user);
  const activePage    = useAppStore((s) => s.activePage);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const logout        = useAppStore((s) => s.logout);
  const clientes      = useAppStore((s) => s.clientes);
  const [confirm, setConfirm] = useState(false);

  const perfisCustomizados = useAppStore((s) => s.perfisCustomizados);
  const perfilCustom = !PERFIS[user?.perfil]
    ? perfisCustomizados.find((p) => p.id === user?.perfil)
    : null;
  const perfil    = PERFIS[user?.perfil] || perfilCustom || PERFIS.diretor;
  const navFiltro = NAV.filter((n) => perfil.paginas.includes(n.key));
  const active    = perfil.paginas.includes(activePage) ? activePage : "dashboard";

  const [preOrcCount, setPreOrcCount] = useState(0);
  useEffect(() => {
    const empId = getEmpresaId();
    if (!empId) return;
    sb.from("pre_orcamentos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empId)
      .eq("status", "Novo")
      .then(({ count }) => setPreOrcCount(count || 0));
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);
  const followupsVencidos = user?.perfil === "comercial"
    ? clientes.filter((c) => c.proximo_contato && c.proximo_contato <= hoje && c.status !== "Fechado").length
    : 0;

  const sidebarStyle = {
    width: 256,
    height: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
    position: "sticky",
    top: 0,
  };

  return (
    <aside className={`sidebar-desktop${open ? " open" : ""}`} style={sidebarStyle}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "#dc2626", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <img src={LOGO_STICKFRAME} style={{ width: 24, height: 24, objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="Logo" />
          </div>
          <div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: 1.5, fontSize: 16, lineHeight: 1, color: "#0f172a" }}>
              STICKFRAME
            </div>
            <div style={{ color: "#94a3b8", fontSize: 9, letterSpacing: 1.5, marginTop: 2 }}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
        {(() => {
          const GROUP_BREAKS = new Set(["obras", "financeiro", "calculadora", "configuracoes"]);
          const items = [];
          navFiltro.forEach((n, idx) => {
            if (idx > 0 && GROUP_BREAKS.has(n.key)) {
              items.push(
                <div key={`div-${n.key}`} style={{ margin: "6px 4px", borderTop: "1px solid #f1f5f9" }} />
              );
            }
            const isActive = active === n.key;
            items.push(
              <button
                key={n.key}
                onClick={() => { setActivePage(n.key); onClose?.(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px",
                  background: isActive ? "rgba(220,38,38,0.08)" : "transparent",
                  border: "none",
                  borderRight: isActive ? "3px solid #dc2626" : "3px solid transparent",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: isActive ? "#dc2626" : "#64748b",
                  fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                  textAlign: "left", transition: "all .15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "#dc2626"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
              >
                <NavIcon name={n.icon} size={16} color={isActive ? "#dc2626" : "#94a3b8"} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.key === "crm" && followupsVencidos > 0 && (
                  <span style={{ background: "#dc2626", color: "#fff", borderRadius: 100, fontSize: 10, fontWeight: 700, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>
                    {followupsVencidos}
                  </span>
                )}
                {n.key === "orcamentos" && preOrcCount > 0 && (
                  <span style={{ background: "#16a34a", color: "#fff", borderRadius: 100, fontSize: 10, fontWeight: 700, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>
                    {preOrcCount}
                  </span>
                )}
              </button>
            );
          });
          return items;
        })()}
      </nav>

      {/* User */}
      <div style={{ padding: "16px", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: perfil.cor + "22", border: `2px solid ${perfil.cor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: perfil.cor, flexShrink: 0 }}>
            {user?.nome?.[0] || "U"}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#0f172a" }}>{user?.nome}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{perfil.label}</div>
          </div>
          {confirm ? (
            <div style={{ fontSize: 11, whiteSpace: "nowrap" }}>
              <button onClick={logout} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Sair</button>
              {" · "}
              <button onClick={() => setConfirm(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>Não</button>
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} title="Sair" style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4, borderRadius: 6, lineHeight: 1 }}>
              <NavIcon name="LogOut" size={15} color="#94a3b8" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
