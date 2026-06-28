import { C } from "../../utils/constants";

export function EmptyState({ icon, title, description, action, compact }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: compact ? "32px 16px" : "60px 24px",
      textAlign: "center", gap: 12,
    }}>
      {icon && (
        <div style={{
          width: compact ? 40 : 56, height: compact ? 40 : 56,
          borderRadius: 12, background: C.brickSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.red, marginBottom: 4,
        }}>
          {typeof icon === "string" ? (
            <span style={{ fontSize: compact ? 18 : 24 }}>{icon}</span>
          ) : icon}
        </div>
      )}
      {title && (
        <div style={{ fontSize: compact ? 14 : 16, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
          {title}
        </div>
      )}
      {description && (
        <div style={{ fontSize: compact ? 12 : 13, color: C.muted, maxWidth: 360, lineHeight: 1.5 }}>
          {description}
        </div>
      )}
      {action && (
        <div style={{ marginTop: compact ? 8 : 12 }}>
          {action}
        </div>
      )}
    </div>
  );
}
