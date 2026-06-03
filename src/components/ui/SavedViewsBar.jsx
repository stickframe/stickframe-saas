import { useState } from "react";
import { useSavedViews } from "../../hooks/useSavedViews";
import SaveViewModal from "./SaveViewModal";

export default function SavedViewsBar({ module, activeFilters, onApplyView }) {
  const { views, saveView, deleteView } = useSavedViews(module);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activeViewId, setActiveViewId] = useState(null);

  const handleApply = (view) => {
    if (activeViewId === view.id) {
      setActiveViewId(null);
      onApplyView(null);
    } else {
      setActiveViewId(view.id);
      onApplyView(view.filters);
    }
  };

  const handleSave = async (label) => {
    await saveView(label, activeFilters);
    setShowSaveModal(false);
  };

  const hasActiveFilters = activeFilters && Object.values(activeFilters).some((v) => v && v !== "todos" && v !== "");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {views.map((view) => (
          <div key={view.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <button
              onClick={() => handleApply(view)}
              style={{
                padding: "4px 12px", borderRadius: "20px 0 0 20px",
                border: "1px solid var(--border)",
                borderRight: "none",
                background: activeViewId === view.id ? "var(--red)" : "var(--surface)",
                color: activeViewId === view.id ? "#fff" : "var(--text)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              {view.label}
            </button>
            <button
              onClick={() => deleteView(view.id)}
              title="Remover view"
              style={{
                padding: "4px 8px", borderRadius: "0 20px 20px 0",
                border: "1px solid var(--border)",
                background: activeViewId === view.id ? "#6e1210" : "var(--surface)",
                color: activeViewId === view.id ? "#fff" : "var(--muted)",
                fontSize: 11, cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        ))}
        {hasActiveFilters && (
          <button
            onClick={() => setShowSaveModal(true)}
            style={{
              padding: "4px 12px", borderRadius: 20,
              border: "1px dashed var(--border)",
              background: "transparent", color: "var(--muted)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            + Salvar filtro atual
          </button>
        )}
      </div>
      {showSaveModal && (
        <SaveViewModal onSave={handleSave} onClose={() => setShowSaveModal(false)} />
      )}
    </>
  );
}
