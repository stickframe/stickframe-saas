-- Conversion Layer™ — métricas públicas de prova social (landing).
-- Função só-leitura, agregados sem PII. SECURITY DEFINER para ler além da RLS
-- (apenas COUNT/SUM), exposta a anon + authenticated para a landing pública.

CREATE OR REPLACE FUNCTION public.stats_publicos()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'm2',         COALESCE((SELECT round(sum(area))::int FROM public.pre_orcamentos), 0),
    'simulacoes', (SELECT count(*)::int FROM public.pre_orcamentos),
    'orcamentos', (SELECT count(*)::int FROM public.stickquote_versoes)
  );
$function$;

GRANT EXECUTE ON FUNCTION public.stats_publicos() TO anon, authenticated;
