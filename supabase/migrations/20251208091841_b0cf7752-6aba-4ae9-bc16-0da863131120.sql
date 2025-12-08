-- Remove the email column from profiles table as it exposes sensitive data
-- Email should be accessed from auth.users metadata via supabase.auth.getUser()
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update the handle_new_user trigger to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);
  RETURN new;
END;
$function$;