import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// ERROR CODES & BILINGUAL MESSAGES
// =============================================================================
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERR_001',
  MISSING_API_KEY: 'CONFIG_ERR_001',
  RATE_LIMIT_EXCEEDED: 'RATE_ERR_001',
  PAYMENT_REQUIRED: 'PAYMENT_ERR_001',
  AI_GATEWAY_ERROR: 'AI_ERR_001',
  TOOL_EXECUTION_ERROR: 'TOOL_ERR_001',
  AUTH_REQUIRED: 'AUTH_ERR_001',
  UNKNOWN_ERROR: 'UNKNOWN_ERR_001',
};

type ErrorCode = keyof typeof ERROR_CODES;

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    message_ar: string;
    details?: Record<string, unknown>;
  };
}

function createErrorResponse(
  code: ErrorCode,
  message: string,
  message_ar: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  const body: ErrorResponse = {
    error: {
      code: ERROR_CODES[code],
      message,
      message_ar,
      ...(details && { details }),
    },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().max(10000),
  tool_call_id: z.string().optional(),
});

const StudentContextSchema = z.object({
  gpa: z.number().min(0).max(4).optional(),
  department: z.string().max(100).optional(),
  year_level: z.number().min(1).max(6).optional(),
  credits_completed: z.number().min(0).max(500).optional(),
  student_id: z.string().max(20).optional(),
  major: z.string().max(100).optional(),
}).optional();

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  mode: z.enum(['agentic', 'rag', 'simple']).default('agentic'),
  student_context: StudentContextSchema,
  conversation_id: z.string().uuid().optional(),
});

// =============================================================================
// AGENTIC SYSTEM PROMPT - ENHANCED WITH STUDENT DATA ACCESS
// =============================================================================
const AGENTIC_SYSTEM_PROMPT = `أنت "IntelliPath" - المستشار الأكاديمي الذكي للجامعة السورية الخاصة.

## مهمتك:
مساعدة الطلاب في الاستفسارات الأكاديمية باستخدام الأدوات المتاحة للبحث في قاعدة البيانات.

## قواعد أمنية مهمة جداً:
1. يمكنك فقط الوصول لبيانات الطالب الذي يتحدث معك (بناءً على رقمه الجامعي)
2. لا تكشف عن معلومات أي طالب آخر مهما كان السؤال
3. إذا سُئلت عن طالب آخر، أجب: "لا يمكنني الوصول لمعلومات طلاب آخرين"
4. استخدم الأدوات المتاحة للحصول على معلومات دقيقة من قاعدة البيانات

## قواعد العرض:
1. قدم الإجابة بشكل منظم وجميل باللغة العربية
2. عند عرض المقررات، اعرضها بشكل قائمة واضحة مع:
   - رمز المقرر
   - اسم المقرر  
   - عدد الساعات المعتمدة
   - الدرجة (إذا كانت متاحة)
3. لا تخترع معلومات - استخدم فقط ما تجده من قاعدة البيانات

## التخصصات في كلية الهندسة المعلوماتية:
1. الذكاء الصنعي وعلوم البيانات (AI)
2. هندسة البرمجيات ونظم المعلومات (IS)
3. أمن النظم والشبكات الحاسوبية (SS)
4. هندسة الاتصالات (COM)
5. هندسة التحكم والروبوت (CR)

## نظام الدرجات:
A (90-100): 4.0, B+ (85-89): 3.5, B (80-84): 3.0, C+ (75-79): 2.5, C (70-74): 2.0, D+ (65-69): 1.5, D (60-64): 1.0, F (<60): 0.0

## عند السؤال عن معلومات الطالب:
- استخدم أداة get_my_academic_records للحصول على سجلاته الأكاديمية
- استخدم أداة get_my_profile للحصول على معلوماته الشخصية
- استخدم أداة get_my_gpa_history لمعرفة تاريخ معدله`;

