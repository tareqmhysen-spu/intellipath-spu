-- First, clean up duplicate rate_limits entries
DELETE FROM public.rate_limits a
USING public.rate_limits b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.endpoint = b.endpoint;

-- Now add the unique constraint
ALTER TABLE public.rate_limits 
ADD CONSTRAINT rate_limits_user_endpoint_unique 
UNIQUE (user_id, endpoint);

-- Create a security definer function for rate limit management
CREATE OR REPLACE FUNCTION public.upsert_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_request_count integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, p_request_count, now())
  ON CONFLICT (user_id, endpoint) 
  DO UPDATE SET 
    request_count = rate_limits.request_count + p_request_count,
    window_start = CASE 
      WHEN rate_limits.window_start < now() - interval '1 hour' 
      THEN now() 
      ELSE rate_limits.window_start 
    END;
END;
$$;

-- Add INSERT policy for advisors on deadlines
CREATE POLICY "Advisors can create deadlines for assigned students"
ON public.deadlines
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'advisor') OR has_role(auth.uid(), 'admin')) AND
  EXISTS (
    SELECT 1 FROM public.advisor_student_assignments asa
    WHERE asa.student_id = deadlines.student_id
    AND asa.advisor_id = auth.uid()
  )
);

-- Add cleanup function for expired memories
CREATE OR REPLACE FUNCTION public.cleanup_expired_memories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_memories
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$;