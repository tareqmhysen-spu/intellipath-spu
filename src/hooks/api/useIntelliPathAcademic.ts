import { useState, useCallback } from 'react';
import { academicApi, simulatorApi } from '@/api';
import type {
  GPAResponse,
  AcademicPlanAnalysis,
  CriticalPathResponse,
  CoursePrerequisites,
  DropSimulationResponse,
  RetakeSimulationResponse,
  GradeProjectionResponse,
  GradeEntry,
} from '@/api/types';
import { useToast } from '@/hooks/use-toast';

export function useIntelliPathAcademic() {
  const [gpaData, setGpaData] = useState<GPAResponse | null>(null);
  const [planAnalysis, setPlanAnalysis] = useState<AcademicPlanAnalysis | null>(null);
  const [criticalPath, setCriticalPath] = useState<CriticalPathResponse | null>(null);
  const [prerequisites, setPrerequisites] = useState<CoursePrerequisites | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // GPA Calculation
  const calculateGPA = useCallback(async (grades?: GradeEntry[]) => {
    setIsLoading(true);
    try {
      const response = grades 
        ? await academicApi.calculateGPAWithGrades({ grades })
        : await academicApi.calculateGPA();
      setGpaData(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حساب المعدل',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Academic Plan Analysis
  const analyzePlan = useCallback(async (courseCodes?: string[]) => {
    setIsLoading(true);
    try {
      const response = courseCodes
        ? await academicApi.analyzePlanWithData({ course_codes: courseCodes })
        : await academicApi.analyzePlan();
      setPlanAnalysis(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحليل الخطة',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Critical Path Analysis
  const analyzeCriticalPath = useCallback(async (targetCourse: string, completedCourses: string[]) => {
    setIsLoading(true);
    try {
      const response = await academicApi.analyzeCriticalPath({
        target_course: targetCourse,
        current_completed: completedCourses,
      });
      setCriticalPath(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحليل المسار الحرج',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Course Prerequisites
  const getPrerequisites = useCallback(async (courseCode: string) => {
    setIsLoading(true);
    try {
      const response = await academicApi.getCoursePrerequisites(courseCode);
      setPrerequisites(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب المتطلبات السابقة',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Simulator - Drop Course
  const simulateDrop = useCallback(async (courseCode: string, reason?: string): Promise<DropSimulationResponse> => {
    setIsLoading(true);
    try {
      const response = await simulatorApi.simulateDrop({ course_code: courseCode, reason });
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في محاكاة الانسحاب',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Simulator - Retake Course
  const simulateRetake = useCallback(async (courseCode: string, targetGrade: number): Promise<RetakeSimulationResponse> => {
    setIsLoading(true);
    try {
      const response = await simulatorApi.simulateRetake({ course_code: courseCode, target_grade: targetGrade });
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في محاكاة الإعادة',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Simulator - Grade Projection
  const projectGrades = useCallback(async (scenarios: { name: string; courses: { code: string; expected_grade: number }[] }[]): Promise<GradeProjectionResponse> => {
    setIsLoading(true);
    try {
      const response = await simulatorApi.projectGrades({ scenarios });
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إسقاط العلامات',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    gpaData,
    planAnalysis,
    criticalPath,
    prerequisites,
    isLoading,
    calculateGPA,
    analyzePlan,
    analyzeCriticalPath,
    getPrerequisites,
    simulateDrop,
    simulateRetake,
    projectGrades,
  };
}
