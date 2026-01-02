// Jobs API Endpoints
import { apiClient } from '../client';
import type { Job } from '../types';

export const jobsApi = {
  // Create job
  createJob: (type: string, params: Record<string, unknown>) =>
    apiClient.post<Job>('/jobs', { type, params }),

  // Get job status
  getJob: (jobId: string) =>
    apiClient.get<Job>(`/jobs/${jobId}`),

  // List jobs
  listJobs: (status?: string) =>
    apiClient.get<Job[]>('/jobs', status ? { status } : undefined),

  // Cancel job
  cancelJob: (jobId: string) =>
    apiClient.post<{ message: string }>(`/jobs/cancel/${jobId}`),

  // Create agentic RAG job
  createAgenticRagJob: (query: string, conversationId?: string) =>
    apiClient.post<Job>('/jobs/agentic-rag', { query, conversation_id: conversationId }),
};
