import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, Database, Archive } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImportResult {
  success: boolean;
  message: string;
  total_records: number;
  inserted: number;
  unique_students: number;
  errors?: string[];
  skipped?: number;
}

interface FileInfo {
  name: string;
  size: number;
  type: 'csv' | 'zip';
  csvFiles?: string[];
}

export const StudentRecordsImport = () => {
  const { t } = useLanguageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [csvContents, setCsvContents] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [overwrite, setOverwrite] = useState(false);

  const parseCSVPreview = (text: string): string[][] => {
    const lines = text.split('\n').slice(0, 6);
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isCSV = selectedFile.name.toLowerCase().endsWith('.csv');
    const isZIP = selectedFile.name.toLowerCase().endsWith('.zip');

    if (!isCSV && !isZIP) {
      toast.error(t('يرجى اختيار ملف CSV أو ZIP', 'Please select a CSV or ZIP file'));
      return;
    }

    setResult(null);
    setCsvContents([]);
    setPreviewData([]);

    try {
      if (isCSV) {
        const text = await selectedFile.text();
        setCsvContents([text]);
        setFileInfo({
          name: selectedFile.name,
          size: selectedFile.size,
          type: 'csv',
        });
        setPreviewData(parseCSVPreview(text));
      } else if (isZIP) {
        setProgressMessage(t('جاري فك ضغط الملف...', 'Extracting ZIP file...'));
        setProgress(10);
        
        const zip = new JSZip();
        const contents = await zip.loadAsync(selectedFile);
        
        const csvFiles: string[] = [];
        const csvTexts: string[] = [];
        
        const fileNames = Object.keys(contents.files).filter(
          name => name.toLowerCase().endsWith('.csv') && !name.startsWith('__MACOSX')
        );

        setProgress(30);
        setProgressMessage(t(`تم العثور على ${fileNames.length} ملف CSV`, `Found ${fileNames.length} CSV files`));

        for (let i = 0; i < fileNames.length; i++) {
          const fileName = fileNames[i];
          const file = contents.files[fileName];
          if (!file.dir) {
            const text = await file.async('text');
            csvFiles.push(fileName);
            csvTexts.push(text);
          }
          setProgress(30 + (i / fileNames.length) * 30);
        }

        setCsvContents(csvTexts);
        setFileInfo({
          name: selectedFile.name,
          size: selectedFile.size,
          type: 'zip',
          csvFiles,
        });

        // Preview first CSV
        if (csvTexts.length > 0) {
          setPreviewData(parseCSVPreview(csvTexts[0]));
        }

        setProgress(0);
        setProgressMessage('');
        
        toast.success(t(
          `تم فك الضغط: ${csvFiles.length} ملف CSV`,
          `Extracted: ${csvFiles.length} CSV files`
        ));
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast.error(t('فشل في قراءة الملف', 'Failed to read file'));
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleImport = async () => {
    if (csvContents.length === 0) {
      toast.error(t('يرجى اختيار ملف أولاً', 'Please select a file first'));
      return;
    }

    setIsUploading(true);
    setProgress(5);
    setProgressMessage(t('جاري التحضير...', 'Preparing...'));

    let totalInserted = 0;
    let totalRecords = 0;
    let totalErrors: string[] = [];
    const uniqueStudents = new Set<string>();

    try {
      for (let i = 0; i < csvContents.length; i++) {
        const csvData = csvContents[i];
        const fileName = fileInfo?.csvFiles?.[i] || fileInfo?.name || 'file.csv';
        
        setProgressMessage(t(
          `جاري استيراد ${i + 1} من ${csvContents.length}: ${fileName}`,
          `Importing ${i + 1} of ${csvContents.length}: ${fileName}`
        ));
        setProgress(5 + ((i / csvContents.length) * 85));

        const { data, error } = await supabase.functions.invoke('import-student-records', {
          body: { csvData, mode: overwrite ? 'overwrite' : 'full', fileName },
        });

        if (error) {
          totalErrors.push(`${fileName}: ${error.message}`);
          continue;
        }

        if (data) {
          totalRecords += data.total_records || 0;
          totalInserted += data.inserted || 0;
          if (data.errors) {
            totalErrors.push(...data.errors.map((e: string) => `${fileName}: ${e}`));
          }
        }
      }

      setProgress(100);
      setProgressMessage('');

      const finalResult: ImportResult = {
        success: totalErrors.length === 0 || totalInserted > 0,
        message: totalInserted > 0 
          ? t(`تم استيراد ${totalInserted} سجل بنجاح`, `Successfully imported ${totalInserted} records`)
          : t('لم يتم استيراد أي سجلات', 'No records were imported'),
        total_records: totalRecords,
        inserted: totalInserted,
        unique_students: uniqueStudents.size,
        errors: totalErrors.length > 0 ? totalErrors.slice(0, 10) : undefined,
      };

      setResult(finalResult);

      if (finalResult.success && totalInserted > 0) {
        toast.success(finalResult.message);
      } else if (totalErrors.length > 0) {
        toast.error(t('حدثت أخطاء أثناء الاستيراد', 'Errors occurred during import'));
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t('فشل الاستيراد', 'Import failed') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
      setResult({
        success: false,
        message: t('فشل الاستيراد', 'Import failed'),
        total_records: 0,
        inserted: 0,
        unique_students: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsUploading(false);
      setProgressMessage('');
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'student_id',
      'course_code',
      'course_name',
      'letter_grade',
      'semester',
      'academic_year',
      'cumulative_gpa_points',
      'cumulative_gpa_percent',
      'final_grade',
      'grade_points',
      'course_credits',
      'college',
      'major',
      'total_completed_hours',
    ];

    const exampleRow = [
      '4210380',
      'CS101',
      'Programming Basics',
      'A',
      '2024-1',
      '2024',
      '3.5',
      '87.5',
      '92',
      '4.0',
      '3',
      'كلية الهندسة المعلوماتية',
      'هندسة البرمجيات',
      '45',
    ];

    const csv = headers.join(',') + '\n' + exampleRow.join(',') + '\n';
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_records_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">{t('استيراد البيانات', 'Import Data')}</TabsTrigger>
          <TabsTrigger value="logs">{t('سجل الاستيراد', 'Import Logs')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-6">
          {/* Upload Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                {t('رفع ملف CSV أو ZIP', 'Upload CSV or ZIP file')}
              </CardTitle>
              <CardDescription>
                {t(
                  'أو اختر من جهازك ملف CSV/ZIP اسحب وأفلت',
                  'Drag and drop or select CSV/ZIP file from your device'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-border/50 rounded-lg p-8 text-center transition-colors ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-muted/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                {fileInfo?.type === 'zip' ? (
                  <Archive className="w-12 h-12 mx-auto text-primary mb-4" />
                ) : (
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                )}
                <p className="text-lg font-medium mb-1">
                  {fileInfo ? fileInfo.name : t('اسحب ملف CSV أو ZIP هنا', 'Drag CSV or ZIP file here')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {fileInfo
                    ? `${(fileInfo.size / 1024).toFixed(1)} KB`
                    : t('يدعم ملفات CSV وملفات ZIP تحتوي CSV متعددة', 'Supports CSV files and ZIP files containing multiple CSVs')}
                </p>
                {fileInfo?.csvFiles && (
                  <Badge variant="secondary" className="mt-2">
                    {t(`${fileInfo.csvFiles.length} ملف CSV`, `${fileInfo.csvFiles.length} CSV files`)}
                  </Badge>
                )}
              </div>

              {/* Progress */}
              {(isUploading || progressMessage) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {progressMessage || t('جاري الاستيراد...', 'Importing...')}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Overwrite Option */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="overwrite" className="font-medium">
                    {t('استبدال البيانات الموجودة', 'Replace existing data')}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {t('لتحديث بيانات الطلاب الموجودين مسبقاً', 'To update existing student data')}
                  </span>
                </div>
                <Switch
                  id="overwrite"
                  checked={overwrite}
                  onCheckedChange={setOverwrite}
                  disabled={isUploading}
                />
              </div>

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={csvContents.length === 0 || isUploading}
                className="w-full"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    {t('جاري الاستيراد...', 'Importing...')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    {t('استيراد السجلات', 'Import Records')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                {t('نتائج الاستيراد', 'Import Results')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <Alert variant={result.success && result.inserted > 0 ? 'default' : 'destructive'}>
                  {result.success && result.inserted > 0 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium">{result.message}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {t('إجمالي السجلات:', 'Total Records:')} {result.total_records}
                        </Badge>
                        <Badge variant={result.inserted > 0 ? 'default' : 'secondary'}>
                          {t('تم الإدخال:', 'Inserted:')} {result.inserted}
                        </Badge>
                      </div>
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                          <p className="text-sm font-medium mb-2 text-destructive">
                            {t('الأخطاء:', 'Errors:')}
                          </p>
                          <ul className="text-sm list-disc list-inside text-destructive space-y-1 max-h-40 overflow-y-auto">
                            {result.errors.map((err, i) => (
                              <li key={i} className="break-all">{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('لم يتم إجراء أي استيراد بعد', 'No import has been performed yet')}</p>
                  <p className="text-sm">{t('ارفع ملف CSV للبدء', 'Upload a CSV file to start')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>{t('سجل عمليات الاستيراد', 'Import Operations Log')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                {t('سيتم عرض سجل العمليات هنا', 'Operation logs will be displayed here')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Format Info */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('صيغة الملف المطلوبة', 'Required File Format')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">{t('الأعمدة المطلوبة:', 'Required columns:')}</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• student_id / رقم الطالب</li>
                <li>• course_code / رمز المقرر</li>
                <li>• course_name / اسم المقرر</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">{t('الأعمدة الاختيارية:', 'Optional columns:')}</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• letter_grade / الدرجة الحرفية</li>
                <li>• semester / الفصل الدراسي</li>
                <li>• cumulative_gpa / المعدل التراكمي</li>
                <li>• college, major, department</li>
              </ul>
            </div>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg font-mono text-xs overflow-x-auto">
            <p className="text-muted-foreground mb-1">{t('مثال:', 'Example:')}</p>
            <p>student_id,course_code,course_name,letter_grade,semester</p>
            <p>4210380,CS101,Programming Basics,A,2024-1</p>
            <p>4210380,CS102,Data Structures,B+,2024-1</p>
          </div>

          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 ml-2" />
            {t('تحميل قالب CSV', 'Download CSV Template')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
