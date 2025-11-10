-- Fix function search path security warning
DROP FUNCTION IF EXISTS generate_share_token();

CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$;