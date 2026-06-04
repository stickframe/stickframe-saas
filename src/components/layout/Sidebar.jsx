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

  return (
    <aside
      className={`sidebar-desktop${open ? " open" : ""}`}
      style={{ width: 220, height: "100vh", background: C.darker, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}
    >
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_STICKFRAME} style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, objectFit: "contain" }} alt="Logo StickFrame" />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2.5, fontSize: 15, lineHeight: 1 }}>
              <span style={{ color: C.graphite }}>STICK</span><span style={{ color: C.red }}>FRAME</span>
            </div>
            <div style={{ color: C.muted, fontSize: 8, letterSpacing: 1.5, marginTop: 1 }}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {(() => {
          // Group keys for dividers between logical sections
          const GROUP_BREAKS = new Set(["obras", "financeiro", "calculadora", "configuracoes"]);
          const items = [];
          navFiltro.forEach((n, idx) => {
            if (idx > 0 && GROUP_BREAKS.has(n.key)) {
              items.push(
                <div key={`div-${n.key}`} style={{ margin: "6px 16px", borderTop: `1px solid ${C.border}`, opacity: 0.5 }} />
              );
            }
            const isActive = active === n.key;
            const iconColor = isActive ? C.red : C.muted;
            items.push(
              <button
                key={n.key}
                onClick={() => { setActivePage(n.key); onClose?.(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "11px 20px",
                  background: isActive ? C.red + "22" : "transparent",
                  borderTop: "none", borderRight: "none", borderBottom: "none",
                  borderLeft: `3px solid ${isActive ? C.red : "transparent"}`,
                  cursor: "pointer",
                  color: isActive ? C.text : C.muted,
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  textAlign: "left", transition: "all .15s",
                }}
              >
                <NavIcon name={n.icon} color={iconColor} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.key === "crm" && followupsVencidos > 0 && (
                  <span style={{ background: C.red, color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                    {followupsVencidos}
                  </span>
                )}
                {n.key === "orcamentos" && preOrcCount > 0 && (
                  <span style={{ background: "#2e9e5b", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
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
      <div style={{ padding: "14px 20px", borderTop: `2px solid ${C.border}`, background: C.darker }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: perfil.cor + "33", border: `2px solid ${perfil.cor}55`, boxShadow: `0 0 0 3px ${perfil.cor}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: perfil.cor, flexShrink: 0 }}>
            {user?.nome?.[0] || "U"}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: C.text }}>{user?.nome}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{user?.cargo}</div>
          </div>
          <span style={{ background: perfil.cor + "22", color: perfil.cor, border: `1px solid ${perfil.cor}44`, borderRadius: 4, padding: "2px 8px", fontSize: 9, fontWeight: 700, letterSpacing: 0.5, flexShrink: 0 }}>
            {perfil.label}
          </span>
        </div>
        <div style={{ marginBottom: 10, display: "none" }}>
          {/* role badge moved inline above */}
        </div>
        {confirm ? (
          <div style={{ fontSize: 11, color: C.muted }}>
            Sair mesmo?{" "}
            <button onClick={logout} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Sim</button>
            {" · "}
            <button onClick={() => setConfirm(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11 }}>Não</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 11, cursor: "pointer", padding: "6px 12px", width: "100%", fontFamily: "inherit", textAlign: "left" }}>
            ↩ Sair da conta
          </button>
        )}
      </div>
    </aside>
  );
}
