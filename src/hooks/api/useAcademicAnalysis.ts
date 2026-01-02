import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GradeEntry {
  course_code?: string;
  grade: number | string;
  credits: number;
}

interface GPAResult {
  gpa: number;
  totalCredits: number;
  totalPoints: number;
  letterGrade: string;
  gradeDistribution?: Record<string, number>;
}

interface PlanAnalysis {
  completedCourses: number;
  remainingCourses: number;
  completedCredits: number;
  remainingCredits: number;
  progressPercentage: number;
  recommendations: string[];
  warnings: string[];
}

interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: { name: string; weight: number; description: string }[];
  recommendations: string[];
  predictedGpa: number;
}

interface DropSimulation {
  impact: {
    gpaChange: number;
    graduationDelay: number;
    affectedCourses: string[];
    creditLoss: number;
  };
  recommendations: string[];
  warnings: string[];
}

interface RetakeSimulation {
  impact: {
    newGpa: number;
    gpaImprovement: number;
  };
  recommendations: string[];
}

interface GradeProjection {
  scenarios: {
    name: string;
    projectedGpa: number;
    gpaChange: number;
    letterGrade: string;
  }[];
  bestScenario: string;
  worstScenario: string;
}

interface CriticalPath {
  path: {
    code: string;
    name: string;
    name_ar: string;
    credits: number;
    semester: number;
  }[];
  totalSemesters: number;
  totalCredits: number;
}

const ANALYSIS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academic-analysis`;

export function useAcademicAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const callAnalysisAPI = useCallback(async (action: string, data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(ANALYSIS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      return result.data;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في التحليل',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Calculate GPA
  const calculateGPA = useCallback(async (grades: GradeEntry[]): Promise<GPAResult> => {
    return callAnalysisAPI('calculate_gpa', { grades });
  }, [callAnalysisAPI]);

  // Analyze academic plan
  const analyzePlan = useCallback(async (
    studentId: string,
    department: string
  ): Promise<PlanAnalysis> => {
    return callAnalysisAPI('analyze_plan', { student_id: studentId, department });
  }, [callAnalysisAPI]);

  // Simulate dropping a course
  const simulateDrop = useCallback(async (
    studentId: string,
    courseCode: string,
    currentGpa: number,
    currentCredits: number
  ): Promise<DropSimulation> => {
    return callAnalysisAPI('simulate_drop', {
      student_id: studentId,
      course_code: courseCode,
      current_gpa: currentGpa,
      current_credits: currentCredits,
    });
  }, [callAnalysisAPI]);

  // Simulate retaking a course
  const simulateRetake = useCallback(async (
    currentGpa: number,
    currentCredits: number,
    courseCredits: number,
    oldGrade: number | string,
    targetGrade: number | string
  ): Promise<RetakeSimulation> => {
    return callAnalysisAPI('simulate_retake', {
      current_gpa: currentGpa,
      current_credits: currentCredits,
      course_credits: courseCredits,
      old_grade: oldGrade,
      target_grade: targetGrade,
    });
  }, [callAnalysisAPI]);

  // Project grades for scenarios
  const projectGrades = useCallback(async (
    currentGpa: number,
    currentCredits: number,
    scenarios: {
      name: string;
      courses: { code: string; expected_grade: number; credits: number }[];
    }[]
  ): Promise<GradeProjection> => {
    return callAnalysisAPI('project_grades', {
      current_gpa: currentGpa,
      current_credits: currentCredits,
      scenarios,
    });
  }, [callAnalysisAPI]);

  // Get risk assessment
  const getRiskAssessment = useCallback(async (
    gpa: number,
    creditsCompleted?: number,
    yearLevel?: number,
    failedCourses?: number
  ): Promise<RiskAssessment> => {
    // Validate GPA - must be a valid number between 0 and 4
    const validGpa = typeof gpa === 'number' && !isNaN(gpa) ? Math.max(0, Math.min(4, gpa)) : 0;
    
    // Build data object, only including defined values
    const data: Record<string, number> = { gpa: validGpa };
    if (typeof creditsCompleted === 'number' && !isNaN(creditsCompleted)) {
      data.credits_completed = Math.max(0, creditsCompleted);
    }
    if (typeof yearLevel === 'number' && !isNaN(yearLevel)) {
      data.year_level = Math.max(1, Math.min(6, yearLevel));
    }
    if (typeof failedCourses === 'number' && !isNaN(failedCourses)) {
      data.failed_courses = Math.max(0, failedCourses);
    }
    
    return callAnalysisAPI('get_risk_assessment', data);
  }, [callAnalysisAPI]);

  // Get critical path to a course
  const getCriticalPath = useCallback(async (
    targetCourse: string,
    completedCourses: string[]
  ): Promise<CriticalPath> => {
    return callAnalysisAPI('get_critical_path', {
      target_course: targetCourse,
      completed_courses: completedCourses,
    });
  }, [callAnalysisAPI]);

  // Local GPA calculation (no API call)
  const calculateGPALocal = useCallback((grades: GradeEntry[]): GPAResult => {
    if (!grades || grades.length === 0) {
      return { gpa: 0, totalCredits: 0, totalPoints: 0, letterGrade: 'N/A' };
    }

    const gradeToPoints = (grade: number | string): number => {
      if (typeof grade === 'string') {
        const mapping: Record<string, number> = {
          'A': 4.0, 'A+': 4.0, 'B+': 3.5, 'B': 3.0,
          'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0,
        };
        return mapping[grade.toUpperCase()] || 0;
      }
      if (grade >= 90) return 4.0;
      if (grade >= 85) return 3.5;
      if (grade >= 80) return 3.0;
      if (grade >= 75) return 2.5;
      if (grade >= 70) return 2.0;
      if (grade >= 65) return 1.5;
      if (grade >= 60) return 1.0;
      return 0.0;
    };

    let totalPoints = 0;
    let totalCredits = 0;

    for (const g of grades) {
      const points = gradeToPoints(g.grade);
      totalPoints += points * g.credits;
      totalCredits += g.credits;
    }

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    const getLetterGrade = (gpa: number): string => {
      if (gpa >= 3.7) return 'A';
      if (gpa >= 3.3) return 'B+';
      if (gpa >= 3.0) return 'B';
      if (gpa >= 2.7) return 'C+';
      if (gpa >= 2.3) return 'C';
      if (gpa >= 2.0) return 'D+';
      if (gpa >= 1.0) return 'D';
      return 'F';
    };

    return {
      gpa: Math.round(gpa * 100) / 100,
      totalCredits,
      totalPoints: Math.round(totalPoints * 100) / 100,
      letterGrade: getLetterGrade(gpa),
    };
  }, []);

  return {
    isLoading,
    calculateGPA,
    calculateGPALocal,
    analyzePlan,
    simulateDrop,
    simulateRetake,
    projectGrades,
    getRiskAssessment,
    getCriticalPath,
  };
}
