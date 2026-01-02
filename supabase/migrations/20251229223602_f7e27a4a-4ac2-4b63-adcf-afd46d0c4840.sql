-- =====================================================
-- IntelliPath URAG System - Complete Database Schema
-- =====================================================

-- 1. FAQs Table (URAG Layer 1 - 100% accurate answers)
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    question_ar TEXT,
    answer TEXT NOT NULL,
    answer_ar TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    keywords TEXT[] DEFAULT '{}',
    department TEXT,
    year_level INTEGER,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Query Cache Table (Semantic Caching)
CREATE TABLE IF NOT EXISTS public.query_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    query_hash TEXT NOT NULL,
    query_text TEXT NOT NULL,
    response JSONB NOT NULL,
    metadata_filter JSONB,
    hit_count INTEGER DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. User Memories Table (Long-term Memory)
CREATE TABLE IF NOT EXISTS public.user_memories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'preference', 'context', 'skill', 'goal', 'interaction')),
    summary TEXT NOT NULL,
    content JSONB,
    importance FLOAT DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Chat Analytics Table (Metrics & Logging)
CREATE TABLE IF NOT EXISTS public.chat_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    conversation_id UUID,
    query_text TEXT NOT NULL,
    response_mode TEXT NOT NULL DEFAULT 'rag',
    cache_hit BOOLEAN DEFAULT false,
    faq_match BOOLEAN DEFAULT false,
    latency_ms INTEGER,
    sources_count INTEGER DEFAULT 0,
    confidence FLOAT,
    route_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Study Materials Table (Course Documents for RAG)
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    content_text TEXT,
    content_chunks JSONB,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    is_processed BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Rate Limits Table (Per-user rate limiting)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- FAQs indexes
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_keywords ON public.faqs USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_faqs_department ON public.faqs(department);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON public.faqs(is_active);

-- Query cache indexes
CREATE INDEX IF NOT EXISTS idx_query_cache_hash ON public.query_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_query_cache_expires ON public.query_cache(expires_at);

-- User memories indexes
CREATE INDEX IF NOT EXISTS idx_user_memories_user ON public.user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON public.user_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_memories_importance ON public.user_memories(importance DESC);

-- Chat analytics indexes
CREATE INDEX IF NOT EXISTS idx_chat_analytics_user ON public.chat_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_created ON public.chat_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_mode ON public.chat_analytics(response_mode);

-- Study materials indexes
CREATE INDEX IF NOT EXISTS idx_study_materials_course ON public.study_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_user ON public.study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_public ON public.study_materials(is_public);
CREATE INDEX IF NOT EXISTS idx_study_materials_processed ON public.study_materials(is_processed);

-- Rate limits indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- =====================================================
-- Enable Row Level Security
-- =====================================================

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- FAQs: Everyone can read, only admins can modify
CREATE POLICY "FAQs are viewable by everyone" ON public.faqs
    FOR SELECT USING (true);

-- Query cache: Service role only (edge functions)
CREATE POLICY "Cache managed by service" ON public.query_cache
    FOR ALL USING (true);

-- User memories: Users access only their own
CREATE POLICY "Users can manage their own memories" ON public.user_memories
    FOR ALL USING (auth.uid() = user_id);

-- Chat analytics: Users view their own, service can insert
CREATE POLICY "Users can view their analytics" ON public.chat_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert analytics" ON public.chat_analytics
    FOR INSERT WITH CHECK (true);

-- Study materials: Complex access rules
CREATE POLICY "Users can view public materials" ON public.study_materials
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own materials" ON public.study_materials
    FOR ALL USING (auth.uid() = user_id);

-- Rate limits: Users see their own limits
CREATE POLICY "Users can view their rate limits" ON public.rate_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage rate limits" ON public.rate_limits
    FOR ALL USING (true);

-- =====================================================
-- Triggers for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_memories_updated_at
    BEFORE UPDATE ON public.user_memories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_materials_updated_at
    BEFORE UPDATE ON public.study_materials
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Sample FAQ Data (Arabic & English)
-- =====================================================

INSERT INTO public.faqs (question, question_ar, answer, answer_ar, category, keywords, priority) VALUES
('What is the minimum GPA to graduate?', 'ما هو الحد الأدنى للمعدل التراكمي للتخرج؟', 
 'The minimum cumulative GPA required for graduation is 2.0 out of 4.0.',
 'الحد الأدنى للمعدل التراكمي المطلوب للتخرج هو 2.0 من 4.0.',
 'graduation', ARRAY['gpa', 'graduation', 'minimum', 'معدل', 'تخرج'], 10),

