import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImportResult {
  success: boolean;
  total_records: number;
  successful_imports: number;
  failed_imports: number;
  imported_student_ids: string[];
  errors: Array<{ student_id: string; error: string }>;
  import_log_id?: string;
}

export interface ImportLog {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: any[];
  status: string;
  created_at: string;
  completed_at: string | null;
}

export function useStudentDataImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const importCSV = async (file: File, overwrite = false): Promise<ImportResult> => {
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('overwrite', String(overwrite));

      setImportProgress(30);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('student-data-import', {
        body: formData,
      });

      setImportProgress(90);

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ImportResult;
      setLastResult(result);
      setImportProgress(100);

      if (result.successful_imports > 0) {
        toast.success(
          `تم استيراد ${result.successful_imports} طالب بنجاح`,
          { description: result.failed_imports > 0 ? `فشل استيراد ${result.failed_imports} سجل` : undefined }
        );
      } else if (result.failed_imports > 0) {
        toast.error(`فشل استيراد ${result.failed_imports} سجل`);
      } else {
        toast.info('لم يتم العثور على سجلات جديدة للاستيراد');
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ أثناء الاستيراد';
      toast.error(message);
      throw error;
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(0), 1000);
    }
  };

  const importCSVContent = async (csvContent: string, fileName = 'import.csv', overwrite = false): Promise<ImportResult> => {
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      setImportProgress(30);

      const response = await supabase.functions.invoke('student-data-import', {
        body: {
          csv_content: csvContent,
          file_name: fileName,
          overwrite,
        },
      });

      setImportProgress(90);

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ImportResult;
      setLastResult(result);
      setImportProgress(100);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ أثناء الاستيراد';
      toast.error(message);
      throw error;
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(0), 1000);
    }
  };

  const getImportLogs = async (): Promise<ImportLog[]> => {
    try {
      // Use raw query since import_logs table is new
      const { data, error } = await supabase
        .from('import_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching import logs:', error);
        return [];
      }

      return (data || []) as unknown as ImportLog[];
    } catch (error) {
      console.error('Error fetching import logs:', error);
      return [];
    }
  };

  const linkStudentToUser = async (studentId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ user_id: userId })
        .eq('student_id', studentId);

      if (error) throw error;

      toast.success('تم ربط الطالب بالحساب بنجاح');
      return true;
    } catch (error) {
      toast.error('فشل ربط الطالب بالحساب');
      return false;
    }
  };

  return {
    importCSV,
    importCSVContent,
    getImportLogs,
    linkStudentToUser,
    isImporting,
    importProgress,
    lastResult,
  };
}
