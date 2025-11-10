-- Add sharing and collaboration features to scripts table
ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create script analytics table
CREATE TABLE IF NOT EXISTS public.script_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.script_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for script_analytics
CREATE POLICY "Users can view their own analytics"
  ON public.script_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.script_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
  ON public.script_analytics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics"
  ON public.script_analytics FOR DELETE
  USING (auth.uid() = user_id);

-- Create script collaborators table
CREATE TABLE IF NOT EXISTS public.script_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(script_id, user_id)
);

-- Enable RLS
ALTER TABLE public.script_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS policies for script_collaborators
CREATE POLICY "Users can view collaborations they're part of"
  ON public.script_collaborators FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Owners can manage collaborators"
  ON public.script_collaborators FOR ALL
  USING (auth.uid() = owner_id);

-- Add trigger for updated_at
CREATE TRIGGER update_script_analytics_updated_at
  BEFORE UPDATE ON public.script_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create script comments table
CREATE TABLE IF NOT EXISTS public.script_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.script_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for script_comments
CREATE POLICY "Users can view comments on scripts they have access to"
  ON public.script_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_id 
      AND (s.user_id = auth.uid() OR s.is_public = true
           OR EXISTS (
             SELECT 1 FROM public.script_collaborators sc
             WHERE sc.script_id = s.id AND sc.user_id = auth.uid()
           ))
    )
  );

CREATE POLICY "Users can insert comments on scripts they have access to"
  ON public.script_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_id 
      AND (s.user_id = auth.uid() OR s.is_public = true
           OR EXISTS (
             SELECT 1 FROM public.script_collaborators sc
             WHERE sc.script_id = s.id AND sc.user_id = auth.uid()
           ))
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.script_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.script_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on comments
CREATE TRIGGER update_script_comments_updated_at
  BEFORE UPDATE ON public.script_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();