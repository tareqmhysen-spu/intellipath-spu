import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { CardGlass, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguageStore } from '@/stores/languageStore';
import { useAcademicRecord, GRADE_POINTS } from '@/hooks/useAcademicRecord';
import { 
  BarChart3, TrendingUp, TrendingDown, BookOpen, Clock, Target, 
  Award, Calendar, PieChart, Activity, GraduationCap, Zap, Download, AlertTriangle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function Analytics() {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  const [selectedPeriod, setSelectedPeriod] = useState('allTime');
  
  const { summary, allCourses, isLoading, hasAcademicRecord } = useAcademicRecord();

  // Build GPA history from academic records
  const gpaHistory = useMemo(() => {
    if (!summary?.semesters) return [];
    return summary.semesters
      .filter(s => s.semesterGPA > 0)
      .reverse()
      .map(s => ({
        semester: `${s.semester.substring(0, 10)}`,
        gpa: Math.round(s.semesterGPA * 100) / 100,
        credits: s.earnedCredits,
      }));
  }, [summary]);

  // Build grade distribution from courses
  const gradeDistribution = useMemo(() => {
    const dist: Record<string, { grade: string; count: number; color: string }> = {
      'A': { grade: 'A', count: 0, color: '#22c55e' },
      'B': { grade: 'B', count: 0, color: '#84cc16' },
      'C': { grade: 'C', count: 0, color: '#eab308' },
      'D': { grade: 'D', count: 0, color: '#f97316' },
      'F': { grade: 'F', count: 0, color: '#ef4444' },
      'P': { grade: 'P', count: 0, color: '#3b82f6' },
    };
    
    allCourses.forEach(c => {
      if (c.letter_grade) {
        const baseGrade = c.letter_grade.charAt(0);
        if (dist[baseGrade]) {
          dist[baseGrade].count++;
        }
      }
    });
    
    return Object.values(dist).filter(d => d.count > 0);
  }, [allCourses]);

  const texts = {
    title: isRTL ? 'التحليلات الأكاديمية' : 'Academic Analytics',
    subtitle: isRTL ? 'تتبع أداءك الأكاديمي بالتفصيل' : 'Track your academic performance in detail',
    overview: isRTL ? 'نظرة عامة' : 'Overview',
    performance: isRTL ? 'الأداء' : 'Performance',
    trends: isRTL ? 'الاتجاهات' : 'Trends',
    currentGpa: isRTL ? 'المعدل الحالي' : 'Current GPA',
    totalCredits: isRTL ? 'الساعات المنجزة' : 'Earned Credits',
    coursesCompleted: isRTL ? 'المقررات الناجحة' : 'Passed Courses',
    remaining: isRTL ? 'المتبقي للتخرج' : 'Remaining',
    gpaHistory: isRTL ? 'تاريخ المعدل' : 'GPA History',
    gradeDistribution: isRTL ? 'توزيع الدرجات' : 'Grade Distribution',
    coursePerformance: isRTL ? 'أداء المقررات' : 'Course Performance',
    studyHours: isRTL ? 'ساعات الدراسة' : 'Study Hours',
    skillsAnalysis: isRTL ? 'تحليل المهارات' : 'Skills Analysis',
    thisWeek: isRTL ? 'هذا الأسبوع' : 'This Week',
    vsAverage: isRTL ? 'مقارنة بالمتوسط' : 'vs Average',
    download: isRTL ? 'تحميل التقرير' : 'Download Report',
    semester: isRTL ? 'الفصل' : 'Semester',
    year: isRTL ? 'السنة' : 'Year',
    allTime: isRTL ? 'كل الوقت' : 'All Time',
    noData: isRTL ? 'لا توجد بيانات أكاديمية' : 'No academic data available',
    pGradeNote: isRTL ? 'P = معادلة (لا تحسب بالمعدل)' : 'P = Credited (not in GPA)',
  };

  const stats = [
    { 
      label: texts.currentGpa, 
      value: summary?.cumulativeGPA?.toFixed(2) || '0.00', 
      change: summary?.cumulativeGPA && summary.cumulativeGPA >= 2.0 ? '+' : '', 
      trend: summary?.cumulativeGPA && summary.cumulativeGPA >= 2.0 ? 'up' : 'down', 
      icon: GraduationCap,
      color: 'from-emerald-500 to-green-600'
    },
    { 
      label: texts.totalCredits, 
      value: summary?.totalCompletedHours?.toString() || '0', 
      subtext: `/ 173`,
      trend: 'up', 
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-600'
    },
    { 
      label: texts.coursesCompleted, 
      value: summary?.passedCourses?.toString() || '0', 
      subtext: summary?.equivalentCourses ? `(${summary.equivalentCourses} P)` : '',
      trend: 'up', 
      icon: Award,
      color: 'from-purple-500 to-pink-600'
    },
    { 
      label: texts.remaining, 
      value: summary?.remainingHours?.toString() || '173', 
      subtext: isRTL ? 'ساعة' : 'hrs',
      trend: 'neutral', 
      icon: Target,
      color: 'from-amber-500 to-orange-600'
    },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-6 space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!hasAcademicRecord) {
    return (
      <MainLayout>
        <div className="p-4 md:p-6">
          <CardGlass className="p-12 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{texts.noData}</h2>
            <p className="text-muted-foreground">
              {isRTL ? 'يرجى رفع سجلاتك الأكاديمية أولاً' : 'Please upload your academic records first'}
            </p>
          </CardGlass>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {texts.title}
                </h1>
                <p className="text-muted-foreground">{texts.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {texts.pGradeNote}
              </Badge>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {texts.download}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <CardGlass className="hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold mt-3">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </CardGlass>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <PieChart className="h-4 w-4 mr-2" />
              {texts.overview}
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              {texts.performance}
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              {texts.trends}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GPA History */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {texts.gpaHistory}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={gpaHistory}>
                        <defs>
                          <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
                        <YAxis domain={[2, 4]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="gpa" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fill="url(#gpaGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </CardGlass>

              {/* Grade Distribution */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    {texts.gradeDistribution}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={gradeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {gradeDistribution.map(item => (
                      <div key={item.grade} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.grade}: {item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CardGlass>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Performance - Using real data */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {texts.coursePerformance}
                  </CardTitle>
                  <CardDescription>{isRTL ? 'آخر 10 مقررات' : 'Last 10 courses'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={allCourses.slice(0, 10).map(c => ({
                          subject: c.course_code,
                          score: c.final_grade || 0,
                        }))} 
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="subject" type="category" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </CardGlass>

              {/* Credits Breakdown */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {isRTL ? 'توزيع الساعات' : 'Credits Breakdown'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{isRTL ? 'ساعات صالحة' : 'Valid Credits'}</span>
                      <Badge variant="default">{summary?.totalCompletedHours || 0}</Badge>
                    </div>
                    <Progress value={(summary?.totalCompletedHours || 0) / 173 * 100} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{isRTL ? 'ساعات معادلة (P)' : 'P Grade Credits'}</span>
                      <Badge variant="secondary">{summary?.equivalencyHours || 0}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{isRTL ? 'المطلوب للتخرج' : 'Required for Graduation'}</span>
                      <Badge variant="outline">173</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-amber-600">{isRTL ? 'المتبقي' : 'Remaining'}</span>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                        {summary?.remainingHours || 173}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{isRTL ? 'نسبة الإنجاز' : 'Completion'}</span>
                      <span className="text-xl font-bold text-primary">
                        {summary?.progressPercentage?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </CardGlass>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <CardGlass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {isRTL ? 'تطور المعدل عبر الفصول' : 'GPA Progress Over Semesters'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gpaHistory.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={gpaHistory}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="semester" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 4]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="gpa" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {isRTL ? 'لا توجد بيانات كافية' : 'Not enough data'}
                  </div>
                )}
              </CardContent>
            </CardGlass>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
