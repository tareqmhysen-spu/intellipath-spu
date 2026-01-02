-- =============================================================================
-- IntelliPath - Complete Database Schema
-- المرشد الأكاديمي الذكي - هيكل قاعدة البيانات الكامل
-- =============================================================================
-- Version: 1.0.0 | الإصدار: 1.0.0
-- Last Updated: 2026-01-02 | آخر تحديث: 2026-01-02
-- =============================================================================

-- *****************************************************************************
-- PHASE 1: ENABLE EXTENSIONS | المرحلة الأولى: تفعيل الإضافات
-- *****************************************************************************

-- Enable UUID generation | تفعيل توليد المعرفات الفريدة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search in Arabic | تفعيل البحث النصي بالعربية
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable vector similarity for RAG | تفعيل التشابه المتجهي لـ RAG
-- CREATE EXTENSION IF NOT EXISTS "vector"; -- Uncomment if using pgvector

-- *****************************************************************************
-- PHASE 2: CUSTOM TYPES & ENUMS | المرحلة الثانية: الأنواع المخصصة
-- *****************************************************************************

-- User roles enum | تعداد أدوار المستخدمين
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('student', 'advisor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- *****************************************************************************
-- PHASE 3: CORE TABLES | المرحلة الثالثة: الجداول الأساسية
-- *****************************************************************************

-- -----------------------------------------------------------------------------
-- Table: profiles | جدول الملفات الشخصية
-- Stores user profile information | يخزن معلومات الملف الشخصي للمستخدمين
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE, -- Links to auth.users | رابط لجدول المستخدمين
    full_name TEXT NOT NULL, -- Full name in English | الاسم الكامل بالإنجليزية
    full_name_ar TEXT, -- Full name in Arabic | الاسم الكامل بالعربية
    email TEXT NOT NULL, -- Email address | البريد الإلكتروني
    phone TEXT, -- Phone number | رقم الهاتف
    avatar_url TEXT, -- Profile picture URL | رابط صورة الملف الشخصي
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookup | فهرس للبحث عن المستخدم
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- -----------------------------------------------------------------------------
-- Table: user_roles | جدول أدوار المستخدمين
-- Maps users to their roles | يربط المستخدمين بأدوارهم
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- User reference | مرجع المستخدم
    role app_role NOT NULL DEFAULT 'student', -- User role | دور المستخدم
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Index for role queries | فهرس لاستعلامات الأدوار
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- -----------------------------------------------------------------------------
-- Table: students | جدول الطلاب
-- Stores student academic information | يخزن المعلومات الأكاديمية للطلاب
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE, -- Links to auth.users | رابط للمستخدم
    student_id TEXT NOT NULL UNIQUE, -- University ID (7 digits) | الرقم الجامعي
    department TEXT NOT NULL, -- Department name | اسم القسم
    major TEXT, -- Student major | التخصص
    year_level INTEGER NOT NULL DEFAULT 1 CHECK (year_level >= 1 AND year_level <= 6),
    gpa NUMERIC(3,2) DEFAULT 0.00 CHECK (gpa >= 0 AND gpa <= 4), -- Cumulative GPA | المعدل التراكمي
    total_credits INTEGER DEFAULT 0, -- Completed credits | الساعات المنجزة
    study_mode TEXT DEFAULT 'نظام ساعات', -- Study system | نظام الدراسة
    academic_warning TEXT, -- Warning status | حالة الإنذار
    permanent_status TEXT, -- Academic status | الحالة الأكاديمية
    baccalaureate_type TEXT, -- High school type | نوع الثانوية
    baccalaureate_country TEXT, -- High school country | بلد الثانوية
    certificate_score NUMERIC, -- High school score | درجة الثانوية
    certificate_average NUMERIC, -- High school average | معدل الثانوية
    has_ministry_scholarship BOOLEAN DEFAULT FALSE, -- Ministry scholarship | منحة وزارية
    xp_points INTEGER DEFAULT 0, -- Gamification points | نقاط التحفيز
    level INTEGER DEFAULT 1, -- Gamification level | مستوى التحفيز
    streak_days INTEGER DEFAULT 0, -- Activity streak | أيام النشاط المتتالية
    last_activity_at TIMESTAMPTZ DEFAULT NOW(), -- Last activity | آخر نشاط
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries | فهارس للاستعلامات الشائعة
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students(department);
CREATE INDEX IF NOT EXISTS idx_students_gpa ON public.students(gpa);

-- -----------------------------------------------------------------------------
-- Table: majors | جدول التخصصات
-- Stores available majors/specializations | يخزن التخصصات المتاحة
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.majors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- Name in Arabic | الاسم بالعربية
    name_en TEXT, -- Name in English | الاسم بالإنجليزية
    description TEXT, -- Description | الوصف
    total_credits INTEGER DEFAULT 171, -- Required credits | الساعات المطلوبة
    duration_years INTEGER DEFAULT 5, -- Duration in years | المدة بالسنوات
    neo4j_id INTEGER, -- Neo4j node ID | معرف عقدة Neo4j
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Table: courses | جدول المقررات
-- Stores course catalog | يخزن كتالوج المقررات
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- Course code (e.g., CS301) | رمز المقرر
    name TEXT NOT NULL, -- Course name in English | اسم المقرر بالإنجليزية
    name_ar TEXT, -- Course name in Arabic | اسم المقرر بالعربية
    description TEXT, -- Description in English | الوصف بالإنجليزية
    description_ar TEXT, -- Description in Arabic | الوصف بالعربية
    credits INTEGER NOT NULL DEFAULT 3 CHECK (credits >= 1 AND credits <= 10),
    department TEXT NOT NULL, -- Department | القسم
    year_level INTEGER NOT NULL DEFAULT 1 CHECK (year_level >= 1 AND year_level <= 6),
    semester TEXT, -- Semester offered | الفصل المتاح
    hours_theory INTEGER DEFAULT 2, -- Theory hours | ساعات نظري
    hours_lab INTEGER DEFAULT 2, -- Lab hours | ساعات عملي
    difficulty_rating NUMERIC DEFAULT 3.0, -- Difficulty rating | تقييم الصعوبة
    is_bottleneck BOOLEAN DEFAULT FALSE, -- Critical path indicator | مؤشر عنق الزجاجة
    critical_path_depth INTEGER DEFAULT 0, -- Depth in prerequisite chain | عمق سلسلة المتطلبات
    objectives_en TEXT, -- Learning objectives English | أهداف التعلم بالإنجليزية
    objectives_ar TEXT, -- Learning objectives Arabic | أهداف التعلم بالعربية
    neo4j_id INTEGER, -- Neo4j node ID | معرف عقدة Neo4j
    is_active BOOLEAN DEFAULT TRUE, -- Active status | حالة التفعيل
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for course queries | فهارس لاستعلامات المقررات
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses(department);
CREATE INDEX IF NOT EXISTS idx_courses_year_level ON public.courses(year_level);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON public.courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_search ON public.courses USING gin(
    (to_tsvector('arabic', coalesce(name_ar, '')) || 
     to_tsvector('english', coalesce(name, '')))
);

-- -----------------------------------------------------------------------------
-- Table: course_prerequisites | جدول المتطلبات السابقة
-- Stores prerequisite relationships | يخزن علاقات المتطلبات السابقة
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_prerequisites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    prerequisite_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, prerequisite_id),
    CHECK (course_id != prerequisite_id) -- Prevent self-reference | منع المرجع الذاتي
);

