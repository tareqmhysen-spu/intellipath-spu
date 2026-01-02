import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// ERROR HANDLING
// =============================================================================
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERR_001',
  ACTION_NOT_FOUND: 'ACTION_ERR_001',
  COURSE_NOT_FOUND: 'DATA_ERR_001',
  CALCULATION_ERROR: 'CALC_ERR_001',
  DATABASE_ERROR: 'DB_ERR_001',
  UNKNOWN_ERROR: 'UNKNOWN_ERR_001',
};

function createErrorResponse(code: string, message: string, message_ar: string, status: number, details?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({
      success: false,
      error: { code, message, message_ar, ...(details && { details }) }
    }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function createSuccessResponse(data: unknown) {
  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================
const GradeEntrySchema = z.object({
  course_code: z.string().max(20).optional(),
  grade: z.union([z.number().min(0).max(100), z.string().max(3)]),
  credits: z.number().min(1).max(10),
});

const CalculateGPASchema = z.object({
  grades: z.array(GradeEntrySchema).min(1).max(100),
});

const AnalyzePlanSchema = z.object({
  student_id: z.string().uuid(),
  department: z.string().min(1).max(100),
});

const SimulateDropSchema = z.object({
  student_id: z.string().uuid(),
  course_code: z.string().min(1).max(20),
  current_gpa: z.number().min(0).max(4),
  current_credits: z.number().min(0).max(500),
});

const SimulateRetakeSchema = z.object({
  current_gpa: z.number().min(0).max(4),
  current_credits: z.number().min(1).max(500),
  course_credits: z.number().min(1).max(10),
  old_grade: z.union([z.number().min(0).max(100), z.string().max(3)]),
  target_grade: z.union([z.number().min(0).max(100), z.string().max(3)]),
});

const ProjectGradesSchema = z.object({
  current_gpa: z.number().min(0).max(4),
  current_credits: z.number().min(0).max(500),
  scenarios: z.array(z.object({
    name: z.string().min(1).max(100),
    courses: z.array(z.object({
      code: z.string().max(20),
      expected_grade: z.number().min(0).max(4),
      credits: z.number().min(1).max(10),
    })).min(1).max(20),
  })).min(1).max(5),
});

const RiskAssessmentSchema = z.object({
  gpa: z.number().min(0).max(4),
  credits_completed: z.number().min(0).max(500).optional(),
  year_level: z.number().min(1).max(6).optional(),
  failed_courses: z.number().min(0).max(50).optional(),
});

const CriticalPathSchema = z.object({
  target_course: z.string().min(1).max(20),
  completed_courses: z.array(z.string().max(20)).max(100).optional(),
});

const RequestSchema = z.object({
  action: z.enum([
    'calculate_gpa',
    'analyze_plan',
    'simulate_drop',
    'simulate_retake',
    'project_grades',
    'get_risk_assessment',
    'get_critical_path'
  ]),
  data: z.record(z.unknown()),
});

// =============================================================================
// GRADE CONVERSION UTILITIES
// =============================================================================
const GRADE_POINTS: Record<string, number> = {
  'A': 4.0, 'A+': 4.0, 'A-': 3.7,
  'B+': 3.5, 'B': 3.0, 'B-': 2.7,
  'C+': 2.5, 'C': 2.0, 'C-': 1.7,
  'D+': 1.5, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

function letterToPoints(letter: string): number {
  return GRADE_POINTS[letter.toUpperCase().trim()] ?? 0;
}

function numberToPoints(grade: number): number {
  if (grade >= 90) return 4.0;
  if (grade >= 85) return 3.5;
  if (grade >= 80) return 3.0;
  if (grade >= 75) return 2.5;
  if (grade >= 70) return 2.0;
  if (grade >= 65) return 1.5;
  if (grade >= 60) return 1.0;
  return 0.0;
}

function pointsToLetter(points: number): string {
  if (points >= 3.7) return 'A';
  if (points >= 3.3) return 'B+';
  if (points >= 3.0) return 'B';
  if (points >= 2.7) return 'C+';
  if (points >= 2.3) return 'C';
  if (points >= 2.0) return 'D+';
  if (points >= 1.0) return 'D';
  return 'F';
}

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================
function calculateGPA(data: z.infer<typeof CalculateGPASchema>) {
  const { grades } = data;
  
  let totalPoints = 0;
  let totalCredits = 0;
  const distribution: Record<string, number> = {};
  
  for (const g of grades) {
    const points = typeof g.grade === 'string' 
      ? letterToPoints(g.grade) 
      : numberToPoints(g.grade);
    totalPoints += points * g.credits;
    totalCredits += g.credits;
    
    const letter = pointsToLetter(points);
    distribution[letter] = (distribution[letter] || 0) + 1;
  }
  
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  
  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
    letterGrade: pointsToLetter(gpa),
    gradeDistribution: distribution
  };
}

async function analyzePlan(data: z.infer<typeof AnalyzePlanSchema>, supabase: any) {
  const { student_id, department } = data;
  
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select(`course:courses(code, name, name_ar, credits, year_level), grade, status`)
    .eq('student_id', student_id)
    .eq('status', 'completed');
  
  if (enrollError) {
    throw new Error(`Database error: ${enrollError.message}`);
  }
  
  const { data: requiredCourses, error: courseError } = await supabase
    .from('courses')
    .select('code, name, name_ar, credits, year_level')
    .eq('department', department)
    .eq('is_active', true);
  
  if (courseError) {
    throw new Error(`Database error: ${courseError.message}`);
  }
  
  const completedCodes = new Set((enrollments || []).map((e: any) => e.course?.code).filter(Boolean));
  const remainingCourses = (requiredCourses || []).filter((c: any) => !completedCodes.has(c.code));
  
  const completedCredits = (enrollments || []).reduce((sum: number, e: any) => 
    sum + (e.course?.credits || 0), 0);
  const totalRequiredCredits = (requiredCourses || []).reduce((sum: number, c: any) => 
    sum + c.credits, 0);
  
  const recommendations: string[] = [];
  const warnings: string[] = [];
  
  if (remainingCourses.length > 0) {
    const nextCourses = remainingCourses.sort((a: any, b: any) => a.year_level - b.year_level).slice(0, 3);
    recommendations.push(`المقررات المقترحة: ${nextCourses.map((c: any) => c.name_ar || c.name).join('، ')}`);
  }
  
  const failedEnrollments = (enrollments || []).filter((e: any) => 
    (typeof e.grade === 'number' && e.grade < 60) || e.grade === 'F'
  );
  
  if (failedEnrollments.length > 0) {
    warnings.push(`لديك ${failedEnrollments.length} مقرر(ات) يجب إعادتها`);
  }
  
  return {
    completedCourses: enrollments?.length || 0,
    remainingCourses: remainingCourses.length,
    completedCredits,
    remainingCredits: Math.max(0, totalRequiredCredits - completedCredits),
    progressPercentage: totalRequiredCredits > 0 ? Math.round((completedCredits / totalRequiredCredits) * 100) : 0,
    recommendations,
    warnings
  };
}

async function simulateDrop(data: z.infer<typeof SimulateDropSchema>, supabase: any) {
  const { course_code } = data;
  
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, code, name, name_ar, credits')
    .eq('code', course_code.toUpperCase())
    .single();
  
  if (error || !course) {
    throw new Error(`Course not found: ${course_code}`);
  }
  
  const { data: dependents } = await supabase
    .from('course_prerequisites')
    .select('course:courses(code, name, name_ar)')
    .eq('prerequisite_id', course.id);
  
  const affectedCourses = (dependents || []).map((d: any) => d.course?.code).filter(Boolean);
  const graduationDelay = affectedCourses.length > 0 ? 1 : 0;
  
  return {
    impact: {
      gpaChange: 0,
      graduationDelay,
      affectedCourses,
      creditLoss: course.credits
    },
    recommendations: [
      graduationDelay > 0 ? 'الانسحاب سيؤثر على المقررات التالية' : 'الانسحاب لن يسبب تأخيراً',
      'راجع المرشد الأكاديمي قبل اتخاذ القرار'
    ],
    warnings: affectedCourses.length > 0 ? [`متطلب سابق لـ ${affectedCourses.length} مقرر(ات)`] : []
  };
}

function simulateRetake(data: z.infer<typeof SimulateRetakeSchema>) {
  const { current_gpa, current_credits, course_credits, old_grade, target_grade } = data;
  
  const oldPoints = typeof old_grade === 'string' ? letterToPoints(old_grade) : numberToPoints(old_grade);
  const targetPoints = typeof target_grade === 'string' ? letterToPoints(target_grade) : numberToPoints(target_grade);
  
  const totalOldPoints = current_gpa * current_credits;
  const gradeImprovement = (targetPoints - oldPoints) * course_credits;
  const newGPA = (totalOldPoints + gradeImprovement) / current_credits;
  
  return {
    impact: {
      newGpa: Math.round(Math.max(0, Math.min(4, newGPA)) * 100) / 100,
      gpaImprovement: Math.round((newGPA - current_gpa) * 100) / 100
    },
    recommendations: [
      targetPoints > oldPoints ? 'إعادة المقرر ستحسن معدلك' : 'تأكد من استعدادك قبل الإعادة'
    ]
  };
}

function projectGrades(data: z.infer<typeof ProjectGradesSchema>) {
  const { current_gpa, current_credits, scenarios } = data;
  
  const results = scenarios.map((scenario) => {
    let scenarioPoints = 0;
    let scenarioCredits = 0;
    
    for (const course of scenario.courses) {
      scenarioPoints += course.expected_grade * course.credits;
      scenarioCredits += course.credits;
    }
    
    const totalPoints = (current_gpa * current_credits) + scenarioPoints;
    const totalCredits = current_credits + scenarioCredits;
    const projectedGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    return {
      name: scenario.name,
      projectedGpa: Math.round(projectedGPA * 100) / 100,
      gpaChange: Math.round((projectedGPA - current_gpa) * 100) / 100,
      letterGrade: pointsToLetter(projectedGPA)
    };
  });
  
  results.sort((a, b) => b.projectedGpa - a.projectedGpa);
  
  return {
    scenarios: results,
    bestScenario: results[0]?.name,
    worstScenario: results[results.length - 1]?.name
  };
}

function assessRisk(data: z.infer<typeof RiskAssessmentSchema>) {
  const { gpa, credits_completed = 0, year_level = 1, failed_courses = 0 } = data;
  
  let riskScore = 0;
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  const factors: Array<{ name: string; name_en: string; weight: number; description: string }> = [];
  const recommendations: string[] = [];
  
  // GPA Risk
  if (gpa < 2.0) {
    riskScore += 40;
    factors.push({ name: 'معدل منخفض جداً', name_en: 'Very Low GPA', weight: 40, description: 'المعدل أقل من الحد الأدنى' });
    recommendations.push('التواصل مع المرشد الأكاديمي فوراً');
  } else if (gpa < 2.5) {
    riskScore += 25;
    factors.push({ name: 'معدل منخفض', name_en: 'Low GPA', weight: 25, description: 'المعدل يحتاج تحسين' });
    recommendations.push('التركيز على تحسين الأداء');
  }
  
  // Credit Progress
  const expectedCredits = year_level * 30;
  if (credits_completed < expectedCredits * 0.7) {
    riskScore += 20;
    factors.push({ name: 'تأخر في الساعات', name_en: 'Behind on Credits', weight: 20, description: 'الساعات أقل من المتوقع' });
    recommendations.push('زيادة الساعات المسجلة');
  }
  
  // Failed Courses
  if (failed_courses > 0) {
    riskScore += Math.min(30, failed_courses * 10);
    factors.push({ name: 'مقررات راسبة', name_en: 'Failed Courses', weight: failed_courses * 10, description: `${failed_courses} مقرر(ات)` });
    recommendations.push('إعادة المقررات الراسبة');
  }
  
  riskScore = Math.min(100, riskScore);
  if (riskScore >= 50) riskLevel = 'critical';
  else if (riskScore >= 35) riskLevel = 'high';
  else if (riskScore >= 20) riskLevel = 'medium';
  
  return {
    riskLevel,
    riskScore,
    factors,
    recommendations,
    predictedGpa: Math.max(0, Math.min(4, gpa + (riskScore > 30 ? -0.2 : 0.1)))
  };
}

async function getCriticalPath(data: z.infer<typeof CriticalPathSchema>, supabase: any) {
  const { target_course, completed_courses = [] } = data;
  
  const { data: course, error } = await supabase
    .from('courses')
    .select(`*, prerequisites:course_prerequisites(prerequisite:courses!course_prerequisites_prerequisite_id_fkey(code, name, name_ar, credits, year_level))`)
    .eq('code', target_course.toUpperCase())
    .single();
  
  if (error || !course) {
    throw new Error(`Course not found: ${target_course}`);
  }
  
  const completedSet = new Set(completed_courses.map(c => c.toUpperCase()));
  const path: any[] = [];
  
  for (const prereq of course.prerequisites || []) {
    if (prereq.prerequisite && !completedSet.has(prereq.prerequisite.code)) {
      path.push({
        code: prereq.prerequisite.code,
        name: prereq.prerequisite.name,
        name_ar: prereq.prerequisite.name_ar,
        credits: prereq.prerequisite.credits,
        semester: prereq.prerequisite.year_level
      });
    }
  }
  
  path.push({
    code: course.code,
    name: course.name,
    name_ar: course.name_ar,
    credits: course.credits,
    semester: path.length > 0 ? Math.max(...path.map(p => p.semester)) + 1 : 1
  });
  
  return {
    path,
    totalSemesters: Math.ceil(path.length / 4),
    totalCredits: path.reduce((sum, p) => sum + p.credits, 0)
  };
}

// =============================================================================
// MAIN HANDLER
// =============================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid JSON', 'JSON غير صالح', 400);
    }
    
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 'فشل التحقق', 400, { errors });
    }
    
    const { action, data } = parseResult.data;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`Processing action: ${action}`);

    let result: unknown;

    switch (action) {
      case 'calculate_gpa': {
        const validated = CalculateGPASchema.safeParse(data);
        if (!validated.success) {
          return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid grades data', 'بيانات الدرجات غير صالحة', 400);
        }
        result = calculateGPA(validated.data);
        break;
      }
      case 'analyze_plan': {
        const validated = AnalyzePlanSchema.safeParse(data);
        if (!validated.success) {
          return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid plan data', 'بيانات الخطة غير صالحة', 400);
        }
        result = await analyzePlan(validated.data, supabase);
        break;
      }
      case 'simulate_drop': {
        const validated = SimulateDropSchema.safeParse(data);
        if (!validated.success) {
          return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid simulation data', 'بيانات المحاكاة غير صالحة', 400);
        }
        result = await simulateDrop(validated.data, supabase);
        break;
      }
      case 'simulate_retake': {
        const validated = SimulateRetakeSchema.safeParse(data);
        if (!validated.success) {
          return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid retake data', 'بيانات الإعادة غير صالحة', 400);
        }
        result = simulateRetake(validated.data);
        break;
      }
      case 'project_grades': {
        const validated = ProjectGradesSchema.safeParse(data);
        if (!validated.success) {
          return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid projection data', 'بيانات التوقعات غير صالحة', 400);
        }
        result = projectGrades(validated.data);
        break;
      }
      case 'get_risk_assessment': {
        const validated = RiskAssessmentSchema.safeParse(data);
        if (!validated.success) {
          return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid risk data', 'بيانات المخاطر غير صالحة', 400);
        }
        result = assessRisk(validated.data);
        break;
      }
      case 'get_critical_path': {
        const validated = CriticalPathSchema.safeParse(data);
        if (!validated.success) {
          return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid path data', 'بيانات المسار غير صالحة', 400);
        }
        result = await getCriticalPath(validated.data, supabase);
        break;
      }
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Academic analysis error:", error);
    return createErrorResponse(
      ERROR_CODES.UNKNOWN_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      'حدث خطأ غير متوقع',
      500
    );
  }
});
