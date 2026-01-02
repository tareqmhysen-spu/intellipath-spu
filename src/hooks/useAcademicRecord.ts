import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export interface AcademicRecord {
  id: string;
  student_id: string;
  college: string | null;
  major: string | null;
  academic_year: string;
  semester: string;
  course_code: string;
  course_name: string;
  course_credits: number | null;
  final_grade: number | null;
  letter_grade: string | null;
  grade_points: number | null;
  total_completed_hours: number | null;
  cumulative_gpa_percent: number | null;
  cumulative_gpa_points: number | null;
  academic_warning: string | null;
  permanent_status: string | null;
  study_mode: string | null;
  baccalaureate_type: string | null;
  baccalaureate_country: string | null;
  certificate_score: number | null;
  certificate_average: number | null;
  has_ministry_scholarship: boolean;
}

export interface CourseRecord {
  course_code: string;
  course_name: string;
  credits: number;
  final_grade: number | null;
  letter_grade: string | null;
  grade_points: number;
  academic_year: string;
  semester: string;
  isExcludedFromGPA: boolean; // P or 60 grade
  isFailed: boolean;
  isWithdrawn: boolean;
  isPassed: boolean;
  isEquivalent: boolean; // معادلة - P grade
}

export interface SemesterSummary {
  academic_year: string;
  semester: string;
  courses: CourseRecord[];
  semesterGPA: number;
  semesterCredits: number;
  earnedCredits: number;
  isEquivalencySemester: boolean; // This semester contains P grades
}

export interface AcademicSummary {
  studentId: string;
  college: string;
  major: string;
  // VALID earned hours (after equivalency reset, excluding failed)
  totalCompletedHours: number;
  // Hours from P grades (equivalency base)
  equivalencyHours: number;
  // Hours earned AFTER equivalency
  postEquivalencyHours: number;
  requiredHours: number; // 173 ساعة
  remainingHours: number;
  // GPA (ONLY from post-equivalency courses, excluding P)
  cumulativeGPA: number;
  cumulativePercentage: number;
  // Counts
  coursesCount: number;
  passedCourses: number;
  failedCourses: number;
  withdrawnCourses: number;
  equivalentCourses: number; // P grades (معادلة)
  // Status
  academicWarning: string | null;
  permanentStatus: string | null;
  isGraduationEligible: boolean; // GPA >= 2.0 and hours >= 173
  progressPercentage: number;
  // Semesters breakdown
  semesters: SemesterSummary[];
  // Equivalency info
  equivalencySemester: string | null; // "2022/2023|الفصل الأول"
  hasEquivalency: boolean;
}

// Grade points mapping - Standard 4.0 scale
const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0, 'W': 0, 'P': 0,
};

/**
 * CRITICAL RULES - EQUIVALENCY RESET LOGIC:
 * 
 * 1. P grade (60) = Equivalency courses (معادلة من الخطة القديمة)
 *    - NOT counted in GPA calculation
 *    - Hours ARE counted towards graduation
 *    - Represents a "reset point" - previous semesters are IGNORED
 * 
 * 2. When a semester has P grades:
 *    - ALL courses from PREVIOUS semesters are IGNORED
 *    - The P grades become the new "base" completed hours
 *    - Only courses AFTER the equivalency semester contribute to GPA
 * 
 * 3. Failed courses (F or <50) = NOT counted in earned hours
 * 4. W (Withdrawn) = NOT counted in GPA or earned hours
 * 5. Passing grade = D (50) or above
 */

const MINIMUM_PASSING_GRADE = 50;

function isPassingGrade(letterGrade: string | null, finalGrade: number | null): boolean {
  if (!letterGrade) return false;
  if (letterGrade === 'W' || letterGrade === 'F') return false;
  if (letterGrade === 'P') return true; // P is passing (equivalency)
  if (finalGrade !== null && finalGrade < MINIMUM_PASSING_GRADE) return false;
  return true;
}

function isExcludedFromGPA(letterGrade: string | null, finalGrade: number | null): boolean {
  if (!letterGrade) return true;
  if (letterGrade === 'P') return true;
  if (letterGrade === 'W') return true;
  if (finalGrade === 60) return true; // 60 exactly is treated as P
  return false;
}

function isFailed(letterGrade: string | null, finalGrade: number | null): boolean {
  if (letterGrade === 'F') return true;
  if (finalGrade !== null && finalGrade < MINIMUM_PASSING_GRADE && letterGrade !== 'P') return true;
  return false;
}

function isWithdrawn(letterGrade: string | null): boolean {
  return letterGrade === 'W';
}

function isPGrade(letterGrade: string | null, finalGrade: number | null): boolean {
  if (letterGrade === 'P') return true;
  if (finalGrade === 60) return true;
  return false;
}