-- Indexes for prerequisite queries | فهارس لاستعلامات المتطلبات
CREATE INDEX IF NOT EXISTS idx_prerequisites_course_id ON public.course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_prerequisites_prereq_id ON public.course_prerequisites(prerequisite_id);

-- -----------------------------------------------------------------------------
-- Table: student_academic_records | جدول السجلات الأكاديمية للطلاب
-- Stores historical academic records | يخزن السجلات الأكاديمية التاريخية
-- CRITICAL: This is the main table for student data isolation
-- حرج: هذا الجدول الرئيسي لعزل بيانات الطلاب
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_academic_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL, -- Links to students.student_id | رابط للرقم الجامعي
    academic_year TEXT NOT NULL, -- e.g., "2024/2025" | العام الدراسي
    semester TEXT NOT NULL, -- e.g., "الفصل الأول" | الفصل الدراسي
    course_code TEXT NOT NULL, -- Course code | رمز المقرر
    course_name TEXT NOT NULL, -- Course name | اسم المقرر
    course_credits NUMERIC DEFAULT 3, -- Credits | الساعات المعتمدة
    final_grade NUMERIC, -- Numeric grade (0-100) | الدرجة الرقمية
    letter_grade TEXT, -- Letter grade (A, B+, etc.) | الدرجة الحرفية
    grade_points NUMERIC, -- Grade points | نقاط الدرجة
    cumulative_gpa_points NUMERIC, -- Cumulative GPA as points | المعدل التراكمي كنقاط
    cumulative_gpa_percent NUMERIC, -- Cumulative GPA as percent | المعدل التراكمي كنسبة
    registered_hours_semester INTEGER DEFAULT 0, -- Registered hours this semester | الساعات المسجلة
    completed_hours_semester INTEGER DEFAULT 0, -- Completed hours this semester | الساعات المنجزة
    total_completed_hours INTEGER DEFAULT 0, -- Total completed hours | إجمالي الساعات المنجزة
    college TEXT, -- College name | اسم الكلية
    major TEXT, -- Student major | التخصص
    study_mode TEXT DEFAULT 'نظام ساعات', -- Study system | نظام الدراسة
    permanent_status TEXT, -- Academic status | الحالة الأكاديمية
    semester_status TEXT, -- Semester status | حالة الفصل
    academic_warning TEXT, -- Current warning | الإنذار الحالي
    previous_academic_warning TEXT, -- Previous warning | الإنذار السابق
    baccalaureate_type TEXT, -- High school type | نوع الثانوية
    baccalaureate_country TEXT, -- High school country | بلد الثانوية
    certificate_score NUMERIC, -- High school score | درجة الثانوية
    certificate_average NUMERIC, -- High school average | معدل الثانوية
    has_ministry_scholarship BOOLEAN DEFAULT FALSE, -- Ministry scholarship | منحة وزارية
    last_registration_semester TEXT, -- Last registration semester | آخر فصل تسجيل
    raw_data JSONB, -- Original import data | البيانات الأصلية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for academic record queries | فهارس لاستعلامات السجلات الأكاديمية
