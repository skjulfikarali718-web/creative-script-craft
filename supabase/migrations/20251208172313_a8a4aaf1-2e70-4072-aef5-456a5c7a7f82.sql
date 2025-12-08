-- Drop the insecure policy that allows enumeration of public scripts
DROP POLICY IF EXISTS "Public scripts viewable by share token" ON public.scripts;

-- Create a security definer function to fetch a script by share token
-- This bypasses RLS and only returns the script if the token matches exactly
CREATE OR REPLACE FUNCTION public.get_script_by_share_token(_share_token text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  created_at timestamptz,
  is_public boolean,
  view_count integer,
  like_count integer,
  comment_count integer,
  language text,
  script_type text,
  content text,
  share_token text,
  topic text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.created_at,
    s.is_public,
    s.view_count,
    s.like_count,
    s.comment_count,
    s.language,
    s.script_type,
    s.content,
    s.share_token,
    s.topic
  FROM public.scripts s
  WHERE s.share_token = _share_token
    AND s.is_public = true
    AND s.share_token IS NOT NULL
  LIMIT 1;
$$;