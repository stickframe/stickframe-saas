import { useState } from "react";
import Modal from "./Modal";
import Btn from "./Btn";

export default function SaveViewModal({ onSave, onClose }) {
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    await onSave(label.trim());
    onClose();
  };

  return (
    <Modal onClose={onClose} title="Salvar filtro como view">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            NOME DA VIEW
          </label>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder='Ex: "Obras em atraso" ou "Leads quentes"'
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 8,
              border: "1px solid var(--border)", fontSize: 13,
              background: "var(--surface)", color: "var(--text)",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="ghost" size="sm" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="sm" onClick={handleSave} disabled={saving || !label.trim()}>
            {saving ? "Salvando…" : "Salvar view"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