CREATE INDEX IF NOT EXISTS idx_academic_records_student_id ON public.student_academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_academic_year ON public.student_academic_records(academic_year);
CREATE INDEX IF NOT EXISTS idx_academic_records_semester ON public.student_academic_records(semester);
CREATE INDEX IF NOT EXISTS idx_academic_records_course_code ON public.student_academic_records(course_code);
CREATE INDEX IF NOT EXISTS idx_academic_records_lookup ON public.student_academic_records(student_id, academic_year, semester);

-- -----------------------------------------------------------------------------
-- Table: enrollments | جدول التسجيلات
-- Stores course enrollments | يخزن تسجيلات المقررات
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL, -- Academic year | العام الدراسي
    semester TEXT NOT NULL, -- Semester | الفصل الدراسي
    status TEXT NOT NULL DEFAULT 'enrolled', -- Status | الحالة
    grade NUMERIC, -- Final grade | الدرجة النهائية
    letter_grade TEXT, -- Letter grade | الدرجة الحرفية
    grade_points NUMERIC, -- Grade points | نقاط الدرجة
    registered_hours INTEGER, -- Registered hours | الساعات المسجلة
    completed_hours INTEGER, -- Completed hours | الساعات المنجزة
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_id, academic_year, semester)
);

-- Indexes for enrollment queries | فهارس لاستعلامات التسجيل
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- -----------------------------------------------------------------------------
-- Table: chat_conversations | جدول المحادثات
-- Stores chat conversations | يخزن المحادثات
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- User ID | معرف المستخدم
    title TEXT DEFAULT 'محادثة جديدة', -- Conversation title | عنوان المحادثة
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user conversations | فهرس لمحادثات المستخدم
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);

-- -----------------------------------------------------------------------------
-- Table: chat_messages | جدول الرسائل
-- Stores chat messages | يخزن رسائل المحادثات
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system' | دور الرسالة
    content TEXT NOT NULL, -- Message content | محتوى الرسالة
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for message queries | فهرس لاستعلامات الرسائل
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);