// =============================================================================
// TOOLS DEFINITIONS - ENHANCED WITH STUDENT-SPECIFIC TOOLS
// =============================================================================
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_courses",
      description: "البحث في قاعدة بيانات المقررات الدراسية حسب التخصص والسنة الدراسية",
      parameters: {
        type: "object",
        properties: {
          major: { 
            type: "string", 
            description: "التخصص: AI للذكاء الصنعي، IS للبرمجيات، SS للأمن، COM للاتصالات، CR للروبوت",
            enum: ["AI", "IS", "SS", "COM", "CR"]
          },
          year_level: { 
            type: "number", 
            description: "السنة الدراسية من 1 إلى 5" 
          },
          query: { 
            type: "string", 
            description: "نص البحث الإضافي" 
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_prerequisites",
      description: "جلب المتطلبات السابقة لمقرر معين",
      parameters: {
        type: "object",
        properties: {
          course_code: { type: "string", description: "رمز المقرر" }
        },
        required: ["course_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_gpa",
      description: "حساب المعدل التراكمي بناءً على الدرجات",
      parameters: {
        type: "object",
        properties: {
          grades: {
            type: "array",
            items: {
              type: "object",
              properties: {
                grade: { type: "number" },
                credits: { type: "number" }
              }
            }
          }
        },
        required: ["grades"]
      }
    }
  },
  // NEW: Student-specific tools
  {
    type: "function",
    function: {
      name: "get_my_academic_records",
      description: "جلب سجلاتي الأكاديمية الشخصية (المقررات التي درستها ودرجاتي)",
      parameters: {
        type: "object",
        properties: {
          semester: { 
            type: "string", 
            description: "الفصل الدراسي (اختياري) مثل: الفصل الأول 2024/2025" 
          },
          academic_year: { 
            type: "string", 
            description: "العام الدراسي (اختياري) مثل: 2024/2025" 
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_my_profile",
      description: "جلب معلوماتي الشخصية والأكاديمية (الاسم، التخصص، المعدل، الساعات المنجزة)",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_my_gpa_history",
      description: "جلب تاريخ معدلي التراكمي عبر الفصول الدراسية",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_my_course_grades",
      description: "جلب درجات مقرر معين من سجلاتي",
      parameters: {
        type: "object",
        properties: {
          course_code: { 
            type: "string", 
            description: "رمز المقرر" 
          }
        },
        required: ["course_code"]
      }
    }
  }
];

// =============================================================================
// STUDENT CONTEXT - Fetched from authenticated user
// =============================================================================
interface AuthenticatedStudent {
  student_id: string;
  user_id: string;
  department: string;
  major: string | null;
  gpa: number | null;
  year_level: number;
  total_credits: number | null;
}

async function getAuthenticatedStudent(supabase: any, userId: string): Promise<AuthenticatedStudent | null> {
  const { data, error } = await supabase
    .from('students')
    .select('student_id, user_id, department, major, gpa, year_level, total_credits')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    console.log("No student found for user:", userId);
    return null;
  }
  
  return data;
}

// =============================================================================
// TOOL EXECUTION FUNCTIONS
// =============================================================================
async function executeTool(
  toolName: string, 
  args: unknown, 
  supabase: any,
  authenticatedStudent: AuthenticatedStudent | null
): Promise<unknown> {
  console.log(`Executing tool: ${toolName}`, JSON.stringify(args));
  
  try {
    switch (toolName) {
      case "search_courses":
        return await searchCourses(args as any, supabase);
      case "get_prerequisites":
        return await getPrerequisites(args as any, supabase);
      case "calculate_gpa":
        return calculateGPA(args as any);
      // Student-specific tools
      case "get_my_academic_records":
        return await getMyAcademicRecords(args as any, supabase, authenticatedStudent);
      case "get_my_profile":
        return await getMyProfile(supabase, authenticatedStudent);
      case "get_my_gpa_history":
        return await getMyGPAHistory(supabase, authenticatedStudent);
      case "get_my_course_grades":
        return await getMyCourseGrades(args as any, supabase, authenticatedStudent);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Tool execution error [${toolName}]:`, error);
    return { error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// =============================================================================
// STUDENT-SPECIFIC TOOL IMPLEMENTATIONS
// =============================================================================
async function getMyAcademicRecords(
  args: { semester?: string; academic_year?: string },
  supabase: any,
  student: AuthenticatedStudent | null
) {
  if (!student) {
    return { error: "لم يتم ربط حسابك برقم جامعي. يرجى تحديث ملفك الشخصي.", records: [] };
  }

  let query = supabase
    .from('student_academic_records')
    .select('*')
    .eq('student_id', student.student_id)
    .order('academic_year', { ascending: false })
    .order('semester', { ascending: false });

  if (args.academic_year) {
    query = query.ilike('academic_year', `%${args.academic_year}%`);
  }
  if (args.semester) {
    query = query.ilike('semester', `%${args.semester}%`);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error("Error fetching academic records:", error);
    return { error: "فشل في جلب السجلات الأكاديمية", records: [] };
  }

  // Group by semester
  const grouped: Record<string, any[]> = {};
  for (const record of (data || [])) {
    const key = `${record.academic_year} - ${record.semester}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      course_code: record.course_code,
      course_name: record.course_name,
      credits: record.course_credits,
      grade: record.final_grade,
      letter_grade: record.letter_grade,
      grade_points: record.grade_points,
    });
  }

  return {
    student_id: student.student_id,
    total_records: data?.length || 0,
    semesters: Object.entries(grouped).map(([semester, courses]) => ({
      semester,
      courses,
      semester_credits: courses.reduce((sum, c) => sum + (c.credits || 0), 0),
    })),
    message: data?.length 
      ? `تم إيجاد ${data.length} سجل أكاديمي` 
      : 'لا توجد سجلات أكاديمية'
  };
}

async function getMyProfile(supabase: any, student: AuthenticatedStudent | null) {
  if (!student) {
    return { error: "لم يتم ربط حسابك برقم جامعي. يرجى تحديث ملفك الشخصي." };
  }

  // Get latest academic record for additional info
  const { data: latestRecord } = await supabase
    .from('student_academic_records')
    .select('*')
    .eq('student_id', student.student_id)
    .order('academic_year', { ascending: false })
    .order('semester', { ascending: false })
    .limit(1)
    .single();

  return {
    student_id: student.student_id,
    department: student.department,
    major: student.major || latestRecord?.major,
    gpa: student.gpa,
    gpa_percentage: latestRecord?.cumulative_gpa_percent,
    year_level: student.year_level,
    total_credits: student.total_credits || latestRecord?.total_completed_hours,
    academic_warning: latestRecord?.academic_warning,
    study_mode: latestRecord?.study_mode,
    college: latestRecord?.college,
    message: "معلومات ملفك الشخصي"
  };
}

async function getMyGPAHistory(supabase: any, student: AuthenticatedStudent | null) {
  if (!student) {
    return { error: "لم يتم ربط حسابك برقم جامعي." };
  }

  // Get unique GPA values per semester
  const { data, error } = await supabase
    .from('student_academic_records')
    .select('academic_year, semester, cumulative_gpa_points, cumulative_gpa_percent')
    .eq('student_id', student.student_id)
    .not('cumulative_gpa_points', 'is', null)
    .order('academic_year', { ascending: true })
    .order('semester', { ascending: true });

  if (error) {
    return { error: "فشل في جلب تاريخ المعدل" };
  }

  // Get unique semesters with their GPA
  const seen = new Set();
  const history = [];
  for (const record of (data || [])) {
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

  return {
    student_id: student.student_id,
    current_gpa: student.gpa,
    history,
    message: `تاريخ المعدل التراكمي عبر ${history.length} فصل دراسي`
  };
}

async function getMyCourseGrades(
  args: { course_code: string },
  supabase: any,
  student: AuthenticatedStudent | null
) {
  if (!student) {
    return { error: "لم يتم ربط حسابك برقم جامعي." };
  }

  const courseCode = args.course_code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('student_academic_records')
    .select('*')
    .eq('student_id', student.student_id)
    .ilike('course_code', `%${courseCode}%`)
    .order('academic_year', { ascending: false });

  if (error || !data?.length) {
    return { 
      error: `لم يتم إيجاد سجل للمقرر ${courseCode} في سجلاتك`,
      course_code: courseCode 
    };
  }

  return {
    course_code: courseCode,
    attempts: data.map((r: any) => ({
      semester: `${r.academic_year} - ${r.semester}`,
      course_name: r.course_name,
      credits: r.course_credits,
      grade: r.final_grade,
      letter_grade: r.letter_grade,
      grade_points: r.grade_points,
    })),
    best_grade: Math.max(...data.map((r: any) => r.final_grade || 0)),
    message: `درجاتك في المقرر ${courseCode}`
  };
}

// =============================================================================
// EXISTING TOOL IMPLEMENTATIONS
// =============================================================================
async function searchCourses(args: { query?: string; major?: string; year_level?: number }, supabase: any) {
  const { query, major, year_level } = args;
  
  console.log("Searching courses with:", { query, major, year_level });
  
  const majorCodePrefixes: Record<string, { specialization: string; shared: string[] }> = {
    'AI': { 
      specialization: 'CIAC', 
      shared: ['CIFC', 'CIFE', 'CIEE', 'CIQC']
    },
    'IS': { 
      specialization: 'CIEC', 
      shared: ['CIFC', 'CIFE', 'CIEE'] 
    },
    'SS': { 
      specialization: 'CISC', 
      shared: ['CIFC', 'CIFE'] 
    },
    'COM': { 
      specialization: 'CICC', 
      shared: ['CIFC', 'CIFE', 'CICE'] 
    },
    'CR': { 
      specialization: 'CIRC', 
      shared: ['CIFC', 'CIFE', 'CIRE'] 
    },
  };

  if (major && majorCodePrefixes[major.toUpperCase()]) {
    const prefixes = majorCodePrefixes[major.toUpperCase()];
    const allPrefixes = [prefixes.specialization, ...prefixes.shared];
    
    let queryBuilder = supabase
      .from('courses')
      .select('code, name, name_ar, credits, year_level, department, hours_theory, hours_lab')
      .eq('is_active', true);
    
    if (year_level && year_level >= 1 && year_level <= 5) {
      queryBuilder = queryBuilder.eq('year_level', year_level);
    }
    
    const orConditions = allPrefixes.map(p => `code.ilike.${p}%`).join(',');
    queryBuilder = queryBuilder.or(orConditions);
    
    const { data, error } = await queryBuilder.order('code').limit(50);
    
    if (error) {
      console.error("Course search error:", error);
      return { error: error.message, courses: [], count: 0 };
    }
    
    const courses = (data || []).sort((a: any, b: any) => {
      const aIsSpec = a.code.startsWith(prefixes.specialization);
      const bIsSpec = b.code.startsWith(prefixes.specialization);
      if (aIsSpec && !bIsSpec) return -1;
      if (!aIsSpec && bIsSpec) return 1;
      return a.code.localeCompare(b.code);
    });
    
    return { 
      courses,
      count: courses.length,
      major: major?.toUpperCase(),
      year_level,
      message: courses.length > 0 
        ? `تم إيجاد ${courses.length} مقرر للسنة ${year_level || 'الدراسية'} تخصص ${getMajorName(major)}` 
        : `لم يتم إيجاد مقررات للسنة ${year_level} تخصص ${getMajorName(major)}`
    };
  }
  
  let queryBuilder = supabase
    .from('courses')
    .select('code, name, name_ar, credits, year_level, department, hours_theory, hours_lab')
    .eq('is_active', true);
  
  if (year_level && year_level >= 1 && year_level <= 5) {
    queryBuilder = queryBuilder.eq('year_level', year_level);
  }
  
  if (query) {
    const sanitizedQuery = query.trim().slice(0, 100).replace(/[%_]/g, '');
    queryBuilder = queryBuilder.or(`name.ilike.%${sanitizedQuery}%,name_ar.ilike.%${sanitizedQuery}%,code.ilike.%${sanitizedQuery}%`);
  }
  
  const { data, error } = await queryBuilder.order('year_level').limit(20);
  
  if (error) {
    console.error("Search error:", error);
    return { error: error.message, courses: [], count: 0 };
  }
  
  return { 
    courses: data || [], 
    count: data?.length || 0,
    message: data?.length ? `تم إيجاد ${data.length} مقرر` : 'لم يتم إيجاد مقررات'
  };
}

function getMajorName(code: string): string {
  const names: Record<string, string> = {
    'AI': 'الذكاء الصنعي وعلوم البيانات',
    'IS': 'هندسة البرمجيات ونظم المعلومات',
    'SS': 'أمن النظم والشبكات الحاسوبية',
    'COM': 'هندسة الاتصالات',
    'CR': 'هندسة التحكم والروبوت',
  };
  return names[code?.toUpperCase()] || code;
}

async function getPrerequisites(args: { course_code: string }, supabase: any) {
  const courseCode = args.course_code.trim().slice(0, 20).toUpperCase();
  
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, code, name, name_ar, credits, year_level')
    .eq('code', courseCode)
    .single();
  
  if (courseError || !course) {
    return { error: `المقرر غير موجود: ${courseCode}` };
  }
  
  const { data: prerequisites } = await supabase
    .from('course_prerequisites')
    .select(`
      prerequisite:courses!course_prerequisites_prerequisite_id_fkey(
        code, name, name_ar, credits
      )
    `)
    .eq('course_id', course.id);
  
  return {
    course,
    prerequisites: prerequisites?.map((p: any) => p.prerequisite) || []
  };
}

function calculateGPA(args: { grades: Array<{ grade: number; credits: number }> }) {
  const { grades } = args;
  
  if (!grades || grades.length === 0) {
    return { error: "لم يتم تقديم أي درجات" };
  }
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const g of grades) {
    if (typeof g.grade !== 'number' || typeof g.credits !== 'number') continue;
    if (g.credits < 0 || g.credits > 10) continue;
    
    const gradePoint = convertToGradePoint(Math.min(100, Math.max(0, g.grade)));
    totalPoints += gradePoint * g.credits;
    totalCredits += g.credits;
  }
  
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  
  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    letterGrade: getLetterGrade(gpa)
  };
}

function convertToGradePoint(grade: number): number {
  if (grade >= 90) return 4.0;
  if (grade >= 85) return 3.5;
  if (grade >= 80) return 3.0;
  if (grade >= 75) return 2.5;
  if (grade >= 70) return 2.0;
  if (grade >= 65) return 1.5;
  if (grade >= 60) return 1.0;
  return 0.0;
}

function getLetterGrade(gpa: number): string {
  if (gpa >= 3.7) return "A";
  if (gpa >= 3.3) return "B+";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.7) return "C+";
  if (gpa >= 2.3) return "C";
  if (gpa >= 2.0) return "D+";
  if (gpa >= 1.0) return "D";
  return "F";
}

// =============================================================================
// MAIN HANDLER
// =============================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid JSON in request body',
        'JSON غير صالح في جسم الطلب',
        400
      );
    }
    
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error("Validation errors:", errors);
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Validation failed: ${errors.join(', ')}`,
        'فشل التحقق من البيانات المدخلة',
        400,
        { errors }
      );
    }
    
    const { messages, mode, student_context } = parseResult.data;
    
    // Get API keys from environment | الحصول على مفاتيح API من البيئة
    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") || "https://api.openai.com/v1";

    if (!AI_API_KEY) {
      return createErrorResponse(
        'MISSING_API_KEY',
        'AI service is not configured',
        'خدمة الذكاء الاصطناعي غير مكونة',
        500
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get authenticated user from JWT
    let authenticatedStudent: AuthenticatedStudent | null = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Use service role client with the user's token to verify
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (user && !authError) {
        console.log("User authenticated:", user.id, user.email);
        authenticatedStudent = await getAuthenticatedStudent(supabase, user.id);
        console.log("Authenticated student:", authenticatedStudent?.student_id);
      } else if (authError) {
        console.log("Auth error:", authError.message);
      }
    }

    console.log(`Processing ${mode} chat request with ${messages.length} messages, student: ${authenticatedStudent?.student_id || 'none'}`);

    // Build context from student data
    let contextMessage = "";
    if (authenticatedStudent) {
      contextMessage = `