// Sort semesters chronologically
function sortSemesters(a: { academic_year: string; semester: string }, b: { academic_year: string; semester: string }): number {
  // Compare years first
  if (a.academic_year !== b.academic_year) {
    return a.academic_year.localeCompare(b.academic_year);
  }
  // Then compare semesters (الأول < الثاني < الصيفي)
  const semesterOrder: Record<string, number> = {
    'الفصل الأول': 1,
    'الفصل الثاني': 2,
    'الفصل الصيفي': 3,
  };
  return (semesterOrder[a.semester] || 0) - (semesterOrder[b.semester] || 0);
}

export function useAcademicRecord() {
  const { user } = useAuthStore();

  // First get the student_id from the students table
  const {
    data: studentData,
    isLoading: studentLoading,
    refetch: refetchStudent,
  } = useQuery({
    queryKey: ['student-link', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, department, major, gpa, total_credits, year_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch academic records from student_academic_records table
  const {
    data: records,
    isLoading: recordsLoading,
    error,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: ['academic-records', studentData?.student_id],
    queryFn: async () => {
      if (!studentData?.student_id) return [];

      const { data, error } = await supabase
        .from('student_academic_records')
        .select('*')
        .eq('student_id', studentData.student_id)
        .order('academic_year', { ascending: true })
        .order('semester', { ascending: true });

      if (error) throw error;
      return data as AcademicRecord[];
    },
    enabled: !!studentData?.student_id,
    staleTime: 1000 * 60 * 5,
  });

  // Calculate academic summary with EQUIVALENCY RESET LOGIC
  const summary: AcademicSummary | null = records && records.length > 0 ? (() => {
    const REQUIRED_HOURS = 173;
    
    // Group records by semester
    const semesterMap = new Map<string, AcademicRecord[]>();
    records.forEach(r => {
      const key = `${r.academic_year}|${r.semester}`;
      if (!semesterMap.has(key)) {
        semesterMap.set(key, []);
      }
      semesterMap.get(key)!.push(r);
    });

    // Sort semesters chronologically
    const sortedSemesters = Array.from(semesterMap.keys()).sort((a, b) => {
      const [yearA, semA] = a.split('|');
      const [yearB, semB] = b.split('|');
      return sortSemesters({ academic_year: yearA, semester: semA }, { academic_year: yearB, semester: semB });
    });

    // Find the EQUIVALENCY SEMESTER (the one with the BIGGEST total of P-grade credits)
    let equivalencySemesterKey: string | null = null;
    let maxEquivalencyCredits = 0;

    for (const key of sortedSemesters) {
      const semesterRecords = semesterMap.get(key)!;
      const pCredits = semesterRecords
        .filter(r => isPGrade(r.letter_grade, r.final_grade))
        .reduce((sum, r) => sum + (r.course_credits || 0), 0);

      if (pCredits > maxEquivalencyCredits) {
        equivalencySemesterKey = key;
        maxEquivalencyCredits = pCredits;
      }
    }

    // Calculate equivalency hours (from P grades in equivalency semester)
    const equivalencyHours = maxEquivalencyCredits;
    let equivalentCoursesCount = 0;
    if (equivalencySemesterKey) {
      const equivalencySemesterRecords = semesterMap.get(equivalencySemesterKey)!;
      equivalentCoursesCount = equivalencySemesterRecords.filter(r => isPGrade(r.letter_grade, r.final_grade)).length;
    }

    // Determine which semesters to include in calculations
    const semestersToInclude = equivalencySemesterKey
      ? sortedSemesters.slice(sortedSemesters.indexOf(equivalencySemesterKey))
      : sortedSemesters;

    // Pick the most reliable "latest summary" record for cumulative values
    const latestSemesterKey = sortedSemesters[sortedSemesters.length - 1] || null;
    const latestSemesterRecords = latestSemesterKey ? semesterMap.get(latestSemesterKey)! : [];
    const latestSummaryRecord =
      latestSemesterRecords.find(r => r.course_code === '__SUMMARY__') ||
      latestSemesterRecords.find(
        r => r.total_completed_hours !== null || r.cumulative_gpa_points !== null || r.cumulative_gpa_percent !== null
      ) ||
      records[records.length - 1];

    // Get unique courses (latest record for each course) from included semesters
    // Skip synthetic __SUMMARY__ rows
    const courseMap = new Map<string, AcademicRecord>();
    for (const key of semestersToInclude) {
      const semesterRecords = semesterMap.get(key)!;
      semesterRecords.forEach(r => {
        if (r.course_code === '__SUMMARY__') return;
        // Always take the latest record for each course
        courseMap.set(r.course_code, r);
      });
    }

    const uniqueCourses = Array.from(courseMap.values());

    // Process each course
    const processedCourses: CourseRecord[] = uniqueCourses.map(c => ({
      course_code: c.course_code,
      course_name: c.course_name,
      credits: c.course_credits || 0,
      final_grade: c.final_grade,
      letter_grade: c.letter_grade,
      grade_points: GRADE_POINTS[c.letter_grade || ''] ?? 0,
      academic_year: c.academic_year,
      semester: c.semester,
      isExcludedFromGPA: isExcludedFromGPA(c.letter_grade, c.final_grade),
      isFailed: isFailed(c.letter_grade, c.final_grade),
      isWithdrawn: isWithdrawn(c.letter_grade),
      isPassed: isPassingGrade(c.letter_grade, c.final_grade),
      isEquivalent: isPGrade(c.letter_grade, c.final_grade),
    }));

    // Separate categories
    const passedCourses = processedCourses.filter(c => c.isPassed && !c.isWithdrawn);
    const failedCourses = processedCourses.filter(c => c.isFailed);
    const withdrawnCourses = processedCourses.filter(c => c.isWithdrawn);

    // Courses that count towards GPA (passed, NOT P grades, NOT withdrawn)
    const gpaEligibleCourses = passedCourses.filter(c => !c.isExcludedFromGPA);

    // Calculate post-equivalency earned hours (passed courses that are NOT P grades)
    const postEquivalencyHours = passedCourses
      .filter(c => !c.isEquivalent)
      .reduce((sum, c) => sum + c.credits, 0);

    // Total completed hours = equivalency hours + post-equivalency passed hours
    let totalCompletedHours = equivalencyHours + postEquivalencyHours;

    // Calculate GPA (ONLY from post-equivalency courses that are not P grades)
    let totalGradePoints = 0;
    let totalCreditsForGPA = 0;

    gpaEligibleCourses.forEach(c => {
      const points = GRADE_POINTS[c.letter_grade || ''] ?? 0;
      totalGradePoints += points * c.credits;
      totalCreditsForGPA += c.credits;
    });

    let cumulativeGPA = totalCreditsForGPA > 0
      ? totalGradePoints / totalCreditsForGPA
      : 0;

    // Prefer official cumulative values from the latest summary (when available)
    const officialTotalHours = latestSummaryRecord?.total_completed_hours ?? null;
    const officialCumulativeGpa = latestSummaryRecord?.cumulative_gpa_points ?? null;
    const officialCumulativePercent = latestSummaryRecord?.cumulative_gpa_percent ?? null;

    if (typeof officialTotalHours === 'number' && officialTotalHours > 0) {
      totalCompletedHours = officialTotalHours;
    }
    if (typeof officialCumulativeGpa === 'number' && officialCumulativeGpa > 0) {
      cumulativeGPA = officialCumulativeGpa;
    }

    // Build semester summaries
    const semesters: SemesterSummary[] = semestersToInclude.map(key => {
      const [academic_year, semester] = key.split('|');
      const semesterRecords = semesterMap.get(key)!;

      const courses: CourseRecord[] = semesterRecords
        .filter(c => c.course_code !== '__SUMMARY__')
        .map(c => ({
          course_code: c.course_code,
          course_name: c.course_name,
          credits: c.course_credits || 0,
          final_grade: c.final_grade,
          letter_grade: c.letter_grade,
          grade_points: GRADE_POINTS[c.letter_grade || ''] ?? 0,
          academic_year: c.academic_year,
          semester: c.semester,
          isExcludedFromGPA: isExcludedFromGPA(c.letter_grade, c.final_grade),
          isFailed: isFailed(c.letter_grade, c.final_grade),
          isWithdrawn: isWithdrawn(c.letter_grade),
          isPassed: isPassingGrade(c.letter_grade, c.final_grade),
          isEquivalent: isPGrade(c.letter_grade, c.final_grade),
        }));

      const gpaEligible = courses.filter(c => c.isPassed && !c.isExcludedFromGPA);
      const semesterGPAPoints = gpaEligible.reduce((sum, c) => sum + (c.grade_points * c.credits), 0);
      const semesterGPACredits = gpaEligible.reduce((sum, c) => sum + c.credits, 0);

      return {
        academic_year,
        semester,
        courses,
        semesterGPA: semesterGPACredits > 0 ? semesterGPAPoints / semesterGPACredits : 0,
        semesterCredits: courses.reduce((sum, c) => sum + c.credits, 0),
        earnedCredits: courses.filter(c => c.isPassed)
          .reduce((sum, c) => sum + c.credits, 0),
        isEquivalencySemester: key === equivalencySemesterKey,
      };
    });

    // Progress based on total completed hours
    const progressPercentage = Math.min((totalCompletedHours / REQUIRED_HOURS) * 100, 100);

    return {
      studentId: studentData!.student_id,
      college: latestSummaryRecord?.college || 'كلية الهندسة',
      major: latestSummaryRecord?.major || studentData?.major || 'غير محدد',
      totalCompletedHours,
      equivalencyHours,
      postEquivalencyHours,
      requiredHours: REQUIRED_HOURS,
      remainingHours: Math.max(REQUIRED_HOURS - totalCompletedHours, 0),
      cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
      cumulativePercentage: typeof officialCumulativePercent === 'number'
        ? officialCumulativePercent
        : (cumulativeGPA / 4.0) * 100,
      coursesCount: uniqueCourses.length,
      passedCourses: passedCourses.length,
      failedCourses: failedCourses.length,
      withdrawnCourses: withdrawnCourses.length,
      equivalentCourses: equivalentCoursesCount,
      academicWarning: latestSummaryRecord?.academic_warning ?? null,
      permanentStatus: latestSummaryRecord?.permanent_status ?? null,
      isGraduationEligible: cumulativeGPA >= 2.0 && totalCompletedHours >= REQUIRED_HOURS,
      progressPercentage,
      semesters,
      equivalencySemester: equivalencySemesterKey,
      hasEquivalency: !!equivalencySemesterKey,
    };
  })() : null;

  // Get all processed courses for other components
  const allCourses: CourseRecord[] = records && summary ? (() => {
    // Only return courses from the included semesters (post-equivalency)
    const courseMap = new Map<string, AcademicRecord>();
    
    // Group by semester first
    const semesterMap = new Map<string, AcademicRecord[]>();
    records.forEach(r => {
      const key = `${r.academic_year}|${r.semester}`;
      if (!semesterMap.has(key)) {
        semesterMap.set(key, []);
      }
      semesterMap.get(key)!.push(r);
    });

    // Sort and filter semesters
    const sortedSemesters = Array.from(semesterMap.keys()).sort((a, b) => {
      const [yearA, semA] = a.split('|');
      const [yearB, semB] = b.split('|');
      return sortSemesters({ academic_year: yearA, semester: semA }, { academic_year: yearB, semester: semB });
    });

    // Find equivalency semester (the one with max P credits)
    let equivalencySemesterKey: string | null = null;
    let maxPCredits = 0;
    for (const key of sortedSemesters) {
      const semesterRecords = semesterMap.get(key)!;
      const pCredits = semesterRecords
        .filter(r => isPGrade(r.letter_grade, r.final_grade))
        .reduce((sum, r) => sum + (r.course_credits || 0), 0);
      if (pCredits > maxPCredits) {
        equivalencySemesterKey = key;
        maxPCredits = pCredits;
      }
    }

    // Include only from equivalency semester onward
    const semestersToInclude = equivalencySemesterKey
      ? sortedSemesters.slice(sortedSemesters.indexOf(equivalencySemesterKey))
      : sortedSemesters;

    for (const key of semestersToInclude) {
      const semesterRecords = semesterMap.get(key)!;
      semesterRecords.forEach(r => {
        if (r.course_code === '__SUMMARY__') return;
        courseMap.set(r.course_code, r);
      });
    }

    return Array.from(courseMap.values()).map(c => ({
      course_code: c.course_code,
      course_name: c.course_name,
      credits: c.course_credits || 0,
      final_grade: c.final_grade,
      letter_grade: c.letter_grade,
      grade_points: GRADE_POINTS[c.letter_grade || ''] ?? 0,
      academic_year: c.academic_year,
      semester: c.semester,
      isExcludedFromGPA: isExcludedFromGPA(c.letter_grade, c.final_grade),
      isFailed: isFailed(c.letter_grade, c.final_grade),
      isWithdrawn: isWithdrawn(c.letter_grade),
      isPassed: isPassingGrade(c.letter_grade, c.final_grade),
      isEquivalent: isPGrade(c.letter_grade, c.final_grade),
    }));
  })() : [];

  const refetchAll = async (): Promise<void> => {
    await Promise.all([refetchStudent(), refetchRecords()]);
  };

  return {
    // Student data
    studentId: studentData?.student_id || null,
    studentDbId: studentData?.id || null,
    department: studentData?.department || null,
    yearLevel: studentData?.year_level || 1,
    // Raw records
    records: records || [],
    // Processed data
    allCourses,
    summary,
    // Status
    isLoading: studentLoading || recordsLoading,
    error,
    refetch: refetchAll,
    hasAcademicRecord: records && records.length > 0,
    // Helper functions for other components
    isExcludedFromGPA,
    isFailed,
    isWithdrawn,
    isPGrade,
    isPassingGrade,
    GRADE_POINTS,
  };
}

// Export helper functions for use in other components
export { isExcludedFromGPA, isFailed, isWithdrawn, isPGrade, isPassingGrade, GRADE_POINTS };
