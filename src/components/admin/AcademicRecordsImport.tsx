import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, 
  Database, Archive, RefreshCw, XCircle, RotateCcw, Eye
} from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

interface FileImportStatus {
  fileName: string;
  studentId: string;
  status: 'pending' | 'importing' | 'success' | 'failed' | 'skipped';
  recordsCount: number;
  parsedRows?: number;
  duplicatesSkipped?: number;
  error?: string;
}

interface ImportSummary {
  totalFiles: number;
  successFiles: number;
  failedFiles: number;
  skippedFiles: number;
  totalRecords: number;
  totalParsedRows: number;
  totalDuplicatesSkipped: number;
  importLogId?: string;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  delimiter: string;
  validRows: number;
  invalidRows: number;
}

export const AcademicRecordsImport = () => {
  const { t } = useLanguageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  
  const [fileStatuses, setFileStatuses] = useState<FileImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isRollbacking, setIsRollbacking] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [csvContents, setCsvContents] = useState<Map<string, string>>(new Map());

  // Convert Excel (xlsx/xls) ArrayBuffer to CSV using SheetJS
  const excelToCsv = (buffer: ArrayBuffer): string => {
    try {
      console.log('Converting Excel, buffer size:', buffer.byteLength);
      const workbook = XLSX.read(buffer, { type: 'array' });
      console.log('Workbook sheets:', workbook.SheetNames);
      const sheetName = workbook.SheetNames?.[0];
      if (!sheetName) {
        throw new Error('No sheets found in Excel file');
      }
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet, {
        FS: ',',
        RS: '\n',
        blankrows: false,
      });
      console.log('Converted CSV length:', csv.length, 'First 200 chars:', csv.substring(0, 200));
      return csv;
    } catch (error) {
      console.error('Excel conversion error:', error);
      throw error;
    }
  };

  // RFC4180 CSV parser for preview
  const parseCSVPreview = useCallback((text: string): PreviewData => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [], delimiter: ',', validRows: 0, invalidRows: 0 };

    // Detect delimiter
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    let delimiter = ',';
    if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
    else if (semiCount > commaCount) delimiter = ';';

    const parseRow = (line: string): string[] => {
      const values: string[] = [];
      let val = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQ && line[i + 1] === '"') { val += '"'; i++; }
          else inQ = !inQ;
        } else if (c === delimiter && !inQ) {
          values.push(val.trim());
          val = '';
        } else {
          val += c;
        }
      }
      values.push(val.trim());
      return values;
    };

    const headers = parseRow(lines[0]).map((h, idx) =>
      idx === 0 ? h.replace(/^\uFEFF/, '') : h
    );
    const rows: string[][] = [];
    let validRows = 0;
    let invalidRows = 0;

    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const row = parseRow(lines[i]);
      rows.push(row);
    }

    // Count valid/invalid based on having data
    for (let i = 1; i < lines.length; i++) {
      const row = parseRow(lines[i]);
      if (row.some(v => v.trim())) validRows++;
      else invalidRows++;
    }

    return { headers, rows, delimiter, validRows, invalidRows };
  }, []);

  // Extract student ID from filename
  const extractStudentId = (filename: string): string => {
    const name = filename.replace(/\\/g, '/').split('/').pop() || '';
    const match = name.match(/^(\d{5,10})/);
    return match ? match[1] : 'unknown';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv') || fileName.endsWith('.tsv');
    const isZIP = fileName.endsWith('.zip');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isZIP && !isExcel) {
      toast.error(t('يرجى اختيار ملف CSV أو ZIP أو Excel', 'Please select a CSV, ZIP or Excel file'));
      return;
    }

    setSummary(null);
    setFileStatuses([]);
    setPreviewData(null);

    try {
      if (isCSV) {
        const text = await selectedFile.text();
        const studentId = extractStudentId(selectedFile.name);
        
        setCsvContents(new Map([[selectedFile.name, text]]));
        setZipFile(null);
        setSelectedFileName(selectedFile.name);
        setPreviewData(parseCSVPreview(text));
        setFileStatuses([{
          fileName: selectedFile.name,
          studentId,
          status: 'pending',
          recordsCount: 0,
        }]);
        
      } else if (isExcel) {
        setProgressMessage(t('جاري قراءة ملف Excel...', 'Reading Excel file...'));
        setProgress(20);

        const arrayBuffer = await selectedFile.arrayBuffer();
        const csvText = excelToCsv(arrayBuffer);
        const studentId = extractStudentId(selectedFile.name);

        setCsvContents(new Map([[selectedFile.name, csvText]]));
        setZipFile(null);
        setSelectedFileName(selectedFile.name);
        setPreviewData(parseCSVPreview(csvText));
        setFileStatuses([
          {
            fileName: selectedFile.name,
            studentId,
            status: 'pending',
            recordsCount: 0,
          },
        ]);

        setProgress(0);
        setProgressMessage('');
        toast.success(t('تم تحويل ملف Excel إلى CSV', 'Excel converted to CSV'));

      } else if (isZIP) {
        setProgressMessage(t('جاري فك ضغط الملف...', 'Extracting ZIP file...'));
        setProgress(10);
        setZipFile(selectedFile);
        
        const zip = new JSZip();
        const contents = await zip.loadAsync(selectedFile);
        
        // Support CSV, TSV and Excel files inside ZIP
        const fileNames = Object.keys(contents.files).filter(name => {
          const lower = name.toLowerCase();
          return (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) 
            && !name.startsWith('__MACOSX') 
            && !contents.files[name].dir;
        });

        setProgress(30);
        setProgressMessage(t(`تم العثور على ${fileNames.length} ملف`, `Found ${fileNames.length} files`));

        const newContents = new Map<string, string>();
        const statuses: FileImportStatus[] = [];

        for (let i = 0; i < fileNames.length; i++) {
          const fName = fileNames[i];
          const lower = fName.toLowerCase();
          
          if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
            // Convert Excel file inside ZIP to CSV
            const arrayBuffer = await contents.files[fName].async('arraybuffer');
            const csvText = excelToCsv(arrayBuffer);
            newContents.set(fName, csvText);
          } else {
            // CSV/TSV file
            const text = await contents.files[fName].async('text');
            newContents.set(fName, text);
          }
          
          statuses.push({
            fileName: fName,
            studentId: extractStudentId(fName),
            status: 'pending',
            recordsCount: 0,
          });
          
          setProgress(30 + (i / fileNames.length) * 40);
        }

        setCsvContents(newContents);
        setFileStatuses(statuses);

        // Preview first file
        if (fileNames.length > 0) {
          const firstFile = fileNames[0];
          const firstContent = newContents.get(firstFile);
          if (firstContent) {
            setSelectedFileName(firstFile);
            setPreviewData(parseCSVPreview(firstContent));
          } else {
            setSelectedFileName(firstFile);
          }
        }

        setProgress(0);
        setProgressMessage('');
        
        const csvCount = fileNames.filter(f => f.toLowerCase().endsWith('.csv') || f.toLowerCase().endsWith('.tsv')).length;
        const excelCount = fileNames.filter(f => f.toLowerCase().endsWith('.xlsx') || f.toLowerCase().endsWith('.xls')).length;
        
        toast.success(t(
          `تم فك الضغط: ${csvCount} ملف CSV، ${excelCount} ملف Excel`,
          `Extracted: ${csvCount} CSV files, ${excelCount} Excel files`
        ));
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast.error(t('فشل في قراءة الملف', 'Failed to read file'));
      setProgress(0);
      setProgressMessage('');
    }
  };

  const requestCancel = () => {
    cancelRef.current = true;
    setCancelRequested(true);
    toast.message(t('جاري إيقاف الاستيراد...', 'Stopping import...'));
  };

  const rollbackLastImport = async () => {
    if (!summary?.importLogId) return;

    setIsRollbacking(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-student-records', {
        body: {
          action: 'rollback',
          importLogId: summary.importLogId,
        },
      });

      if (error) throw error;

      const deleted = data?.deleted || 0;
      toast.success(
        t(`تم حذف ${deleted} سجل من هذا الاستيراد`, `Deleted ${deleted} records from this import`)
      );

      // Refresh local state
      setSummary(null);
      setFileStatuses([]);
      setPreviewData(null);
      setSelectedFileName('');
      setZipFile(null);
      setCsvContents(new Map());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Rollback failed';
      toast.error(t('فشل حذف الاستيراد', 'Rollback failed'), { description: msg });
    } finally {
      setIsRollbacking(false);
    }
  };

  const handleImport = async () => {
    if (csvContents.size === 0) {
      toast.error(t('يرجى اختيار ملف أولاً', 'Please select a file first'));
      return;
    }

    cancelRef.current = false;
    setCancelRequested(false);
    setIsImporting(true);
    setProgress(5);
    setProgressMessage(t('جاري التحضير...', 'Preparing...'));

    try {
      // Determine file type
      const fileName = zipFile?.name || selectedFileName;
      const fileType = zipFile ? 'zip' : (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls') ? 'excel' : 'csv');
      
      // Create import log
      const { data: logData, error: logError } = await supabase
        .from('import_logs')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          file_name: fileName,
          file_type: fileType,
          total_records: 0,
          status: 'processing',
        })
        .select('id')
        .single();

      if (logError) {
        console.error('Failed to create import log:', logError);
      }

      const importLogId = logData?.id;
      const entries = Array.from(csvContents.entries());
      let totalInserted = 0;
      let totalParsedRows = 0;
      let totalDuplicatesSkipped = 0;
      let successFiles = 0;
      let failedFiles = 0;
      let skippedFiles = 0;

      for (let i = 0; i < entries.length; i++) {
        if (cancelRef.current) break;

        const [fileName, csvData] = entries[i];
        const studentId = extractStudentId(fileName);

        setProgressMessage(
          t(
            `جاري استيراد ${i + 1} من ${entries.length}: ${fileName}`,
            `Importing ${i + 1} of ${entries.length}: ${fileName}`
          )
        );
        setProgress(5 + ((i / entries.length) * 90));

        // Update status to importing
        setFileStatuses(prev =>
          prev.map(f => (f.fileName === fileName ? { ...f, status: 'importing' as const } : f))
        );

        try {
          // Log the data being sent for debugging
          console.log(`Sending file ${fileName}, csvData length: ${csvData?.length || 0}`);
          
          if (!csvData || csvData.trim().length === 0) {
            throw new Error('CSV data is empty');
          }
          
          const { data, error } = await supabase.functions.invoke('import-student-records', {
            body: {
              csvData,
              fileName,
              importLogId,
              useFilenameAsStudentId: true,
            },
          });

          if (error) throw error;

          const inserted = data?.inserted || 0;
          const parsedRows = data?.parsed_rows || 0;
          const duplicatesSkipped = data?.duplicates_skipped || 0;

          totalInserted += inserted;
          totalParsedRows += parsedRows;
          totalDuplicatesSkipped += duplicatesSkipped;

          if (data?.success && inserted > 0) {
            successFiles++;
            setFileStatuses(prev =>
              prev.map(f =>
                f.fileName === fileName
                  ? {
                      ...f,
                      status: 'success' as const,
                      recordsCount: inserted,
                      parsedRows,
                      duplicatesSkipped,
                      studentId: data.studentId || studentId,
                    }
                  : f
              )
            );
          } else if (inserted === 0) {
            skippedFiles++;
            setFileStatuses(prev =>
              prev.map(f =>
                f.fileName === fileName
                  ? {
                      ...f,
                      status: 'skipped' as const,
                      parsedRows,
                      duplicatesSkipped,
                      error: data?.error || 'No records inserted',
                    }
                  : f
              )
            );
          }
        } catch (err) {
          failedFiles++;
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setFileStatuses(prev =>
            prev.map(f =>
              f.fileName === fileName
                ? {
                    ...f,
                    status: 'failed' as const,
                    error: errorMsg,
                  }
                : f
            )
          );
        }
      }

      const wasCancelled = cancelRef.current;

      // Update import log
      if (importLogId) {
        await supabase
          .from('import_logs')
          .update({
            total_records: entries.length,
            successful_records: successFiles,
            failed_records: failedFiles,
            status: wasCancelled
              ? 'cancelled'
              : failedFiles === 0
                ? 'completed'
                : 'completed_with_errors',
            completed_at: new Date().toISOString(),
          })
          .eq('id', importLogId);
      }

      if (wasCancelled) {
        setProgressMessage(t('تم إيقاف الاستيراد', 'Import stopped'));
        toast.message(t('تم إيقاف الاستيراد', 'Import stopped'));
      }

      setProgress(100);
      setSummary({
        totalFiles: entries.length,
        successFiles,
        failedFiles,
        skippedFiles,
        totalRecords: totalInserted,
        totalParsedRows,
        totalDuplicatesSkipped,
        importLogId,
      });

      if (successFiles > 0) {
        toast.success(
          t(
            `تم استيراد ${totalInserted} سجل من ${successFiles} ملف`,
            `Imported ${totalInserted} records from ${successFiles} files`
          )
        );
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t('فشل الاستيراد', 'Import failed'));
    } finally {
      setIsImporting(false);
      setProgressMessage('');
    }
  };

  const retryFailed = async () => {
    const failedFiles = fileStatuses.filter(f => f.status === 'failed');
    if (failedFiles.length === 0) return;

    setIsImporting(true);
    let successCount = 0;

    for (const file of failedFiles) {
      const csvData = csvContents.get(file.fileName);
      if (!csvData) continue;

      setFileStatuses(prev => prev.map(f => 
        f.fileName === file.fileName ? { ...f, status: 'importing' as const } : f
      ));

      try {
        const { data, error } = await supabase.functions.invoke('import-student-records', {
          body: { 
            csvData, 
            fileName: file.fileName,
            useFilenameAsStudentId: true,
          },
        });

        if (error) throw error;

        if (data?.success && data?.inserted > 0) {
          successCount++;
          setFileStatuses(prev => prev.map(f => 
            f.fileName === file.fileName ? { 
              ...f, 
              status: 'success' as const, 
              recordsCount: data.inserted,
            } : f
          ));
        }
      } catch (err) {
        setFileStatuses(prev => prev.map(f => 
          f.fileName === file.fileName ? { 
            ...f, 
            status: 'failed' as const, 
            error: err instanceof Error ? err.message : 'Unknown error',
          } : f
        ));
      }
    }

    setIsImporting(false);
    if (successCount > 0) {
      toast.success(t(`تم إعادة استيراد ${successCount} ملف بنجاح`, `Successfully re-imported ${successCount} files`));
    }
  };

  const downloadErrorsCSV = () => {
    const errors = fileStatuses.filter(f => f.status === 'failed' || f.status === 'skipped');
    if (errors.length === 0) return;

    const csv = 'file_name,student_id,status,error\n' + 
      errors.map(e => `"${e.fileName}","${e.studentId}","${e.status}","${e.error || ''}"`).join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const headers = [
      'student_id', 'course_code', 'course_name', 'letter_grade', 'semester',
      'academic_year', 'cumulative_gpa_points', 'final_grade', 'course_credits',
      'college', 'major', 'total_completed_hours',
    ];
    const example = [
      '4210380', 'CS101', 'البرمجة', 'A', 'الفصل الأول',
      '2024/2025', '3.5', '92', '3',
      'كلية الهندسة المعلوماتية', 'هندسة البرمجيات', '45',
    ];
    const csv = headers.join(',') + '\n' + example.join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: FileImportStatus['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'importing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <div className="w-4 h-4 rounded-full bg-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">{t('استيراد', 'Import')}</TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewData}>{t('معاينة', 'Preview')}</TabsTrigger>
          <TabsTrigger value="status" disabled={fileStatuses.length === 0}>{t('الحالة', 'Status')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-6">
          {/* Upload Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                {t('استيراد السجلات الأكاديمية', 'Import Academic Records')}
              </CardTitle>
              <CardDescription>
                {t(
                  'ارفع ملف CSV واحد (يحوي student_id) أو ملف ZIP يحتوي ملفات CSV (اسم كل ملف = الرقم الجامعي)',
                  'Upload a single CSV (with student_id) or a ZIP containing CSV files (filename = student ID)'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div
                onClick={() => !isImporting && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-border/50 rounded-lg p-8 text-center transition-colors ${
                  isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-muted/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.zip,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isImporting}
                />
                {zipFile || selectedFileName ? (
                  <Archive className="w-12 h-12 mx-auto text-primary mb-4" />
                ) : (
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                )}
                <p className="text-lg font-medium mb-1">
                  {zipFile?.name || selectedFileName || t('اسحب ملف CSV أو ZIP هنا', 'Drop CSV or ZIP file here')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {fileStatuses.length > 0 
                    ? t(`${fileStatuses.length} ملف جاهز للاستيراد`, `${fileStatuses.length} files ready to import`)
                    : t('اسم الملف يجب أن يكون الرقم الجامعي (مثال: 4220212.csv)', 'Filename must be student ID (e.g., 4220212.csv)')}
                </p>
              </div>

              {/* Progress */}
              {(isImporting || progressMessage) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {progressMessage}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Summary */}
              {summary && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {summary.failedFiles === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                      {t('تقرير الاستيراد', 'Import Report')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Main stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-background rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-primary">{summary.totalRecords}</div>
                        <div className="text-xs text-muted-foreground">{t('سجل مستورد', 'Records imported')}</div>
                      </div>
                      <div className="bg-background rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">{summary.totalParsedRows}</div>
                        <div className="text-xs text-muted-foreground">{t('صف مقروء', 'Rows parsed')}</div>
                      </div>
                      <div className="bg-background rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-500">{summary.totalDuplicatesSkipped}</div>
                        <div className="text-xs text-muted-foreground">{t('مكرر (تم دمجه)', 'Duplicates merged')}</div>
                      </div>
                      <div className="bg-background rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">{summary.totalFiles}</div>
                        <div className="text-xs text-muted-foreground">{t('ملف', 'Files')}</div>
                      </div>
                    </div>

                    {/* File stats */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        {summary.successFiles} {t('نجح', 'success')}
                      </Badge>
                      {summary.failedFiles > 0 && (
                        <Badge variant="destructive">
                          {summary.failedFiles} {t('فشل', 'failed')}
                        </Badge>
                      )}
                      {summary.skippedFiles > 0 && (
                        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          {summary.skippedFiles} {t('تخطي', 'skipped')}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleImport}
                  disabled={fileStatuses.length === 0 || isImporting}
                  className="flex-1"
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      {t('جاري الاستيراد...', 'Importing...')}
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 ml-2" />
                      {t('بدء الاستيراد', 'Start Import')}
                    </>
                  )}
                </Button>

                {isImporting && (
                  <Button
                    variant="outline"
                    onClick={requestCancel}
                    disabled={cancelRequested}
                    size="lg"
                  >
                    <XCircle className="w-4 h-4 ml-2" />
                    {cancelRequested ? t('جاري الإيقاف...', 'Stopping...') : t('إيقاف', 'Stop')}
                  </Button>
                )}
                
                {fileStatuses.some(f => f.status === 'failed') && (
                  <Button variant="outline" onClick={retryFailed} disabled={isImporting}>
                    <RotateCcw className="w-4 h-4 ml-2" />
                    {t('إعادة الفاشل', 'Retry Failed')}
                  </Button>
                )}

                {summary?.importLogId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isImporting || isRollbacking}>
                        <XCircle className="w-4 h-4 ml-2" />
                        {t('حذف هذا الاستيراد', 'Delete this import')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('تأكيد حذف الاستيراد', 'Confirm rollback')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t(
                            'سيتم حذف السجلات التي تم إنشاؤها بواسطة هذا الاستيراد فقط. لا يمكن التراجع عن العملية.',
                            'This will delete only records created by this import. This action cannot be undone.'
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={rollbackLastImport}>
                          {isRollbacking ? t('جاري الحذف...', 'Deleting...') : t('تأكيد الحذف', 'Confirm delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 ml-2" />
                  {t('قالب', 'Template')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          {previewData && (
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {t('معاينة الملف', 'File Preview')}: {selectedFileName}
                </CardTitle>
                <CardDescription className="flex gap-4">
                  <span>{t('الفاصل:', 'Delimiter:')} <Badge variant="outline">{previewData.delimiter === '\t' ? 'TAB' : previewData.delimiter}</Badge></span>
                  <span>{t('صفوف صالحة:', 'Valid rows:')} <Badge className="bg-green-500/10 text-green-500">{previewData.validRows}</Badge></span>
                  <span>{t('صفوف فارغة:', 'Empty rows:')} <Badge variant="secondary">{previewData.invalidRows}</Badge></span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {previewData.headers.map((h, i) => (
                          <TableHead key={i} className="text-xs">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.rows.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j} className="text-xs">{cell.slice(0, 30)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="status">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t('حالة الملفات', 'File Status')}</CardTitle>
                  <CardDescription>{fileStatuses.length} {t('ملف', 'files')}</CardDescription>
                </div>
                {fileStatuses.some(f => f.status === 'failed' || f.status === 'skipped') && (
                  <Button variant="outline" size="sm" onClick={downloadErrorsCSV}>
                    <Download className="w-4 h-4 ml-2" />
                    {t('تنزيل الأخطاء', 'Download Errors')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>{t('الملف', 'File')}</TableHead>
                      <TableHead>{t('الرقم الجامعي', 'Student ID')}</TableHead>
                      <TableHead>{t('صفوف', 'Rows')}</TableHead>
                      <TableHead>{t('مستورد', 'Imported')}</TableHead>
                      <TableHead>{t('مكرر', 'Dupes')}</TableHead>
                      <TableHead>{t('الحالة', 'Status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fileStatuses.map((file, i) => (
                      <TableRow key={i}>
                        <TableCell>{getStatusIcon(file.status)}</TableCell>
                        <TableCell className="font-mono text-xs max-w-48 truncate">{file.fileName}</TableCell>
                        <TableCell className="font-mono">{file.studentId}</TableCell>
                        <TableCell>{file.parsedRows || '-'}</TableCell>
                        <TableCell className="text-green-600">{file.recordsCount || '-'}</TableCell>
                        <TableCell className="text-yellow-600">{file.duplicatesSkipped || '-'}</TableCell>
                        <TableCell>
                          {file.error ? (
                            <span className="text-xs text-red-500 max-w-32 truncate block" title={file.error}>{file.error}</span>
                          ) : (
                            <Badge variant={file.status === 'success' ? 'default' : 'secondary'}>{file.status}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            {t('تعليمات الاستيراد', 'Import Instructions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• {t('يمكنك رفع ملف CSV واحد يحتوي student_id أو رفع ملف ZIP يحتوي عدة ملفات CSV دفعة واحدة', 'You can upload a single CSV with student_id, or a ZIP containing multiple CSV files')}</p>
          <p>• {t('في ZIP: اسم كل ملف CSV يفضّل أن يكون الرقم الجامعي (مثال: 4220212.csv)', 'In ZIP: each CSV filename should be the student ID (e.g., 4220212.csv)')}</p>
          <p>• {t('الملفات التي تفشل يمكن إعادة محاولتها بشكل منفصل', 'Failed files can be retried separately')}</p>
          <p>• {t('الطالب يرى بياناته فقط - المرشد يرى طلابه - الإدمن يرى الكل', 'Student sees own data - Advisor sees assigned students - Admin sees all')}</p>
        </CardContent>
      </Card>
    </div>
  );
};
