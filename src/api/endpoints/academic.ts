// Academic API Endpoints
import { apiClient } from '../client';
import type {
  GPACalculateRequest,
  GPAResponse,
  AcademicPlanAnalysis,
  CriticalPathRequest,
  CriticalPathResponse,
  CoursePrerequisites,
} from '../types';

export const academicApi = {
  // GPA Calculation
  calculateGPA: () =>
    apiClient.get<GPAResponse>('/academic/gpa/calculate'),

  calculateGPAWithGrades: (data: GPACalculateRequest) =>
    apiClient.post<GPAResponse>('/academic/gpa/calculate', data),

  // Academic Plan Analysis
  analyzePlan: () =>
    apiClient.get<AcademicPlanAnalysis>('/academic/plan/analyze'),

  analyzePlanWithData: (data: { course_codes: string[] }) =>
    apiClient.post<AcademicPlanAnalysis>('/academic/plan/analyze', data),

  // Critical Path
  analyzeCriticalPath: (data: CriticalPathRequest) =>
    apiClient.post<CriticalPathResponse>('/academic/critical-path', data),

  // Course Prerequisites (Neo4j)
  getCoursePrerequisites: (courseCode: string) =>
    apiClient.get<CoursePrerequisites>(`/academic/courses/${courseCode}/prerequisites`),
};
