import { useState } from "react";
import { C, FASES, OBRA_TOKENS } from "../utils/constants";
import { gerarPortalCliente, gerarRelatorioObra } from "../services/pdfService";
import useAppStore from "../store/useAppStore";
import Btn from "../components/ui/Btn";
import Badge from "../components/ui/Badge";

const ICONE_TIPO = { pdf: "📄", imagem: "🖼️", outro: "📎" };
const CATS       = ["Projeto", "Foto", "Documento", "Outro"];

const STATUS_COR = {
  "Em andamento": "#2e9e5b",
  "Planejamento": "#4a9eff",
  "Pausada":      "#c88a00",
  "Concluída":    "#888888",
};
const statusColor = (s) => STATUS_COR[s] || "#888";

export default function GestaoObras() {
  const obras       = useAppStore((s) => s.obras);
  const financeiro  = useAppStore((s) => s.financeiro);
  const arquivos    = useAppStore((s) => s.arquivos);
  const avancarFase = useAppStore((s) => s.avancarFase);
  const addArquivos = useAppStore((s) => s.addArquivos);
  const deleteArquivo = useAppStore((s) => s.deleteArquivo);

  const [obraId,    setObraId]    = useState(obras[0]?.id);
  const [dragOver,  setDragOver]  = useState(false);
  const [abaAtiva,  setAbaAtiva]  = useState("fases");
  const [catFiltro, setCatFiltro] = useState("Todos");

  const obra      = obras.find((o) => o.id === obraId) || obras[0];
  const arqObra   = arquivos[obraId] || [];
  const arqFiltro = catFiltro === "Todos" ? arqObra : arqObra.filter((a) => a.categoria === catFiltro);

  const avancar = () => {
    const i = FASES.indexOf(obra.fase);
    if (i >= FASES.length - 1) return;
    const novaFase  = FASES[i + 1];
    const progresso = Math.round(((i + 2) / FASES.length) * 100);
    avancarFase(obra.id, novaFase, progresso);
  };

  const handleFiles = (files) => {
    const novos = Array.from(files).map((f) => ({
      id:        Date.now() + Math.random(),
      nome:      f.name,
      tipo:      f.type.startsWith("image/") ? "imagem" : f.name.endsWith(".pdf") ? "pdf" : "outro",
      tamanho:   (f.size / 1024 / 1024).toFixed(1) + " MB",
      data:      new Date().toLocaleDateString("pt-BR"),
      categoria: f.name.endsWith(".pdf") ? "Documento" : "Foto",
    }));
    addArquivos(obraId, novos);
  };

  const copiarLinkPortal = () => {
    const tokens = { "1": "bofete2025", "2": "socorro2025", "3": "alpha2025" };
    const token  = tokens[String(obra.id)] || "";
    const link   = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(link).then(() => alert("Link copiado!\n\n" + link));
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Gestão de Obras</h2>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>{obras.length} projetos</p>

      {/* Seletor de obra */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {obras.map((o) => (
          <button key={o.id} onClick={() => setObraId(o.id)} style={{
            padding: "8px 16px", borderRadius: 8,
            border: `1px solid ${obraId === o.id ? C.red : C.border}`,
            background: obraId === o.id ? C.red + "18" : "transparent",
            color: obraId === o.id ? C.text : C.muted,
            fontSize: 12, fontWeight: obraId === o.id ? 700 : 400, cursor: "pointer",
          }}>{o.nome.split("—")[0].trim()}</button>
        ))}
      </div>

      {obra && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 18 }}>

          {/* Coluna principal */}
          <div>
            {/* Abas */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
              {[["fases", "📋 Fases da obra"], ["arquivos", "📁 Arquivos"]].map(([k, l]) => (
                <button key={k} onClick={() => setAbaAtiva(k)} style={{
                  padding: "10px 20px", background: "transparent", border: "none",
                  borderBottom: `2px solid ${abaAtiva === k ? C.red : "transparent"}`,
                  color: abaAtiva === k ? C.text : C.muted,
                  fontSize: 13, fontWeight: abaAtiva === k ? 700 : 400,
                  cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                }}>{l}</button>
              ))}
            </div>

            {/* ABA FASES */}
            {abaAtiva === "fases" && (
              <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{obra.nome}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{obra.cliente} · {obra.prazo}</div>
                  </div>
                  <Badge label={obra.status} color={statusColor(obra.status)} />
                </div>

                {/* Barra de progresso */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 5 }}>
                    <span>Progresso</span>
                    <span style={{ color: C.text, fontWeight: 700 }}>{obra.progresso}%</span>
                  </div>
                  <div style={{ height: 8, background: C.dark, borderRadius: 4 }}>
                    <div style={{ height: 8, width: `${obra.progresso}%`, background: `linear-gradient(90deg,${C.red},#6e1210)`, borderRadius: 4, transition: "width .5s" }} />
                  </div>
                </div>

                {/* Timeline de fases */}
                {FASES.map((f, i) => {
                  const idx  = FASES.indexOf(obra.fase);
                  const done = f === obra.fase;
                  const past = idx > i;
                  return (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        background: past ? C.success : done ? C.red : C.dark,
                        border: `2px solid ${past ? C.success : done ? C.red : C.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#fff", fontWeight: 700,
                      }}>{past ? "✓" : i + 1}</div>
                      <span style={{ fontSize: 13, color: done || past ? C.text : C.muted, fontWeight: done ? 700 : 400 }}>{f}</span>
                      {done && <Badge label="Atual" color={C.red} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ABA ARQUIVOS */}
            {abaAtiva === "arquivos" && (
              <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>

                {/* Drop zone */}
                <label style={{
                  display: "block",
                  border: `2px dashed ${dragOver ? C.red : C.border}`,
                  borderRadius: 10, padding: "24px 20px", textAlign: "center",
                  cursor: "pointer", marginBottom: 18,
                  background: dragOver ? C.red + "0a" : C.darker,
                  transition: "all .2s",
                }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                >
                  <input type="file" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: dragOver ? C.red : C.text, marginBottom: 4 }}>
                    {dragOver ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para enviar"}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>PDF, imagens, planilhas — qualquer formato</div>
                </label>

                {/* Filtros */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {["Todos", ...CATS].map((c) => (
                    <button key={c} onClick={() => setCatFiltro(c)} style={{
                      padding: "5px 12px", borderRadius: 6, fontSize: 11,
                      fontWeight: catFiltro === c ? 700 : 400,
                      border: `1px solid ${catFiltro === c ? C.red : C.border}`,
                      background: catFiltro === c ? C.red + "18" : "transparent",
                      color: catFiltro === c ? C.text : C.muted,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>{c}</button>
                  ))}
                  <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted, alignSelf: "center" }}>{arqFiltro.length} arquivo(s)</span>
                </div>

                {/* Lista */}
                {arqFiltro.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>
                    {arqObra.length === 0 ? "Nenhum arquivo enviado ainda." : "Nenhum arquivo nesta categoria."}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {arqFiltro.map((a) => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.darker, borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{ICONE_TIPO[a.tipo] || "📎"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.categoria} · {a.tamanho} · {a.data}</div>
                        </div>
                        <button onClick={() => deleteArquivo(obraId, a.id)} style={{ background: C.danger + "22", border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.danger, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 10px", fontFamily: "inherit", flexShrink: 0 }}>🗑</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coluna lateral */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 12 }}>AÇÃO RÁPIDA</div>
              <Btn onClick={avancar} disabled={obra.fase === "Entrega"} fullWidth>
                {obra.fase === "Entrega" ? "✓ Concluída" : "Avançar fase →"}
              </Btn>
              {obra.fase !== "Entrega" && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Próxima: {FASES[FASES.indexOf(obra.fase) + 1]}</div>
              )}
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "🔗 Portal do Cliente", cor: C.success,   fn: () => gerarPortalCliente(obra, [], financeiro) },
                  { label: "📋 Copiar Link Portal",cor: "#4a9eff",   fn: copiarLinkPortal },
                  { label: "📄 Relatório da Obra", cor: C.red,       fn: () => gerarRelatorioObra(obra, arqObra) },
                ].map(({ label, cor, fn }) => (
                  <button key={label} onClick={fn} style={{
                    width: "100%", padding: "9px 0", background: "transparent",
                    border: `1px solid ${cor}`, borderRadius: 6,
                    color: cor, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 14 }}>RESUMO</div>
              {[["Fase", obra.fase], ["Prazo", obra.prazo], ["Concluído", `${obra.progresso}%`], ["Arquivos", `${arqObra.length} arquivo(s)`]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 9, marginBottom: 9 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
