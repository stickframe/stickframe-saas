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
    width: 248,
    height: "100vh",
    background: "#16181c",
    color: "#fff",
    borderRight: "1px solid #25282e",
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
      <div style={{ padding: "24px 22px 18px", borderBottom: "1px solid #25282e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_STICKFRAME} style={{ height: "34px", width: "auto", display: "block", objectFit: "contain", flexShrink: 0 }} alt="Logo StickFrame" />
          <div>
            <div style={{ fontFamily: "inherit", fontWeight: 700, letterSpacing: "2px", fontSize: 16, lineHeight: 1, color: "#ffffff" }}>
              STICKFRAME
            </div>
            <div style={{ color: "#7a7f87", fontSize: 9, letterSpacing: "2px", marginTop: 4, fontWeight: 600 }}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 0", overflowY: "auto" }}>
        {(() => {
          const GROUP_BREAKS = new Set(["obras", "financeiro", "calculadora", "configuracoes"]);
          const items = [];
          navFiltro.forEach((n, idx) => {
            if (idx > 0 && GROUP_BREAKS.has(n.key)) {
              items.push(
                <div key={`div-${n.key}`} style={{ margin: "10px 0", borderTop: "1px solid #25282e" }} />
              );
            }
            const isActive = active === n.key;
            items.push(
              <button
                key={n.key}
                onClick={() => { setActivePage(n.key); onClose?.(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "9px 22px",
                  background: isActive ? "rgba(152,25,21,0.16)" : "transparent",
                  border: "none",
                  borderLeft: isActive ? "3px solid #981915" : "3px solid transparent",
                  cursor: "pointer",
                  color: isActive ? "#ffffff" : "#9aa0a8",
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  textAlign: "left", transition: "all .15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#1e2127"; e.currentTarget.style.color = "#ffffff"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9aa0a8"; } }}
              >
                <NavIcon name={n.icon} size={15} color={isActive ? "#ffffff" : "#9aa0a8"} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.key === "crm" && followupsVencidos > 0 && (
                  <span style={{ background: "#981915", color: "#fff", borderRadius: 100, fontSize: 10, fontWeight: 700, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>
                    {followupsVencidos}
                  </span>
                )}
                {n.key === "orcamentos" && preOrcCount > 0 && (
                  <span style={{ background: "#2e9e5b", color: "#fff", borderRadius: 100, fontSize: 10, fontWeight: 700, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>
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
      <div style={{ padding: "16px", borderTop: "1px solid #25282e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: perfil.cor + "22", border: `2px solid ${perfil.cor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: perfil.cor, flexShrink: 0 }}>
            {user?.nome?.[0] || "U"}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#ffffff" }}>{user?.nome}</div>
            <div style={{ fontSize: 11, color: "#9aa0a8", marginTop: 1 }}>{perfil.label}</div>
          </div>
          {confirm ? (
            <div style={{ fontSize: 11, whiteSpace: "nowrap" }}>
              <button onClick={logout} style={{ background: "none", border: "none", color: "#c9484a", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Sair</button>
              {" · "}
              <button onClick={() => setConfirm(false)} style={{ background: "none", border: "none", color: "#9aa0a8", cursor: "pointer", fontSize: 11 }}>Não</button>
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} title="Sair" style={{ background: "none", border: "none", color: "#9aa0a8", cursor: "pointer", padding: 4, borderRadius: 6, lineHeight: 1 }}>
              <NavIcon name="LogOut" size={15} color="#9aa0a8" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
