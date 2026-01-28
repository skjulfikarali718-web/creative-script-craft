-- Create video_series table
CREATE TABLE public.video_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  color_theme TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add series_id and episode_number to scripts table
ALTER TABLE public.scripts 
ADD COLUMN series_id UUID REFERENCES public.video_series(id) ON DELETE SET NULL,
ADD COLUMN episode_number INTEGER;

-- Enable RLS on video_series
ALTER TABLE public.video_series ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_series
CREATE POLICY "Users can view their own series"
ON public.video_series FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own series"
ON public.video_series FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own series"
ON public.video_series FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own series"
ON public.video_series FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_video_series_user_id ON public.video_series(user_id);
CREATE INDEX idx_scripts_series_id ON public.scripts(series_id);

-- Add trigger for updated_at
CREATE TRIGGER update_video_series_updated_at
BEFORE UPDATE ON public.video_series
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();