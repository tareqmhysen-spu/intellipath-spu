import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguageStore } from '@/stores/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  Briefcase,
  Code,
  Wrench,
  Tag,
  Link,
  AlertTriangle,
  Timer,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataStats {
  majors: number;
  courses: number;
  prerequisites: number;
  skills: number;
  tools: number;
  topics: number;
  career_paths: number;
  course_majors: number;
  course_skills: number;
  course_topics: number;
  course_tools: number;
  course_career_paths: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  stats?: any;
  error?: string;
  timestamp?: string;
}

export default function SyncManagement() {
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const isArabic = language === 'ar';
  
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  
  // Cron job state
  const [cronEnabled, setCronEnabled] = useState(false);
  const [cronSchedule, setCronSchedule] = useState('daily');
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<{
    success: boolean;
    memories_cleaned?: number;
    rate_limits_cleaned?: number;
    cache_cleaned?: number;
    executed_at?: string;
    error?: string;
  } | null>(null);

  // Fetch current data stats
  const fetchStats = async () => {
    setLoading(true);
    
    try {
      const [
        majors,
        courses,
        prerequisites,
        skills,
        tools,
        topics,
        careerPaths,
        courseMajors,
        courseSkills,
        courseTopics,
        courseTools,
        courseCareerPaths
      ] = await Promise.all([
        supabase.from('majors').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('course_prerequisites').select('id', { count: 'exact', head: true }),
        supabase.from('skills').select('id', { count: 'exact', head: true }),
        supabase.from('tools').select('id', { count: 'exact', head: true }),
        supabase.from('topics').select('id', { count: 'exact', head: true }),
        supabase.from('career_paths').select('id', { count: 'exact', head: true }),
        supabase.from('course_majors').select('id', { count: 'exact', head: true }),
        supabase.from('course_skills').select('id', { count: 'exact', head: true }),
        supabase.from('course_topics').select('id', { count: 'exact', head: true }),
        supabase.from('course_tools').select('id', { count: 'exact', head: true }),
        supabase.from('course_career_paths').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        majors: majors.count || 0,
        courses: courses.count || 0,
        prerequisites: prerequisites.count || 0,
        skills: skills.count || 0,
        tools: tools.count || 0,
        topics: topics.count || 0,
        career_paths: careerPaths.count || 0,
        course_majors: courseMajors.count || 0,
        course_skills: courseSkills.count || 0,
        course_topics: courseTopics.count || 0,
        course_tools: courseTools.count || 0,
        course_career_paths: courseCareerPaths.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تحميل الإحصائيات' : 'Failed to load statistics',
        variant: 'destructive'
      });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Run sync
  const runSync = async () => {
    setSyncing(true);
    setSyncProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => Math.min(prev + 10, 90));
    }, 500);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-neo4j', {
        body: { full_sync: true }
      });

      clearInterval(progressInterval);
      setSyncProgress(100);

      if (error) {
        throw error;
      }

      setLastSyncResult({
        success: true,
        message: isArabic ? 'تمت المزامنة بنجاح' : 'Sync completed successfully',
        stats: data,
        timestamp: new Date().toISOString()
      });

      toast({
        title: isArabic ? 'نجاح' : 'Success',
        description: isArabic ? 'تمت مزامنة البيانات بنجاح' : 'Data synced successfully'
      });

      // Refresh stats
      await fetchStats();
    } catch (error: any) {
      clearInterval(progressInterval);
      setSyncProgress(0);
      
      setLastSyncResult({
        success: false,
        message: isArabic ? 'فشل في المزامنة' : 'Sync failed',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });

      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: error.message || (isArabic ? 'فشل في المزامنة' : 'Sync failed'),
        variant: 'destructive'
      });
    }
    
    setSyncing(false);
  };

  // Run cleanup job manually
  const runCleanupJob = async () => {
    setRunningCleanup(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-job');

      if (error) {
        throw error;
      }

      setLastCleanupResult({
        success: true,
        memories_cleaned: data?.memories?.cleaned || 0,
        rate_limits_cleaned: data?.rate_limits_cleaned || 0,
        cache_cleaned: data?.cache_cleaned || 0,
        executed_at: data?.executed_at || new Date().toISOString()
      });

      toast({
        title: isArabic ? 'نجاح' : 'Success',
        description: isArabic ? 'تم تنظيف البيانات المنتهية بنجاح' : 'Cleanup completed successfully'
      });
    } catch (error: any) {
      setLastCleanupResult({
        success: false,
        error: error.message || 'Unknown error',
        executed_at: new Date().toISOString()
      });

      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: error.message || (isArabic ? 'فشل في التنظيف' : 'Cleanup failed'),
        variant: 'destructive'
      });
    }
    
    setRunningCleanup(false);
  };

  const cronScheduleOptions = [
    { value: 'hourly', label: { ar: 'كل ساعة', en: 'Every hour' }, cron: '0 * * * *' },
    { value: 'daily', label: { ar: 'يومياً', en: 'Daily (midnight)' }, cron: '0 0 * * *' },
    { value: 'weekly', label: { ar: 'أسبوعياً', en: 'Weekly (Sunday)' }, cron: '0 0 * * 0' }
  ];

  const statCards = [
    { key: 'majors', icon: GraduationCap, label: { ar: 'التخصصات', en: 'Majors' }, color: 'text-purple-500' },
    { key: 'courses', icon: BookOpen, label: { ar: 'المقررات', en: 'Courses' }, color: 'text-blue-500' },
    { key: 'prerequisites', icon: Link, label: { ar: 'المتطلبات', en: 'Prerequisites' }, color: 'text-amber-500' },
    { key: 'skills', icon: Code, label: { ar: 'المهارات', en: 'Skills' }, color: 'text-emerald-500' },
    { key: 'tools', icon: Wrench, label: { ar: 'الأدوات', en: 'Tools' }, color: 'text-rose-500' },
    { key: 'topics', icon: Tag, label: { ar: 'المواضيع', en: 'Topics' }, color: 'text-indigo-500' },
    { key: 'career_paths', icon: Briefcase, label: { ar: 'المسارات الوظيفية', en: 'Career Paths' }, color: 'text-teal-500' }
  ];

  const relationCards = [
    { key: 'course_majors', label: { ar: 'ربط المقررات بالتخصصات', en: 'Course-Major Links' } },
    { key: 'course_skills', label: { ar: 'ربط المقررات بالمهارات', en: 'Course-Skill Links' } },
    { key: 'course_topics', label: { ar: 'ربط المقررات بالمواضيع', en: 'Course-Topic Links' } },
    { key: 'course_tools', label: { ar: 'ربط المقررات بالأدوات', en: 'Course-Tool Links' } },
    { key: 'course_career_paths', label: { ar: 'ربط المقررات بالمسارات', en: 'Course-Career Links' } }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              {isArabic ? 'إدارة المزامنة' : 'Sync Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isArabic 
                ? 'مزامنة البيانات من Neo4j إلى قاعدة البيانات' 
                : 'Sync data from Neo4j to database'}
            </p>
          </div>
          
          <Button 
            onClick={runSync} 
            disabled={syncing}
            size="lg"
            className="gap-2"
          >
            <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing 
              ? (isArabic ? 'جاري المزامنة...' : 'Syncing...') 
              : (isArabic ? 'بدء المزامنة' : 'Start Sync')}
          </Button>
        </div>

        {/* Scheduled Cleanup Section */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              {isArabic ? 'التنظيف المجدول' : 'Scheduled Cleanup'}
            </CardTitle>
            <CardDescription>
              {isArabic 
                ? 'تنظيف تلقائي للذكريات المنتهية وذاكرة التخزين المؤقت' 
                : 'Automatic cleanup of expired memories and cache'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={cronEnabled} 
                  onCheckedChange={setCronEnabled}
                  id="cron-enabled"
                />
                <label htmlFor="cron-enabled" className="text-sm font-medium cursor-pointer">
                  {isArabic ? 'تفعيل التنظيف التلقائي' : 'Enable automatic cleanup'}
                </label>
              </div>
              
              {cronEnabled && (
                <Select value={cronSchedule} onValueChange={setCronSchedule}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cronScheduleOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {isArabic ? option.label.ar : option.label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button 
                variant="outline" 
                onClick={runCleanupJob}
                disabled={runningCleanup}
                className="gap-2"
              >
                <Trash2 className={`h-4 w-4 ${runningCleanup ? 'animate-pulse' : ''}`} />
                {runningCleanup 
                  ? (isArabic ? 'جاري التنظيف...' : 'Cleaning...') 
                  : (isArabic ? 'تشغيل الآن' : 'Run Now')}
              </Button>
            </div>

            {cronEnabled && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="font-medium">{isArabic ? 'جدولة Cron: ' : 'Cron Schedule: '}</span>
                <code className="bg-background px-2 py-1 rounded">
                  {cronScheduleOptions.find(o => o.value === cronSchedule)?.cron}
                </code>
                <p className="text-muted-foreground mt-1 text-xs">
                  {isArabic 
                    ? 'ملاحظة: لتفعيل الجدولة، يجب إضافة هذا الأمر في لوحة تحكم قاعدة البيانات باستخدام pg_cron' 
                    : 'Note: To activate scheduling, add this cron command in your database dashboard using pg_cron'}
                </p>
              </div>
            )}

            {/* Last Cleanup Result */}
            {lastCleanupResult && (
              <div className={`p-3 rounded-lg ${lastCleanupResult.success ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' : 'bg-destructive/10 border border-destructive/20'}`}>
                <div className="flex items-start gap-2">
                  {lastCleanupResult.success ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {lastCleanupResult.success 
                        ? (isArabic ? 'تم التنظيف بنجاح' : 'Cleanup successful')
                        : (isArabic ? 'فشل التنظيف' : 'Cleanup failed')}
                    </div>
                    {lastCleanupResult.success && (
                      <div className="text-xs text-muted-foreground mt-1 space-x-2 rtl:space-x-reverse">
                        <Badge variant="outline" className="text-xs">
                          {isArabic ? 'ذكريات: ' : 'Memories: '}{lastCleanupResult.memories_cleaned}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {isArabic ? 'حدود الطلبات: ' : 'Rate limits: '}{lastCleanupResult.rate_limits_cleaned}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {isArabic ? 'التخزين المؤقت: ' : 'Cache: '}{lastCleanupResult.cache_cleaned}
                        </Badge>
                      </div>
                    )}
                    {lastCleanupResult.error && (
                      <div className="text-xs text-destructive mt-1">{lastCleanupResult.error}</div>
                    )}
                    {lastCleanupResult.executed_at && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(lastCleanupResult.executed_at).toLocaleString(isArabic ? 'ar-SA' : 'en-US')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Progress */}
        {syncing && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {isArabic ? 'جاري المزامنة...' : 'Syncing...'}
                  </span>
                  <span className="text-sm text-muted-foreground">{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Sync Result */}
        {lastSyncResult && (
          <Card className={lastSyncResult.success ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-destructive/50 bg-destructive/10'}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {lastSyncResult.success ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{lastSyncResult.message}</div>
                  {lastSyncResult.timestamp && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(lastSyncResult.timestamp).toLocaleString(isArabic ? 'ar-SA' : 'en-US')}
                    </div>
                  )}
                  {lastSyncResult.error && (
                    <div className="text-sm text-destructive mt-1">{lastSyncResult.error}</div>
                  )}
                  {lastSyncResult.stats && (
                    <div className="mt-2 text-sm">
                      <Badge variant="outline" className="mr-2">
                        {isArabic ? 'تم مزامنة' : 'Synced'}: {lastSyncResult.stats.courses_count || 0} {isArabic ? 'مقرر' : 'courses'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            {isArabic ? 'إحصائيات البيانات' : 'Data Statistics'}
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {statCards.map(({ key, icon: Icon, label, color }) => (
                <Card key={key} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${color}`} />
                    <div className="text-2xl font-bold">
                      {stats?.[key as keyof DataStats] || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isArabic ? label.ar : label.en}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Relationship Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Link className="h-5 w-5" />
            {isArabic ? 'العلاقات' : 'Relationships'}
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {relationCards.map(({ key, label }) => (
                <Card key={key} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="text-xl font-bold text-primary">
                      {stats?.[key as keyof DataStats] || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isArabic ? label.ar : label.en}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Data Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {isArabic ? 'جودة البيانات' : 'Data Quality'}
            </CardTitle>
            <CardDescription>
              {isArabic ? 'فحص سريع لجودة البيانات المزامنة' : 'Quick check of synced data quality'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>{isArabic ? 'نسبة المقررات المرتبطة بتخصصات' : 'Courses linked to majors'}</span>
                  <Badge variant={stats.course_majors > 0 ? 'default' : 'destructive'}>
                    {stats.courses > 0 ? Math.round((stats.course_majors / stats.courses) * 100) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>{isArabic ? 'متوسط المتطلبات لكل مقرر' : 'Avg prerequisites per course'}</span>
                  <Badge variant="outline">
                    {stats.courses > 0 ? (stats.prerequisites / stats.courses).toFixed(1) : 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>{isArabic ? 'المقررات مع مهارات' : 'Courses with skills'}</span>
                  <Badge variant={stats.course_skills > 0 ? 'default' : 'secondary'}>
                    {stats.course_skills}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>{isArabic ? 'المقررات مع مواضيع' : 'Courses with topics'}</span>
                  <Badge variant={stats.course_topics > 0 ? 'default' : 'secondary'}>
                    {stats.course_topics}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">
              {isArabic ? 'ملاحظات' : 'Notes'}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>{isArabic ? 'المزامنة تستخدم upsert لتحديث البيانات الموجودة' : 'Sync uses upsert to update existing data'}</li>
              <li>{isArabic ? 'البيانات من Neo4j تعتبر المصدر الرئيسي' : 'Neo4j data is considered the primary source'}</li>
              <li>{isArabic ? 'لا يتم حذف البيانات غير الموجودة في Neo4j' : 'Data not in Neo4j is not deleted'}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
