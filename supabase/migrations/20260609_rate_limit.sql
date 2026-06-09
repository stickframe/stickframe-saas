-- Rate limiting para endpoints públicos (ex: whatsapp-lead)
-- Acessada apenas via service_role nas edge functions (RLS sem policy bloqueia anon/authenticated).
CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket_ip_time
  ON public.rate_limit_hits (bucket, ip, created_at);

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

-- Checa e registra uma tentativa. Retorna true se permitido.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket text, p_ip text, p_max int, p_window_secs int
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.rate_limit_hits
   WHERE bucket = p_bucket AND ip = p_ip
     AND created_at > now() - make_interval(secs => p_window_secs);
  IF cnt >= p_max THEN
    RETURN false;
  END IF;
  INSERT INTO public.rate_limit_hits (bucket, ip) VALUES (p_bucket, p_ip);
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text,text,int,int) FROM anon, authenticated;
