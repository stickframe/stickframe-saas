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

const BADGE_STYLE = {
  IA:      { bg: "#6d3a9e", color: "#fff" },
  PRO:     { bg: "#981915", color: "#fff" },
  NOVO:    { bg: "#2e7d5a", color: "#fff" },
  PREMIUM: { bg: "#b07a1e", color: "#fff" },
};

function NavBadge({ badge }) {
  if (!badge) return null;
  const s = BADGE_STYLE[badge] || { bg: "#444", color: "#fff" };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 8, fontWeight: 800,
      padding: "2px 5px", borderRadius: 4, letterSpacing: 0.5, lineHeight: 1,
    }}>{badge}</span>
  );
}

// Grupos de navegação em ordem
const GRUPOS_ORDEM = [null, "Comercial", "Obras", "Financeiro", "Compras", "Engenharia", "Gestão", "__config__"];
const GRUPO_LABEL = {
  "Comercial":   "Comercial",
  "Obras":       "Obras",
  "Financeiro":  "Financeiro",
  "Compras":     "Compras",
  "Engenharia":  "Engenharia",
  "Gestão":      "Gestão",
};

function buildGroupedNav(navFiltro) {
  // Separa configuracoes e agrupa o resto
  const config   = navFiltro.filter(n => n.key === "configuracoes");
  const rest     = navFiltro.filter(n => n.key !== "configuracoes");
  const groups   = {};
  rest.forEach(n => {
    const g = n.grupo || "__top__";
    if (!groups[g]) groups[g] = [];
    groups[g].push(n);
  });
  return { groups, config };
}

