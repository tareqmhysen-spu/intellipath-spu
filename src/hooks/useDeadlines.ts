import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { usePushNotifications } from './usePushNotifications';
import { useLanguageStore } from '@/stores/languageStore';

interface Deadline {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  due_date: string;
  course_id: string | null;
  student_id: string;
  is_completed: boolean;
  reminder_days: number;
  created_at: string;
  course?: {
    name: string;
    name_ar: string | null;
    code: string;
  } | null;
}

export const useDeadlines = () => {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { notifyImportant, isEnabled } = usePushNotifications();
  const queryClient = useQueryClient();
  const [checkedDeadlines, setCheckedDeadlines] = useState<Set<string>>(new Set());

  const { data: deadlines = [], isLoading } = useQuery({
    queryKey: ['deadlines', user?.id],
    queryFn: async (): Promise<Deadline[]> => {
      if (!user?.id) return [];

      // Get student record
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) return [];

      const { data, error } = await supabase
        .from('deadlines')
        .select(`
          id,
          title,
          title_ar,
          description,
          due_date,
          course_id,
          student_id,
          is_completed,
          reminder_days,
          created_at,
          course:courses(name, name_ar, code)
        `)
        .eq('student_id', student.id)
        .eq('is_completed', false)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Deadline[];
    },
    enabled: !!user?.id,
  });

  // Check for upcoming deadlines and send notifications
  const checkUpcomingDeadlines = () => {
    if (!isEnabled || deadlines.length === 0) return;

    const now = new Date();
    deadlines.forEach(deadline => {
      if (checkedDeadlines.has(deadline.id)) return;

      const dueDate = new Date(deadline.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= deadline.reminder_days && daysUntilDue > 0) {
        const title = language === 'ar' ? deadline.title_ar || deadline.title : deadline.title;
        notifyImportant(
          `⏰ موعد نهائي قريب: ${title}`,
          `⏰ Upcoming Deadline: ${title}`,
          `باقي ${daysUntilDue} يوم`,
          `${daysUntilDue} days remaining`
        );
        setCheckedDeadlines(prev => new Set([...prev, deadline.id]));
      }
    });
  };

  const addDeadline = useMutation({
    mutationFn: async (data: {
      title: string;
      title_ar?: string;
      description?: string;
      due_date: string;
      course_id?: string;
      reminder_days?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) throw new Error('Student not found');

      const { error } = await supabase
        .from('deadlines')
        .insert({
          title: data.title,
          title_ar: data.title_ar || null,
          description: data.description || null,
          due_date: data.due_date,
          course_id: data.course_id || null,
          student_id: student.id,
          reminder_days: data.reminder_days || 3,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });

  const completeDeadline = useMutation({
    mutationFn: async (deadlineId: string) => {
      const { error } = await supabase
        .from('deadlines')
        .update({ is_completed: true })
        .eq('id', deadlineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });

  const deleteDeadline = useMutation({
    mutationFn: async (deadlineId: string) => {
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', deadlineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = deadlines.filter(d => {
    const dueDate = new Date(d.due_date);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue > 0;
  });

  // Get overdue deadlines
  const overdueDeadlines = deadlines.filter(d => {
    const dueDate = new Date(d.due_date);
    return dueDate < new Date();
  });

  return {
    deadlines,
    upcomingDeadlines,
    overdueDeadlines,
    isLoading,
    addDeadline,
    completeDeadline,
    deleteDeadline,
    checkUpcomingDeadlines,
  };
};
