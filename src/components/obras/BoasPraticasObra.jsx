import { useState, useEffect } from "react";
import { sb } from "../../services/supabase";
import { C } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";
import Btn from "../ui/Btn";
import Input from "../ui/Input";

const MOCK_GUIAS = [
  { id: "g1", titulo: "Guia de Fundação — Radier", fase_obra: "Fundação", versao: "1.0" },
  { id: "g2", titulo: "Guia de Estrutura — Montagem de Painéis", fase_obra: "Estrutura Steel Frame", versao: "1.0" },
  { id: "g3", titulo: "Guia de Fechamentos — OSB e Membrana", fase_obra: "Fechamentos", versao: "1.0" }
];

const MOCK_ITENS = [
  { id: "gi1", guia_id: "g1", ordem: 1, titulo: "Nivelamento e gabarito", descricao: "Verificar se o nível da fôrma do radier está rigorosamente plano. Desvios maiores que 5mm devem ser corrigidos.", foto_referencia_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=300", obrigatorio: true },
  { id: "gi2", guia_id: "g1", ordem: 2, titulo: "Posicionamento de tubulações", descricao: "Garantir que todas as esperas de instalações estejam fixadas antes da concretagem, já que o radier não aceita rasgos.", foto_referencia_url: "https://images.unsplash.com/photo-1542060748-10c28b629f6f?w=300", obrigatorio: true },
  { id: "gi3", guia_id: "g2", ordem: 1, titulo: "Prumo e contraventamento de paredes", descricao: "Instalar prumo temporário e fitas metálicas de contraventamento X conforme projeto de engenharia.", foto_referencia_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300", obrigatorio: true },
  { id: "gi4", guia_id: "g2", ordem: 2, titulo: "Instalação de chumbadores (ancoragem)", descricao: "Verificar espaçamento de chumbadores mecânicos ou químicos que fixam a guia inferior ao concreto.", foto_referencia_url: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300", obrigatorio: true },
  { id: "gi5", guia_id: "g3", ordem: 1, titulo: "Fixação das Placas de OSB", descricao: "Usar parafusos adequados com espaçamento de 15cm nas bordas e 30cm no meio. Deixar junta de dilatação de 3mm.", foto_referencia_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300", obrigatorio: true },
  { id: "gi6", guia_id: "g3", ordem: 2, titulo: "Aplicação da Membrana Hidrófuga", descricao: "Instalar a barreira de vapor com sobreposição mínima de 15cm e fita tape específica em todas as emendas e rasgos.", foto_referencia_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300", obrigatorio: true }
];

export default function BoasPraticasObra({ obraId, obra }) {
  const user = useAppStore(s => s.user);
  const [loading, setLoading] = useState(true);
  const [guias, setGuias] = useState([]);
  const [guiaSelecionado, setGuiaSelecionado] = useState(null);
  const [itens, setItens] = useState([]);
  const [conforms, setConforms] = useState({});
  const [modalItem, setModalItem] = useState(null);
  const [modalFoto, setModalFoto] = useState("");
  const [modalObs, setModalObs] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [obraId, obra?.fase]);

  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Carregar Guias
      let guiasList = MOCK_GUIAS;
      try {
        const { data, error } = await sb.from("guias").select("*");
        if (!error && data && data.length > 0) guiasList = data;
      } catch (err) {
        console.warn("[BoasPraticas] Usando mockup de guias.");
      }
      setGuias(guiasList);

      // Escolher guia da fase atual da obra, se houver
      const guiaFase = guiasList.find(g => g.fase_obra === obra?.fase) || guiasList[0];
      setGuiaSelecionado(guiaFase);

      if (guiaFase) {
        await carregarItensEConformidade(guiaFase.id, guiasList);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function carregarItensEConformidade(guiaId, guiasList = guias) {
    try {
      // 2. Carregar Itens do Guia
      let itensList = MOCK_ITENS.filter(i => i.guia_id === guiaId);
      try {
        const { data, error } = await sb.from("guias_itens").select("*").eq("guia_id", guiaId).order("ordem");
        if (!error && data && data.length > 0) itensList = data;
      } catch (err) {
        console.warn("[BoasPraticas] Usando mockup de itens.");
      }
      setItens(itensList);

      // 3. Carregar Conformidades salvas para esta obra
      let conformsMap = {};
      try {
        const { data, error } = await sb.from("obra_conformidade").select("*").eq("obra_id", obraId);
        if (!error && data) {
          data.forEach(c => {
            conformsMap[c.guia_item_id] = c;
          });
        }
      } catch (err) {
        console.warn("[BoasPraticas] Usando conformidades locais.");
        // Carregar do localStorage do sandbox
        const localData = localStorage.getItem(`boas_praticas_conf_${obraId}`);
        if (localData) conformsMap = JSON.parse(localData);
      }
      setConforms(conformsMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const mudarGuia = (guiaId) => {
    setLoading(true);
    const g = guias.find(x => x.id === guiaId);
    setGuiaSelecionado(g);
    carregarItensEConformidade(guiaId);
  };

  async function salvarConformidade(itemId, checked, foto = "", obs = "") {
    const updated = { ...conforms };
    if (checked) {
      const confObj = {
        id: conforms[itemId]?.id || Math.random().toString(36).substring(2),
        obra_id: obraId,
        guia_item_id: itemId,
        conferido_em: new Date().toISOString(),
        conferido_por: user?.uid || null,
        foto_registro_url: foto,
        observacao: obs
      };
      
      // Salvar no BD
      try {
        const { data, error } = await sb.from("obra_conformidade")
          .upsert({
            obra_id: obraId,
            guia_item_id: itemId,
            foto_registro_url: foto || null,
            observacao: obs || null
          })
          .select()
          .single();
        if (!error && data) {
          updated[itemId] = data;
        } else {
          updated[itemId] = confObj;
        }
      } catch (e) {
        // Fallback local
        updated[itemId] = confObj;
      }
    } else {
      delete updated[itemId];
      try {
        await sb.from("obra_conformidade").delete().eq("obra_id", obraId).eq("guia_item_id", itemId);
      } catch (e) {
        // Fallback local
      }
    }

    setConforms(updated);
    localStorage.setItem(`boas_praticas_conf_${obraId}`, JSON.stringify(updated));
  }

  function abrirModal(item) {
    setModalItem(item);
    const conf = conforms[item.id] || {};
    setModalFoto(conf.foto_registro_url || "");
    setModalObs(conf.observacao || "");
  }

  async function salvarModal() {
    setSaving(true);
    await salvarConformidade(modalItem.id, true, modalFoto, modalObs);
    setSaving(false);
    setModalItem(null);
  }

  // Estatísticas de conformidade
  const totalItens = itens.length;
  const conferidos = itens.filter(i => conforms[i.id]).length;
  const pct = totalItens > 0 ? Math.round((conferidos / totalItens) * 100) : 0;

  return (
    <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
      {/* Header e Seletor de Guia */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Guia de Boas Práticas e Qualidade</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Garanta os padrões CBCA e normativas técnicas por fase.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Selecionar Checklist:</span>
          <select
            value={guiaSelecionado?.id || ""}
            onChange={(e) => mudarGuia(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.darker,
              color: C.text,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: "inherit",
              outline: "none"
            }}
          >
            {guias.map(g => (
              <option key={g.id} value={g.id}>{g.titulo} (Fase: {g.fase_obra})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ color: C.muted, fontSize: 13, padding: "20px 0", textAlign: "center" }}>Carregando diretrizes de qualidade...</div>
      ) : !guiaSelecionado ? (
        <div style={{ color: C.muted, fontSize: 13, padding: "20px 0", textAlign: "center" }}>Nenhum guia de qualidade disponível para esta fase.</div>
      ) : (
        <div>
          {/* Dashboard de Conformidade */}
          <div style={{
            background: C.darker,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: `1px solid ${C.border}`
          }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 1.1, textTransform: "uppercase" }}>CONFORMIDADE DO CHECKLIST</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {conferidos} de {totalItens} requisitos verificados e aprovados pelo canteiro.
              </div>
              {/* Barra de progresso */}
              <div style={{ marginTop: 10, height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: pct === 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : C.red,
                  borderRadius: 4,
                  transition: "width .4s"
                }} />
              </div>
            </div>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: pct === 100 ? "#22c55e15" : pct >= 50 ? "#f59e0b15" : C.red + "15",
              border: `2.5px solid ${pct === 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : C.red}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: pct === 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : C.red,
              fontFamily: "'Barlow Condensed', sans-serif"
            }}>
              {pct}%
            </div>
          </div>

          {/* Listagem de Requisitos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {itens.map((item, idx) => {
              const conf = conforms[item.id];
              const isChecked = !!conf;
              return (
                <div key={item.id} style={{
                  background: isChecked ? "rgba(34,197,94,0.03)" : C.surface,
                  border: `1px solid ${isChecked ? "rgba(34,197,94,0.25)" : C.border}`,
                  borderRadius: 12,
                  padding: 16,
                  transition: "all .15s"
                }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    {/* Checkbox */}
                    <button
                      onClick={() => salvarConformidade(item.id, !isChecked)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: `2px solid ${isChecked ? "#22c55e" : C.border}`,
                        background: isChecked ? "#22c55e" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 12,
                        padding: 0,
                        marginTop: 2
                      }}
                    >
                      {isChecked && "✓"}
                    </button>

                    {/* Texto informativo */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>
                          {idx + 1}. {item.titulo}
                        </div>
                        {item.obrigatorio && (
                          <span style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            background: "#a3332718",
                            color: C.red,
                            border: `1.5px solid ${C.red}25`,
                            borderRadius: 4,
                            padding: "1px 6px"
                          }}>OBRIGATÓRIO</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>
                        {item.descricao}
                      </div>

                      {/* Registro de Evidências */}
                      {isChecked && (
                        <div style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: `1px dashed ${C.border}`,
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          flexWrap: "wrap"
                        }}>
                          {conf.foto_registro_url && (
                            <img
                              src={conf.foto_registro_url}
                              alt="evidencia"
                              style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border}` }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: 11.5, color: C.text }}>
                              <strong>Evidência registrada:</strong> {conf.observacao || "Sem observações cadastradas."}
                            </div>
                            <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>
                              Conferido em {new Date(conf.conferido_em).toLocaleDateString("pt-BR")} às {new Date(conf.conferido_em).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <button
                            onClick={() => abrirModal(item)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              border: `1px solid ${C.border}`,
                              background: C.darker,
                              color: C.muted,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit"
                            }}
                          >
                            {conf.foto_registro_url || conf.observacao ? "Editar Registro" : "+ Foto / Nota"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Foto de Referência CBCA */}
                    {item.foto_reference_url && (
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <img
                          src={item.foto_reference_url}
                          alt="referencia"
                          style={{ width: 75, height: 75, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }}
                        />
                        <div style={{ fontSize: 9, color: C.muted, marginTop: 4, fontWeight: 700 }}>REF CBCA</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Foto / Nota do Requisito */}
      {modalItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, borderRadius: 14, padding: 24, width: "min(420px,95vw)" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Registrar Evidência de Qualidade</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: C.muted }}>{modalItem.titulo}</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>FOTO DO LOCAL / DETALHE (URL)</label>
                <Input
                  value={modalFoto}
                  onChange={setModalFoto}
                  placeholder="https://sua-foto-da-obra.jpg"
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>OBSERVAÇÃO / INFORMAÇÕES ADICIONAIS</label>
                <textarea
                  value={modalObs}
                  onChange={(e) => setModalObs(e.target.value)}
                  placeholder="Ex: Prumo aferido com desvio menor que 2mm. Fundação nivelada."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 9,
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "transparent",
                    color: C.text,
                    resize: "none"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModalItem(null)}>Cancelar</Btn>
              <Btn onClick={salvarModal} disabled={saving}>{saving ? "Salvando..." : "Salvar Registro"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
