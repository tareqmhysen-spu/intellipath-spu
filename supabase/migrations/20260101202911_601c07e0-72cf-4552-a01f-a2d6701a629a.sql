-- Add unique constraint for deduplication at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_academic_records_unique_entry 
ON public.student_academic_records (student_id, academic_year, semester, course_code);