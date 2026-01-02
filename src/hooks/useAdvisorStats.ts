import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface DepartmentStats {
  department: string;
  totalStudents: number;
  avgGpa: number;
  atRiskCount: number;
}

interface GpaDistribution {
  range: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  avgGpa: number;
  atRiskCount: number;
}

export const useAdvisorStats = () => {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['advisor-stats', user?.id],
    queryFn: async () => {
      // Get all students with their data
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          id,
          department,
          gpa,
          year_level,
          total_credits,
          xp_points,
          streak_days
        `);

      if (error) throw error;

      const studentList = students || [];
      
      // Calculate department statistics
      const deptMap = new Map<string, { students: typeof studentList }>();
      studentList.forEach(s => {
        if (!deptMap.has(s.department)) {
          deptMap.set(s.department, { students: [] });
        }
        deptMap.get(s.department)!.students.push(s);
      });

      const departmentStats: DepartmentStats[] = Array.from(deptMap.entries()).map(([dept, data]) => ({
        department: dept,
        totalStudents: data.students.length,
        avgGpa: data.students.reduce((sum, s) => sum + (s.gpa || 0), 0) / data.students.length || 0,
        atRiskCount: data.students.filter(s => (s.gpa || 0) < 2.0).length,
      }));

      // Calculate GPA distribution
      const gpaRanges = [
        { range: '0-1.0', min: 0, max: 1.0 },
        { range: '1.0-2.0', min: 1.0, max: 2.0 },
        { range: '2.0-2.5', min: 2.0, max: 2.5 },
        { range: '2.5-3.0', min: 2.5, max: 3.0 },
        { range: '3.0-3.5', min: 3.0, max: 3.5 },
        { range: '3.5-4.0', min: 3.5, max: 4.0 },
      ];

      const gpaDistribution: GpaDistribution[] = gpaRanges.map(range => ({
        range: range.range,
        count: studentList.filter(s => (s.gpa || 0) >= range.min && (s.gpa || 0) < range.max).length,
      }));

      // Calculate year level distribution
      const yearDistribution = [1, 2, 3, 4, 5].map(year => ({
        year: `السنة ${year}`,
        yearEn: `Year ${year}`,
        count: studentList.filter(s => s.year_level === year).length,
      }));

      // Calculate overall statistics
      const totalStudents = studentList.length;
      const avgGpa = studentList.reduce((sum, s) => sum + (s.gpa || 0), 0) / totalStudents || 0;
      const atRiskStudents = studentList.filter(s => (s.gpa || 0) < 2.0).length;
      const excellentStudents = studentList.filter(s => (s.gpa || 0) >= 3.5).length;
      const avgCredits = studentList.reduce((sum, s) => sum + (s.total_credits || 0), 0) / totalStudents || 0;

      // Risk level distribution
      const riskDistribution = [
        { 
          level: 'high', 
          labelAr: 'خطر عالي', 
          labelEn: 'High Risk',
          count: studentList.filter(s => (s.gpa || 0) < 1.5).length,
          color: '#ef4444'
        },
        { 
          level: 'medium', 
          labelAr: 'خطر متوسط', 
          labelEn: 'Medium Risk',
          count: studentList.filter(s => (s.gpa || 0) >= 1.5 && (s.gpa || 0) < 2.0).length,
          color: '#f59e0b'
        },
        { 
          level: 'low', 
          labelAr: 'خطر منخفض', 
          labelEn: 'Low Risk',
          count: studentList.filter(s => (s.gpa || 0) >= 2.0 && (s.gpa || 0) < 2.5).length,
          color: '#22c55e'
        },
        { 
          level: 'safe', 
          labelAr: 'آمن', 
          labelEn: 'Safe',
          count: studentList.filter(s => (s.gpa || 0) >= 2.5).length,
          color: '#3b82f6'
        },
      ];

      // Mock monthly trends (in real app, this would come from historical data)
      const monthlyTrends: MonthlyTrend[] = [
        { month: 'سبتمبر', avgGpa: 2.4, atRiskCount: 12 },
        { month: 'أكتوبر', avgGpa: 2.35, atRiskCount: 14 },
        { month: 'نوفمبر', avgGpa: 2.3, atRiskCount: 16 },
        { month: 'ديسمبر', avgGpa: 2.25, atRiskCount: 18 },
        { month: 'يناير', avgGpa: 2.28, atRiskCount: 17 },
        { month: 'فبراير', avgGpa: 2.32, atRiskCount: 15 },
      ];

      return {
        totalStudents,
        avgGpa,
        atRiskStudents,
        excellentStudents,
        avgCredits,
        departmentStats,
        gpaDistribution,
        yearDistribution,
        riskDistribution,
        monthlyTrends,
        atRiskPercentage: (atRiskStudents / totalStudents) * 100 || 0,
        excellentPercentage: (excellentStudents / totalStudents) * 100 || 0,
      };
    },
    enabled: !!user?.id,
  });

  return {
    stats,
    isLoading,
  };
};
