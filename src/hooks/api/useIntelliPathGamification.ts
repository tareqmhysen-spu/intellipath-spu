import { useState, useCallback } from 'react';
import { gamificationApi } from '@/api';
import type { GamificationProfile, Badge, Achievement, LeaderboardEntry } from '@/api/types';
import { useToast } from '@/hooks/use-toast';

export function useIntelliPathGamification() {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await gamificationApi.getProfile();
      setProfile(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب الملف الشخصي',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getBadges = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await gamificationApi.getBadges();
      setBadges(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب الشارات',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getAchievements = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await gamificationApi.getAchievements();
      setAchievements(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب الإنجازات',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getLeaderboard = useCallback(async (limit = 10) => {
    setIsLoading(true);
    try {
      const response = await gamificationApi.getLeaderboard(limit);
      setLeaderboard(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب لوحة المتصدرين',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const claimReward = useCallback(async (rewardId: string) => {
    try {
      const response = await gamificationApi.claimReward(rewardId);
      toast({
        title: 'مبروك!',
        description: `حصلت على ${response.points_earned} نقطة`,
      });
      // Refresh profile
      await getProfile();
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في استلام المكافأة',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, getProfile]);

  return {
    profile,
    badges,
    achievements,
    leaderboard,
    isLoading,
    getProfile,
    getBadges,
    getAchievements,
    getLeaderboard,
    claimReward,
  };
}
