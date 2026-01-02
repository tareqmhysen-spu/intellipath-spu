import { useState, useCallback } from 'react';
import { predictionsApi } from '@/api';
import type {
  StudentRiskPrediction,
  AtRiskDashboard,
  TemporalRisk,
  InterventionRecommendation,
} from '@/api/types';
import { useToast } from '@/hooks/use-toast';

export function useIntelliPathPredictions() {
  const [riskPrediction, setRiskPrediction] = useState<StudentRiskPrediction | null>(null);
  const [atRiskDashboard, setAtRiskDashboard] = useState<AtRiskDashboard | null>(null);
  const [temporalRisk, setTemporalRisk] = useState<TemporalRisk | null>(null);
  const [interventions, setInterventions] = useState<InterventionRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const predictStudentRisk = useCallback(async (studentId: string) => {
    setIsLoading(true);
    try {
      const response = await predictionsApi.predictStudentRisk(studentId);
      setRiskPrediction(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في التنبؤ بالمخاطر',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const bulkPredict = useCallback(async (studentIds: string[]) => {
    setIsLoading(true);
    try {
      const response = await predictionsApi.bulkPredict(studentIds);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في التنبؤ الجماعي',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getAtRiskDashboard = useCallback(async (page = 1, pageSize = 20) => {
    setIsLoading(true);
    try {
      const response = await predictionsApi.getAtRiskDashboard(page, pageSize);
      setAtRiskDashboard(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب لوحة المخاطر',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getTemporalRisk = useCallback(async (studentId: string) => {
    setIsLoading(true);
    try {
      const response = await predictionsApi.getTemporalRisk(studentId);
      setTemporalRisk(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب المخاطر الزمنية',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getCohortComparison = useCallback(async (studentId: string) => {
    setIsLoading(true);
    try {
      const response = await predictionsApi.getCohortComparison(studentId);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في مقارنة الفوج',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getInterventions = useCallback(async (studentId: string) => {
    setIsLoading(true);
    try {
      const response = await predictionsApi.getInterventions(studentId);
      setInterventions(response);
      return response;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جلب التدخلات',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    riskPrediction,
    atRiskDashboard,
    temporalRisk,
    interventions,
    isLoading,
    predictStudentRisk,
    bulkPredict,
    getAtRiskDashboard,
    getTemporalRisk,
    getCohortComparison,
    getInterventions,
  };
}
