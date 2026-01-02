// Chat & RAG API Endpoints
import { apiClient } from '../client';
import type {
  ChatQueryRequest,
  ChatQueryResponse,
  Conversation,
  Message,
  PaginatedResponse,
} from '../types';

export const chatApi = {
  // Standard RAG query
  query: (data: ChatQueryRequest) =>
    apiClient.post<ChatQueryResponse>('/chat/query', data),

  // Smart auto-routing query
  smartQuery: (data: ChatQueryRequest) =>
    apiClient.post<ChatQueryResponse>('/chat/query/smart', data),

  // Agentic RAG with Plan-Execute-Reflect
  agenticQuery: (data: ChatQueryRequest) =>
    apiClient.post<ChatQueryResponse>('/chat/query/agentic', data),

  // SSE streaming for agentic thoughts
  streamAgenticQuery: (data: ChatQueryRequest) =>
    apiClient.streamChat('/chat/query/agentic/stream', data),

  // Standard streaming
  streamQuery: (data: ChatQueryRequest) =>
    apiClient.streamChat('/chat/query/stream', data),

  // Conversations
  createConversation: (title?: string) =>
    apiClient.post<Conversation>('/chat/conversations', { title }),

  listConversations: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<Conversation>>('/chat/conversations', {
      page: page.toString(),
      page_size: pageSize.toString(),
    }),

  getConversation: (id: string) =>
    apiClient.get<Conversation>(`/chat/conversations/${id}`),

  deleteConversation: (id: string) =>
    apiClient.delete<{ message: string }>(`/chat/conversations/${id}`),

  getMessages: (conversationId: string, page = 1, pageSize = 50) =>
    apiClient.get<PaginatedResponse<Message>>(
      `/chat/conversations/${conversationId}/messages`,
      { page: page.toString(), page_size: pageSize.toString() }
    ),

  updateConversationTitle: (id: string, title: string) =>
    apiClient.put<Conversation>(`/chat/conversations/${id}/title`, { title }),

  // Quality metrics (Advisor only)
  getQualityMetrics: () =>
    apiClient.get<{ accuracy: number; relevance: number; response_time: number }>(
      '/chat/quality/metrics'
    ),

  getLanguageCompliance: () =>
    apiClient.get<{ arabic_compliance: number; english_compliance: number }>(
      '/chat/quality/language-compliance'
    ),

  getAccuracyMetrics: () =>
    apiClient.get<{ overall_accuracy: number; by_topic: Record<string, number> }>(
      '/chat/quality/accuracy'
    ),
};
