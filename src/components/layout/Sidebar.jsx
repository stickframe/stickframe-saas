import { useState } from "react";
import { C, NAV, PERFIS } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";
import { LOGO_STICKFRAME } from "../../utils/cdn";

export default function Sidebar({ open, onClose }) {
  const user        = useAppStore((s) => s.user);
  const activePage  = useAppStore((s) => s.activePage);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const logout      = useAppStore((s) => s.logout);
  const clientes    = useAppStore((s) => s.clientes);
  const [confirm, setConfirm] = useState(false);

  const perfil    = PERFIS[user?.perfil] || PERFIS.diretor;
  const navFiltro = NAV.filter((n) => perfil.paginas.includes(n.key));
  const active    = perfil.paginas.includes(activePage) ? activePage : "dashboard";

  // Badge de follow-ups vencidos para perfil comercial
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
        {navFiltro.map((n) => (
          <button
            key={n.key}
            onClick={() => { setActivePage(n.key); onClose?.(); }}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "11px 20px",
              background: active === n.key ? C.red + "18" : "transparent",
              borderTop: "none",
              borderRight: "none",
              borderBottom: "none",
              borderLeft: `3px solid ${active === n.key ? C.red : "transparent"}`,
              cursor: "pointer",
              color: active === n.key ? C.text : C.muted,
              fontSize: 13, fontWeight: active === n.key ? 600 : 400,
              textAlign: "left", transition: "all .15s",
            }}
          >
            <span style={{ fontSize: 15, color: active === n.key ? C.red : C.muted }}>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.key === "crm" && followupsVencidos > 0 && (
              <span style={{ background: C.red, color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                {followupsVencidos}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: perfil.cor + "33", border: `2px solid ${perfil.cor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: perfil.cor, flexShrink: 0 }}>
            {user?.nome?.[0] || "U"}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.nome}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{user?.cargo}</div>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <span style={{ background: perfil.cor + "22", color: perfil.cor, border: `1px solid ${perfil.cor}44`, borderRadius: 4, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>
            {perfil.label}
          </span>
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
