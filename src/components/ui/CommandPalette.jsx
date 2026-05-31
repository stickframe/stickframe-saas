import { useState, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { C, NAV, PERFIS } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";

// Atalhos globais de navegação rápida
const ATALHOS_NAV = [
  { keys: "ctrl+shift+d", key: "dashboard",    desc: "Ir para Dashboard" },
  { keys: "ctrl+shift+o", key: "obras",         desc: "Ir para Gestão de Obras" },
  { keys: "ctrl+shift+f", key: "financeiro",    desc: "Ir para Financeiro" },
  { keys: "ctrl+shift+c", key: "crm",           desc: "Ir para CRM / Clientes" },
  { keys: "ctrl+shift+r", key: "orcamentos",    desc: "Ir para Orçamentos" },
  { keys: "ctrl+shift+t", key: "contratos",     desc: "Ir para Contratos" },
];

export default function CommandPalette({ onNavigate }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const [sel,   setSel]   = useState(0);
  const inputRef = useRef(null);
  const perfil   = useAppStore((s) => s.user?.perfil);

  const paginas = PERFIS[perfil]?.paginas || NAV.map((n) => n.key);
  const items   = NAV.filter((n) => paginas.includes(n.key));

  const results = query.trim()
    ? items.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  // Ctrl+K — abre/fecha paleta
  useHotkeys("ctrl+k, meta+k", (e) => {
    e.preventDefault();
    setOpen((v) => !v);
    setQuery("");
    setSel(0);
  }, { enableOnFormTags: false });

  // ESC — fecha
  useHotkeys("escape", () => setOpen(false), { enableOnFormTags: true });

  // Atalhos de navegação rápida
  ATALHOS_NAV.forEach(({ keys, key }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkeys(keys, (e) => {
      e.preventDefault();
      if (paginas.includes(key)) onNavigate(key);
    }, { enableOnFormTags: false });
  });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => { setSel(0); }, [query]);

  function go(key) {
    onNavigate(key);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[sel]) go(results[sel].key);
  }

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "15vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 90vw)", background: C.surface,
          borderRadius: 14, border: `1px solid ${C.border}`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 16, color: C.muted }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ir para... (Ctrl+K)"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 15, color: C.text, fontFamily: "inherit",
            }}
          />
          <span style={{ fontSize: 11, color: C.muted, background: C.darker, borderRadius: 4, padding: "2px 6px" }}>ESC</span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "24px 18px", textAlign: "center", color: C.muted, fontSize: 13 }}>Nenhum resultado</div>
          ) : results.map((n, i) => {
            const atalho = ATALHOS_NAV.find((a) => a.key === n.key);
            return (
              <div
                key={n.key}
                onClick={() => go(n.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 18px", cursor: "pointer",
                  background: i === sel ? C.red + "12" : "transparent",
                  borderLeft: i === sel ? `3px solid ${C.red}` : "3px solid transparent",
                }}
                onMouseEnter={() => setSel(i)}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{n.icon}</span>
                <span style={{ fontSize: 13, fontWeight: i === sel ? 700 : 400, flex: 1 }}>{n.label}</span>
                {atalho && (
                  <span style={{ fontSize: 10, color: C.muted, background: C.darker, borderRadius: 4, padding: "2px 6px", letterSpacing: .5 }}>
                    {atalho.keys.replace("ctrl+shift+", "⌃⇧").toUpperCase()}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{ padding: "8px 18px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 16, fontSize: 10, color: C.muted, flexWrap: "wrap" }}>
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>ESC fechar</span>
          <span style={{ marginLeft: "auto" }}>⌃⇧D/O/F/C/R/T → nav. rápida</span>
        </div>
      </div>
    </div>
  );
}
