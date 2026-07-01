-- StickFEM™ — validação humana + versionamento (evolução do Slice 1). Aditivo.
ALTER TABLE public.elemento_estrutural
  ADD COLUMN IF NOT EXISTS incluir_calculo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS validado        boolean NOT NULL DEFAULT false;

ALTER TABLE public.arquivo_cad
  ADD COLUMN IF NOT EXISTS versao     integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by uuid;
