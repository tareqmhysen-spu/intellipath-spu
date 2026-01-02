import { useState, useCallback } from 'react';
import { wellnessApi } from '@/api';
import type { WellnessAnalysis, WellnessAlert } from '@/api/types';
import { useToast } from '@/hooks/use-toast';

export function useIntelliPathWellness() {
  const [wellness, setWellness] = useState<WellnessAnalysis | null>(null);
  const [alerts, setAlerts] = useState<WellnessAlert[]>([]);
  const [history, setHistory] = useState<WellnessAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const analyzeWellness = useCallback(async (studentId: string) => {
    setIsLoading(true);
    try {
      const response = await wellnessApi.analyzeWellness(studentId);
      setWellness(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحليل الصحة النفسية',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getWellnessHistory = useCallback(async (studentId: string, days = 30) => {
    setIsLoading(true);
    try {
      const response = await wellnessApi.getWellnessHistory(studentId, days);
      setHistory(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب سجل الصحة',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getAlerts = useCallback(async (page = 1, pageSize = 20) => {
    setIsLoading(true);
    try {
      const response = await wellnessApi.getAlerts(page, pageSize);
      setAlerts(response.items);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب التنبيهات',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await wellnessApi.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, acknowledged: true } : a
      ));
      toast({
        title: 'تم',
        description: 'تم الإقرار بالتنبيه',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في الإقرار',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const getMyWellness = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await wellnessApi.getMyWellness();
      setWellness(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب صحتك النفسية',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    wellness,
    alerts,
    history,
    isLoading,
    analyzeWellness,
    getWellnessHistory,
    getAlerts,
    acknowledgeAlert,
    getMyWellness,
  };
}
