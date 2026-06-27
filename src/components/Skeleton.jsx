/**
 * Skeleton — placeholders com shimmer (classe .skeleton de globals.css).
 * Reproduz a FORMA do conteúdo em vez de spinner, onde o layout é previsível.
 */
export function SkeletonBar({ w = "100%", h = 12, style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 6, ...style }} />;
}

/** Linha de lista: avatar 34 + 2 linhas + valor à direita. */
export function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
      <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <SkeletonBar w="55%" h={12} />
        <SkeletonBar w="35%" h={10} />
      </div>
      <SkeletonBar w={70} h={14} />
    </div>
  );
}

/** Lista de N linhas-esqueleto dentro de um card. */
export function SkeletonList({ rows = 4 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

/** Grade de cards-esqueleto (para KPIs). */
export function SkeletonKpis({ count = 5 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ border: "1px solid #e7e1d8", borderRadius: 12, padding: "15px 16px" }}>
          <SkeletonBar w="60%" h={9} />
          <SkeletonBar w="45%" h={24} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}
