export function Skeleton({ w = "100%", h = 16, radius = 6, style }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: radius, flexShrink: 0, ...style }}
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="sf-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Skeleton h={14} w="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} h={12} w={i === lines - 1 ? "40%" : "100%"} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton h={22} w={200} />
        <Skeleton h={34} w={120} radius={6} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[0,1,2,3].map((i) => (
          <div key={i} className="sf-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton h={12} w="50%" />
            <Skeleton h={28} w="70%" />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
      <SkeletonCard lines={5} />
    </div>
  );
}
