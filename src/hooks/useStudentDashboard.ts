import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface StudentData {
  id: string;
  student_id: string;
  department: string;
  year_level: number;
  gpa: number;
  total_credits: number;
  xp_points: number;
  level: number;
  streak_days: number;
  last_activity_at: string | null;
}

interface ProfileData {
  full_name: string;
  full_name_ar: string | null;
  email: string;
  avatar_url: string | null;
}

interface EnrollmentData {
  id: string;
  course_id: string;
  grade: number | null;
  letter_grade: string | null;
  status: string;
  semester: string;
  course: {
    name: string;
    name_ar: string | null;
    code: string;
    credits: number;
  };
}

interface AchievementData {
  id: string;
  earned_at: string;
  achievement: {
    name: string;
    name_ar: string | null;
    description: string | null;
    description_ar: string | null;
    icon: string | null;
    badge_color: string | null;
    xp_reward: number | null;
  };
}

export const useStudentDashboard = () => {
  const { user } = useAuthStore();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, full_name_ar, email, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) setProfile(profileData);

      // Fetch student data
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentData) {
        setStudent(studentData);

        // Fetch enrollments with course info
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select(`
            id,
            course_id,
            grade,
            letter_grade,
            status,
            semester,
            courses:course_id (
              name,
              name_ar,
              code,
              credits
            )
          `)
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false });

        if (enrollmentsData) {
          const formattedEnrollments = enrollmentsData.map(e => ({
            ...e,
            course: e.courses as any
          }));
          setEnrollments(formattedEnrollments);
        }

        // Fetch achievements
        const { data: achievementsData } = await supabase
          .from('student_achievements')
          .select(`
            id,
            earned_at,
            achievements:achievement_id (
              name,
              name_ar,
              description,
              description_ar,
              icon,
              badge_color,
              xp_reward
            )
          `)
          .eq('student_id', studentData.id)
          .order('earned_at', { ascending: false })
          .limit(5);

        if (achievementsData) {
          const formattedAchievements = achievementsData.map(a => ({
            ...a,
            achievement: a.achievements as any
          }));
          setAchievements(formattedAchievements);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStreak = async () => {
    if (!user || !student) return;

    const today = new Date().toDateString();
    const lastActivity = student.last_activity_at 
      ? new Date(student.last_activity_at).toDateString() 
      : null;

    if (lastActivity !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastActivity === yesterday.toDateString();

      const newStreak = wasYesterday ? (student.streak_days || 0) + 1 : 1;

      await supabase
        .from('students')
        .update({
          streak_days: newStreak,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', student.id);

      setStudent(prev => prev ? { ...prev, streak_days: newStreak } : null);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    const handler = () => {
      void fetchDashboardData();
    };

    window.addEventListener('intellipath:student-linked', handler);
    return () => {
      window.removeEventListener('intellipath:student-linked', handler);
    };
  }, [user]);

  useEffect(() => {
    if (student) {
      updateStreak();
    }
  }, [student?.id]);

  const nextLevelXp = student ? (student.level || 1) * 500 : 500;
  const xpProgress = student ? ((student.xp_points || 0) / nextLevelXp) * 100 : 0;

  return {
    student,
    profile,
    enrollments,
    achievements,
    isLoading,
    nextLevelXp,
    xpProgress,
    refetch: fetchDashboardData
  };
};
