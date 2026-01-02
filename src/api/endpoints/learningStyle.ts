// Learning Style API Endpoints
import { apiClient } from '../client';
import type {
  LearningStyleAnalysis,
  LearningResource,
} from '../types';

export const learningStyleApi = {
  // Predict learning style
  predictStyle: () =>
    apiClient.get<LearningStyleAnalysis>('/learning-style/predict'),

  // Analyze learning style with responses
  analyzeStyle: (responses: Record<string, number>) =>
    apiClient.post<LearningStyleAnalysis>('/learning-style/analyze', { responses }),

  // Get learning resources
  getResources: (style?: string) =>
    apiClient.get<LearningResource[]>('/learning-style/resources', 
      style ? { style } : undefined
    ),
};
