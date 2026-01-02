/**
 * Study Materials Page
 * Features: Upload, View, Download, Delete study materials for courses
 */
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Download, Trash2, Search, Filter, 
  FolderOpen, Plus, X, Check, Loader2, BookOpen, Eye,
  FileSpreadsheet, File, FileImage, Archive
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudyMaterials } from '@/hooks/api/useStudyMaterials';
import { useLanguageStore } from '@/stores/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Course {
  id: string;
  code: string;
  name: string;
  name_ar?: string;
}

export default function StudyMaterials() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    materials,
    isLoading,
    isUploading,
    uploadProgress,
    fetchMaterials,
    uploadMaterial,
    downloadMaterial,
    deleteMaterial,
    formatFileSize,
  } = useStudyMaterials();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    title_ar: '',
    description: '',
    course_id: '',
    is_public: false,
  });

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, code, name, name_ar')
        .eq('is_active', true)
        .order('code');
      
      if (data) setCourses(data);
    };
    loadCourses();
  }, []);

  // Load materials
  useEffect(() => {
    fetchMaterials(selectedCourse === 'all' ? undefined : selectedCourse);
  }, [selectedCourse, fetchMaterials]);

  // Filter materials by search
  const filteredMaterials = materials.filter(m => {
    const searchLower = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(searchLower) ||
      m.title_ar?.toLowerCase().includes(searchLower) ||
      m.file_name.toLowerCase().includes(searchLower)
    );
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadForm(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ''),
      }));
      setShowUploadDialog(true);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile) return;
    
    await uploadMaterial(uploadFile, {
      title: uploadForm.title,
      title_ar: uploadForm.title_ar || undefined,
      description: uploadForm.description || undefined,
      course_id: uploadForm.course_id || undefined,
      is_public: uploadForm.is_public,
    });

    setShowUploadDialog(false);
    setUploadFile(null);
    setUploadForm({
      title: '',
      title_ar: '',
      description: '',
      course_id: '',
      is_public: false,
    });
  };

  // Get file icon component
  const getFileIconComponent = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <File className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    if (fileType.includes('image')) return <FileImage className="h-8 w-8 text-purple-500" />;
    if (fileType.includes('zip') || fileType.includes('archive')) return <Archive className="h-8 w-8 text-yellow-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const labels = {
    title: isRTL ? 'المواد الدراسية' : 'Study Materials',
    subtitle: isRTL ? 'رفع وإدارة ملفات المقررات' : 'Upload and manage course files',
    upload: isRTL ? 'رفع ملف' : 'Upload File',
    search: isRTL ? 'بحث...' : 'Search...',
    allCourses: isRTL ? 'جميع المقررات' : 'All Courses',
    noMaterials: isRTL ? 'لا توجد مواد دراسية' : 'No study materials',
    uploadFirst: isRTL ? 'ارفع ملفك الأول' : 'Upload your first file',
    fileName: isRTL ? 'اسم الملف' : 'File Name',
    titleEn: isRTL ? 'العنوان (إنجليزي)' : 'Title (English)',
    titleAr: isRTL ? 'العنوان (عربي)' : 'Title (Arabic)',
    description: isRTL ? 'الوصف' : 'Description',
    course: isRTL ? 'المقرر' : 'Course',
    selectCourse: isRTL ? 'اختر المقرر' : 'Select Course',
    isPublic: isRTL ? 'متاح للجميع' : 'Public Access',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    uploadBtn: isRTL ? 'رفع' : 'Upload',
    uploading: isRTL ? 'جاري الرفع...' : 'Uploading...',
    processing: isRTL ? 'جاري المعالجة' : 'Processing',
    processed: isRTL ? 'تمت المعالجة' : 'Processed',
    downloads: isRTL ? 'تحميلات' : 'downloads',
    confirmDelete: isRTL ? 'هل أنت متأكد من حذف هذا الملف؟' : 'Are you sure you want to delete this file?',
  };

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {labels.title}
            </h1>
            <p className="text-muted-foreground mt-1">{labels.subtitle}</p>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {labels.upload}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.md"
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={labels.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full md:w-[200px]">
              <BookOpen className="h-4 w-4 mr-2" />
              <SelectValue placeholder={labels.allCourses} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.allCourses}</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {isRTL ? course.name_ar || course.name : course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Materials Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredMaterials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">{labels.noMaterials}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">{labels.uploadFirst}</p>
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-4 w-4" />
              {labels.upload}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredMaterials.map((material, index) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                          {getFileIconComponent(material.file_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {isRTL ? material.title_ar || material.title : material.title}
                          </CardTitle>
                          <CardDescription className="text-xs truncate">
                            {material.file_name}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(material.file_size)}</span>
                        <span>{format(new Date(material.created_at), 'PP', { locale: isRTL ? ar : enUS })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={material.is_processed ? 'default' : 'secondary'} className="text-xs">
                          {material.is_processed ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              {labels.processed}
                            </>
                          ) : (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              {labels.processing}
                            </>
                          )}
                        </Badge>
                        
                        {material.is_public && (
                          <Badge variant="outline" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            {isRTL ? 'عام' : 'Public'}
                          </Badge>
                        )}
                        
                        {material.download_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Download className="h-3 w-3 mr-1" />
                            {material.download_count} {labels.downloads}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => downloadMaterial(material)}
                        >
                          <Download className="h-3 w-3" />
                          {isRTL ? 'تحميل' : 'Download'}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(labels.confirmDelete)) {
                              deleteMaterial(material.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{labels.upload}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {uploadFile && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {getFileIconComponent(uploadFile.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-center text-muted-foreground">{uploadProgress}%</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>{labels.titleEn}</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Introduction to Programming"
                />
              </div>

              <div className="space-y-2">
                <Label>{labels.titleAr}</Label>
                <Input
                  value={uploadForm.title_ar}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="مقدمة في البرمجة"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>{labels.description}</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>{labels.course}</Label>
                <Select 
                  value={uploadForm.course_id} 
                  onValueChange={(v) => setUploadForm(prev => ({ ...prev, course_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={labels.selectCourse} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {isRTL ? course.name_ar || course.name : course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>{labels.isPublic}</Label>
                <Switch
                  checked={uploadForm.is_public}
                  onCheckedChange={(v) => setUploadForm(prev => ({ ...prev, is_public: v }))}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isUploading}>
                {labels.cancel}
              </Button>
              <Button onClick={handleUpload} disabled={isUploading || !uploadForm.title}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {labels.uploading}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {labels.uploadBtn}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
