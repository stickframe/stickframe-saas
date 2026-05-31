import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { registrarCheckin, listarCheckinsDia } from "../services/repositories/checkinRepository";

const C_QR = {
  red:     "#981915",
  surface: "#ffffff",
  dark:    "#f5f5f7",
  border:  "#dcdce4",
  text:    "#1a1a1a",
  muted:   "#6b7280",
  success: "#2e9e5b",
};

const FUNCOES = ["Montador Steel Frame", "Eletricista", "Encanador", "Pedreiro", "Carpinteiro", "Pintor", "Ajudante", "Outro"];

export default function QRObra() {
  const { obraId } = useParams();

  const [obra,      setObra]      = useState(null);
  const [checkins,  setCheckins]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [nome,      setNome]      = useState("");
  const [funcao,    setFuncao]    = useState("Montador Steel Frame");
  const [enviando,  setEnviando]  = useState(false);
  const [sucesso,   setSucesso]   = useState(false);
  const [erro,      setErro]      = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const { data: obraData } = await sb
          .from("obras")
          .select("id, nome, status, fase")
          .eq("id", obraId)
          .single();
        setObra(obraData);

        const lista = await listarCheckinsDia(obraId);
        setCheckins(lista);
      } catch {
        setErro("Obra não encontrada.");
      } finally {
        setLoading(false);
      }
    }
    if (obraId) carregar();
  }, [obraId]);

  async function registrar() {
    if (!nome.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const novo = await registrarCheckin({ obra_id: obraId, nome_operario: nome.trim(), funcao });
      setCheckins((prev) => [novo, ...prev]);
      setSucesso(true);
      setNome("");
      setTimeout(() => setSucesso(false), 4000);
    } catch (e) {
      setErro("Erro ao registrar: " + e.message);
    } finally {
      setEnviando(false);
    }
  }

  function fmtHora(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C_QR.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C_QR.muted, fontSize: 14 }}>Carregando...</div>
      </div>
    );
  }

  if (!obra || erro === "Obra não encontrada.") {
    return (
      <div style={{ minHeight: "100vh", background: C_QR.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: C_QR.text }}>Obra não encontrada</div>
          <div style={{ color: C_QR.muted, fontSize: 13, marginTop: 6 }}>Verifique o QR code e tente novamente.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C_QR.dark, padding: "0 0 40px" }}>

      {/* Header */}
      <div style={{
        background: C_QR.red, padding: "24px 20px", textAlign: "center",
      }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
          STICKFRAME — CHECK-IN DE OBRA
        </div>
        <div style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>{obra.nome}</div>
        {obra.fase && (
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>
            Fase: {obra.fase}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "24px 20px" }}>

        {/* Formulário */}
        <div style={{
          background: C_QR.surface, borderRadius: 16, padding: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 24,
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18, color: C_QR.text }}>
            Registrar Presença
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C_QR.muted, marginBottom: 6 }}>
              SEU NOME *
            </div>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João da Silva"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
                border: `1px solid ${C_QR.border}`, outline: "none",
                background: C_QR.surface, color: C_QR.text, boxSizing: "border-box",
              }}
              onKeyDown={(e) => e.key === "Enter" && registrar()}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C_QR.muted, marginBottom: 6 }}>
              FUNÇÃO
            </div>
            <select
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
                border: `1px solid ${C_QR.border}`, outline: "none",
                background: C_QR.surface, color: C_QR.text,
              }}
            >
              {FUNCOES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {erro && (
            <div style={{ background: "#fdecea", color: "#c0392b", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>
              {erro}
            </div>
          )}

          {sucesso && (
            <div style={{ background: "#e8f7ef", color: "#2e9e5b", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
              ✅ Presença registrada com sucesso!
            </div>
          )}

          <button
            onClick={registrar}
            disabled={enviando || !nome.trim()}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: !nome.trim() || enviando ? "#ccc" : C_QR.red,
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: nome.trim() && !enviando ? "pointer" : "not-allowed",
              transition: "background .2s",
            }}
          >
            {enviando ? "Registrando..." : "✅ Registrar Entrada"}
          </button>
        </div>

        {/* Check-ins do dia */}
        {checkins.length > 0 && (
          <div style={{
            background: C_QR.surface, borderRadius: 16, padding: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: C_QR.text, display: "flex", justifyContent: "space-between" }}>
              <span>Presenças hoje</span>
              <span style={{ background: C_QR.red + "22", color: C_QR.red, borderRadius: 12, padding: "2px 10px", fontSize: 12 }}>
                {checkins.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {checkins.map((c) => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", background: C_QR.dark, borderRadius: 10,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: C_QR.red, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 15, flexShrink: 0,
                  }}>
                    {c.nome_operario[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C_QR.text }}>{c.nome_operario}</div>
                    <div style={{ fontSize: 11, color: C_QR.muted }}>{c.funcao || "—"}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C_QR.muted }}>{fmtHora(c.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: C_QR.muted }}>
          Powered by Stickframe · {new Date().toLocaleDateString("pt-BR")}
        </div>
      </div>
    </div>
  );
}