معلومات الطالب المتصل (يمكنك الوصول فقط لبياناته):
- الرقم الجامعي: ${authenticatedStudent.student_id}
- المعدل التراكمي: ${authenticatedStudent.gpa ?? 'غير محدد'}
- القسم: ${authenticatedStudent.department ?? 'غير محدد'}
- التخصص: ${authenticatedStudent.major ?? 'غير محدد'}
- السنة الدراسية: ${authenticatedStudent.year_level ?? 'غير محدد'}
- الساعات المكتملة: ${authenticatedStudent.total_credits ?? 'غير محدد'}
`;
    } else if (student_context) {
      contextMessage = `
معلومات الطالب (من السياق):
- المعدل التراكمي: ${student_context.gpa ?? 'غير محدد'}
- القسم: ${student_context.department ?? 'غير محدد'}
- السنة الدراسية: ${student_context.year_level ?? 'غير محدد'}
`;
    }

    // For agentic mode, we use non-streaming with tool calling loop
    if (mode === 'agentic') {
      const aiMessages: any[] = [
        { role: "system", content: AGENTIC_SYSTEM_PROMPT + contextMessage },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ];

      let finalResponse = '';
      let iterations = 0;
      const maxIterations = 5;

      // Tool calling loop
      while (iterations < maxIterations) {
        iterations++;
        console.log(`AI iteration ${iterations}`);

        // Call AI gateway | استدعاء بوابة الذكاء الاصطناعي
        const response = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: aiMessages,
            tools: TOOLS,
            tool_choice: "auto",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AI gateway error:", response.status, errorText);
          
          if (response.status === 429) {
            return createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests.', 'تم تجاوز الحد المسموح من الطلبات', 429);
          }
          if (response.status === 402) {
            return createErrorResponse('PAYMENT_REQUIRED', 'Please add credits.', 'يرجى إضافة رصيد', 402);
          }
          return createErrorResponse('AI_GATEWAY_ERROR', `AI error: ${response.status}`, 'خطأ في خدمة الذكاء الاصطناعي', 502);
        }

        const data = await response.json();
        console.log("AI response:", JSON.stringify(data, null, 2));

        const choice = data.choices?.[0];
        if (!choice) {
          return createErrorResponse('AI_GATEWAY_ERROR', 'No response from AI', 'لا يوجد رد من الذكاء الاصطناعي', 502);
        }

        const message = choice.message;

        // Check if AI wants to call tools
        if (message.tool_calls && message.tool_calls.length > 0) {
          console.log("AI requested tool calls:", message.tool_calls.length);
          
          // Add assistant message with tool calls
          aiMessages.push({
            role: "assistant",
            content: message.content || null,
            tool_calls: message.tool_calls,
          });

          // Execute each tool and add results
          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function?.name;
            const toolArgs = toolCall.function?.arguments;
            
            if (toolName && toolArgs) {
              try {
                const args = typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs;
                // Pass authenticatedStudent to tool execution
                const result = await executeTool(toolName, args, supabase, authenticatedStudent);
                
                console.log(`Tool ${toolName} result:`, JSON.stringify(result));
                
                aiMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(result),
                });
              } catch (e) {
                console.error(`Tool parse error:`, e);
                aiMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ error: "Failed to execute tool" }),
                });
              }
            }
          }

          // Continue the loop to get AI's response after tool execution
          continue;
        }

        // No more tool calls - we have the final response
        finalResponse = message.content || '';
        break;
      }

      if (!finalResponse) {
        finalResponse = "عذراً، لم أتمكن من الحصول على إجابة. يرجى المحاولة مرة أخرى.";
      }

      // Stream the final response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const words = finalResponse.split(' ');
          
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Simple/RAG mode - direct streaming without tool calling | الوضع البسيط/RAG - بث مباشر بدون استدعاء الأدوات
    const response = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: AGENTIC_SYSTEM_PROMPT + contextMessage },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests.', 'تم تجاوز الحد المسموح', 429);
      }
      if (response.status === 402) {
        return createErrorResponse('PAYMENT_REQUIRED', 'Please add credits.', 'يرجى إضافة رصيد', 402);
      }
      return createErrorResponse('AI_GATEWAY_ERROR', `AI error: ${response.status}`, 'خطأ في الذكاء الاصطناعي', 502);
    }

    // Transform the stream to our format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {
              controller.enqueue(encoder.encode(line + '\n'));
            }
          } else if (line === 'data: [DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          }
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Agentic chat error:", error);
    return createErrorResponse(
      'UNKNOWN_ERROR',
      error instanceof Error ? error.message : 'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      500
    );
  }
});
