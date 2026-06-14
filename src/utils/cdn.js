const BASE = import.meta.env.VITE_SUPABASE_URL;

import logoBranco from "../assets/logo_branco.png";
export const LOGO_STICKFRAME = logoBranco;

export function storageUrl(path) {
  return `${BASE}/storage/v1/object/public/arquivos/${path}`;
}

export function bimUrl(path) {
  return `${BASE}/storage/v1/object/public/bim/${path}`;
}
