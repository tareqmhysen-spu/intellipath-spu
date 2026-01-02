-- Create pg_cron extension if not exists and schedule daily memory cleanup
-- Note: pg_cron requires superuser and may not be available in all Supabase projects

-- Create a simple approach using a database function that can be called via edge function
CREATE OR REPLACE FUNCTION public.get_cleanup_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer;
  cleaned_count integer;
BEGIN
  -- Count expired memories
  SELECT COUNT(*) INTO expired_count
  FROM public.user_memories
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  -- Run cleanup
  DELETE FROM public.user_memories
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'expired_found', expired_count,
    'cleaned', cleaned_count,
    'cleaned_at', now()
  );
END;
$$;