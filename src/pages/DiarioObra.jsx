import { useState, useEffect, useCallback } from "react";
import { useToast } from "../hooks/useToast";
import { C, CLIMAS, TURNOS } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { salvarDiarioOffline, getPendentesDiario, deletarPendente, contarPendentes } from "../utils/offlineDB";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ─── Helpers de data ──────────────────────────────────────────────────────────
// Suporta YYYY-MM-DD (type=date) e DD/MM/AAAA (legado)
function parseDia(data = "") {
  if (data.includes("-")) return data.split("-")[2]; // YYYY-MM-DD
  return data.split("/")[0];                          // DD/MM/AAAA
}
function parseMes(data = "") {
  if (data.includes("-")) return Number(data.split("-")[1]);  // YYYY-MM-DD
  return Number(data.split("/")[1]);                           // DD/MM/AAAA
}
function fmtDataBR(data = "") {
  if (!data) return "—";
  if (data.includes("-")) {
    const [y, m, d] = data.split("-");
    return `${d}/${m}/${y}`;
  }
  return data;
}

// ─── Label ───────────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>
      {String(children).toUpperCase()}
      {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

// ─── Textarea estilizado ──────────────────────────────────────────────────────
function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", background: "transparent",
        border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "10px 13px", color: C.text, fontSize: 13,
        outline: "none", fontFamily: "inherit", resize: "vertical",
        boxSizing: "border-box",
      }}
    />
  );
}

// ─── Formulário de registro ───────────────────────────────────────────────────
function FormDiario({ form, setForm, onSave, onCancel }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const ok  = form.data && form.responsavel && form.atividades;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Data + Turno */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label required>Data</Label>
          <Input value={form.data} onChange={set("data")} type="date" />
        </div>
        <div>
          <Label>Turno</Label>
          <Select value={form.turno} onChange={set("turno")}
            options={TURNOS.map((t) => ({ value: t, label: t }))} />
        </div>
      </div>

      {/* Clima + Equipe */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Clima</Label>
          <Select value={form.clima} onChange={set("clima")}
            options={CLIMAS.map((c) => ({ value: c, label: c }))} />
        </div>
        <div>
          <Label>Equipe (pessoas)</Label>
          <Input type="number" min="1" value={form.equipe} onChange={set("equipe")} />
        </div>
      </div>

      {/* Responsável */}
      <div>
        <Label required>Responsável</Label>
        <Input value={form.responsavel} onChange={set("responsavel")} placeholder="Nome do engenheiro/mestre" />
      </div>

      {/* Atividades */}
      <div>
        <Label required>Atividades realizadas</Label>
        <Textarea
          value={form.atividades}
          onChange={set("atividades")}
          placeholder="Descreva as atividades executadas no dia..."
          rows={4}
        />
      </div>

      {/* Materiais e Equipamentos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Materiais utilizados</Label>
          <Textarea value={form.materiais} onChange={set("materiais")} placeholder="Ex: 20 perfis C90, 2 bobinas OSB..." rows={2} />
        </div>
        <div>
          <Label>Equipamentos</Label>
          <Textarea value={form.equipamentos} onChange={set("equipamentos")} placeholder="Ex: Parafusadeira, nível laser..." rows={2} />
        </div>
      </div>

      {/* Ocorrências */}
      <div>
        <Label>Ocorrências <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></Label>
        <Textarea
          value={form.ocorrencias}
          onChange={set("ocorrencias")}
          placeholder="Problemas, paralisações, visitas, acidentes..."
          rows={3}
        />
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn disabled={!ok} onClick={onSave}>💾 Salvar registro</Btn>
      </div>
    </div>
  );
}

