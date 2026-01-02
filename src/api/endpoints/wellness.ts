// Wellness Monitoring API Endpoints
import { apiClient } from '../client';
import type {
  WellnessAnalysis,
  WellnessAlert,
  PaginatedResponse,
} from '../types';

export const wellnessApi = {
  // Analyze student wellness (Advisor only)
  analyzeWellness: (studentId: string) =>
    apiClient.get<WellnessAnalysis>(`/wellness/analyze/${studentId}`),

  // Get wellness history (Advisor only)
  getWellnessHistory: (studentId: string, days = 30) =>
    apiClient.get<WellnessAnalysis[]>(`/wellness/history/${studentId}`, {
      days: days.toString(),
    }),

  // Get wellness alerts (Advisor only)
  getAlerts: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<WellnessAlert>>('/wellness/alerts', {
      page: page.toString(),
      page_size: pageSize.toString(),
    }),

  // Get specific alert
  getAlert: (alertId: string) =>
    apiClient.get<WellnessAlert>(`/wellness/alerts/${alertId}`),

  // Acknowledge alert
  acknowledgeAlert: (alertId: string) =>
    apiClient.post<{ message: string }>(`/wellness/alerts/${alertId}/acknowledge`),

  // Get own wellness (Student)
  getMyWellness: () =>
    apiClient.get<WellnessAnalysis>('/wellness/my-wellness'),
};
