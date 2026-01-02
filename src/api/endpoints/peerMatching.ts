// Peer Matching API Endpoints
import { apiClient } from '../client';
import type {
  PeerMatchRequest,
  PeerMatch,
} from '../types';

export const peerMatchingApi = {
  // Find study partners
  findMatches: (data: PeerMatchRequest) =>
    apiClient.post<PeerMatch[]>('/peer-matching/find', data),

  // Accept match request
  acceptMatch: (matchId: string) =>
    apiClient.post<{ message: string }>('/peer-matching/accept', { match_id: matchId }),

  // Decline match request
  declineMatch: (matchId: string) =>
    apiClient.post<{ message: string }>('/peer-matching/decline', { match_id: matchId }),

  // Get my matches
  getMyMatches: () =>
    apiClient.get<PeerMatch[]>('/peer-matching/my-matches'),
};
