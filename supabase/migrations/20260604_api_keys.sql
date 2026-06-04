ALTER TABLE empresas ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS api_key_created_at TIMESTAMPTZ;

-- Function to generate a new API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
  SELECT 'sf_live_' || encode(gen_random_bytes(24), 'hex');
$$ LANGUAGE sql;