function NavButton({ n, isActive, onClick, badges }) {
  return (
    <button
      key={n.key}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9, width: "100%",
        padding: n.brand ? "6px 18px" : "8px 18px",
        background: isActive ? "rgba(152,25,21,0.18)" : "transparent",
        border: "none",
        borderLeft: isActive ? "3px solid #981915" : "3px solid transparent",
        cursor: "pointer",
        color: isActive ? "#ffffff" : "#9aa0a8",
        fontSize: 12.5, fontWeight: isActive ? 700 : 500,
        textAlign: "left", transition: "all .12s",
        fontFamily: "inherit",
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#1e2127"; e.currentTarget.style.color = "#ffffff"; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9aa0a8"; } }}
    >
      <NavIcon name={n.icon} size={14} color={isActive ? "#ffffff" : "#9aa0a8"} />
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <span>{n.label}</span>
        {n.brand && (
          <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? "rgba(255,255,255,0.45)" : "#4a5060", letterSpacing: 0.3 }}>
            {n.brand}
          </span>
        )}
      </span>
      {badges}
      {n.badge && <NavBadge badge={n.badge} />}
    </button>
  );
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

  const [busca, setBusca] = useState("");

  const navFiltrado = busca.trim()
    ? navFiltro.filter(n =>
        n.label.toLowerCase().includes(busca.toLowerCase()) ||
        n.brand?.toLowerCase().includes(busca.toLowerCase())
      )
    : navFiltro;
  const { groups: groupsFiltrado, config: configFiltrado } = buildGroupedNav(navFiltrado);

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

  const { groups, config } = buildGroupedNav(navFiltro);

  function renderNavGroups(mobile = false, overrideGroups, overrideConfig) {
    const grps = overrideGroups || groups;
    const cfg  = overrideConfig  || config;
    const pad = mobile ? "12px 18px" : "8px 18px";
    const iconSz = mobile ? 16 : 14;
    const fontSize = mobile ? 14 : 12.5;
    const items = [];

    // Top items (null group: dashboard, agenda)
    (grps["__top__"] || []).forEach(n => {
      const isActive = active === n.key;
      items.push(
        <button key={n.key} onClick={() => { setActivePage(n.key); onClose?.(); }}
          style={{
            display: "flex", alignItems: "center", gap: 9, width: "100%",
            padding: pad, background: isActive ? "rgba(152,25,21,0.18)" : "transparent",
            border: "none", borderLeft: isActive ? "3px solid #981915" : "3px solid transparent",
            cursor: "pointer", color: isActive ? "#ffffff" : "#9aa0a8",
            fontSize, fontWeight: isActive ? 700 : 500,
            textAlign: "left", transition: "all .12s", fontFamily: "inherit",
          }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background="#1e2127"; e.currentTarget.style.color="#fff"; }}}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9aa0a8"; }}}
        >
          <NavIcon name={n.icon} size={iconSz} color={isActive ? "#fff" : "#9aa0a8"} />
          <span style={{ flex: 1 }}>{n.label}</span>
        </button>
      );
    });

    // Grouped items
    ["Comercial","Obras","Financeiro","Compras","Engenharia","Gestão"].forEach(grupo => {
      const list = grps[grupo];
      if (!list || !list.length) return;
      items.push(
        <div key={`grp-${grupo}`}>
          <div style={{
            padding: "10px 18px 4px", fontSize: 9, fontWeight: 800,
            color: "#4a5060", letterSpacing: 1.5, textTransform: "uppercase",
            marginTop: 4,
          }}>{GRUPO_LABEL[grupo]}</div>
          {list.map(n => {
            const isActive = active === n.key;
            const badges = [];
            if (n.key === "crm" && followupsVencidos > 0)
              badges.push(<span key="fu" style={{ background: "#981915", color: "#fff", borderRadius: 100, fontSize: 9, fontWeight: 700, padding: "1px 6px" }}>{followupsVencidos}</span>);
            if (n.key === "orcamentos" && preOrcCount > 0)
              badges.push(<span key="orc" style={{ background: "#2e9e5b", color: "#fff", borderRadius: 100, fontSize: 9, fontWeight: 700, padding: "1px 6px" }}>{preOrcCount}</span>);
            return (
              <button key={n.key} onClick={() => { setActivePage(n.key); onClose?.(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 9, width: "100%",
                  padding: pad, background: isActive ? "rgba(152,25,21,0.18)" : "transparent",
                  border: "none", borderLeft: isActive ? "3px solid #981915" : "3px solid transparent",
                  cursor: "pointer", color: isActive ? "#ffffff" : "#9aa0a8",
                  fontSize, fontWeight: isActive ? 700 : 500,
                  textAlign: "left", transition: "all .12s", fontFamily: "inherit",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background="#1e2127"; e.currentTarget.style.color="#fff"; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9aa0a8"; }}}
              >
                <NavIcon name={n.icon} size={iconSz} color={isActive ? "#fff" : "#9aa0a8"} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {badges}
                {n.badge && <NavBadge badge={n.badge} />}
              </button>
            );
          })}
        </div>
      );
    });

    // Configurações (always last)
    if (cfg.length) {
      items.push(<div key="div-cfg" style={{ margin: "8px 0", borderTop: "1px solid #25282e" }} />);
      cfg.forEach(n => {
        const isActive = active === n.key;
        items.push(
          <button key={n.key} onClick={() => { setActivePage(n.key); onClose?.(); }}
            style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: pad, background: isActive ? "rgba(152,25,21,0.18)" : "transparent",
              border: "none", borderLeft: isActive ? "3px solid #981915" : "3px solid transparent",
              cursor: "pointer", color: isActive ? "#ffffff" : "#9aa0a8",
              fontSize, fontWeight: isActive ? 700 : 500,
              textAlign: "left", transition: "all .12s", fontFamily: "inherit",
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background="#1e2127"; e.currentTarget.style.color="#fff"; }}}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9aa0a8"; }}}
          >
            <NavIcon name={n.icon} size={iconSz} color={isActive ? "#fff" : "#9aa0a8"} />
            <span style={{ flex: 1 }}>{n.label}</span>
          </button>
        );
      });
    }

    return items;
  }

  const sidebarStyle = {
    width: 232,
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

  const drawerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100dvh",
    width: 260,
    background: "#16181c",
    color: "#fff",
    borderRight: "1px solid #25282e",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 600,
    transform: open ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.25s ease",
  };

  // Mobile bottom nav items
  const bottomNav = [
    { key: "dashboard",  label: "Início",  icon: "LayoutDashboard" },
    { key: "obras",      label: "Obras",   icon: "Building2" },
    { key: "crm",        label: "CRM",     icon: "Users" },
    { key: "inteligencia", label: "IA",    icon: "Brain" },
    { key: "__menu__",   label: "Menu",    icon: "Menu" },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop" style={sidebarStyle}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid #25282e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <img src={LOGO_STICKFRAME} style={{ height: "30px", width: "auto", display: "block", objectFit: "contain", flexShrink: 0 }} alt="Logo StickFrame" />
            <div>
              <div style={{ fontFamily: "inherit", fontWeight: 700, letterSpacing: "2px", fontSize: 14, lineHeight: 1, color: "#ffffff" }}>
                STICKFRAME
              </div>
              <div style={{ color: "#7a7f87", fontSize: 8, letterSpacing: "2px", marginTop: 3, fontWeight: 600 }}>SISTEMAS CONSTRUTIVOS</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e2127" }}>
          <div style={{ position: "relative" }}>
            <NavIcon name="Search" size={12} color="#4a5060" />
            <input
              value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar módulo…"
              style={{
                width: "100%", padding: "7px 10px 7px 26px",
                background: "#1e2127", border: "1px solid #25282e",
                borderRadius: 8, color: "#fff", fontSize: 12,
                fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <NavIcon name="Search" size={12} color="#4a5060" />
            </div>
            {busca && (
              <button onClick={() => setBusca("")} style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#4a5060", cursor: "pointer", fontSize: 14, lineHeight: 1,
              }}>✕</button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {busca.trim()
            ? renderNavGroups(false, groupsFiltrado, configFiltrado)
            : renderNavGroups(false)}
        </nav>

        {/* User */}
        <div style={{ padding: "12px", borderTop: "1px solid #25282e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: perfil.cor + "22", border: `2px solid ${perfil.cor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: perfil.cor, flexShrink: 0 }}>
              {user?.nome?.[0] || "U"}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#ffffff" }}>{user?.nome}</div>
              <div style={{ fontSize: 10, color: "#9aa0a8", marginTop: 1 }}>{perfil.label}</div>
            </div>
            {confirm ? (
              <div style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                <button onClick={logout} style={{ background: "none", border: "none", color: "#c9484a", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Sair</button>
                {" · "}
                <button onClick={() => setConfirm(false)} style={{ background: "none", border: "none", color: "#9aa0a8", cursor: "pointer", fontSize: 11 }}>Não</button>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} title="Sair" style={{ background: "none", border: "none", color: "#9aa0a8", cursor: "pointer", padding: 4, borderRadius: 6, lineHeight: 1 }}>
                <NavIcon name="LogOut" size={14} color="#9aa0a8" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <aside className="sidebar-mobile-drawer" style={drawerStyle}>
        <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid #25282e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={LOGO_STICKFRAME} style={{ height: "30px", width: "auto", objectFit: "contain" }} alt="Logo StickFrame" />
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9aa0a8", fontSize: 22, cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        {/* Search mobile */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e2127" }}>
          <div style={{ position: "relative" }}>
            <input
              value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar módulo…"
              style={{
                width: "100%", padding: "9px 10px 9px 32px",
                background: "#1e2127", border: "1px solid #25282e",
                borderRadius: 8, color: "#fff", fontSize: 13,
                fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <NavIcon name="Search" size={14} color="#4a5060" />
            </div>
            {busca && (
              <button onClick={() => setBusca("")} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#4a5060", cursor: "pointer", fontSize: 16, lineHeight: 1,
              }}>✕</button>
            )}
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {busca.trim()
            ? renderNavGroups(true, groupsFiltrado, configFiltrado)
            : renderNavGroups(true)}
        </nav>
        <div style={{ padding: "16px 16px calc(16px + env(safe-area-inset-bottom))", borderTop: "1px solid #25282e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: perfil.cor + "22", border: `2px solid ${perfil.cor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: perfil.cor, flexShrink: 0 }}>
              {user?.nome?.[0] || "U"}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.nome}</div>
              <div style={{ fontSize: 10, color: "#9aa0a8" }}>{perfil.label}</div>
            </div>
          </div>
          <button onClick={logout} style={{ background: "none", border: "none", color: "#c9484a", cursor: "pointer", fontWeight: 700, fontSize: 13, padding: "8px 0", width: "100%", textAlign: "left" }}>
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav bar */}
      <nav className="mobile-bottom-nav" style={{
        display: "none", /* shown via CSS on mobile */
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#16181c", borderTop: "1px solid #25282e",
        zIndex: 500,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {bottomNav.map(item => {
          if (item.key === "__menu__") {
            return (
              <button key="menu" onClick={onClose === undefined ? undefined : () => { /* handled by parent */ }}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 0", background: "none", border: "none", color: "#9aa0a8", cursor: "pointer", fontFamily: "inherit" }}
                onClick={() => { if (typeof onClose === "function") onClose(); else document.dispatchEvent(new CustomEvent("sf:open-menu")); }}
              >
                <NavIcon name="Menu" size={20} color="#9aa0a8" />
                <span style={{ fontSize: 9, fontWeight: 600 }}>Menu</span>
              </button>
            );
          }
          const isActive = active === item.key;
          const inNav = perfil.paginas.includes(item.key);
          if (!inNav) return null;
          return (
            <button key={item.key} onClick={() => setActivePage(item.key)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 3, padding: "10px 0",
                background: "none", border: "none",
                color: isActive ? "#981915" : "#9aa0a8",
                cursor: "pointer", fontFamily: "inherit", transition: "color .15s",
              }}>
              <NavIcon name={item.icon} size={20} color={isActive ? "#981915" : "#9aa0a8"} />
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 600 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
