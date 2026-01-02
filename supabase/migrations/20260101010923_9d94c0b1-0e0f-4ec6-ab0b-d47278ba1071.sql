-- Fix remaining RLS issues from Phase 1

-- 1. Fix deadlines table - Restrict advisor SELECT to assigned students only
DROP POLICY IF EXISTS "Advisors can view all deadlines" ON public.deadlines;

CREATE POLICY "Advisors can view assigned student deadlines"
ON public.deadlines
FOR SELECT
USING (
  (has_role(auth.uid(), 'advisor') OR has_role(auth.uid(), 'admin')) AND
  EXISTS (
    SELECT 1 FROM public.advisor_student_assignments asa
    WHERE asa.student_id = deadlines.student_id
    AND asa.advisor_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all deadlines"
ON public.deadlines
FOR SELECT
USING (has_role(auth.uid(), 'admin'));