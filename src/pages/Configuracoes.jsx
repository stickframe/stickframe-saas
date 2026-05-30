import { useState, useEffect, useRef } from "react";
import { C, PERFIS } from "../utils/constants";
import { sb } from "../services/supabase";
import useAppStore from "../store/useAppStore";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function LabelF({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 20px", fontSize: 12, fontWeight: active ? 700 : 400,
      background: active ? C.red : "transparent",
      color: active ? "#fff" : C.muted,
      border: `1px solid ${active ? C.red : C.border}`,
      borderRadius: 8, cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
    }}>
      {label}
    </button>
  );
}

function Card({ children, title, subtitle }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px", marginBottom: 20 }}>
      {title && (
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Configuracoes() {
  const user      = useAppStore((s) => s.user);
  const empresaId = useAppStore((s) => s.empresaId);

  const [tab,     setTab]     = useState("empresa");
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  // Empresa
  const [empresa, setEmpresa] = useState({
    nome: "", cnpj: "", cidade: "", telefone: "", email: "", segmento: "", site: "", logo_url: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile,    setLogoFile]    = useState(null);
  const logoRef = useRef();

  // Perfil
  const [perfil, setPerfil] = useState({ nome: "", cargo: "" });

  // Senha
  const [senhaForm, setSenhaForm] = useState({ nova: "", confirmar: "" });
  const [showSenha, setShowSenha] = useState(false);

  function mostrarToast(msg, err) {
    setToast({ msg, err: !!err });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Carrega dados ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!empresaId) return;
    sb.from("empresas").select("*").eq("id", empresaId).single()
      .then(({ data }) => {
        if (data) setEmpresa({
          nome:      data.nome      || "",
          cnpj:      data.cnpj      || "",
          cidade:    data.cidade    || "",
          telefone:  data.telefone  || "",
          email:     data.email     || "",
          segmento:  data.segmento  || "",
          site:      data.site      || "",
          logo_url:  data.logo_url  || "",
        });
      });
    sb.from("usuarios").select("*").eq("empresa_id", empresaId).order("nome")
      .then(({ data }) => { if (data) setUsuarios(data); });
  }, [empresaId]);

  useEffect(() => {
    if (user) setPerfil({ nome: user.nome || "", cargo: user.cargo || "" });
  }, [user]);

  // ── Logo ─────────────────────────────────────────────────────────────────
  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function uploadLogo() {
    if (!logoFile) return empresa.logo_url;
    const ext  = logoFile.name.split(".").pop();
    const path = `logos/${empresaId}/logo.${ext}`;
    await sb.storage.from("arquivos").upload(path, logoFile, { upsert: true });
    const { data } = sb.storage.from("arquivos").getPublicUrl(path);
    return data.publicUrl + `?t=${Date.now()}`;
  }

  // ── Salvar empresa ────────────────────────────────────────────────────────
  async function salvarEmpresa() {
    if (!empresa.nome) return;
    setSaving(true);
    try {
      const logoUrl = await uploadLogo();
      await sb.from("empresas").update({
        nome:      empresa.nome,
        cnpj:      empresa.cnpj      || null,
        cidade:    empresa.cidade    || null,
        telefone:  empresa.telefone  || null,
        email:     empresa.email     || null,
        segmento:  empresa.segmento  || null,
        site:      empresa.site      || null,
        logo_url:  logoUrl           || null,
      }).eq("id", empresaId);
      setEmpresa((f) => ({ ...f, logo_url: logoUrl }));
      setLogoFile(null);
      mostrarToast("✅ Dados da empresa salvos!");
    } catch (e) {
      mostrarToast("❌ Erro ao salvar: " + e.message, true);
    } finally { setSaving(false); }
  }

  // ── Salvar perfil ─────────────────────────────────────────────────────────
  async function salvarPerfil() {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await sb.from("usuarios").update({ nome: perfil.nome, cargo: perfil.cargo }).eq("id", user.uid);
      mostrarToast("✅ Perfil atualizado!");
    } catch (e) {
      mostrarToast("❌ Erro: " + e.message, true);
    } finally { setSaving(false); }
  }

  // ── Trocar senha ──────────────────────────────────────────────────────────
  async function trocarSenha() {
    if (!senhaForm.nova || senhaForm.nova !== senhaForm.confirmar) return;
    if (senhaForm.nova.length < 6) { mostrarToast("❌ Senha deve ter ao menos 6 caracteres.", true); return; }
    setSaving(true);
    try {
      const { error } = await sb.auth.updateUser({ password: senhaForm.nova });
      if (error) throw error;
      setSenhaForm({ nova: "", confirmar: "" });
      mostrarToast("✅ Senha alterada com sucesso!");
    } catch (e) {
      mostrarToast("❌ Erro: " + e.message, true);
    } finally { setSaving(false); }
  }

  const logoAtual = logoPreview || empresa.logo_url;
  const senhaOk   = senhaForm.nova.length >= 6 && senhaForm.nova === senhaForm.confirmar;

  return (
    <>
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: C.surface, border: `1px solid ${toast.err ? C.danger : C.success}`,
          borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 32px #0006", color: toast.err ? C.danger : C.text,
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Configurações</h2>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Empresa · Perfil · Usuários</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <Tab label="🏢 Empresa"   active={tab === "empresa"} onClick={() => setTab("empresa")} />
        <Tab label="👤 Meu perfil" active={tab === "perfil"}  onClick={() => setTab("perfil")} />
        <Tab label="👥 Usuários"  active={tab === "usuarios"} onClick={() => setTab("usuarios")} />
      </div>

      {/* ══ Aba: Empresa ══ */}
      {tab === "empresa" && (
        <>
          <Card title="Logo da empresa" subtitle="Aparece nos relatórios, propostas e portal do cliente.">
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {/* Preview */}
              <div
                onClick={() => logoRef.current?.click()}
                style={{
                  width: 96, height: 96, borderRadius: 14,
                  border: `2px dashed ${C.border}`, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", background: C.darker, flexShrink: 0,
                  transition: "border-color .15s",
                }}
              >
                {logoAtual ? (
                  <img src={logoAtual} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🖼</div>
                    <div style={{ fontSize: 9, color: C.muted }}>Clique para enviar</div>
                  </div>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  {logoAtual ? "Logo carregado" : "Nenhum logo"}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>PNG, JPG ou SVG · recomendado 200×200px</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => logoRef.current?.click()} style={{
                    padding: "7px 14px", background: C.darker, border: `1px solid ${C.border}`,
                    borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: C.text,
                  }}>
                    {logoAtual ? "Trocar logo" : "Escolher logo"}
                  </button>
                  {logoAtual && (
                    <button onClick={() => { setLogoPreview(null); setLogoFile(null); setEmpresa((f) => ({ ...f, logo_url: "" })); }} style={{
                      padding: "7px 14px", background: C.danger + "18", border: `1px solid ${C.danger}44`,
                      borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: C.danger,
                    }}>Remover</button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Dados da empresa" subtitle="Exibidos nos relatórios, propostas e contatos.">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <LabelF required>Nome da empresa</LabelF>
                <Input value={empresa.nome} onChange={(v) => setEmpresa((f) => ({ ...f, nome: v }))} placeholder="Ex: StickFrame Construções Ltda." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <LabelF>CNPJ</LabelF>
                  <Input value={empresa.cnpj} onChange={(v) => setEmpresa((f) => ({ ...f, cnpj: v }))} placeholder="00.000.000/0001-00" />
                </div>
                <div>
                  <LabelF>Segmento</LabelF>
                  <Input value={empresa.segmento} onChange={(v) => setEmpresa((f) => ({ ...f, segmento: v }))} placeholder="Ex: Construção Steel Frame" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <LabelF>Cidade / Estado</LabelF>
                  <Input value={empresa.cidade} onChange={(v) => setEmpresa((f) => ({ ...f, cidade: v }))} placeholder="Ex: São Paulo / SP" />
                </div>
                <div>
                  <LabelF>Telefone</LabelF>
                  <Input value={empresa.telefone} onChange={(v) => setEmpresa((f) => ({ ...f, telefone: v }))} placeholder="+55 (11) 99999-9999" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <LabelF>E-mail comercial</LabelF>
                  <Input type="email" value={empresa.email} onChange={(v) => setEmpresa((f) => ({ ...f, email: v }))} placeholder="contato@empresa.com.br" />
                </div>
                <div>
                  <LabelF>Site</LabelF>
                  <Input value={empresa.site} onChange={(v) => setEmpresa((f) => ({ ...f, site: v }))} placeholder="www.empresa.com.br" />
                </div>
              </div>
            </div>
          </Card>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn disabled={!empresa.nome || saving} onClick={salvarEmpresa}>
              {saving ? "Salvando…" : "💾 Salvar dados da empresa"}
            </Btn>
          </div>
        </>
      )}

      {/* ══ Aba: Meu perfil ══ */}
      {tab === "perfil" && (
        <>
          {/* Info do usuário */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: C.red, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0,
              }}>
                {(user?.nome || user?.email || "?")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{user?.nome || "—"}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{user?.email}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12,
                    background: (PERFIS[user?.perfil]?.cor || C.muted) + "22",
                    color: PERFIS[user?.perfil]?.cor || C.muted,
                    border: `1px solid ${(PERFIS[user?.perfil]?.cor || C.muted)}44`,
                  }}>
                    {PERFIS[user?.perfil]?.label || user?.perfil || "—"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <LabelF>Nome de exibição</LabelF>
                <Input value={perfil.nome} onChange={(v) => setPerfil((f) => ({ ...f, nome: v }))} placeholder="Seu nome completo" />
              </div>
              <div>
                <LabelF>Cargo</LabelF>
                <Input value={perfil.cargo} onChange={(v) => setPerfil((f) => ({ ...f, cargo: v }))} placeholder="Ex: Engenheiro de Obras" />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Btn disabled={saving} onClick={salvarPerfil}>
                {saving ? "Salvando…" : "💾 Salvar perfil"}
              </Btn>
            </div>
          </Card>

          {/* Trocar senha */}
          <Card title="Alterar senha" subtitle="Sua nova senha deve ter pelo menos 6 caracteres.">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <LabelF>Nova senha</LabelF>
                <div style={{ position: "relative" }}>
                  <Input
                    type={showSenha ? "text" : "password"}
                    value={senhaForm.nova}
                    onChange={(v) => setSenhaForm((f) => ({ ...f, nova: v }))}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button onClick={() => setShowSenha((v) => !v)} style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 11, color: C.muted, fontFamily: "inherit",
                  }}>{showSenha ? "Ocultar" : "Mostrar"}</button>
                </div>
              </div>
              <div>
                <LabelF>Confirmar nova senha</LabelF>
                <Input
                  type={showSenha ? "text" : "password"}
                  value={senhaForm.confirmar}
                  onChange={(v) => setSenhaForm((f) => ({ ...f, confirmar: v }))}
                  placeholder="Repita a nova senha"
                />
                {senhaForm.confirmar && senhaForm.nova !== senhaForm.confirmar && (
                  <div style={{ fontSize: 11, color: C.danger, marginTop: 5 }}>As senhas não coincidem.</div>
                )}
              </div>

              {/* Barra de força */}
              {senhaForm.nova.length > 0 && (
                <div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map((i) => {
                      const forca = senhaForm.nova.length >= 8 && /[A-Z]/.test(senhaForm.nova) && /[0-9]/.test(senhaForm.nova) ? 4
                        : senhaForm.nova.length >= 8 ? 3
                        : senhaForm.nova.length >= 6 ? 2 : 1;
                      const cor = forca >= 4 ? C.success : forca >= 3 ? "#4a9eff" : forca >= 2 ? C.warning : C.danger;
                      return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= forca ? cor : C.border, transition: "background .2s" }} />;
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted }}>
                    {senhaForm.nova.length < 6 ? "Muito curta" : senhaForm.nova.length < 8 ? "Fraca" : /[A-Z]/.test(senhaForm.nova) && /[0-9]/.test(senhaForm.nova) ? "Forte" : "Média"}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn disabled={!senhaOk || saving} onClick={trocarSenha}>
                  {saving ? "Alterando…" : "🔒 Alterar senha"}
                </Btn>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ══ Aba: Usuários ══ */}
      {tab === "usuarios" && (
        <>
          <Card title="Usuários da empresa" subtitle={`${usuarios.length} conta(s) cadastrada(s) nesta empresa.`}>
            {usuarios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
                Nenhum usuário encontrado.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {usuarios.map((u) => {
                  const isMe    = u.id === user?.uid;
                  const perfilU = PERFIS[u.perfil];
                  return (
                    <div key={u.id} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 16px", borderRadius: 10,
                      border: `1px solid ${isMe ? C.red + "44" : C.border}`,
                      background: isMe ? C.red + "05" : "transparent",
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                        background: perfilU?.cor || C.muted,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: "#fff",
                      }}>
                        {(u.nome || "?")[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                          {u.nome || "—"}
                          {isMe && <span style={{ fontSize: 10, color: C.red, fontWeight: 700 }}>• você</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{u.cargo || "—"}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                          background: (perfilU?.cor || C.muted) + "22",
                          color: perfilU?.cor || C.muted,
                          border: `1px solid ${(perfilU?.cor || C.muted)}44`,
                        }}>
                          {perfilU?.label || u.perfil || "—"}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                          background: u.ativo ? C.success + "18" : C.muted + "18",
                          color: u.ativo ? C.success : C.muted,
                        }}>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Perfis e permissões */}
          <Card title="Perfis e permissões" subtitle="Cada perfil tem acesso a módulos específicos do sistema.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {Object.entries(PERFIS).map(([key, p]) => (
                <div key={key} style={{
                  borderRadius: 10, padding: "14px 16px",
                  border: `1px solid ${p.cor}44`,
                  background: p.cor + "08",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: p.cor, marginBottom: 10 }}>{p.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {p.paginas.map((pg) => (
                      <span key={pg} style={{
                        fontSize: 9, padding: "2px 6px", borderRadius: 4,
                        background: p.cor + "15", color: p.cor, fontWeight: 600, textTransform: "capitalize",
                      }}>{pg}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
