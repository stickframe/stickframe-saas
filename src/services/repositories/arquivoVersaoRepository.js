import { sb } from "../supabase";

// List all versions of an arquivo (by finding all files with same arquivo_pai, plus the root)
export async function listarVersoes(arquivoId) {
  // First get the root: if arquivo_pai is null, this IS the root; otherwise fetch the root
  const { data: arquivo } = await sb.from("arquivos").select("*").eq("id", arquivoId).single();
  const rootId = arquivo.arquivo_pai || arquivo.id;

  // Get all versions (root + children)
  const { data, error } = await sb
    .from("arquivos")
    .select("*, publicado_por_usuario:usuarios!publicado_por(nome)")
    .or(`id.eq.${rootId},arquivo_pai.eq.${rootId}`)
    .order("versao_num");
  if (error) throw error;
  return data || [];
}

export async function uploadNovaRevisao(arquivoPaiId, novoArquivo, notasRevisao = "") {
  const { data: pai, error: e1 } = await sb.from("arquivos").select("*").eq("id", arquivoPaiId).single();
  if (e1) throw e1;

  const rootId = pai.arquivo_pai || pai.id;
  const { data: raiz } = await sb.from("arquivos").select("versao_num").eq("id", rootId).single();
  const novaVersaoNum = (raiz?.versao_num || pai.versao_num || 1) + 1;

  // Generate next revision letter: Rev A -> Rev B -> Rev C...
  // Find highest revision among all versions
  const { data: versoes } = await sb.from("arquivos")
    .select("versao_num")
    .or(`id.eq.${rootId},arquivo_pai.eq.${rootId}`)
    .order("versao_num", { ascending: false })
    .limit(1);
  const maxVersao = versoes?.[0]?.versao_num || 1;
  const letraIndex = maxVersao; // 0=A, 1=B, etc. (maxVersao is 1-based so index = maxVersao)
  const novaRevisao = `Rev ${String.fromCharCode(65 + letraIndex)}`; // 65 = 'A'

  const { data: me } = await sb.auth.getUser();

  const { data, error } = await sb.from("arquivos").insert({
    ...novoArquivo,
    revisao: novaRevisao,
    versao_num: maxVersao + 1,
    arquivo_pai: rootId,
    notas_revisao: notasRevisao,
    publicado_por: me.user?.id,
  }).select("*").single();
  if (error) throw error;
  return data;
}
