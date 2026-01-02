-- ===================================
-- Knowledge Graph Schema for IntelliPath
-- 251 nodes, 1,267 relationships
-- ===================================

-- 1. Topics table (81 nodes)
CREATE TABLE IF NOT EXISTS public.topics (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    neo4j_id integer UNIQUE,
    name text NOT NULL UNIQUE,
    name_ar text,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Skills table (24 nodes)
CREATE TABLE IF NOT EXISTS public.skills (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    neo4j_id integer UNIQUE,
    name text NOT NULL UNIQUE,
    name_ar text,
    description text,
    category text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Tools table (20 nodes)
CREATE TABLE IF NOT EXISTS public.tools (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    neo4j_id integer UNIQUE,
    name text NOT NULL UNIQUE,
    name_ar text,
    description text,
    category text,
    url text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Career Paths table (9 nodes)
CREATE TABLE IF NOT EXISTS public.career_paths (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    neo4j_id integer UNIQUE,
    name text NOT NULL UNIQUE,
    name_ar text,
    description text,
    description_ar text,
    icon text,
    color text DEFAULT 'primary',
    salary_range_min integer,
    salary_range_max integer,
    demand text DEFAULT 'متوسط',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Majors table (5 nodes)
CREATE TABLE IF NOT EXISTS public.majors (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    neo4j_id integer UNIQUE,
    name text NOT NULL UNIQUE,
    name_en text,
    description text,
    total_credits integer DEFAULT 171,
    duration_years integer DEFAULT 5,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Update courses table to add new columns from Neo4j
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS neo4j_id integer,
ADD COLUMN IF NOT EXISTS hours_theory integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS hours_lab integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS is_bottleneck boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS critical_path_depth integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS objectives_ar text,
ADD COLUMN IF NOT EXISTS objectives_en text;

-- ===================================
-- Relationship Tables
-- ===================================

-- 6. Course-Topic relationship (COVERS_TOPIC: 377 relationships)
CREATE TABLE IF NOT EXISTS public.course_topics (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(course_id, topic_id)
);

-- 7. Course-Major relationship (BELONGS_TO: 276 relationships)
CREATE TABLE IF NOT EXISTS public.course_majors (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    major_id uuid NOT NULL REFERENCES public.majors(id) ON DELETE CASCADE,
    is_required boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(course_id, major_id)
);

-- 8. Course-Tool relationship (TEACHES_TOOL: 231 relationships)
CREATE TABLE IF NOT EXISTS public.course_tools (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(course_id, tool_id)
);

-- 9. Course-Skill relationship (TEACHES_SKILL: 100 relationships)
CREATE TABLE IF NOT EXISTS public.course_skills (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    level text DEFAULT 'beginner',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(course_id, skill_id)
);

-- 10. Course-Course relationship (RELATED_TO: 65 relationships)
CREATE TABLE IF NOT EXISTS public.course_relations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    related_course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    relation_type text DEFAULT 'related',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(course_id, related_course_id)
);

-- 11. Course-CareerPath relationship (LEADS_TO_CAREER: 48 relationships)
CREATE TABLE IF NOT EXISTS public.course_career_paths (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    career_path_id uuid NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
    importance text DEFAULT 'core',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(course_id, career_path_id)
);

-- ===================================
-- Enable RLS on all new tables
-- ===================================
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_career_paths ENABLE ROW LEVEL SECURITY;

-- ===================================
-- RLS Policies - All tables are public read
-- ===================================

-- Topics policies
CREATE POLICY "Anyone can view topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage topics" ON public.topics FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Skills policies
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Admins can manage skills" ON public.skills FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Tools policies
CREATE POLICY "Anyone can view tools" ON public.tools FOR SELECT USING (true);
CREATE POLICY "Admins can manage tools" ON public.tools FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Career paths policies
CREATE POLICY "Anyone can view career_paths" ON public.career_paths FOR SELECT USING (true);
CREATE POLICY "Admins can manage career_paths" ON public.career_paths FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Majors policies
CREATE POLICY "Anyone can view majors" ON public.majors FOR SELECT USING (true);
CREATE POLICY "Admins can manage majors" ON public.majors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Relationship tables policies
CREATE POLICY "Anyone can view course_topics" ON public.course_topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage course_topics" ON public.course_topics FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course_majors" ON public.course_majors FOR SELECT USING (true);
CREATE POLICY "Admins can manage course_majors" ON public.course_majors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course_tools" ON public.course_tools FOR SELECT USING (true);
CREATE POLICY "Admins can manage course_tools" ON public.course_tools FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course_skills" ON public.course_skills FOR SELECT USING (true);
CREATE POLICY "Admins can manage course_skills" ON public.course_skills FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course_relations" ON public.course_relations FOR SELECT USING (true);
CREATE POLICY "Admins can manage course_relations" ON public.course_relations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course_career_paths" ON public.course_career_paths FOR SELECT USING (true);
CREATE POLICY "Admins can manage course_career_paths" ON public.course_career_paths FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ===================================
-- Create indexes for performance
-- ===================================
CREATE INDEX IF NOT EXISTS idx_topics_name ON public.topics(name);
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills(name);
CREATE INDEX IF NOT EXISTS idx_tools_name ON public.tools(name);
CREATE INDEX IF NOT EXISTS idx_career_paths_name ON public.career_paths(name);
CREATE INDEX IF NOT EXISTS idx_majors_name ON public.majors(name);

CREATE INDEX IF NOT EXISTS idx_course_topics_course ON public.course_topics(course_id);
CREATE INDEX IF NOT EXISTS idx_course_topics_topic ON public.course_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_course_majors_course ON public.course_majors(course_id);
CREATE INDEX IF NOT EXISTS idx_course_majors_major ON public.course_majors(major_id);
CREATE INDEX IF NOT EXISTS idx_course_tools_course ON public.course_tools(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tools_tool ON public.course_tools(tool_id);
CREATE INDEX IF NOT EXISTS idx_course_skills_course ON public.course_skills(course_id);
CREATE INDEX IF NOT EXISTS idx_course_skills_skill ON public.course_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_course_relations_course ON public.course_relations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_career_paths_course ON public.course_career_paths(course_id);
CREATE INDEX IF NOT EXISTS idx_course_career_paths_career ON public.course_career_paths(career_path_id);

CREATE INDEX IF NOT EXISTS idx_courses_neo4j_id ON public.courses(neo4j_id);