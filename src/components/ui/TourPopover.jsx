import { useEffect } from "react";
import { C } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";
import { TOURS } from "../../store/slices/tourSlice";

export default function TourPopover() {
  const activePage = useAppStore((s) => s.activePage);
  const toursDismissed = useAppStore((s) => s.toursDismissed);
  const dismissTour = useAppStore((s) => s.dismissTour);

  const tour = Object.values(TOURS).find((t) => t.page === activePage);

  useEffect(() => {
    if (tour && toursDismissed[tour.key]) return;
  }, [activePage, tour, toursDismissed]);

  if (!tour || toursDismissed[tour.key]) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 1000,
      maxWidth: 320, background: "#1a1a1a", borderRadius: 14,
      padding: "18px 20px", boxShadow: "0 8px 32px rgba(0,0,0,.25)",
      border: "1px solid rgba(255,255,255,.1)",
      animation: "sfTourIn .3s ease",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#981915", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
        Dica
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
        {tour.title}
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)", lineHeight: 1.5, marginBottom: 14 }}>
        {tour.description}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => dismissTour(tour.key)}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8,
            background: "rgba(255,255,255,.1)", border: "none",
            color: "#fff", fontSize: 12, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer",
          }}
        >
          Entendi
        </button>
      </div>
      <style>{`
        @keyframes sfTourIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
