import { useState, useEffect, useRef } from "react";
import { sb } from "../services/supabase";
import { TrendingUp } from "../components/ui/Icon";
import * as Sentry from "@sentry/react";
import { useToast } from "../hooks/useToast";
import { C, PERFIS } from "../utils/constants";
import PerfisCustomizados from "../components/configuracoes/PerfisCustomizados";
import useAppStore from "../store/useAppStore";
import {
  buscarEmpresa, atualizarEmpresa, uploadLogoEmpresa,
  listarUsuariosEmpresa, atualizarPerfil, trocarSenha,
  atualizarPerfilUsuario, convidarUsuario,
} from "../services/repositories/empresaRepository";
import { hasSavedCredential, removeBiometric, isWebAuthnAvailable } from "../services/webAuthnService";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import WebhookConfig from "../components/configuracoes/WebhookConfig";
import ModalUpgradePro from "../components/ui/ModalUpgradePro";
import { ConfigSFTab } from "../components/configuracoes/ConfigSF";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function LabelF({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function LinkCopiavel({ label, url, desc }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div>
      <LabelF>{label}</LabelF>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, padding: "10px 14px", background: C.darker, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.muted, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {url}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
          style={{ padding: "10px 16px", background: copiado ? "#16a34a" : C.red, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "background .2s" }}
        >
          {copiado ? "✓ Copiado!" : "📋 Copiar"}
        </button>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{desc}</div>
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

  const { toast, mostrarToast: _toast } = useToast(3500);
  const mostrarToast = (msg, err) => _toast(err ? `❌ ${msg}` : msg);

  const [tab,     setTab]     = useState("empresa");
  const [saving,  setSaving]  = useState(false);
  const [usuarios, setUsuarios] = useState([]);

  // Empresa
  const [empresa, setEmpresa] = useState({
    nome: "", cnpj: "", cidade: "", telefone: "", email: "", segmento: "", site: "", logo_url: "", whatsapp_alertas: "", ical_token: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile,    setLogoFile]    = useState(null);
  const [gerandoIcal, setGerandoIcal] = useState(false);
  const logoRef = useRef();

  // Perfil
  const [perfil, setPerfil] = useState({ nome: "", cargo: "" });

  // Senha
  const [senhaForm, setSenhaForm] = useState({ nova: "", confirmar: "" });
  const [showSenha, setShowSenha] = useState(false);

  // Biometria
  const [biometriaAtiva, setBiometriaAtiva] = useState(false);
  const [webAuthnDisponivel, setWebAuthnDisponivel] = useState(false);

  // Convidar usuário
  const [showConvite, setShowConvite] = useState(false);
  const [convite, setConvite] = useState({ email: "", nome: "", perfil: "comercial" });
  const [convidando, setConvidando] = useState(false);

  const [showUpgrade, setShowUpgrade] = useState(false);

  // Calculadora white-label
  const [calcToken, setCalcToken] = useState("");
  const [calcLinkCopiado, setCalcLinkCopiado] = useState(false);

  // API Key
  const [apiKey, setApiKey] = useState("");
  const [apiKeyCreatedAt, setApiKeyCreatedAt] = useState(null);
  const [apiKeyRevealed, setApiKeyRevealed] = useState(false);
  const [gerandoChave, setGerandoChave] = useState(false);

  // Perfis customizados (para dropdown de usuários)
  const perfisCustomizados = useAppStore((s) => s.perfisCustomizados);

  const [precosM2, setPrecosM2] = useState(() => {
    try {
      const local = localStorage.getItem("sf_precos_m2");
      if (local) {
        const parsed = JSON.parse(local);
        return {
          economico: parsed["Econômico"]?.m2 || 2800,
          padrao: parsed["Padrão"]?.m2 || 3500,
          altoPadrao: parsed["Alto Padrão"]?.m2 || 4800,
        };
      }
    } catch (_) {}
    return { economico: 2800, padrao: 3500, altoPadrao: 4800 };
  });



  // ── Carrega dados ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!empresaId) return;
    buscarEmpresa().then((data) => {
      if (data) {
        setEmpresa({
          nome:     data.nome      || "",
          cnpj:     data.cnpj      || "",
          cidade:   data.cidade    || "",
          telefone: data.telefone  || "",
          email:    data.email     || "",
          segmento: data.segmento  || "",
          site:             data.site             || "",
          logo_url:         data.logo_url         || "",
          whatsapp_alertas: data.whatsapp_alertas || "",
          plano:            data.plano            || "free",
          limite_obras:     data.limite_obras      ?? 2,
          ical_token:       data.ical_token       || "",
        });
        if (data.calc_token) setCalcToken(data.calc_token);
        if (data.api_key) setApiKey(data.api_key);
        if (data.api_key_created_at) setApiKeyCreatedAt(data.api_key_created_at);
      }
    }).catch(() => {});
    listarUsuariosEmpresa().then((data) => { if (data) setUsuarios(data); }).catch(() => {});
  }, [empresaId]);

  useEffect(() => {
    if (user) setPerfil({ nome: user.nome || "", cargo: user.cargo || "" });
  }, [user]);

  useEffect(() => {
    isWebAuthnAvailable().then(setWebAuthnDisponivel).catch(() => {});
    setBiometriaAtiva(hasSavedCredential());
  }, []);

  // ── Logo ─────────────────────────────────────────────────────────────────
  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  // ── Salvar empresa ────────────────────────────────────────────────────────
  async function salvarEmpresa() {
    if (!empresa.nome) return;
    setSaving(true);
    try {
      const logoUrl = logoFile ? await uploadLogoEmpresa(logoFile) : empresa.logo_url;
      await atualizarEmpresa({
        nome:     empresa.nome,
        cnpj:     empresa.cnpj      || null,
        cidade:   empresa.cidade    || null,
        telefone: empresa.telefone  || null,
        email:    empresa.email     || null,
        segmento: empresa.segmento  || null,
        site:     empresa.site      || null,
        logo_url:         logoUrl           || null,
        whatsapp_alertas: empresa.whatsapp_alertas || null,
      });
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
      await atualizarPerfil(user.uid, { nome: perfil.nome, cargo: perfil.cargo });
      mostrarToast("✅ Perfil atualizado!");
    } catch (e) {
      mostrarToast("❌ Erro: " + e.message, true);
    } finally { setSaving(false); }
  }

  // ── Trocar senha ──────────────────────────────────────────────────────────
  async function handleTrocarSenha() {
    if (!senhaForm.nova || senhaForm.nova !== senhaForm.confirmar) return;
    if (senhaForm.nova.length < 6) { mostrarToast("❌ Senha deve ter ao menos 6 caracteres.", true); return; }
    setSaving(true);
    try {
      await trocarSenha(senhaForm.nova);
      setSenhaForm({ nova: "", confirmar: "" });
      mostrarToast("✅ Senha alterada com sucesso!");
    } catch (e) {
      mostrarToast("❌ Erro: " + e.message, true);
    } finally { setSaving(false); }
  }

  async function handleAlterarPerfil(uid, novoPerfil) {
    try {
      await atualizarPerfilUsuario(uid, { perfil: novoPerfil });
      setUsuarios((prev) => prev.map((u) => u.id === uid ? { ...u, perfil: novoPerfil } : u));
      mostrarToast("✅ Perfil atualizado!");
    } catch (e) {
      mostrarToast("Erro: " + e.message, true);
    }
  }

  async function handleToggleAtivo(uid, ativoAtual) {
    try {
      await atualizarPerfilUsuario(uid, { ativo: !ativoAtual });
      setUsuarios((prev) => prev.map((u) => u.id === uid ? { ...u, ativo: !ativoAtual } : u));
      mostrarToast(!ativoAtual ? "✅ Usuário ativado!" : "✅ Usuário desativado!");
    } catch (e) {
      mostrarToast("Erro: " + e.message, true);
    }
  }

  async function handleConvidarUsuario() {
    if (!convite.email || !convite.nome) return;
    setConvidando(true);
    try {
      await convidarUsuario(convite.email, convite.nome, convite.perfil);
      setShowConvite(false);
      setConvite({ email: "", nome: "", perfil: "comercial" });
      mostrarToast("✅ Convite enviado!");
      listarUsuariosEmpresa().then((data) => { if (data) setUsuarios(data); }).catch(() => {});
    } catch (e) {
      if (e.message?.startsWith("LIMITE_PLANO:")) {
        mostrarToast("⚠️ " + e.message.replace("LIMITE_PLANO:", ""));
      } else {
        mostrarToast("Erro: " + e.message, true);
      }
    } finally {
      setConvidando(false);
    }
  }

  async function handleRemoverBiometria() {
    try {
      removeBiometric();
      setBiometriaAtiva(false);
      mostrarToast("✅ Biometria removida!");
    } catch (e) {
      mostrarToast("Erro: " + e.message, true);
    }
  }

  async function gerarApiKey() {
    setGerandoChave(true);
    try {
      const { data: newKey, error: rpcError } = await sb.rpc("generate_api_key");
      if (rpcError) throw rpcError;
      const now = new Date().toISOString();
      const { error: updateError } = await sb
        .from("empresas")
        .update({ api_key: newKey, api_key_created_at: now })
        .eq("id", empresaId);
      if (updateError) throw updateError;
      setApiKey(newKey);
      setApiKeyCreatedAt(now);
      setApiKeyRevealed(true);
      mostrarToast("✅ Nova chave gerada com sucesso!");
    } catch (e) {
      mostrarToast("❌ Erro ao gerar chave: " + e.message, true);
    } finally {
      setGerandoChave(false);
    }
  }

  async function gerarNovoIcalToken() {
    setGerandoIcal(true);
    try {
      const novoToken = crypto.randomUUID();
      const { error } = await sb
        .from("empresas")
        .update({ ical_token: novoToken })
        .eq("id", empresaId);
      if (error) throw error;
      setEmpresa((f) => ({ ...f, ical_token: novoToken }));
      mostrarToast("✅ Novo token de calendário gerado com sucesso!");
    } catch (e) {
      mostrarToast("❌ Erro ao gerar token: " + e.message, true);
    } finally {
      setGerandoIcal(false);
    }
  }

  const logoAtual = logoPreview || empresa.logo_url;
  const senhaOk   = senhaForm.nova.length >= 6 && senhaForm.nova === senhaForm.confirmar;

  return (
    <>
      {showUpgrade && <ModalUpgradePro onClose={() => setShowUpgrade(false)} />}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: C.surface, border: `1px solid ${String(toast).startsWith("❌") ? C.danger : C.success}`,
          borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 32px #0006", color: String(toast).startsWith("❌") ? C.danger : C.text,
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Configurações</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Empresa · Perfil · Usuários</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: empresa.plano === "pro" ? "#e6f9f0" : "#f0f4ff", border: `1px solid ${empresa.plano === "pro" ? "#2e9e5b" : "#4a7af8"}`, borderRadius: 10, padding: "10px 16px" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: empresa.plano === "pro" ? "#1a6b40" : "#2c4a9e" }}>
              Plano {empresa.plano === "pro" ? "Pro ✓" : "Free"}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {empresa.plano === "free" ? `${empresa.limite_obras ?? 2} obras ativas · 1 usuário` : "Obras ilimitadas · usuários ilimitados"}
            </div>
          </div>
          {empresa.plano === "free" && (
            <button onClick={() => setShowUpgrade(true)} style={{ background: C.red, color: "#fff", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Fazer upgrade
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <Tab label="🏢 Empresa"   active={tab === "empresa"}  onClick={() => setTab("empresa")} />
        <Tab label="👤 Meu perfil" active={tab === "perfil"}   onClick={() => setTab("perfil")} />
        <Tab label="👥 Usuários"  active={tab === "usuarios"} onClick={() => setTab("usuarios")} />
        <Tab label="⚙️ Sistema"   active={tab === "sistema"}  onClick={() => setTab("sistema")} />
        <Tab label="🤖 Robô IA"   active={tab === "ia"}       onClick={() => setTab("ia")} />
        <Tab label="📅 Integrações" active={tab === "integracoes"} onClick={() => setTab("integracoes")} />
        <Tab label="🏗️ Orçamento SF" active={tab === "orcamento_sf"} onClick={() => setTab("orcamento_sf")} />
        {user?.perfil === "diretor" && (
          <Tab label="🔗 Webhooks" active={tab === "webhooks"} onClick={() => setTab("webhooks")} />
        )}
        {user?.perfil === "diretor" && (
          <Tab label="🌐 API"      active={tab === "api"}      onClick={() => setTab("api")} />
        )}
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
              <div>
                <LabelF>WhatsApp para alertas de leads</LabelF>
                <Input value={empresa.whatsapp_alertas} onChange={(v) => setEmpresa((f) => ({ ...f, whatsapp_alertas: v }))} placeholder="Ex: 5511989859995" />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Número que receberá notificações automáticas quando um lead preencher a calculadora. Formato: DDI + DDD + número (ex: 5511999999999).</div>
              </div>
            </div>
          </Card>

          {/* Alertas de preço */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}><TrendingUp size={13} /> Alertas de Variação de Preços</div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
              <div>
                <LabelF>E-mail para receber alertas</LabelF>
                <Input type="email" value={empresa.email_alertas_precos} onChange={(v) => setEmpresa((f) => ({ ...f, email_alertas_precos: v }))} placeholder="andre@stickframe.com.br" />
              </div>
              <div>
                <LabelF>Alertar quando variar mais de (%)</LabelF>
                <Input type="number" min="1" max="50" value={empresa.alerta_variacao_pct} onChange={(v) => setEmpresa((f) => ({ ...f, alerta_variacao_pct: v }))} placeholder="5" />
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
              Você receberá um email diariamente quando algum produto monitorado variar mais do que esse percentual.
            </div>
          </Card>

          {/* Links White-Label */}
          <Card title="🔗 Seus links personalizados" subtitle="Compartilhe com clientes e colaboradores — os links exibem o nome e logo da sua empresa.">
            {calcToken ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <LinkCopiavel
                  label="Calculadora personalizada"
                  url={`https://stickframe.com.br/calcular?e=${calcToken}`}
                  desc="Clientes veem a calculadora com seu logo. Leads chegam para você via WhatsApp."
                />
                <LinkCopiavel
                  label="Login personalizado (para colaboradores)"
                  url={`https://stickframe.com.br/login?e=${calcToken}`}
                  desc="Colaboradores veem seu logo na tela de acesso ao sistema."
                />
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.muted }}>Carregando links…</div>
            )}
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

          {webAuthnDisponivel && (
            <Card title="Biometria / Autenticação por dispositivo">
              {biometriaAtiva ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 20,
                    background: C.success + "18", color: C.success,
                    border: `1px solid ${C.success}44`,
                  }}>🔐 Biometria ativa neste dispositivo</span>
                  <Btn variant="ghost" onClick={handleRemoverBiometria}>Remover biometria</Btn>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: C.muted }}>Biometria não ativada neste dispositivo</div>
              )}
            </Card>
          )}

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
                <Btn disabled={!senhaOk || saving} onClick={handleTrocarSenha}>
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
          {showConvite && (
            <div style={{
              position: "fixed", inset: 0, background: "#0008", zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center",
            }} onClick={() => setShowConvite(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
                padding: "28px 32px", width: 400, maxWidth: "90vw",
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Convidar usuário</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <LabelF required>E-mail</LabelF>
                    <Input type="email" value={convite.email} onChange={(v) => setConvite((f) => ({ ...f, email: v }))} placeholder="usuario@email.com" />
                  </div>
                  <div>
                    <LabelF required>Nome</LabelF>
                    <Input value={convite.nome} onChange={(v) => setConvite((f) => ({ ...f, nome: v }))} placeholder="Nome completo" />
                  </div>
                  <div>
                    <LabelF>Perfil</LabelF>
                    <Select
                      value={convite.perfil}
                      onChange={(v) => setConvite((f) => ({ ...f, perfil: v }))}
                      options={[
                        { value: "diretor",     label: "Diretor" },
                        { value: "comercial",   label: "Comercial" },
                        { value: "engenheiro",  label: "Engenheiro" },
                        { value: "financeiro",  label: "Financeiro" },
                        ...perfisCustomizados.map((p) => ({ value: p.id, label: p.nome })),
                      ]}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                  <Btn variant="ghost" onClick={() => setShowConvite(false)}>Cancelar</Btn>
                  <Btn disabled={!convite.email || !convite.nome || convidando} onClick={handleConvidarUsuario}>
                    {convidando ? "Enviando…" : "Enviar convite"}
                  </Btn>
                </div>
              </div>
            </div>
          )}

          <Card title="Usuários da empresa" subtitle={`${usuarios.length} conta(s) cadastrada(s) nesta empresa.`}>
            {user?.perfil === "diretor" && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Btn onClick={() => setShowConvite(true)}>+ Convidar usuário</Btn>
              </div>
            )}
            {usuarios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
                Nenhum usuário encontrado.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {usuarios.map((u) => {
                  const isMe    = u.id === user?.uid;
                  const perfilU = PERFIS[u.perfil] || perfisCustomizados.find((p) => p.id === u.perfil);
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
                        {user?.perfil === "diretor" && !isMe ? (
                          <select
                            value={u.perfil || ""}
                            onChange={(e) => handleAlterarPerfil(u.id, e.target.value)}
                            style={{
                              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 12,
                              background: (perfilU?.cor || C.muted) + "22",
                              color: perfilU?.cor || C.muted,
                              border: `1px solid ${(perfilU?.cor || C.muted)}44`,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            {["diretor", "comercial", "engenheiro", "financeiro"].map((p) => (
                              <option key={p} value={p}>{PERFIS[p]?.label || p}</option>
                            ))}
                            {perfisCustomizados.length > 0 && (
                              <optgroup label="Personalizados">
                                {perfisCustomizados.map((p) => (
                                  <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        ) : (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                            background: (perfilU?.cor || C.muted) + "22",
                            color: perfilU?.cor || C.muted,
                            border: `1px solid ${(perfilU?.cor || C.muted)}44`,
                          }}>
                            {perfilU?.label || u.perfil || "—"}
                          </span>
                        )}
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                          background: u.ativo ? C.success + "18" : C.muted + "18",
                          color: u.ativo ? C.success : C.muted,
                        }}>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                        {user?.perfil === "diretor" && !isMe && (
                          <button
                            onClick={() => handleToggleAtivo(u.id, u.ativo)}
                            style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                              background: u.ativo ? C.danger + "18" : C.success + "18",
                              color: u.ativo ? C.danger : C.success,
                              border: `1px solid ${u.ativo ? C.danger : C.success}44`,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            {u.ativo ? "Desativar" : "Ativar"}
                          </button>
                        )}
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

          <PerfisCustomizados />
        </>
      )}
      {/* ══ Aba: Sistema ══ */}
      {tab === "sistema" && (
        <>
          <Card title="Monitoramento de Erros (Sentry)" subtitle="Rastreamento automático de erros em produção">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: C.darker, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: import.meta.env.VITE_SENTRY_DSN ? C.success : C.warning }}>
                  {import.meta.env.VITE_SENTRY_DSN ? "✓ Ativo" : "⚠ DSN não configurado"}
                </div>
              </div>
              <div style={{ background: C.darker, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Ambiente</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{import.meta.env.MODE}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
              Clique no botão abaixo para enviar um erro de teste ao Sentry e confirmar que o monitoramento está funcionando.
            </div>
            <Btn variant="ghost" onClick={() => {
              try { throw new Error("[Teste Sentry] Erro manual de verificação — pode ignorar."); }
              catch (e) { Sentry.captureException(e); mostrarToast("✅ Erro de teste enviado ao Sentry!"); }
            }}>
              Enviar erro de teste
            </Btn>
          </Card>
          <Card title="Preço do m² por Padrão Construtivo" subtitle="Valores base utilizados no cálculo de orçamentos por m²">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="sf-grid-3">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>ECONÔMICO (R$/m²)</div>
                  <Input
                    type="number"
                    value={precosM2.economico}
                    onChange={(v) => setPrecosM2(p => ({ ...p, economico: Math.max(0, parseInt(v) || 0) }))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>PADRÃO (R$/m²)</div>
                  <Input
                    type="number"
                    value={precosM2.padrao}
                    onChange={(v) => setPrecosM2(p => ({ ...p, padrao: Math.max(0, parseInt(v) || 0) }))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>ALTO PADRÃO (R$/m²)</div>
                  <Input
                    type="number"
                    value={precosM2.altoPadrao}
                    onChange={(v) => setPrecosM2(p => ({ ...p, altoPadrao: Math.max(0, parseInt(v) || 0) }))}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <Btn onClick={() => {
                  try {
                    const toSave = {
                      "Econômico":   { label: "Econômico",   m2: precosM2.economico },
                      "Padrão":      { label: "Padrão",      m2: precosM2.padrao },
                      "Alto Padrão": { label: "Alto Padrão", m2: precosM2.altoPadrao },
                    };
                    localStorage.setItem("sf_precos_m2", JSON.stringify(toSave));
                    mostrarToast("✅ Preços atualizados com sucesso!");
                  } catch (e) {
                    mostrarToast("Erro ao salvar preços.", true);
                  }
                }}>💾 Salvar valores de m²</Btn>
              </div>
            </div>
          </Card>

          <Card title="Informações do Build">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Versão",     import.meta.env.VITE_APP_VERSION || "—"],
                ["Modo",       import.meta.env.MODE],
                ["Base URL",   import.meta.env.BASE_URL],
                ["Supabase",   import.meta.env.VITE_SUPABASE_URL ? "✓ Configurado" : "✗ Ausente"],
              ].map(([label, value]) => (
                <div key={label} style={{ background: C.darker, borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>{value}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
      {/* ══ Aba: Robô IA / WhatsApp ══ */}
      {tab === "ia" && <AbaRoboIA empresaId={empresaId} mostrarToast={mostrarToast} />}

      {/* ══ Aba: Webhooks (somente diretores) ══ */}
      {tab === "webhooks" && user?.perfil === "diretor" && (
        <Card title="Webhooks" subtitle="Configure endpoints externos para receber eventos automáticos do StickFrame.">
          <WebhookConfig />
        </Card>
      )}

      {/* ══ Aba: API pública (somente diretores) ══ */}
      {tab === "api" && user?.perfil === "diretor" && (
        <>
          {/* API Key management */}
          <Card title="Chave de API" subtitle="Use esta chave para autenticar requisições à API pública do StickFrame.">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Current key display */}
              <div>
                <LabelF>Sua chave de API</LabelF>
                {apiKey ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      readOnly
                      value={apiKeyRevealed ? apiKey : "sf_live_" + "•".repeat(40)}
                      style={{
                        flex: 1, padding: "10px 13px", background: C.darker,
                        border: `1px solid ${C.border}`, borderRadius: 8,
                        fontFamily: "monospace", fontSize: 12, color: C.text,
                      }}
                    />
                    <button
                      onClick={() => setApiKeyRevealed((v) => !v)}
                      style={{
                        padding: "10px 14px", background: C.darker, border: `1px solid ${C.border}`,
                        borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: C.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {apiKeyRevealed ? "Ocultar" : "Revelar"}
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(apiKey); mostrarToast("✅ Chave copiada!"); }}
                      style={{
                        padding: "10px 14px", background: C.darker, border: `1px solid ${C.border}`,
                        borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: C.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: C.muted, padding: "10px 0" }}>
                    Nenhuma chave gerada ainda. Clique em "Gerar nova chave" para criar.
                  </div>
                )}
                {apiKeyCreatedAt && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                    Criada em: {new Date(apiKeyCreatedAt).toLocaleString("pt-BR")}
                  </div>
                )}
              </div>

              <div>
                <Btn onClick={gerarApiKey} disabled={gerandoChave}>
                  {gerandoChave ? "Gerando…" : apiKey ? "🔄 Gerar nova chave" : "🔑 Gerar chave de API"}
                </Btn>
                {apiKey && (
                  <div style={{ fontSize: 11, color: C.warning, marginTop: 6 }}>
                    Atenção: gerar uma nova chave invalida a chave atual imediatamente.
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card title="API pública" subtitle="Integre o StickFrame com ERPs e sistemas externos via REST API.">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Base URL */}
              <div>
                <LabelF>URL base</LabelF>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    readOnly
                    value={`${import.meta.env.VITE_SUPABASE_URL || "https://<projeto>.supabase.co"}/functions/v1/api`}
                    style={{
                      flex: 1, padding: "10px 13px", background: C.darker,
                      border: `1px solid ${C.border}`, borderRadius: 8,
                      fontFamily: "monospace", fontSize: 12, color: C.text,
                    }}
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`); mostrarToast("✅ URL copiada!"); }}
                    style={{
                      padding: "10px 14px", background: C.darker, border: `1px solid ${C.border}`,
                      borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: C.text,
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Autenticação */}
              <div>
                <LabelF>Autenticação</LabelF>
                <div style={{
                  background: C.darker, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: "12px 16px", fontFamily: "monospace", fontSize: 12,
                }}>
                  Authorization: Bearer sf_live_sua_chave_aqui
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  Envie a chave no header <code>Authorization</code> com o prefixo <code>Bearer</code>.
                </div>
              </div>

              {/* Endpoints */}
              <div>
                <LabelF>Endpoints disponíveis</LabelF>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Método", "Rota", "Descrição"].map((h) => (
                        <th key={h} style={{
                          textAlign: "left", padding: "8px 12px", fontWeight: 700,
                          color: C.muted, borderBottom: `1px solid ${C.border}`, fontSize: 10,
                          letterSpacing: 0.8, textTransform: "uppercase",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["GET",  "/obras",                "Lista todas as obras da empresa"],
                      ["GET",  "/obras/:id",            "Detalha uma obra específica"],
                      ["GET",  "/obras/:id/financeiro", "Lançamentos financeiros de uma obra"],
                      ["GET",  "/clientes",             "Lista todos os clientes"],
                      ["GET",  "/financeiro",           "Lista lançamentos financeiros (máx. 100)"],
                      ["POST", "/webhooks/test",        "Testa o endpoint de webhooks"],
                    ].map(([method, route, desc]) => (
                      <tr key={route}>
                        <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
                          <span style={{
                            fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                            padding: "2px 7px", borderRadius: 5,
                            background: method === "GET" ? C.success + "22" : C.warning + "22",
                            color: method === "GET" ? C.success : C.warning,
                          }}>{method}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.text, borderBottom: `1px solid ${C.border}` }}>{route}</td>
                        <td style={{ padding: "10px 12px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Exemplo curl */}
              <div>
                <LabelF>Exemplo de requisição (curl)</LabelF>
                <pre style={{
                  background: C.darker, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: "14px 16px", fontFamily: "monospace", fontSize: 11,
                  color: C.text, overflow: "auto", margin: 0,
                }}>{`curl -H "Authorization: Bearer ${apiKey || "{sua_chave}"}" \\
  ${import.meta.env.VITE_SUPABASE_URL || "https://gpzmglcxmbboxxogbibq.supabase.co"}/functions/v1/api/obras`}</pre>
                {apiKey && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`curl -H "Authorization: Bearer ${apiKey}" \\\n  ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/obras`);
                      mostrarToast("✅ Exemplo copiado!");
                    }}
                    style={{
                      marginTop: 8, padding: "6px 12px", background: C.darker, border: `1px solid ${C.border}`,
                      borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 11, color: C.text,
                    }}
                  >
                    Copiar exemplo
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Google Calendar / iCal */}
          <Card
            title="📅 Google Calendar / iCal"
            subtitle="Adicione seus compromissos do StickFrame no Google Calendar, Apple Calendar ou Outlook"
          >
            {apiKey ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  Use o link abaixo para sincronizar seus eventos do StickFrame com qualquer aplicativo de calendário que suporte o formato iCalendar (.ics).
                  O feed é atualizado automaticamente e exibe os compromissos dos próximos 90 dias.
                </div>

                <div>
                  <LabelF>URL do Feed iCal</LabelF>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{
                      flex: 1, padding: "10px 14px", background: C.darker,
                      border: `1px solid ${C.border}`, borderRadius: 8,
                      fontSize: 12, color: C.muted, fontFamily: "monospace",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {`https://gpzmglcxmbboxxogbibq.supabase.co/functions/v1/agenda-ical?token=${apiKey}`}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://gpzmglcxmbboxxogbibq.supabase.co/functions/v1/agenda-ical?token=${apiKey}`);
                        mostrarToast("✅ Link copiado!");
                      }}
                      style={{
                        padding: "10px 16px", background: C.red, color: "#fff",
                        border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                      }}
                    >
                      📋 Copiar link
                    </button>
                    <button
                      onClick={() => {
                        const feedUrl = `https://gpzmglcxmbboxxogbibq.supabase.co/functions/v1/agenda-ical?token=${apiKey}`;
                        window.open(`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`, "_blank");
                      }}
                      style={{
                        padding: "10px 16px", background: "#1a73e8", color: "#fff",
                        border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                      }}
                    >
                      📆 Abrir no Google Calendar
                    </button>
                  </div>
                </div>

                <div style={{ background: C.darker, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Como adicionar no Google Calendar:</div>
                  <ol style={{ fontSize: 12, color: C.muted, paddingLeft: 18, lineHeight: 2 }}>
                    <li>Clique em <strong style={{ color: C.text }}>"Abrir no Google Calendar"</strong> acima, ou acesse o Google Calendar</li>
                    <li>No menu lateral, clique em <strong style={{ color: C.text }}>"Outros calendários"</strong> → <strong style={{ color: C.text }}>+</strong></li>
                    <li>Selecione <strong style={{ color: C.text }}>"A partir do URL"</strong></li>
                    <li>Cole o link copiado acima e clique em <strong style={{ color: C.text }}>"Adicionar calendário"</strong></li>
                  </ol>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                    Apple Calendar: Arquivo → Nova assinatura de calendário → Cole o link.<br />
                    Outlook: Adicionar calendário → Da Internet → Cole o link.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.muted, padding: "10px 0" }}>
                Gere uma Chave de API (acima) para habilitar o feed de calendário.
              </div>
            )}
          </Card>
        </>
      )}

      {/* ══ Aba: Integrações ══ */}
      {tab === "integracoes" && (
        <>
          <Card 
            title="📅 Sincronização com Google Calendar e Calendários Externos" 
            subtitle="Adicione seus compromissos e visitas de obras diretamente ao seu calendário favorito (Google Calendar, Apple Calendar, Outlook, etc.) usando um link de assinatura seguro."
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Informação sobre como funciona */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: C.darker, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px" }}>
                <span style={{ fontSize: 20 }}>💡</span>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                  <strong style={{ color: C.text, display: "block", marginBottom: 4 }}>Como funciona a sincronização?</strong>
                  Ao assinar este link, seu aplicativo de calendário irá atualizar automaticamente e buscar os eventos futuros e passados cadastrados na Agenda do StickFrame.
                  <br />
                  <span style={{ color: C.warning, display: "block", marginTop: 4 }}>
                    ⚠️ Nota: O Google Calendar atualiza as assinaturas de URL periodicamente (geralmente a cada 8 a 12 horas). Portanto, novos compromissos podem demorar um pouco para aparecer na sua agenda do Google.
                  </span>
                </div>
              </div>

              {/* Link de Assinatura */}
              <div>
                <LabelF>Link de Assinatura iCal</LabelF>
                {empresa.ical_token ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      readOnly
                      value={`${import.meta.env.VITE_SUPABASE_URL || "https://<projeto>.supabase.co"}/functions/v1/ical-feed?token=${empresa.ical_token}`}
                      style={{
                        flex: 1, padding: "10px 13px", background: C.darker,
                        border: `1px solid ${C.border}`, borderRadius: 8,
                        fontFamily: "monospace", fontSize: 12, color: C.text,
                      }}
                    />
                    <button
                      onClick={() => { 
                        navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ical-feed?token=${empresa.ical_token}`); 
                        mostrarToast("✅ Link do iCal copiado!"); 
                      }}
                      style={{
                        padding: "10px 14px", background: C.darker, border: `1px solid ${C.border}`,
                        borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: C.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Copiar Link
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: C.muted, padding: "10px 0" }}>
                    Nenhum link gerado. Clique em "Gerar Token" para ativar a integração.
                  </div>
                )}
              </div>

              {/* Ações de Administração do Token */}
              <div>
                {user?.perfil === "diretor" ? (
                  <div>
                    <Btn onClick={gerarNovoIcalToken} disabled={gerandoIcal}>
                      {gerandoIcal ? "Gerando..." : empresa.ical_token ? "🔄 Revogar e Gerar Novo Token" : "📅 Gerar Token iCal"}
                    </Btn>
                    {empresa.ical_token && (
                      <div style={{ fontSize: 11, color: C.warning, marginTop: 6 }}>
                        Atenção: ao gerar um novo token, o link de assinatura anterior deixará de funcionar imediatamente em todos os dispositivos sincronizados.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: C.muted }}>
                    Somente usuários com perfil de <strong>Diretor</strong> podem revogar ou gerar novos tokens de sincronização da empresa.
                  </div>
                )}
              </div>

              {/* Instruções de Configuração detalhadas */}
              <div style={{ background: C.darker, borderRadius: 10, padding: "16px 20px", fontSize: 12, color: C.muted }}>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>📋 Como adicionar no Google Agenda (Computador):</div>
                <ol style={{ paddingLeft: 18, lineHeight: 1.8 }}>
                  <li>Acesse o <a href="https://calendar.google.com" target="_blank" rel="noreferrer" style={{ color: C.red, textDecoration: "underline" }}>Google Agenda</a> no computador.</li>
                  <li>No menu lateral esquerdo, clique no botão <strong>+</strong> ao lado de "Outras agendas".</li>
                  <li>Selecione a opção <strong>"Do URL"</strong>.</li>
                  <li>Cole o link copiado acima e clique em <strong>"Adicionar agenda"</strong>.</li>
                  <li>Pronto! O calendário "StickFrame - {empresa.nome}" aparecerá na seção "Outras agendas".</li>
                </ol>
              </div>

            </div>
          </Card>
        </>
      )}

      {tab === "orcamento_sf" && (
        <ConfigSFTab />
      )}
    </>
  );
}

// ─── Aba Robô IA ─────────────────────────────────────────────────────────────

function AbaRoboIA({ empresaId, mostrarToast }) {
  const [cfg,    setCfg]    = useState({ openai_key: "", waba_token: "", phone_number_id: "", sistema_prompt: "", modelo_openai: "gpt-4o-mini", ativo: false, verify_token: "" });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookUrl  = supabaseUrl ? `${supabaseUrl}/functions/v1/whatsapp-bot` : "—";

  useEffect(() => {
    if (!empresaId) return;
    sb.from("ia_config").select("*").eq("empresa_id", empresaId).single()
      .then(({ data }) => {
        if (data) setCfg({ openai_key: data.openai_key || "", waba_token: data.waba_token || "", phone_number_id: data.phone_number_id || "", sistema_prompt: data.sistema_prompt || "", modelo_openai: data.modelo_openai || "gpt-4o-mini", ativo: data.ativo || false, verify_token: data.verify_token || "" });
        setLoaded(true);
      });
  }, [empresaId]);

  const set = (k) => (v) => setCfg((f) => ({ ...f, [k]: v }));

  async function salvar() {
    setSaving(true);
    try {
      await sb.from("ia_config").upsert({ ...cfg, empresa_id: empresaId }, { onConflict: "empresa_id" });
      mostrarToast("✅ Configuração salva!");
      // Reload to get verify_token if newly created
      const { data } = await sb.from("ia_config").select("verify_token").eq("empresa_id", empresaId).single();
      if (data?.verify_token) setCfg((f) => ({ ...f, verify_token: data.verify_token }));
    } catch (e) { mostrarToast(`❌ ${e.message}`, true); }
    finally { setSaving(false); }
  }

  const inp = { width: "100%", padding: "10px 13px", border: `1px solid #e5e7eb`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" };
  const Label = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" }}>{children}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Status ativo */}
      <div style={{ background: cfg.ativo ? "#f0fdf4" : "#fff5f5", border: `1px solid ${cfg.ativo ? "#86efac" : "#fca5a5"}`, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: cfg.ativo ? "#166534" : "#991b1b" }}>{cfg.ativo ? "🟢 Robô ativo" : "🔴 Robô desativado"}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Responde automaticamente às mensagens no WhatsApp da construtora</div>
        </div>
        <button onClick={() => setCfg((f) => ({ ...f, ativo: !f.ativo }))} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: cfg.ativo ? "#fee2e2" : "#dcfce7", color: cfg.ativo ? "#991b1b" : "#166534", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          {cfg.ativo ? "Desativar" : "Ativar"}
        </button>
      </div>

      {/* Webhook URL */}
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "14px 18px" }}>
        <Label>URL do Webhook (configurar no Meta)</Label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input readOnly value={webhookUrl} style={{ ...inp, fontFamily: "monospace", fontSize: 11, background: "#e0f2fe", flex: 1 }} />
          <button onClick={() => { navigator.clipboard.writeText(webhookUrl); mostrarToast("✅ URL copiada!"); }} style={{ padding: "10px 14px", background: "#0ea5e9", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Copiar</button>
        </div>
        {cfg.verify_token && (
          <div style={{ marginTop: 10 }}>
            <Label>Verify Token</Label>
            <input readOnly value={cfg.verify_token} style={{ ...inp, fontFamily: "monospace", fontSize: 11, background: "#e0f2fe" }} />
          </div>
        )}
      </div>

      {/* Credenciais */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>🔑 Credenciais</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Label>OpenAI API Key</Label>
            <input type="password" value={cfg.openai_key} onChange={(e) => set("openai_key")(e.target.value)} placeholder="sk-..." style={inp} />
          </div>
          <div>
            <Label>WhatsApp Access Token (WABA)</Label>
            <input type="password" value={cfg.waba_token} onChange={(e) => set("waba_token")(e.target.value)} placeholder="EAAxxxxx..." style={inp} />
          </div>
          <div>
            <Label>Phone Number ID</Label>
            <input value={cfg.phone_number_id} onChange={(e) => set("phone_number_id")(e.target.value)} placeholder="Ex: 123456789012345" style={inp} />
          </div>
          <div>
            <Label>Modelo OpenAI</Label>
            <select value={cfg.modelo_openai} onChange={(e) => set("modelo_openai")(e.target.value)} style={inp}>
              {["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Prompt do sistema */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>💬 Personalidade do Robô</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Descreva como o robô deve se comportar. O sistema injeta automaticamente os dados da obra e vencimentos.</div>
        <textarea value={cfg.sistema_prompt} onChange={(e) => set("sistema_prompt")(e.target.value)}
          placeholder={`Ex: Você é a Lara, assistente virtual da Construtora Silva. Seja simpática, objetiva e sempre finalize com "Posso ajudar em algo mais?"`}
          rows={5} style={{ ...inp, resize: "vertical" }} />
      </div>

      <div style={{ background: "#f9fafb", borderRadius: 12, padding: "14px 18px", fontSize: 12, color: "#6b7280" }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>📋 Como configurar no Meta Business:</div>
        <ol style={{ paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Acesse <strong>developers.facebook.com</strong> → seu app → WhatsApp → Configuração</li>
          <li>Cole a URL do Webhook acima no campo "URL de callback"</li>
          <li>Cole o Verify Token no campo "Token de verificação"</li>
          <li>Inscreva-se no evento <strong>messages</strong></li>
          <li>Salve as credenciais aqui e ative o robô</li>
        </ol>
      </div>

      <button onClick={salvar} disabled={saving} style={{ padding: "13px", background: saving ? "#ccc" : "#981915", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
        {saving ? "Salvando..." : "💾 Salvar configuração"}
      </button>
    </div>
  );
}