-- -----------------------------------------------------------------------------
-- Table: chat_analytics | جدول تحليلات المحادثات
-- Stores query analytics for monitoring | يخزن تحليلات الاستعلامات للمراقبة
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- User ID | معرف المستخدم
    conversation_id UUID, -- Conversation ID | معرف المحادثة
    query_text TEXT NOT NULL, -- Query text | نص الاستعلام
    response_mode TEXT NOT NULL DEFAULT 'rag', -- Mode used | النمط المستخدم
    route_type TEXT, -- Query route type | نوع توجيه الاستعلام
    latency_ms INTEGER, -- Response latency | زمن الاستجابة
    sources_count INTEGER DEFAULT 0, -- Sources used | عدد المصادر
    confidence DOUBLE PRECISION, -- Response confidence | ثقة الإجابة
    faq_match BOOLEAN DEFAULT FALSE, -- FAQ match | تطابق FAQ
    cache_hit BOOLEAN DEFAULT FALSE, -- Cache hit | ضربة الكاش
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for analytics queries | فهرس لاستعلامات التحليلات
CREATE INDEX IF NOT EXISTS idx_chat_analytics_user_id ON public.chat_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_created_at ON public.chat_analytics(created_at);

-- -----------------------------------------------------------------------------
-- Table: notifications | جدول الإشعارات
-- Stores user notifications | يخزن إشعارات المستخدمين
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- Target user | المستخدم المستهدف
    title TEXT NOT NULL, -- Title in English | العنوان بالإنجليزية
    title_ar TEXT, -- Title in Arabic | العنوان بالعربية
    message TEXT NOT NULL, -- Message in English | الرسالة بالإنجليزية
    message_ar TEXT, -- Message in Arabic | الرسالة بالعربية
    type TEXT NOT NULL DEFAULT 'info', -- Notification type | نوع الإشعار
    link TEXT, -- Action link | رابط الإجراء
    is_read BOOLEAN NOT NULL DEFAULT FALSE, -- Read status | حالة القراءة
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for notification queries | فهارس لاستعلامات الإشعارات
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- -----------------------------------------------------------------------------
-- Table: advisor_student_assignments | جدول تعيينات المشرفين للطلاب
-- Maps advisors to students | يربط المشرفين بالطلاب
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.advisor_student_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    advisor_id UUID NOT NULL, -- Advisor user ID | معرف المشرف
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(advisor_id, student_id)
);

