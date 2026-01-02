// Academic Simulator API Endpoints
import { apiClient } from '../client';
import type {
  DropSimulationRequest,
  DropSimulationResponse,
  RetakeSimulationRequest,
  RetakeSimulationResponse,
  GradeProjectionRequest,
  GradeProjectionResponse,
} from '../types';

export const simulatorApi = {
  // Simulate dropping a course
  simulateDrop: (data: DropSimulationRequest) =>
    apiClient.post<DropSimulationResponse>('/academic-simulator/drop', data),

  // Simulate retaking a course
  simulateRetake: (data: RetakeSimulationRequest) =>
    apiClient.post<RetakeSimulationResponse>('/academic-simulator/retake', data),

  // Grade projection scenarios
  projectGrades: (data: GradeProjectionRequest) =>
    apiClient.post<GradeProjectionResponse>(
      '/academic-simulator/scenarios/grade-projection',
      data
    ),
};
