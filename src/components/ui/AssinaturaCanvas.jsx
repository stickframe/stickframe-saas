import { useRef, useState, useEffect } from "react";
import { C } from "../../utils/constants";
import Btn from "./Btn";

export default function AssinaturaCanvas({ onSalvar, onCancelar, titulo = "Assinatura" }) {
  const canvasRef = useRef(null);
  const [desenhando, setDesenhando] = useState(false);
  const [vazio, setVazio] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function iniciar(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDesenhando(true);
    setVazio(false);
  }

  function desenhar(e) {
    if (!desenhando) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function parar(e) {
    e.preventDefault();
    setDesenhando(false);
  }

  function limpar() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setVazio(true);
  }

  function salvar() {
    const canvas = canvasRef.current;
    onSalvar(canvas.toDataURL("image/png"));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{titulo}</div>
      <div style={{ border: `2px solid ${C.border}`, borderRadius: 10, overflow: "hidden", background: "#fff", touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={180}
          style={{ width: "100%", height: 180, display: "block", cursor: "crosshair" }}
          onMouseDown={iniciar}
          onMouseMove={desenhar}
          onMouseUp={parar}
          onMouseLeave={parar}
          onTouchStart={iniciar}
          onTouchMove={desenhar}
          onTouchEnd={parar}
        />
      </div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Assine acima com o mouse ou dedo</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={limpar}>Limpar</Btn>
        <Btn variant="ghost" onClick={onCancelar}>Cancelar</Btn>
        <Btn disabled={vazio} onClick={salvar}> Confirmar assinatura</Btn>
      </div>
    </div>
  );
}
