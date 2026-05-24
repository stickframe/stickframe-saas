import { useState } from "react";
import Sidebar from "./Sidebar";
import NotificacaoDropdown from "../notificacoes/NotificacaoDropdown";
import { C } from "../../utils/constants";

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}
      <Sidebar open={menuOpen} />
      <div className="main-area">
        <div className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen((v) => !v)}>☰</button>
          <NotificacaoDropdown />
        </div>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
