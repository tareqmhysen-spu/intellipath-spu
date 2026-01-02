import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'student' | 'advisor' | 'admin';
  department: string | null;
  created_at: string;
  is_active: boolean;
}

interface Course {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  department: string;
  credits: number;
  is_active: boolean;
  created_at: string;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get students for department info
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('user_id, department');

      if (studentsError) throw studentsError;

      // Combine data
      const usersWithRoles: UserWithRole[] = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const student = students?.find(s => s.user_id === profile.user_id);
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
          role: (userRole?.role || 'student') as 'student' | 'advisor' | 'admin',
          department: student?.department || null,
          created_at: profile.created_at,
          is_active: true, // Could be extended with a status field
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('فشل في جلب المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'student' | 'advisor' | 'admin') => {
    try {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      setUsers(prev =>
        prev.map(u => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('تم تحديث دور المستخدم بنجاح');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('فشل في تحديث دور المستخدم');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, isLoading, refetch: fetchUsers, updateUserRole };
};

export const useAdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('فشل في جلب المقررات');
    } finally {
      setIsLoading(false);
    }
  };

  const addCourse = async (course: {
    code: string;
    name: string;
    name_ar?: string;
    department: string;
    credits: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();

      if (error) throw error;

      setCourses(prev => [data, ...prev]);
      toast.success('تم إضافة المقرر بنجاح');
      return data;
    } catch (error) {
      console.error('Error adding course:', error);
      toast.error('فشل في إضافة المقرر');
      throw error;
    }
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;

      setCourses(prev =>
        prev.map(c => (c.id === courseId ? { ...c, ...data } : c))
      );
      toast.success('تم تحديث المقرر بنجاح');
      return data;
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('فشل في تحديث المقرر');
      throw error;
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.filter(c => c.id !== courseId));
      toast.success('تم حذف المقرر بنجاح');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('فشل في حذف المقرر');
      throw error;
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return { courses, isLoading, refetch: fetchCourses, addCourse, updateCourse, deleteCourse };
};

export const useSendNotification = () => {
  const sendNotification = async (notification: {
    user_id: string;
    title: string;
    title_ar?: string;
    message: string;
    message_ar?: string;
    type?: string;
    link?: string;
  }) => {
    try {
      const { error } = await supabase.from('notifications').insert(notification);
      if (error) throw error;
      toast.success('تم إرسال الإشعار بنجاح');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('فشل في إرسال الإشعار');
      throw error;
    }
  };

  const sendBulkNotifications = async (
    userIds: string[],
    notification: {
      title: string;
      title_ar?: string;
      message: string;
      message_ar?: string;
      type?: string;
    }
  ) => {
    try {
      const notifications = userIds.map(user_id => ({
        user_id,
        ...notification,
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      toast.success(`تم إرسال ${userIds.length} إشعار بنجاح`);
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      toast.error('فشل في إرسال الإشعارات');
      throw error;
    }
  };

  return { sendNotification, sendBulkNotifications };
};
