import { useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

// Priority order: admin > advisor > student (higher = more privileges)
const ROLE_PRIORITY: Record<string, number> = {
  admin: 100,
  advisor: 50,
  student: 10,
};

const getHighestRole = (roles: { role: string }[]): 'student' | 'advisor' | 'admin' | null => {
  if (!roles || roles.length === 0) return null;
  
  // Find role with highest priority
  let highestRole: string | null = null;
  let highestPriority = -1;
  
  for (const r of roles) {
    const priority = ROLE_PRIORITY[r.role] ?? 0;
    if (priority > highestPriority) {
      highestPriority = priority;
      highestRole = r.role;
    }
  }
  
  return highestRole as 'student' | 'advisor' | 'admin' | null;
};

const fetchAndSetRole = async (userId: string, setUserRole: (role: 'student' | 'advisor' | 'admin' | null) => void) => {
  try {
    const { data: rolesData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching roles:', error);
      return;
    }
    
    if (rolesData && rolesData.length > 0) {
      const highestRole = getHighestRole(rolesData);
      console.log('User roles:', rolesData, '-> Highest:', highestRole);
      setUserRole(highestRole);
    } else {
      setUserRole(null);
    }
  } catch (err) {
    console.error('Error in fetchAndSetRole:', err);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setIsLoading, setUserRole } = useAuthStore();
  const queryClient = useQueryClient();
  const rolesFetchedRef = useRef<string | null>(null);
  const linkAttemptedRef = useRef<string | null>(null);

  const ensureStudentLinked = async (authUser: User): Promise<void> => {
    const studentIdMeta = (authUser.user_metadata as any)?.student_id;
    const fullNameMeta = (authUser.user_metadata as any)?.full_name;

    const normalizedStudentId =
      typeof studentIdMeta === 'string' || typeof studentIdMeta === 'number'
        ? String(studentIdMeta)
        : '';

    // We can only auto-link if we have a valid university ID.
    if (!/^\d{7,10}$/.test(normalizedStudentId)) return;

    // Avoid repeated auto-link attempts in a single session.
    if (linkAttemptedRef.current === authUser.id) return;
    linkAttemptedRef.current = authUser.id;

    try {
      const { data: existingStudent, error: studentErr } = await supabase
        .from('students')
        .select('id, student_id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (studentErr) {
        console.warn('Error checking student link:', studentErr);
      }

      // Already linked to a real university ID.
      if (existingStudent?.student_id && /^\d{7,10}$/.test(existingStudent.student_id)) {
        return;
      }

      const { data, error } = await supabase.functions.invoke('link-student', {
        body: {
          student_id: normalizedStudentId,
          full_name: typeof fullNameMeta === 'string' ? fullNameMeta : '',
        },
      });

      if (error) {
        console.warn('Auto link-student failed:', error);
        return;
      }

      if (data?.success) {
        // Refresh all data that depends on the student link immediately.
        queryClient.invalidateQueries({ queryKey: ['student-link', authUser.id] });
        queryClient.invalidateQueries({ queryKey: ['student-settings', authUser.id] });
        queryClient.invalidateQueries({ queryKey: ['academic-records'] });
        queryClient.invalidateQueries({ queryKey: ['academic-records-count'] });

        window.dispatchEvent(new CustomEvent('intellipath:student-linked'));
      }
    } catch (err) {
      console.warn('Auto student linking error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Only fetch roles if we haven't fetched for this user yet
        if (rolesFetchedRef.current !== session.user.id) {
          rolesFetchedRef.current = session.user.id;
          // Use setTimeout to prevent Supabase auth deadlock
          setTimeout(() => {
            if (isMounted) {
              fetchAndSetRole(session.user.id, setUserRole);
              void ensureStudentLinked(session.user);
            }
          }, 0);
        } else {
          // Even if roles are already fetched, ensure linking at least once.
          setTimeout(() => {
            if (isMounted) {
              void ensureStudentLinked(session.user);
            }
          }, 0);
        }
      } else {
        rolesFetchedRef.current = null;
        linkAttemptedRef.current = null;
        setUserRole(null);
      }

      setIsLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user && rolesFetchedRef.current !== session.user.id) {
        rolesFetchedRef.current = session.user.id;
        await fetchAndSetRole(session.user.id, setUserRole);
      }

      if (session?.user) {
        // No setTimeout here because this runs outside the auth change callback.
        await ensureStudentLinked(session.user);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, setIsLoading, setSession, setUser, setUserRole]);

  return <>{children}</>;
}
