const BASE = import.meta.env.VITE_SUPABASE_URL;

export const LOGO_STICKFRAME = `${BASE}/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174`;

export function storageUrl(path) {
  return `${BASE}/storage/v1/object/public/arquivos/${path}`;
}

export function bimUrl(path) {
  return `${BASE}/storage/v1/object/public/bim/${path}`;
}
