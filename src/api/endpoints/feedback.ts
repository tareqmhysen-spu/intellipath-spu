// Feedback API Endpoints
import { apiClient } from '../client';
import type {
  FeedbackSubmission,
  Feedback,
  PaginatedResponse,
} from '../types';

export const feedbackApi = {
  // Submit feedback
  submit: (data: FeedbackSubmission) =>
    apiClient.post<Feedback>('/feedback', data),

  // Get feedback
  getFeedback: (feedbackId: string) =>
    apiClient.get<Feedback>(`/feedback/${feedbackId}`),

  // Get my feedback
  getMyFeedback: () =>
    apiClient.get<Feedback[]>('/feedback/my-feedback'),

  // Get review queue (Admin)
  getReviewQueue: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<Feedback>>('/feedback/review/queue', {
      page: page.toString(),
      page_size: pageSize.toString(),
    }),

  // Update status
  updateStatus: (feedbackId: string, status: string) =>
    apiClient.put<Feedback>(`/feedback/${feedbackId}/status`, { status }),

  // Get statistics
  getStats: () =>
    apiClient.get<{
      total: number;
      pending: number;
      resolved: number;
      average_rating: number;
    }>('/feedback/stats/summary'),

  // Reply to feedback
  reply: (feedbackId: string, message: string) =>
    apiClient.post<Feedback>(`/feedback/${feedbackId}/reply`, { message }),
};
