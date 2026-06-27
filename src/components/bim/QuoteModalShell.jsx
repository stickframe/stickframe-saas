/**
 * QuoteModalShell — casca visual unificada dos modais StickQuote™
 * (PDF / DWG / AI Vision / BIM). handoff §5.
 *
 * Espelha o header de referência do StickQuoteBIMModal (badge pill + arquivo +
 * fechar + descrição, sobre painel escuro #16151a). SÓ a casca: toda a lógica
 * (steps, parse, motor, geração) permanece em cada modal, passada como children.
 * A única variável por tipo é a cor de acento.
 *
 * Acentos (handoff §5): PDF=#981915 · DWG=#3b6ea5 · Vision=#6d557e · BIM=#c0892d
 *
 * Props: tipo, accent, descricao?, arquivo?, onClose, children
 */
export default function QuoteModalShell({ tipo, accent, descricao, arquivo, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#16151a", border: "1px solid rgba(255,255,255,.09)", borderRadius: 16,
        width: "100%", maxWidth: 700, maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,.7)",
      }}>
        {/* Header (referência: StickQuoteBIMModal) */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              background: `color-mix(in srgb, ${accent} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
              borderRadius: 8, padding: "5px 10px", fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 0.3,
            }}>
              StickQuote™ <span style={{ color: accent }}>{tipo}</span>
            </div>
            {arquivo && (
              <span title={arquivo} style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,.4)",
                maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{arquivo}</span>
            )}
            <button onClick={onClose} aria-label="Fechar" title="Fechar" style={{
              marginLeft: "auto", background: "none", border: "none",
              color: "rgba(255,255,255,.4)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 2,
            }}>×</button>
          </div>
          {descricao && (
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,.35)" }}>{descricao}</p>
          )}
        </div>

        {/* Corpo */}
        <div style={{ padding: "16px 20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