// ─── Modal de detalhes ────────────────────────────────────────────────────────
function ModalDetalhes({ reg, onClose }) {
  return (
    <Modal title={`Diário — ${fmtDataBR(reg.data)}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Cabeçalho do registro */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            ["Data",   fmtDataBR(reg.data)],
            ["Turno",  reg.turno],
            ["Clima",  reg.clima],
            ["Equipe", `${reg.equipe} pessoas`],
          ].map(([k, v]) => (
            <div key={k} style={{ background: C.darker, borderRadius: 6, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Responsável */}
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>RESPONSÁVEL</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{reg.responsavel}</div>
        </div>

        {/* Atividades */}
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>ATIVIDADES REALIZADAS</div>
          <div style={{
            background: C.darker, borderRadius: 6,
            padding: "12px 14px", fontSize: 13, lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}>
            {reg.atividades}
          </div>
        </div>

        {/* Materiais / Equipamentos */}
        {(reg.materiais || reg.equipamentos) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {reg.materiais && (
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>MATERIAIS UTILIZADOS</div>
                <div style={{ background: C.darker, borderRadius: 6, padding: "10px 12px", fontSize: 13, lineHeight: 1.6 }}>{reg.materiais}</div>
              </div>
            )}
            {reg.equipamentos && (
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>EQUIPAMENTOS</div>
                <div style={{ background: C.darker, borderRadius: 6, padding: "10px 12px", fontSize: 13, lineHeight: 1.6 }}>{reg.equipamentos}</div>
              </div>
            )}
          </div>
        )}

        {/* Ocorrências */}
        {reg.ocorrencias && (
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>⚠️ OCORRÊNCIAS</div>
            <div style={{
              background: C.red + "0f",
              border: `1px solid ${C.red}33`,
              borderLeft: `3px solid ${C.red}`,
              borderRadius: 6, padding: "12px 14px",
              fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
            }}>
              {reg.ocorrencias}
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>
          Registrado por <strong>{reg.responsavel}</strong> · {reg.created}
        </div>
      </div>
    </Modal>
  );
}

// ─── Diário de Obra ───────────────────────────────────────────────────────────
const FORM_VAZIO = {
  data: new Date().toISOString().slice(0, 10),
  turno: "Integral",
  clima: "☀️ Ensolarado",
  equipe: 1,
  responsavel: "",
  atividades: "",
  materiais: "",
  equipamentos: "",
  ocorrencias: "",
};

export default function DiarioObra() {
  useModuleLoad("obras");

  const obras     = useAppStore((s) => s.obras);
  const diario    = useAppStore((s) => s.diario);
  const addDiario = useAppStore((s) => s.addDiario);

  const [obraId,    setObraId]    = useState(null);
  const [modal,     setModal]     = useState(false);
  const [verReg,    setVerReg]    = useState(null);
  const [form,      setForm]      = useState(FORM_VAZIO);
  const { toast, mostrarToast } = useToast();
  const [online,    setOnline]    = useState(navigator.onLine);
  const [pendentes, setPendentes] = useState(0);

  // Inicializa obraId quando obras carregarem (sem sobrescrever seleção manual)
  useEffect(() => {
    setObraId((prev) => prev || obras[0]?.id || null);
  }, [obras]);

  // Detecta mudança de conectividade
  useEffect(() => {
    const goOnline  = () => { setOnline(true);  sincronizarPendentes(); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    contarPendentes().then(setPendentes);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withTimeout = (promise, ms = 8000) =>
    Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms))]);

  const sincronizarPendentes = useCallback(async () => {
    const pendentes = await getPendentesDiario();
    for (const p of pendentes) {
      try {
        await withTimeout(addDiario(p.obraId, p.registro));
        await deletarPendente(p.localId);
      } catch { /* item ignorado; tentará novamente na próxima conexão */ }
    }
    setPendentes(await contarPendentes());
  }, [addDiario]);

  // Carrega diário da obra selecionada
  useModuleLoad("diario", obraId);

  function abrirNovoRegistro() {
    setForm({ ...FORM_VAZIO, data: new Date().toISOString().slice(0, 10) });
    setModal(true);
  }

  async function salvar() {
    if (!online) {
      await salvarDiarioOffline(obraId, form);
      setPendentes((n) => n + 1);
      setModal(false);
      setForm(FORM_VAZIO);
      mostrarToast("📴 Sem internet — salvo localmente. Será sincronizado ao reconectar.");
      return;
    }
    addDiario(obraId, form);
    setModal(false);
    setForm(FORM_VAZIO);
    mostrarToast("✅ Registro salvo no diário!");
  }

  const obra      = obras.find((o) => o.id === obraId) || null;
  const registros = diario[obraId] || [];

  // Empty state: sem obras
  if (obras.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhuma obra cadastrada</div>
        <div style={{ fontSize: 13, color: C.muted }}>
          Cadastre uma obra em <strong>Gestão de Obras</strong> para começar o diário.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006",
        }}>
          {toast}
        </div>
      )}

      {/* Modal novo registro */}
      {modal && (
        <Modal title="📋 Novo registro de diário" onClose={() => setModal(false)}>
          <FormDiario form={form} setForm={setForm} onSave={salvar} onCancel={() => setModal(false)} />
        </Modal>
      )}

      {/* Modal detalhes */}
      {verReg && <ModalDetalhes reg={verReg} onClose={() => setVerReg(null)} />}

      <div>
        {/* Header */}
        {/* Banner offline */}
        {!online && (
          <div style={{
            background: "#b97a0018", border: "1px solid #b97a0055", borderRadius: 10,
            padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>📴</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#b97a00" }}>Sem conexão com a internet</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                Os registros serão salvos localmente e sincronizados automaticamente ao reconectar.
                {pendentes > 0 && ` ${pendentes} registro(s) aguardando sync.`}
              </div>
            </div>
          </div>
        )}
        {online && pendentes > 0 && (
          <div style={{
            background: C.success + "18", border: `1px solid ${C.success}44`, borderRadius: 10,
            padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>🔄</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.success }}>Conexão restaurada</div>
              <div style={{ fontSize: 12, color: C.muted }}>{pendentes} registro(s) offline sendo sincronizados…</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Diário de Obra</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Registro diário de atividades e ocorrências</p>
          </div>
          <Btn onClick={abrirNovoRegistro}>+ Novo registro</Btn>
        </div>

        {/* Seletor de obra */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {obras.map((o) => (
            <button key={o.id} onClick={() => setObraId(o.id)} style={{
              padding: "8px 16px", borderRadius: 8,
              border: `1px solid ${obraId === o.id ? C.red : C.border}`,
              background: obraId === o.id ? C.red + "18" : "transparent",
              color: obraId === o.id ? C.text : C.muted,
              fontSize: 12, fontWeight: obraId === o.id ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
            }}>
              {o.nome?.split("—")[0]?.trim()}
            </button>
          ))}
        </div>

        {/* Info da obra */}
        {obra && (
          <div style={{
            background: C.surface, borderRadius: 14,
            border: `1px solid ${C.border}`, padding: "14px 20px",
            marginBottom: 20, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap",
          }}>
            {[
              ["Obra",      obra.nome?.split("—")[0]?.trim()],
              ["Fase",      obra.fase],
              ["Progresso", `${obra.progresso}%`],
              ["Registros", registros.length],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de registros */}
        {registros.length === 0 ? (
          <div style={{
            background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`,
            padding: "56px 0", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Nenhum registro ainda</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Registre as atividades diárias da obra para manter o histórico.</div>
            <Btn onClick={abrirNovoRegistro}>+ Criar primeiro registro</Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {registros.map((r) => (
              <div key={r.id} style={{
                background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                border: `1px solid ${r.ocorrencias ? C.red + "44" : C.border}`,
                overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px" }}>
                  {/* Data */}
                  <div style={{
                    background: r.ocorrencias ? C.danger : C.red,
                    borderRadius: 8, padding: "10px 14px",
                    textAlign: "center", flexShrink: 0, minWidth: 56,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                      {parseDia(r.data)}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.8)", marginTop: 2 }}>
                      {MESES[(parseMes(r.data) || 1) - 1]}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{r.clima}</span>
                      <span style={{ background: "#41414133", color: C.muted, borderRadius: 4, padding: "1px 8px", fontSize: 11 }}>
                        {r.turno}
                      </span>
                      <span style={{ fontSize: 11, color: C.muted }}>👥 {r.equipe} pessoas</span>
                      {r.ocorrencias && (
                        <span style={{
                          background: C.red + "18", color: C.red,
                          border: `1px solid ${C.red}33`,
                          borderRadius: 4, padding: "1px 8px",
                          fontSize: 11, fontWeight: 700,
                        }}>⚠️ Ocorrência</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 13, color: C.text, lineHeight: 1.5,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {r.atividades}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      Por <strong>{r.responsavel}</strong> · {r.created}
                    </div>
                  </div>

                  {/* Ação */}
                  <button onClick={() => setVerReg(r)} style={{
                    background: "transparent", border: `1px solid ${C.border}`,
                    borderRadius: 6, color: C.muted, fontSize: 12,
                    cursor: "pointer", padding: "8px 14px",
                    fontFamily: "inherit", flexShrink: 0,
                    transition: "all .15s",
                  }}>
                    Ver detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
