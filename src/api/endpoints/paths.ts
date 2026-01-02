// Paths & Specializations API Endpoints
import { apiClient } from '../client';
import type {
  Specialization,
  AcademicPath,
  PathCourse,
} from '../types';

export const pathsApi = {
  // Get all specializations
  getSpecializations: () =>
    apiClient.get<Specialization[]>('/paths/specializations'),

  // Get paths for specialization
  getPathsForSpecialization: (specializationId: string) =>
    apiClient.get<AcademicPath[]>(`/paths/specializations/${specializationId}/paths`),

  // Get course details
  getCourseDetails: (courseId: string) =>
    apiClient.get<PathCourse>(`/paths/courses/${courseId}`),

  // Get my academic path (Student)
  getMyPath: () =>
    apiClient.get<AcademicPath>('/paths/my-path'),

  // Get student's path (Advisor)
  getStudentPath: (studentId: string) =>
    apiClient.get<AcademicPath>(`/paths/students/${studentId}/path`),
};
