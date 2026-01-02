import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export interface Achievement {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  icon: string | null;
  badge_color: string;
  category: string;
  xp_reward: number;
  unlocked?: boolean;
  earned_at?: string;
}

export function useAchievements() {
  const { user } = useAuthStore();

  const { data: allAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('xp_reward', { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
  });

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, xp_points, level, streak_days')
        .eq('user_id', user.id)
        .single();

      if (studentError) return null;
      return student;
    },
    enabled: !!user?.id,
  });

  const { data: earnedAchievements, isLoading: earnedLoading } = useQuery({
    queryKey: ['earned-achievements', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return [];

      const { data, error } = await supabase
        .from('student_achievements')
        .select('achievement_id, earned_at')
        .eq('student_id', studentData.id);

      if (error) return [];
      return data;
    },
    enabled: !!studentData?.id,
  });

  const achievements = allAchievements?.map(achievement => ({
    ...achievement,
    unlocked: earnedAchievements?.some(ea => ea.achievement_id === achievement.id) || false,
    earned_at: earnedAchievements?.find(ea => ea.achievement_id === achievement.id)?.earned_at,
  })) || [];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalXp = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.xp_reward || 0), 0);

  return {
    achievements,
    studentData,
    unlockedCount,
    totalXp,
    isLoading: achievementsLoading || studentLoading || earnedLoading,
  };
}
