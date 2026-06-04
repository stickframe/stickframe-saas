import { useState } from "react";
import { sb } from "../../services/supabase";
import jsPDF from "jspdf";

function isImage(path) {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(path || "");
}

export function RelatorioFotografico({ obra, arquivos }) {
  const [gerando, setGerando] = useState(false);

  async function gerar() {
    setGerando(true);
    try {
      const fotos = (arquivos || []).filter(a => isImage(a.storage_path));
      const doc = new jsPDF();
      const hoje = new Date().toLocaleDateString("pt-BR");

      // Header
      doc.setFillColor(180, 30, 30);
      doc.rect(0, 0, 210, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text("STICKFRAME", 14, 12);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("Relatório Fotográfico", 14, 21);
      doc.text(hoje, 170, 21);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(obra.nome || "Obra", 14, 40);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Status: ${obra.status || "—"}  |  Progresso: ${obra.progresso || 0}%  |  ${fotos.length} foto(s)`, 14, 48);

      let y = 58;
      let col = 0;
      const W = 85, H = 65;
      const margins = [14, 111];

      for (const foto of fotos.slice(0, 20)) {
        const url = sb.storage.from("arquivos").getPublicUrl(foto.storage_path).data.publicUrl;
        try {
          // Fetch image as base64
          const resp = await fetch(url);
          const blob = await resp.blob();
          const b64 = await new Promise(res => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.readAsDataURL(blob);
          });
          const ext = foto.storage_path.match(/\.(jpg|jpeg)$/i) ? "JPEG" : "PNG";
          doc.addImage(b64, ext, margins[col], y, W, H);
          // Caption
          doc.setFontSize(8); doc.setTextColor(100);
          doc.text(foto.nome?.substring(0, 35) || "", margins[col], y + H + 4);
          col++;
          if (col === 2) { col = 0; y += H + 14; }
          if (y > 250) { doc.addPage(); y = 14; col = 0; }
        } catch { /* skip if image fails to load */ }
      }

      if (fotos.length === 0) {
        doc.setFontSize(14); doc.setTextColor(150);
        doc.text("Nenhuma foto encontrada para esta obra.", 105, 140, { align: "center" });
      }

      // Footer
      const n = doc.internal.getNumberOfPages();
      for (let i = 1; i <= n; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text(`Pág ${i}/${n} — StickFrame Sistemas Construtivos`, 14, 290);
      }

      doc.save(`fotos-${(obra.nome || "obra").replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } finally { setGerando(false); }
  }

  return (
    <button onClick={gerar} disabled={gerando}
      style={{ padding: "7px 14px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, opacity: gerando ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
      {gerando ? "⏳ Gerando..." : "📸 Relatório fotográfico"}
    </button>
  );
}
