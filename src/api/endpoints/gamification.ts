// Gamification API Endpoints
import { apiClient } from '../client';
import type {
  GamificationProfile,
  Badge,
  Achievement,
  LeaderboardEntry,
} from '../types';

export const gamificationApi = {
  // Get gamification profile
  getProfile: () =>
    apiClient.get<GamificationProfile>('/gamification/profile'),

  // Get badges
  getBadges: () =>
    apiClient.get<Badge[]>('/gamification/badges'),

  // Get achievements
  getAchievements: () =>
    apiClient.get<Achievement[]>('/gamification/achievements'),

  // Get leaderboard
  getLeaderboard: (limit = 10) =>
    apiClient.get<LeaderboardEntry[]>('/gamification/leaderboard', {
      limit: limit.toString(),
    }),

  // Claim reward
  claimReward: (rewardId: string) =>
    apiClient.post<{ message: string; points_earned: number }>(
      `/gamification/rewards/${rewardId}/claim`
    ),
};
