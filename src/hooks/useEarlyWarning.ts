import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/stores/languageStore';

interface AtRiskStudent {
  name: string;
  gpa: number;
  riskLevel: 'high' | 'medium' | 'low';
  factors: string[];
}

interface EarlyWarningResult {
  success: boolean;
  totalStudents: number;
  atRiskCount: number;
  highRiskCount: number;
  notificationsCreated: number;
  atRiskStudents: AtRiskStudent[];
}

export function useEarlyWarning() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EarlyWarningResult | null>(null);
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';

  const runCheck = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('early-warning', {
        method: 'POST',
      });

      if (error) throw error;

      setResult(data as EarlyWarningResult);
      
      if (data.highRiskCount > 0) {
        toast({
          title: isRTL ? 'تنبيه!' : 'Alert!',
          description: isRTL 
            ? `تم العثور على ${data.highRiskCount} طالب في خطر عالي`
            : `Found ${data.highRiskCount} high-risk students`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: isRTL ? 'تم الفحص' : 'Check Complete',
          description: isRTL 
            ? 'لا يوجد طلاب في خطر عالي حالياً'
            : 'No high-risk students currently',
        });
      }

      return data;
    } catch (error) {
      console.error('Early warning check failed:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL 
          ? 'فشل في تشغيل فحص الإنذار المبكر'
          : 'Failed to run early warning check',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    runCheck,
    isLoading,
    result,
  };
}
