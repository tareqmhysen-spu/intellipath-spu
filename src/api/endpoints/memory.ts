// Memory API Endpoints
import { apiClient } from '../client';
import type {
  Memory,
  MemorySearchRequest,
  UserPreferences,
} from '../types';

export const memoryApi = {
  // Create memory
  createMemory: (content: string, type: string, importance = 0.5) =>
    apiClient.post<Memory>('/memory/memories', { content, type, importance }),

  // List memories
  listMemories: (type?: string, limit = 20) =>
    apiClient.get<Memory[]>('/memory/memories', {
      ...(type && { type }),
      limit: limit.toString(),
    }),

  // Search memories
  searchMemories: (data: MemorySearchRequest) =>
    apiClient.post<Memory[]>('/memory/memories/search', data),

  // Get memory
  getMemory: (memoryId: string) =>
    apiClient.get<Memory>(`/memory/memories/${memoryId}`),

  // Update memory importance
  updateImportance: (memoryId: string, importance: number) =>
    apiClient.put<Memory>(`/memory/memories/${memoryId}/importance`, { importance }),

  // Delete memory
  deleteMemory: (memoryId: string) =>
    apiClient.delete<{ message: string }>(`/memory/memories/${memoryId}`),

  // Set preferences
  setPreferences: (preferences: Partial<UserPreferences>) =>
    apiClient.post<UserPreferences>('/memory/preferences', preferences),

  // Get preferences
  getPreferences: () =>
    apiClient.get<UserPreferences>('/memory/preferences'),

  // Get memory context for query
  getContext: (query: string) =>
    apiClient.get<Memory[]>('/memory/context', { query }),
};
