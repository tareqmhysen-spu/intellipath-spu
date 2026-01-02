-- إنشاء جدول السجلات الأكاديمية الكاملة للطلاب
CREATE TABLE public.student_academic_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id text NOT NULL,
  college text,
  major text,
  academic_year text NOT NULL,
  semester text NOT NULL,
  last_registration_semester text,
  study_mode text DEFAULT 'نظام ساعات',
  permanent_status text,
  semester_status text,
  registered_hours_semester integer DEFAULT 0,
  completed_hours_semester integer DEFAULT 0,
  academic_warning text,
  previous_academic_warning text,
  cumulative_gpa_percent numeric(5,2),
  cumulative_gpa_points numeric(3,2),
  total_completed_hours integer DEFAULT 0,
  baccalaureate_type text,
  baccalaureate_country text,
  certificate_score numeric(6,2),
  certificate_average numeric(5,2),
  has_ministry_scholarship boolean DEFAULT false,
  course_name text NOT NULL,
  course_code text NOT NULL,
  course_credits numeric(3,1) DEFAULT 3,
  final_grade numeric(5,2),
  letter_grade text,
  grade_points numeric(4,2),
  raw_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- إضافة أعمدة جديدة لجدول الطلاب
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS study_mode text DEFAULT 'نظام ساعات',
ADD COLUMN IF NOT EXISTS permanent_status text,
ADD COLUMN IF NOT EXISTS academic_warning text,
ADD COLUMN IF NOT EXISTS baccalaureate_type text,
ADD COLUMN IF NOT EXISTS baccalaureate_country text,
ADD COLUMN IF NOT EXISTS certificate_score numeric(6,2),
ADD COLUMN IF NOT EXISTS certificate_average numeric(5,2),
ADD COLUMN IF NOT EXISTS has_ministry_scholarship boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS major text;

-- إضافة أعمدة جديدة لجدول التسجيلات
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS registered_hours integer,
ADD COLUMN IF NOT EXISTS completed_hours integer,
ADD COLUMN IF NOT EXISTS grade_points numeric(4,2);

-- تمكين RLS للجدول الجديد
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول
CREATE POLICY "Admins can manage student_academic_records"
ON public.student_academic_records FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Advisors can view student_academic_records"
ON public.student_academic_records FOR SELECT
USING (has_role(auth.uid(), 'advisor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own records"
ON public.student_academic_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.student_id = student_academic_records.student_id 
    AND s.user_id = auth.uid()
  )
);

-- فهرس للبحث السريع
CREATE INDEX idx_student_academic_records_student_id ON public.student_academic_records(student_id);
CREATE INDEX idx_student_academic_records_semester ON public.student_academic_records(academic_year, semester);
CREATE INDEX idx_student_academic_records_course ON public.student_academic_records(course_code);