import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/stores/languageStore';
import { exportStudentReportPDF } from '@/utils/pdfExport';

interface ExportReportButtonProps {
  student: {
    name: string;
    studentId: string;
    department: string;
    yearLevel: number;
    gpa: number;
    totalCredits: number;
    email: string;
  };
  courses: {
    name: string;
    code: string;
    credits: number;
    grade?: string;
    semester: string;
  }[];
}

export const ExportReportButton = ({ student, courses }: ExportReportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguageStore();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      exportStudentReportPDF(student, courses, language);
      
      toast({
        title: t('تم التصدير بنجاح', 'Export Successful'),
        description: t('تم تحميل التقرير بصيغة PDF', 'Report downloaded as PDF'),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: t('خطأ في التصدير', 'Export Error'),
        description: t('فشل في تصدير التقرير', 'Failed to export report'),
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {t('تصدير PDF', 'Export PDF')}
    </Button>
  );
};
