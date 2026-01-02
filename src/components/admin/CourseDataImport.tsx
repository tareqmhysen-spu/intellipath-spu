import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, FileText, CheckCircle, XCircle, AlertTriangle, 
  BookOpen, Loader2, Code
} from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportResult {
  success: boolean;
  total_files: number;
  processed_files: number;
  total_courses: number;
  successful_imports: number;
  failed_imports: number;
  imported_codes: string[];
  errors: Array<{ code: string; error: string }>;
  file_errors: Array<{ file: string; error: string }>;
}

export function CourseDataImport() {
  const { t } = useLanguageStore();
  const [dragActive, setDragActive] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv') || fileName.endsWith('.md') || fileName.endsWith('.txt') || fileName.endsWith('.zip')) {
        setSelectedFile(file);
      } else {
        toast.error(t('صيغة الملف غير مدعومة', 'File format not supported'));
      }
    }
  }, [t]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('overwrite', String(overwrite));

      setImportProgress(30);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('course-data-import', {
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
          t(`تم استيراد ${result.successful_imports} مقرر بنجاح`, `Successfully imported ${result.successful_imports} courses`),
          { description: result.failed_imports > 0 ? t(`فشل استيراد ${result.failed_imports} مقرر`, `Failed to import ${result.failed_imports} courses`) : undefined }
        );
      } else if (result.failed_imports > 0) {
        toast.error(t(`فشل استيراد ${result.failed_imports} مقرر`, `Failed to import ${result.failed_imports} courses`));
      } else {
        toast.info(t('لم يتم العثور على مقررات جديدة', 'No new courses found'));
      }

      setSelectedFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('حدث خطأ أثناء الاستيراد', 'Error during import');
      toast.error(message);
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(0), 1000);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Upload Area */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t('رفع ملفات المقررات', 'Upload Course Files')}
          </CardTitle>
          <CardDescription>
            {t('اسحب وأفلت ملف Markdown أو CSV أو ZIP', 'Drag and drop Markdown, CSV, or ZIP file')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all
              ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${isImporting ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
            `}
            onClick={() => document.getElementById('course-file-input')?.click()}
          >
            <input
              id="course-file-input"
              type="file"
              accept=".csv,.md,.txt,.zip"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-2"
                >
                  <FileText className="w-12 h-12 mx-auto text-primary" />
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {t('اسحب ملف هنا أو انقر للاختيار', 'Drop file here or click to select')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('يدعم ملفات Markdown و CSV و TXT و ZIP', 'Supports Markdown, CSV, TXT, and ZIP files')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress */}
          {isImporting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('جاري الاستيراد...', 'Importing...')}</span>
                <span className="text-foreground">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </motion.div>
          )}

          {/* Options */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="course-overwrite">{t('استبدال المقررات الموجودة', 'Overwrite existing courses')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('تحديث بيانات المقررات الموجودة مسبقاً', 'Update data for existing courses')}
              </p>
            </div>
            <Switch
              id="course-overwrite"
              checked={overwrite}
              onCheckedChange={setOverwrite}
            />
          </div>

          {/* Import Button */}
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || isImporting}
            className="w-full"
            size="lg"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('جاري الاستيراد...', 'Importing...')}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {t('بدء الاستيراد', 'Start Import')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            {t('نتائج الاستيراد', 'Import Results')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastResult ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{lastResult.total_courses}</p>
                  <p className="text-xs text-muted-foreground">{t('إجمالي المقررات', 'Total Courses')}</p>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-500">{lastResult.successful_imports}</p>
                  <p className="text-xs text-muted-foreground">{t('نجح', 'Successful')}</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-red-500">{lastResult.failed_imports}</p>
                  <p className="text-xs text-muted-foreground">{t('فشل', 'Failed')}</p>
                </div>
              </div>

              {/* Imported Codes */}
              {lastResult.imported_codes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t('المقررات المستوردة:', 'Imported Courses:')}</p>
                  <div className="flex flex-wrap gap-2">
                    {lastResult.imported_codes.map((code, idx) => (
                      <Badge key={idx} variant="outline" className="bg-primary/5">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {lastResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t('الأخطاء:', 'Errors:')}</p>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {lastResult.errors.map((error, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-red-500/5 rounded text-sm">
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">{error.code}:</span>{' '}
                            <span className="text-muted-foreground">{error.error}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Success message */}
              {lastResult.successful_imports > 0 && lastResult.errors.length === 0 && (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span>{t('تم استيراد جميع المقررات بنجاح!', 'All courses imported successfully!')}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <BookOpen className="w-12 h-12 mb-4 opacity-50" />
              <p>{t('لم يتم إجراء أي استيراد بعد', 'No import performed yet')}</p>
              <p className="text-sm">{t('ارفع ملف للبدء', 'Upload a file to start')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Format Guide */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t('صيغة الملف المدعومة', 'Supported File Formats')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="font-medium text-foreground">{t('Markdown / TXT:', 'Markdown / TXT:')}</p>
              <div className="p-4 bg-muted/30 rounded-lg">
                <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
{`# السنة الأولى - الفصل الأول

- CS101 - مبادئ البرمجة (3 ساعات)
  متطلب سابق: لا يوجد
  
- CS102 - هياكل البيانات (3 ساعات)
  متطلب سابق: CS101`}
                </code>
              </div>
            </div>
            <div className="space-y-3">
              <p className="font-medium text-foreground">{t('CSV:', 'CSV:')}</p>
              <div className="p-4 bg-muted/30 rounded-lg">
                <code className="text-xs text-muted-foreground block whitespace-pre-wrap">
{`code,name,credits,department,prerequisites
CS101,Programming Basics,3,Computer Science,
CS102,Data Structures,3,Computer Science,CS101
CS201,Algorithms,3,Computer Science,CS102`}
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
