import { sb, getEmpresaId } from "../supabase";

export async function buscarEmpresa() {
  const { data, error } = await sb
    .from("empresas")
    .select("*")
    .eq("id", getEmpresaId())
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarEmpresa(updates) {
  const { error } = await sb
    .from("empresas")
    .update(updates)
    .eq("id", getEmpresaId());
  if (error) throw error;
}

export async function uploadLogoEmpresa(file) {
  const ext  = file.name.split(".").pop();
  const path = `logos/${getEmpresaId()}/logo.${ext}`;
  const { error } = await sb.storage.from("arquivos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from("arquivos").getPublicUrl(path);
  return data.publicUrl + `?t=${Date.now()}`;
}

export async function listarUsuariosEmpresa() {
  const { data, error } = await sb
    .from("usuarios")
    .select("*")
    .eq("empresa_id", getEmpresaId())
    .order("nome");
  if (error) throw error;
  return data;
}

export async function atualizarPerfil(uid, updates) {
  const { error } = await sb
    .from("usuarios")
    .update(updates)
    .eq("id", uid);
  if (error) throw error;
}

export async function trocarSenha(novaSenha) {
  const { error } = await sb.auth.updateUser({ password: novaSenha });
  if (error) throw error;
}

export async function atualizarPerfilUsuario(uid, updates) {
  const { error } = await sb.from("usuarios").update(updates).eq("id", uid).eq("empresa_id", getEmpresaId());
  if (error) throw error;
}

export async function convidarUsuario(email, nome, perfil) {
  const { data, error } = await sb.functions.invoke("invite-user", {
    body: { email, nome, perfil, empresa_id: getEmpresaId() },
  });
  if (error) throw error;
  return data;
}