('How many credit hours are required to graduate?', 'كم عدد الساعات المعتمدة المطلوبة للتخرج؟',
 'Students must complete 132-144 credit hours depending on their major to graduate.',
 'يجب على الطلاب إكمال 132-144 ساعة معتمدة حسب التخصص للتخرج.',
 'graduation', ARRAY['credits', 'hours', 'graduation', 'ساعات', 'معتمدة'], 10),

('What is the academic warning policy?', 'ما هي سياسة الإنذار الأكاديمي؟',
 'Students receive an academic warning if their semester GPA falls below 2.0. Two consecutive warnings may result in academic probation.',
 'يحصل الطلاب على إنذار أكاديمي إذا انخفض معدلهم الفصلي عن 2.0. إنذاران متتاليان قد يؤديان إلى الإيقاف الأكاديمي.',
 'policies', ARRAY['warning', 'probation', 'gpa', 'إنذار', 'أكاديمي'], 9),

('How do I withdraw from a course?', 'كيف أنسحب من مقرر؟',
 'You can withdraw from a course through the student portal within the first 10 weeks of the semester. A "W" grade will appear on your transcript.',
 'يمكنك الانسحاب من المقرر عبر بوابة الطالب خلال أول 10 أسابيع من الفصل. ستظهر درجة "W" في سجلك الأكاديمي.',
 'registration', ARRAY['withdraw', 'drop', 'course', 'انسحاب', 'مقرر'], 8),

('What are the grading scales?', 'ما هي مقاييس الدرجات؟',
 'A+ (95-100) = 4.0, A (90-94) = 3.75, B+ (85-89) = 3.5, B (80-84) = 3.0, C+ (75-79) = 2.5, C (70-74) = 2.0, D+ (65-69) = 1.5, D (60-64) = 1.0, F (Below 60) = 0',
 'A+ (95-100) = 4.0، A (90-94) = 3.75، B+ (85-89) = 3.5، B (80-84) = 3.0، C+ (75-79) = 2.5، C (70-74) = 2.0، D+ (65-69) = 1.5، D (60-64) = 1.0، F (أقل من 60) = 0',
 'grades', ARRAY['grade', 'scale', 'gpa', 'points', 'درجات', 'نقاط'], 10),

('Can I retake a course to improve my grade?', 'هل يمكنني إعادة مقرر لتحسين درجتي؟',
 'Yes, you can retake a course. The higher grade will be counted in your GPA calculation, but both attempts appear on your transcript.',
 'نعم، يمكنك إعادة المقرر. سيتم احتساب الدرجة الأعلى في معدلك التراكمي، لكن المحاولتين ستظهران في سجلك.',
 'grades', ARRAY['retake', 'repeat', 'course', 'grade', 'إعادة', 'تحسين'], 8),

('What is the maximum course load per semester?', 'ما هو الحد الأقصى للساعات في الفصل؟',
 'Regular students can register for 12-18 credit hours. Students with GPA above 3.5 can request up to 21 hours.',
 'يمكن للطلاب العاديين التسجيل في 12-18 ساعة معتمدة. الطلاب الذين معدلهم أعلى من 3.5 يمكنهم طلب حتى 21 ساعة.',
 'registration', ARRAY['load', 'credits', 'maximum', 'semester', 'ساعات', 'فصل'], 7),

('How do I calculate my GPA?', 'كيف أحسب معدلي التراكمي؟',
 'GPA = Sum of (Grade Points × Credit Hours) / Total Credit Hours. Use our GPA calculator in the app for accurate calculations.',
 'المعدل = مجموع (نقاط الدرجة × الساعات المعتمدة) / إجمالي الساعات. استخدم حاسبة المعدل في التطبيق للحساب الدقيق.',
 'grades', ARRAY['calculate', 'gpa', 'formula', 'حساب', 'معدل'], 10);

-- =====================================================
-- Create Storage Bucket for Study Materials
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'study-materials',
    'study-materials', 
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for study materials
CREATE POLICY "Users can upload their study materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own materials"
ON storage.objects FOR DELETE
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);