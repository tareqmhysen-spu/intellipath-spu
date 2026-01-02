import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAcademicRecord } from './useAcademicRecord';

export interface Course {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  credits: number;
  department: string;
  year_level: number;
  semester: string | null;
  difficulty_rating: number | null;
}

export function useSimulatorData() {
  // Get real academic data from the centralized hook
  const { summary, allCourses, isLoading: academicLoading, studentId } = useAcademicRecord();

  // Fetch all available courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['simulator-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('year_level')
        .order('name');

      if (error) throw error;
      return data as Course[];
    },
  });

  // Get courses the student has completed (from academic record)
  const completedCourseCodes = allCourses
    .filter(c => c.isPassed)
    .map(c => c.course_code);

  // Get available courses (not yet taken or failed ones that can be retaken)
  const availableCourses = courses?.filter(c => 
    !completedCourseCodes.includes(c.code)
  ) || [];

  // Use accurate GPA and credits from academic summary
  // These are calculated with the equivalency reset logic
  const currentGpa = summary?.cumulativeGPA || 0;
  
  // For GPA calculation, we need the post-equivalency hours (not including P grades)
  // This is the denominator for the cumulative GPA calculation
  const gpaEligibleHours = summary?.postEquivalencyHours || 0;
  
  // Total completed hours (including P grades equivalency)
  const completedCredits = summary?.totalCompletedHours || 0;

  return {
    studentId,
    courses: courses || [],
    availableCourses,
    completedCourses: allCourses.filter(c => c.isPassed),
    // Real GPA from academic record (post-equivalency only)
    currentGpa,
    // Total completed hours (including equivalency)
    completedCredits,
    // Hours that count towards GPA calculation
    gpaEligibleHours,
    // Equivalency info
    equivalencyHours: summary?.equivalencyHours || 0,
    hasEquivalency: summary?.hasEquivalency || false,
    isLoading: academicLoading || coursesLoading,
  };
}
