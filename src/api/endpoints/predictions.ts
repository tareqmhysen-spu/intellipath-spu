// Predictions & Early Warning API Endpoints
import { apiClient } from '../client';
import type {
  StudentRiskPrediction,
  AtRiskDashboard,
  TemporalRisk,
  InterventionRecommendation,
  PaginatedResponse,
} from '../types';

export const predictionsApi = {
  // Predict student risk (Advisor only)
  predictStudentRisk: (studentId: string) =>
    apiClient.get<StudentRiskPrediction>(`/predictions/student/${studentId}`),

  // Bulk risk predictions (Advisor only)
  bulkPredict: (studentIds: string[]) =>
    apiClient.post<StudentRiskPrediction[]>('/predictions/bulk', { student_ids: studentIds }),

  // Get at-risk students dashboard (Advisor only)
  getAtRiskDashboard: (page = 1, pageSize = 20) =>
    apiClient.get<AtRiskDashboard>('/predictions/dashboard/at-risk', {
      page: page.toString(),
      page_size: pageSize.toString(),
    }),

  // Temporal risk patterns
  getTemporalRisk: (studentId: string) =>
    apiClient.get<TemporalRisk>(`/predictions/temporal-risk/${studentId}`),

  // Cohort comparison
  getCohortComparison: (studentId: string) =>
    apiClient.get<{
      student_percentile: number;
      cohort_average_gpa: number;
      cohort_risk_distribution: Record<string, number>;
    }>(`/predictions/cohort-comparison/${studentId}`),

  // Intervention recommendations
  getInterventions: (studentId: string) =>
    apiClient.get<InterventionRecommendation[]>(`/predictions/interventions/${studentId}`),
};