-- Index for assignment queries | فهرس لاستعلامات التعيينات
CREATE INDEX IF NOT EXISTS idx_advisor_assignments_advisor_id ON public.advisor_student_assignments(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_assignments_student_id ON public.advisor_student_assignments(student_id);

-- *****************************************************************************
-- PHASE 4: UTILITY FUNCTIONS | المرحلة الرابعة: الدوال المساعدة
-- *****************************************************************************

-- -----------------------------------------------------------------------------
-- Function: has_role | دالة فحص الدور
-- Checks if a user has a specific role | يتحقق مما إذا كان المستخدم يملك دوراً معيناً
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- Function: update_updated_at_column | دالة تحديث عمود التاريخ
-- Automatically updates updated_at timestamp | يحدث تلقائياً طابع الوقت
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at | إنشاء المحفزات لعمود التحديث
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_academic_records_updated_at ON public.student_academic_records;
CREATE TRIGGER update_academic_records_updated_at
    BEFORE UPDATE ON public.student_academic_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- *****************************************************************************
-- PHASE 5: ROW LEVEL SECURITY (RLS) | المرحلة الخامسة: أمان مستوى الصف
-- *****************************************************************************

-- Enable RLS on all tables | تفعيل RLS على جميع الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies: profiles | سياسات أمان: الملفات الشخصية
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (
        auth.uid() = user_id OR
        has_role(auth.uid(), 'admin') OR
        (has_role(auth.uid(), 'advisor') AND EXISTS (
            SELECT 1 FROM students s
            JOIN advisor_student_assignments asa ON asa.student_id = s.id
            WHERE s.user_id = profiles.user_id AND asa.advisor_id = auth.uid()
        ))
    );

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- RLS Policies: user_roles | سياسات أمان: أدوار المستخدمين
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: students | سياسات أمان: الطلاب
-- CRITICAL: Students can only see their own data
-- حرج: الطلاب يمكنهم فقط رؤية بياناتهم الخاصة
-- -----------------------------------------------------------------------------
CREATE POLICY "Students can view own record" ON public.students
    FOR SELECT USING (
        auth.uid() = user_id OR
        has_role(auth.uid(), 'advisor') OR
        has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Students can update own record" ON public.students
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create own student record" ON public.students
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- RLS Policies: student_academic_records | سياسات أمان: السجلات الأكاديمية
-- CRITICAL: Most important isolation - students only see their records
-- حرج: أهم عزل - الطلاب يرون سجلاتهم فقط
-- -----------------------------------------------------------------------------
CREATE POLICY "Students can view own records" ON public.student_academic_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.student_id = student_academic_records.student_id
              AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Advisors can view records" ON public.student_academic_records
    FOR SELECT USING (
        has_role(auth.uid(), 'advisor') OR
        has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can manage records" ON public.student_academic_records
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: enrollments | سياسات أمان: التسجيلات
-- -----------------------------------------------------------------------------
CREATE POLICY "Students can view own enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = enrollments.student_id
              AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Advisors can view enrollments" ON public.enrollments
    FOR SELECT USING (
        has_role(auth.uid(), 'advisor') OR
        has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can manage enrollments" ON public.enrollments
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: chat_conversations | سياسات أمان: المحادثات
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- RLS Policies: chat_messages | سياسات أمان: الرسائل
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own messages" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations c
            WHERE c.id = chat_messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations c
            WHERE c.id = chat_messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own messages" ON public.chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_conversations cc
            WHERE cc.id = chat_messages.conversation_id
              AND cc.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- RLS Policies: chat_analytics | سياسات أمان: تحليلات المحادثات
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own analytics" ON public.chat_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert analytics" ON public.chat_analytics
    FOR INSERT WITH CHECK (TRUE);

-- -----------------------------------------------------------------------------
-- RLS Policies: notifications | سياسات أمان: الإشعارات
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        has_role(auth.uid(), 'admin') OR
        has_role(auth.uid(), 'advisor')
    );

CREATE POLICY "Admins can delete notifications" ON public.notifications
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: advisor_student_assignments | سياسات أمان: تعيينات المشرفين
-- -----------------------------------------------------------------------------
CREATE POLICY "Advisors can view own assignments" ON public.advisor_student_assignments
    FOR SELECT USING (advisor_id = auth.uid());

CREATE POLICY "Admins can manage assignments" ON public.advisor_student_assignments
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: courses (public read) | سياسات أمان: المقررات (قراءة عامة)
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can view courses" ON public.courses
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage courses" ON public.courses
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: course_prerequisites (public read)
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can view prerequisites" ON public.course_prerequisites
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage prerequisites" ON public.course_prerequisites
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: majors (public read)
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can view majors" ON public.majors
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage majors" ON public.majors
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- *****************************************************************************
-- PHASE 6: NEW USER HANDLING | المرحلة السادسة: معالجة المستخدمين الجدد
-- *****************************************************************************

-- -----------------------------------------------------------------------------
-- Function: handle_new_user | دالة معالجة المستخدم الجديد
-- Creates profile, role, and student record for new users
-- ينشئ ملف شخصي ودور وسجل طالب للمستخدمين الجدد
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    student_id_val TEXT;
    department_val TEXT;
BEGIN
    -- Create profile | إنشاء الملف الشخصي
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.email
    );
    
    -- Assign default student role | تعيين دور الطالب الافتراضي
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
    
    -- Generate student_id from metadata or random | توليد الرقم الجامعي
    student_id_val := COALESCE(
        NEW.raw_user_meta_data ->> 'student_id',
        LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0')
    );
    
    -- Get department from metadata or default | الحصول على القسم
    department_val := COALESCE(
        NEW.raw_user_meta_data ->> 'department',
        'هندسة المعلوماتية'
    );
    
    -- Create student record | إنشاء سجل الطالب
    INSERT INTO public.students (
        user_id,
        student_id,
        department,
        year_level,
        gpa,
        total_credits,
        xp_points,
        level,
        streak_days
    )
    VALUES (
        NEW.id,
        student_id_val,
        department_val,
        1,
        0.00,
        0,
        0,
        1,
        0
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new users | إنشاء محفز للمستخدمين الجدد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- *****************************************************************************
-- SCHEMA COMPLETE | اكتمل الهيكل
-- *****************************************************************************
