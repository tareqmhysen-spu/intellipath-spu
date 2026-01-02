// Health & Monitoring API Endpoints
import { apiClient } from '../client';
import type { HealthStatus } from '../types';

export const healthApi = {
  // Basic health check
  check: () =>
    apiClient.get<{ status: string }>('/health'),

  // Detailed health
  detailed: () =>
    apiClient.get<HealthStatus>('/health/detailed'),

  // Readiness probe
  readiness: () =>
    apiClient.get<{ ready: boolean }>('/health/readiness'),

  // Liveness probe
  liveness: () =>
    apiClient.get<{ alive: boolean }>('/health/liveness'),

  // Vector DB health
  vectorDbHealth: () =>
    apiClient.get<{ status: string; collections: number }>('/health/vector-db'),

  // Models health
  modelsHealth: () =>
    apiClient.get<{ llm: string; embeddings: string }>('/health/models'),
};
