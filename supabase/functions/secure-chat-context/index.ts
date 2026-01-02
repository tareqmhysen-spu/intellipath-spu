// =============================================================================
// Secure Chat Context Edge Function
// دالة بناء سياق المحادثة الآمن
// =============================================================================
// This function builds a secure, isolated context for LLM prompts
// هذه الدالة تبني سياقاً آمناً ومعزولاً لطلبات نموذج اللغة
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// CORS headers for browser requests | رؤوس CORS لطلبات المتصفح
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// ERROR HANDLING | معالجة الأخطاء
// =============================================================================

// Error codes for standardized responses | رموز الأخطاء للردود الموحدة
const ERROR_CODES = {
  VALIDATION_ERROR: 'CTX_VALIDATION_ERR_001',
  AUTH_ERROR: 'CTX_AUTH_ERR_001',
  STUDENT_NOT_FOUND: 'CTX_STUDENT_ERR_001',
  DATABASE_ERROR: 'CTX_DB_ERR_001',
  UNKNOWN_ERROR: 'CTX_UNKNOWN_ERR_001',
};

// Create error response | إنشاء رد خطأ
function createErrorResponse(
  code: string,
  message: string,
  message_ar: string,
  status: number
): Response {
  console.error(`Error [${code}]: ${message}`);
  return new Response(
    JSON.stringify({
      success: false,
      error: { code, message, message_ar }
    }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Create success response | إنشاء رد نجاح
function createSuccessResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// =============================================================================
// INPUT VALIDATION SCHEMAS | مخططات التحقق من الإدخال
// =============================================================================

// Request schema for context building | مخطط طلب بناء السياق
const RequestSchema = z.object({
  // Include academic records in context | تضمين السجلات الأكاديمية في السياق
  include_academic_records: z.boolean().default(true),
  // Include profile information | تضمين معلومات الملف الشخصي
  include_profile: z.boolean().default(true),
  // Include GPA history | تضمين تاريخ المعدل
  include_gpa_history: z.boolean().default(true),
  // Include current enrollments | تضمين التسجيلات الحالية
  include_enrollments: z.boolean().default(true),
  // Academic year filter | فلتر العام الدراسي
  academic_year: z.string().optional(),
  // Semester filter | فلتر الفصل الدراسي
  semester: z.string().optional(),
  // Limit records returned | حد السجلات المرجعة
  limit: z.number().min(1).max(200).default(100),
});

// =============================================================================
// CONTEXT INTERFACES | واجهات السياق
// =============================================================================

// Student profile interface | واجهة ملف الطالب
interface StudentProfile {
  student_id: string;
  full_name: string;
  full_name_ar: string | null;
  department: string;
  major: string | null;
  year_level: number;
  gpa: number | null;
  total_credits: number | null;
  academic_warning: string | null;
  study_mode: string | null;
}

// Academic record interface | واجهة السجل الأكاديمي
interface AcademicRecord {
  academic_year: string;
  semester: string;
  course_code: string;
  course_name: string;
  credits: number;
  final_grade: number | null;
  letter_grade: string | null;
  grade_points: number | null;
}

// GPA history entry interface | واجهة مدخلة تاريخ المعدل
interface GPAHistoryEntry {
  academic_year: string;
  semester: string;
  gpa_points: number | null;
  gpa_percent: number | null;
}

// Complete student context interface | واجهة سياق الطالب الكامل
interface StudentContext {
  profile: StudentProfile | null;
  academic_records: AcademicRecord[];
  gpa_history: GPAHistoryEntry[];
  summary: {
    total_courses_taken: number;
    total_credits_completed: number;
    current_gpa: number | null;
    average_grade: number | null;
    passed_courses: number;
    failed_courses: number;
  };
  context_text: string;
}

// =============================================================================
// CONTEXT BUILDING FUNCTIONS | دوال بناء السياق
// =============================================================================

// Build student profile context | بناء سياق ملف الطالب
async function getStudentProfile(
  supabase: any,
  userId: string
): Promise<StudentProfile | null> {
  // Fetch student record linked to user | جلب سجل الطالب المرتبط بالمستخدم
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('student_id, department, major, year_level, gpa, total_credits, academic_warning, study_mode')
    .eq('user_id', userId)
    .single();

  if (studentError || !student) {
    console.log(`No student found for user: ${userId}`);
    return null;
  }

  // Fetch profile for name | جلب الملف الشخصي للاسم
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, full_name_ar')
    .eq('user_id', userId)
    .single();

  return {
    student_id: student.student_id,
    full_name: profile?.full_name || 'Unknown',
    full_name_ar: profile?.full_name_ar || null,
    department: student.department,
    major: student.major,
    year_level: student.year_level,
    gpa: student.gpa,
    total_credits: student.total_credits,
    academic_warning: student.academic_warning,
    study_mode: student.study_mode,
  };
}

// Fetch academic records for authenticated student only
// جلب السجلات الأكاديمية للطالب المصادق عليه فقط
async function getAcademicRecords(
  supabase: any,
  studentId: string,
  filters: { academic_year?: string; semester?: string },
  limit: number
): Promise<AcademicRecord[]> {
  // SECURITY: Query by student_id which is verified from user_id
  // الأمان: الاستعلام برقم الطالب الموثق من معرف المستخدم
  let query = supabase
    .from('student_academic_records')
    .select(`
      academic_year,
      semester,
      course_code,
      course_name,
      course_credits,
      final_grade,
      letter_grade,
      grade_points
    `)
    .eq('student_id', studentId) // CRITICAL: Filter by verified student_id | حرج: الفلترة برقم الطالب الموثق
    .order('academic_year', { ascending: false })
    .order('semester', { ascending: false })
    .limit(limit);

  // Apply optional filters | تطبيق الفلاتر الاختيارية
  if (filters.academic_year) {
    query = query.ilike('academic_year', `%${filters.academic_year}%`);
  }
  if (filters.semester) {
    query = query.ilike('semester', `%${filters.semester}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching academic records:', error);
    return [];
  }

  return (data || []).map((record: any) => ({
    academic_year: record.academic_year,
    semester: record.semester,
    course_code: record.course_code,
    course_name: record.course_name,
    credits: record.course_credits || 3,
    final_grade: record.final_grade,
    letter_grade: record.letter_grade,
    grade_points: record.grade_points,
  }));
}

// Get GPA history for trend analysis | جلب تاريخ المعدل لتحليل الاتجاهات
async function getGPAHistory(
  supabase: any,
  studentId: string
): Promise<GPAHistoryEntry[]> {
  const { data, error } = await supabase
    .from('student_academic_records')
    .select('academic_year, semester, cumulative_gpa_points, cumulative_gpa_percent')
    .eq('student_id', studentId)
    .not('cumulative_gpa_points', 'is', null)
    .order('academic_year', { ascending: true })
    .order('semester', { ascending: true });

  if (error) {
    console.error('Error fetching GPA history:', error);
    return [];
  }

  // Deduplicate by semester | إزالة التكرار بالفصل
  const seen = new Set();
  const history: GPAHistoryEntry[] = [];
  
  for (const record of data || []) {
    const key = `${record.academic_year}-${record.semester}`;
    if (!seen.has(key) && record.cumulative_gpa_points) {
      seen.add(key);
      history.push({
        academic_year: record.academic_year,
        semester: record.semester,
        gpa_points: record.cumulative_gpa_points,
        gpa_percent: record.cumulative_gpa_percent,
      });
    }
  }

  return history;
}

// Calculate summary statistics | حساب إحصائيات الملخص
function calculateSummary(
  records: AcademicRecord[],
  profile: StudentProfile | null
): StudentContext['summary'] {
  const passedCourses = records.filter(r => 
    (r.final_grade !== null && r.final_grade >= 60) || 
    (r.letter_grade && !['F', 'راسب'].includes(r.letter_grade))
  );
  
  const failedCourses = records.filter(r =>
    (r.final_grade !== null && r.final_grade < 60) ||
    (r.letter_grade && ['F', 'راسب'].includes(r.letter_grade))
  );

  const totalCredits = records.reduce((sum, r) => sum + (r.credits || 0), 0);
  
  const gradesWithValues = records.filter(r => r.final_grade !== null);
  const averageGrade = gradesWithValues.length > 0
    ? gradesWithValues.reduce((sum, r) => sum + (r.final_grade || 0), 0) / gradesWithValues.length
    : null;

  return {
    total_courses_taken: records.length,
    total_credits_completed: totalCredits,
    current_gpa: profile?.gpa || null,
    average_grade: averageGrade ? Math.round(averageGrade * 100) / 100 : null,
    passed_courses: passedCourses.length,
    failed_courses: failedCourses.length,
  };
}

// Build context text for LLM | بناء نص السياق لنموذج اللغة
function buildContextText(context: Omit<StudentContext, 'context_text'>): string {
  const lines: string[] = [];

  // Profile section | قسم الملف الشخصي
  if (context.profile) {
    lines.push('## معلومات الطالب | Student Information');
    lines.push(`- الرقم الجامعي: ${context.profile.student_id}`);
    lines.push(`- الاسم: ${context.profile.full_name_ar || context.profile.full_name}`);
    lines.push(`- القسم: ${context.profile.department}`);
    lines.push(`- التخصص: ${context.profile.major || 'غير محدد'}`);
    lines.push(`- السنة الدراسية: ${context.profile.year_level}`);
    lines.push(`- المعدل التراكمي: ${context.profile.gpa?.toFixed(2) || 'غير متاح'}`);
    lines.push(`- الساعات المنجزة: ${context.profile.total_credits || 0}`);
    if (context.profile.academic_warning) {
      lines.push(`- ⚠️ الإنذار الأكاديمي: ${context.profile.academic_warning}`);
    }
    lines.push('');
  }

  // Summary section | قسم الملخص
  lines.push('## ملخص الأداء | Performance Summary');
  lines.push(`- إجمالي المقررات المدروسة: ${context.summary.total_courses_taken}`);
  lines.push(`- المقررات الناجحة: ${context.summary.passed_courses}`);
  lines.push(`- المقررات الراسبة: ${context.summary.failed_courses}`);
  if (context.summary.average_grade) {
    lines.push(`- متوسط الدرجات: ${context.summary.average_grade.toFixed(1)}`);
  }
  lines.push('');

  // Academic records section | قسم السجلات الأكاديمية
  if (context.academic_records.length > 0) {
    lines.push('## السجلات الأكاديمية | Academic Records');
    
    // Group by semester | التجميع بالفصل
    const bySemester: Record<string, AcademicRecord[]> = {};
    for (const record of context.academic_records) {
      const key = `${record.academic_year} - ${record.semester}`;
      if (!bySemester[key]) bySemester[key] = [];
      bySemester[key].push(record);
    }

    for (const [semester, records] of Object.entries(bySemester)) {
      lines.push(`\n### ${semester}`);
      for (const record of records) {
        const grade = record.letter_grade || (record.final_grade?.toFixed(0) || 'N/A');
        lines.push(`- ${record.course_code}: ${record.course_name} (${record.credits} س.م) - ${grade}`);
      }
    }
    lines.push('');
  }

  // GPA history section | قسم تاريخ المعدل
  if (context.gpa_history.length > 0) {
    lines.push('## تاريخ المعدل التراكمي | GPA History');
    for (const entry of context.gpa_history.slice(-6)) { // Last 6 semesters | آخر 6 فصول
      lines.push(`- ${entry.academic_year} ${entry.semester}: ${entry.gpa_points?.toFixed(2) || 'N/A'}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// MAIN HANDLER | المعالج الرئيسي
// =============================================================================

serve(async (req) => {
  // Handle CORS preflight | معالجة طلب CORS المسبق
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body | تحليل جسم الطلب
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid JSON in request body',
        'JSON غير صالح في جسم الطلب',
        400
      );
    }

    // Validate request | التحقق من الطلب
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error('Validation errors:', errors);
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        `Validation failed: ${errors.join(', ')}`,
        'فشل التحقق من البيانات',
        400
      );
    }

    const options = parseResult.data;

    // Get authorization header | الحصول على رأس التفويض
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse(
        ERROR_CODES.AUTH_ERROR,
        'Authorization header required',
        'رأس التفويض مطلوب',
        401
      );
    }

    // Initialize Supabase client | تهيئة عميل Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return createErrorResponse(
        ERROR_CODES.DATABASE_ERROR,
        'Database configuration missing',
        'إعدادات قاعدة البيانات مفقودة',
        500
      );
    }

    // Create client with user's token for RLS | إنشاء عميل بتوكن المستخدم لـ RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get authenticated user | الحصول على المستخدم المصادق عليه
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return createErrorResponse(
        ERROR_CODES.AUTH_ERROR,
        'Invalid or expired token',
        'التوكن غير صالح أو منتهي الصلاحية',
        401
      );
    }

    console.log(`Building context for user: ${user.id}`);

    // SECURITY LAYER 1: Get student profile from user_id
    // طبقة الأمان 1: الحصول على ملف الطالب من معرف المستخدم
    const profile = options.include_profile 
      ? await getStudentProfile(supabase, user.id)
      : null;

    if (!profile) {
      return createErrorResponse(
        ERROR_CODES.STUDENT_NOT_FOUND,
        'No student record found for this user',
        'لم يتم العثور على سجل طالب لهذا المستخدم',
        404
      );
    }

    // SECURITY LAYER 2: Use verified student_id for all queries
    // طبقة الأمان 2: استخدام رقم الطالب الموثق لجميع الاستعلامات
    const verifiedStudentId = profile.student_id;
    console.log(`Verified student_id: ${verifiedStudentId}`);

    // Fetch academic records with verified student_id
    // جلب السجلات الأكاديمية برقم الطالب الموثق
    const academicRecords = options.include_academic_records
      ? await getAcademicRecords(
          supabase, 
          verifiedStudentId, // Use verified ID | استخدام الرقم الموثق
          { 
            academic_year: options.academic_year, 
            semester: options.semester 
          },
          options.limit
        )
      : [];

    // Fetch GPA history with verified student_id
    // جلب تاريخ المعدل برقم الطالب الموثق
    const gpaHistory = options.include_gpa_history
      ? await getGPAHistory(supabase, verifiedStudentId)
      : [];

    // Calculate summary | حساب الملخص
    const summary = calculateSummary(academicRecords, profile);

    // Build context object | بناء كائن السياق
    const contextWithoutText = {
      profile,
      academic_records: academicRecords,
      gpa_history: gpaHistory,
      summary,
    };

    // Build context text for LLM | بناء نص السياق لنموذج اللغة
    const contextText = buildContextText(contextWithoutText);

    const fullContext: StudentContext = {
      ...contextWithoutText,
      context_text: contextText,
    };

    console.log(`Context built successfully for student: ${verifiedStudentId}`);
    console.log(`Records: ${academicRecords.length}, GPA entries: ${gpaHistory.length}`);

    return createSuccessResponse(fullContext);

  } catch (error) {
    console.error('Unexpected error in secure-chat-context:', error);
    return createErrorResponse(
      ERROR_CODES.UNKNOWN_ERROR,
      error instanceof Error ? error.message : 'Unknown error occurred',
      'حدث خطأ غير متوقع',
      500
    );
  }
});
