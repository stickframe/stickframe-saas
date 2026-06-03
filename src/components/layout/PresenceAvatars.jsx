import { usePresence } from "../../hooks/usePresence";
import useAppStore from "../../store/useAppStore";

const PAGE_LABELS = {
  dashboard: "Dashboard", crm: "CRM", obras: "Obras",
  financeiro: "Financeiro", equipe: "Equipe", agenda: "Agenda",
  orcamentos: "Orçamentos", diario: "Diário", medicoes: "Medições",
  vistorias: "Vistorias", contratos: "Contratos", bim: "BIM",
  cronograma: "Cronograma", fornecedores: "Fornecedores",
};

function getInitials(nome) {
  return (nome || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const COLORS = ["#981915","#2e9e5b","#4a7af8","#b97a00","#7c3aed","#0891b2"];
function colorFor(id) { return COLORS[id?.charCodeAt(0) % COLORS.length] || COLORS[0]; }

export default function PresenceAvatars() {
  const online = usePresence();
  const activePage = useAppStore((s) => s.activePage);

  if (!online.length) return null;

  const samePageUsers = online.filter((u) => u.pagina === activePage);
  const otherUsers = online.filter((u) => u.pagina !== activePage);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {samePageUsers.map((u) => (
        <div
          key={u.id}
          title={`${u.nome} — aqui agora`}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: colorFor(u.id), color: "#fff",
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #2e9e5b",
            cursor: "default",
          }}
        >
          {getInitials(u.nome)}
        </div>
      ))}
      {otherUsers.map((u) => (
        <div
          key={u.id}
          title={`${u.nome} — em ${PAGE_LABELS[u.pagina] || u.pagina}`}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: colorFor(u.id), color: "#fff",
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0.5,
            cursor: "default",
          }}
        >
          {getInitials(u.nome)}
        </div>
      ))}
    </div>
  );
}
