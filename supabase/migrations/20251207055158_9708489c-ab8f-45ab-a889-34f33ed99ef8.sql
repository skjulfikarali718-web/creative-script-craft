-- Create guest usage tracking table for server-side limit enforcement
CREATE TABLE IF NOT EXISTS public.guest_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL UNIQUE,
  request_count integer DEFAULT 1,
  first_request_at timestamptz DEFAULT now(),
  last_request_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_guest_usage_identifier ON public.guest_usage(identifier);

-- Enable RLS (no public policies - server-only access via SECURITY DEFINER function)
ALTER TABLE public.guest_usage ENABLE ROW LEVEL SECURITY;

-- Function to check and increment guest usage (returns remaining and allowed)
CREATE OR REPLACE FUNCTION public.check_guest_limit(
  _identifier text,
  _max_requests integer DEFAULT 9
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_count integer;
  _allowed boolean;
BEGIN
  -- Get or create guest record
  INSERT INTO public.guest_usage (identifier, request_count, last_request_at)
  VALUES (_identifier, 1, now())
  ON CONFLICT (identifier) DO UPDATE
    SET request_count = guest_usage.request_count + 1,
        last_request_at = now()
  RETURNING request_count INTO _current_count;

  _allowed := _current_count <= _max_requests;

  RETURN jsonb_build_object(
    'allowed', _allowed,
    'count', _current_count,
    'remaining', GREATEST(0, _max_requests - _current_count)
  );
END;
$$;

-- Add RLS policy for public scripts (share token access)
CREATE POLICY "Public scripts viewable by share token"
ON public.scripts
FOR SELECT
USING (is_public = true AND share_token IS NOT NULL);

-- Add RLS policy for collaborators to view shared scripts
CREATE POLICY "Collaborators can view shared scripts"
ON public.scripts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.script_collaborators sc
    WHERE sc.script_id = scripts.id
      AND sc.user_id = auth.uid()
  )
);

-- Add RLS policy for collaborators with edit permission
CREATE POLICY "Collaborators can update scripts with edit permission"
ON public.scripts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.script_collaborators sc
    WHERE sc.script_id = scripts.id
      AND sc.user_id = auth.uid()
      AND sc.permission = 'edit'
  )
);

-- Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);