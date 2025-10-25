-- Create saved_scripts table for storing user-generated scripts
CREATE TABLE IF NOT EXISTS public.saved_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  script_type TEXT NOT NULL,
  language TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scripts"
  ON public.saved_scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scripts"
  ON public.saved_scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
  ON public.saved_scripts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
  ON public.saved_scripts FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_scripts_user_id ON public.saved_scripts(user_id);

-- Updated timestamp trigger
CREATE TRIGGER update_saved_scripts_updated_at
  BEFORE UPDATE ON public.saved_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();