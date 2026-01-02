import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentWithProfile {
  id: string;
  student_id: string;
  department: string;
  year_level: number;
  gpa: number;
  total_credits: number;
  xp_points: number;
  level: number;
  streak_days: number;
  user_id: string;
  profile?: {
    full_name: string;
    full_name_ar: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function useStudentsList() {
  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('gpa', { ascending: false });

      if (studentsError) throw studentsError;

      // Fetch profiles for each student
      const studentIds = studentsData.map(s => s.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, full_name_ar, email, avatar_url')
        .in('user_id', studentIds);

      if (profilesError) throw profilesError;

      // Combine students with their profiles
      const studentsWithProfiles: StudentWithProfile[] = studentsData.map(student => ({
        ...student,
        gpa: Number(student.gpa) || 0,
        profile: profiles?.find(p => p.user_id === student.user_id),
      }));

      return studentsWithProfiles;
    },
  });

  // Calculate statistics
  const stats = {
    total: students?.length || 0,
    highRisk: students?.filter(s => s.gpa < 2.0).length || 0,
    mediumRisk: students?.filter(s => s.gpa >= 2.0 && s.gpa < 2.5).length || 0,
    lowRisk: students?.filter(s => s.gpa >= 2.5).length || 0,
    avgGpa: students?.length 
      ? students.reduce((sum, s) => sum + s.gpa, 0) / students.length 
      : 0,
  };

  return {
    students: students || [],
    stats,
    isLoading,
    error,
  };
}
