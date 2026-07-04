// ── Fase 3: Detecção de Conflitos (badge de contagem) ────────────────────────
// TODO(Fase 3): expandir para lista clicável com detalhe por conflito.
export default function ConflictPanel({ conflitos }) {
  if (!conflitos.length) return null;
  return (
    <div style={{
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      color: '#ef4444',
      padding: '8px 14px',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
    }}>
      ⚠ {conflitos.length} {conflitos.length === 1 ? 'conflito encontrado' : 'conflitos encontrados'}
    </div>
  );
}
