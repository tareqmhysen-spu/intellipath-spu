import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  BookOpen, 
  Trophy, 
  Calendar,
  MessageSquare,
  Target,
  Flame,
  ChevronLeft,
  ChevronRight,
  Award,
  Sparkles,
  AlertTriangle,
  Brain,
  Shield,
  Lightbulb,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardGlass, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguageStore } from '@/stores/languageStore';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { useAcademicRecord } from '@/hooks/useAcademicRecord';
import { ExportReportButton } from '@/components/dashboard/ExportReportButton';
import { useAuthStore } from '@/stores/authStore';
import { useAcademicAnalysis } from '@/hooks/api/useAcademicAnalysis';
import { supabase } from '@/integrations/supabase/client';

// Mock data for demonstration when no real data exists
const mockDeadlines = [
  { title: 'تسليم مشروع البرمجيات', titleEn: 'Software Project Submission', date: '2024-01-20', daysLeft: 3 },
  { title: 'امتحان الشبكات', titleEn: 'Networks Exam', date: '2024-01-25', daysLeft: 8 },
  { title: 'واجب قواعد البيانات', titleEn: 'Database Assignment', date: '2024-01-18', daysLeft: 1 },
];

// AI Insights Component
function AIInsightsCard({ gpa, yearLevel, language }: { gpa: number; yearLevel: number; language: string }) {
  const isRTL = language === 'ar';
  const { getRiskAssessment, isLoading } = useAcademicAnalysis();
  const [riskData, setRiskData] = useState<any>(null);

  useEffect(() => {
    if (gpa > 0) {
      getRiskAssessment(gpa, undefined, yearLevel)
        .then(setRiskData)
        .catch(() => {});
    }
  }, [gpa, yearLevel]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-emerald-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'critical': return 'bg-red-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getRiskBorderColor = (level: string) => {
    switch (level) {
      case 'low': return 'border-emerald-500/30 bg-emerald-500/5';
      case 'medium': return 'border-amber-500/30 bg-amber-500/5';
      case 'high': return 'border-orange-500/30 bg-orange-500/5';
      case 'critical': return 'border-red-500/30 bg-red-500/5';
      default: return 'border-border';
    }
  };

  if (isLoading) {
    return (
      <CardGlass>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            {isRTL ? 'تحليل ذكي' : 'AI Insights'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </CardGlass>
    );
  }

  return (
    <CardGlass className={`border ${riskData ? getRiskBorderColor(riskData.riskLevel) : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          {isRTL ? 'تحليل ذكي' : 'AI Insights'}
          {riskData && (
            <Badge className={`${getRiskColor(riskData.riskLevel)} text-xs`}>
              {riskData.riskLevel === 'low' ? (isRTL ? 'منخفض' : 'Low Risk') :
               riskData.riskLevel === 'medium' ? (isRTL ? 'متوسط' : 'Medium Risk') :
               riskData.riskLevel === 'high' ? (isRTL ? 'مرتفع' : 'High Risk') :
               (isRTL ? 'حرج' : 'Critical')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {riskData ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Risk Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className={`h-5 w-5 ${
                    riskData.riskLevel === 'low' ? 'text-emerald-500' :
                    riskData.riskLevel === 'medium' ? 'text-amber-500' :
                    riskData.riskLevel === 'high' ? 'text-orange-500' :
                    'text-red-500'
                  }`} />
                  <span className="text-sm font-medium">
                    {isRTL ? 'مستوى المخاطر' : 'Risk Score'}
                  </span>
                </div>
                <span className="text-2xl font-bold">{riskData.riskScore}%</span>
              </div>
              
              <Progress 
                value={100 - riskData.riskScore} 
                className="h-2"
              />

              {/* Predicted GPA */}
              {riskData.predictedGpa && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">{isRTL ? 'المعدل المتوقع' : 'Predicted GPA'}</span>
                  <span className="font-bold">{riskData.predictedGpa.toFixed(2)}</span>
                </div>
              )}

              {/* Recommendations */}
              {riskData.recommendations?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" />
                    {isRTL ? 'توصيات:' : 'Recommendations:'}
                  </p>
                  {riskData.recommendations.slice(0, 2).map((rec: string, i: number) => (
                    <motion.p 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-xs text-muted-foreground bg-muted/30 p-2 rounded"
                    >
                      • {rec}
                    </motion.p>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'أضف معدلك لتفعيل التحليل الذكي' : 'Add your GPA to enable AI analysis'}
            </p>
          </div>
        )}
      </CardContent>
    </CardGlass>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { student, profile, enrollments, achievements, isLoading, nextLevelXp, xpProgress } = useStudentDashboard();
  const { studentId, summary, hasAcademicRecord, isLoading: academicLoading } = useAcademicRecord();
  const isRTL = language === 'ar';

  // Use academic record data if available, otherwise fallback to students table
  const displayData = {
    name: profile?.full_name || (isRTL ? 'طالب جديد' : 'New Student'),
    nameEn: profile?.full_name || 'New Student',
    department: summary?.major || student?.department || (isRTL ? 'هندسة المعلوماتية' : 'Computer Engineering'),
    college: summary?.college || 'كلية الهندسة',
    year: student?.year_level || 1,
    // Prefer academic record GPA over students table
    gpa: hasAcademicRecord && summary ? summary.cumulativeGPA : (student?.gpa || 0),
    // Prefer academic record credits over students table
    totalCredits: hasAcademicRecord && summary ? summary.totalCompletedHours : (student?.total_credits || 0),
    requiredCredits: 173,
    remainingCredits: hasAcademicRecord && summary ? summary.remainingHours : (173 - (student?.total_credits || 0)),
    progressPercentage: hasAcademicRecord && summary ? summary.progressPercentage : ((student?.total_credits || 0) / 173 * 100),
    xp: student?.xp_points || 0,
    level: student?.level || 1,
    streak: student?.streak_days || 0,
    studentId: studentId || student?.student_id || '',
    isGraduationEligible: hasAcademicRecord && summary ? summary.isGraduationEligible : false,
    passedCourses: summary?.passedCourses || 0,
    failedCourses: summary?.failedCourses || 0,
  };

  if (isLoading || academicLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto space-y-6 p-4 md:p-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto space-y-6 p-4 md:p-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardGlass className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/20">
            <CardContent className="p-6 md:p-8 relative">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      <GraduationCap className="h-3 w-3 me-1" />
                      {displayData.studentId}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold md:text-3xl text-white">
                    {displayData.name}
                  </h1>
                  <p className="text-sm text-white/60">
                    {displayData.department}
                  </p>
                  <p className="text-xs text-white/50">
                    {displayData.college}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <ExportReportButton
                    student={{
                      name: displayData.name,
                      studentId: displayData.studentId,
                      department: displayData.department,
                      yearLevel: displayData.year,
                      gpa: displayData.gpa,
                      totalCredits: displayData.totalCredits,
                      email: user?.email || '',
                    }}
                    courses={enrollments.map(e => ({
                      name: e.course?.name || '',
                      code: e.course?.code || '',
                      credits: e.course?.credits || 3,
                      grade: e.letter_grade || undefined,
                      semester: e.semester,
                    }))}
                  />
                  <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/20">
                    <p className="text-xs text-white/60">{t('dashboard.stats.gpa')}</p>
                    <p className="text-2xl font-bold text-white">{displayData.gpa.toFixed(2)}</p>
                    <p className="text-xs text-white/40">{isRTL ? 'الحد الأدنى 2.0' : 'Min 2.0'}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/20">
                    <p className="text-xs text-white/60">{isRTL ? 'الساعات المنجزة' : 'Credits'}</p>
                    <p className="text-2xl font-bold text-white">{displayData.totalCredits}</p>
                    <p className="text-xs text-white/40">{isRTL ? 'من 173 ساعة' : 'of 173'}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/20">
                    <p className="text-xs text-white/60">{isRTL ? 'المتبقي' : 'Remaining'}</p>
                    <p className="text-2xl font-bold text-white">{displayData.remainingCredits}</p>
                    <p className="text-xs text-white/40">{isRTL ? 'ساعة' : 'credits'}</p>
                  </div>
                </div>
              </div>

              {/* Graduation Progress Bar */}
              <div className="mt-6 relative z-10">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/70">{isRTL ? 'التقدم نحو التخرج' : 'Progress to Graduation'}</span>
                  <span className="text-white font-bold">{displayData.progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${displayData.progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-white/50">
                    {displayData.passedCourses} {isRTL ? 'مقرر ناجح' : 'courses passed'}
                  </span>
                  <span className={`${displayData.isGraduationEligible ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {displayData.isGraduationEligible 
                      ? (isRTL ? '✅ مؤهل للتخرج' : '✅ Eligible')
                      : (isRTL ? '⏳ غير مكتمل' : '⏳ In Progress')}
                  </span>
                </div>
              </div>
            </CardContent>
          </CardGlass>
        </motion.div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CardGlass>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {t('dashboard.stats.level', { level: displayData.level })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {displayData.xp} / {nextLevelXp} XP
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 px-4 py-2 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  <Flame className="h-5 w-5" />
                  <span className="text-sm font-bold">{t('dashboard.stats.streak', { days: displayData.streak })}</span>
                </div>
              </div>
              <div className="mt-4 relative">
                <Progress value={xpProgress} className="h-3 bg-muted" />
                <div 
                  className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </CardContent>
          </CardGlass>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { icon: MessageSquare, label: t('dashboard.quickActions.chat'), path: '/chat', gradient: 'from-blue-500 to-indigo-600' },
            { icon: BookOpen, label: t('nav.courses'), path: '/courses', gradient: 'from-emerald-500 to-teal-600' },
            { icon: Target, label: t('dashboard.quickActions.career'), path: '/career', gradient: 'from-purple-500 to-pink-600' },
            { icon: Trophy, label: t('nav.achievements'), path: '/achievements', gradient: 'from-amber-500 to-orange-600' },
          ].map((action, i) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <CardGlass
                className="cursor-pointer transition-all duration-300 hover:shadow-lg group"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                  <div className={`rounded-xl bg-gradient-to-br ${action.gradient} p-3.5 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold">{action.label}</span>
                </CardContent>
              </CardGlass>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <CardGlass>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {t('dashboard.currentSemester.title')}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/courses')} className="group">
                  {t('dashboard.deadlines.viewAll')}
                  {isRTL ? <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> : <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </CardHeader>
              <CardContent>
                {enrollments.length > 0 ? (
                  <div className="space-y-3">
                    {enrollments.slice(0, 4).map((enrollment, i) => (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-center justify-between rounded-xl bg-muted/50 p-4 hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {language === 'ar' && enrollment.course?.name_ar 
                                ? enrollment.course.name_ar 
                                : enrollment.course?.name || (isRTL ? 'مقرر' : 'Course')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {enrollment.course?.credits || 3} {t('dashboard.currentSemester.credits')}
                            </p>
                          </div>
                        </div>
                        {enrollment.letter_grade && (
                          <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                            enrollment.letter_grade.startsWith('A') ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                            enrollment.letter_grade.startsWith('B') ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                            'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {enrollment.letter_grade}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">{isRTL ? 'لا توجد مقررات مسجلة' : 'No enrolled courses'}</p>
                    <Button variant="link" onClick={() => navigate('/courses')}>
                      {isRTL ? 'تصفح المقررات' : 'Browse Courses'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </CardGlass>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <AIInsightsCard 
              gpa={displayData.gpa} 
              yearLevel={displayData.year}
              language={language}
            />
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <CardGlass className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  {t('dashboard.achievements.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <div className="space-y-3">
                    {achievements.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3 border border-amber-500/20"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                          <Award className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-medium">
                          {language === 'ar' && item.achievement?.name_ar 
                            ? item.achievement.name_ar 
                            : item.achievement?.name || (isRTL ? 'إنجاز' : 'Achievement')}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Trophy className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">{t('dashboard.achievements.empty')}</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => navigate('/achievements')}
                >
                  {t('dashboard.achievements.viewAll')}
                </Button>
              </CardContent>
            </CardGlass>
          </motion.div>

          {/* Deadlines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <CardGlass>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5 text-primary" />
                  {t('dashboard.deadlines.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDeadlines.map((deadline, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {isRTL ? deadline.title : deadline.titleEn}
                        </p>
                        <p className="text-sm text-muted-foreground">{deadline.date}</p>
                      </div>
                      <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                        deadline.daysLeft <= 2 ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20' :
                        deadline.daysLeft <= 5 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {deadline.daysLeft} {isRTL ? 'أيام' : 'days'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </CardGlass>
          </motion.div>

          {/* Quick AI Chat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <CardGlass className="h-full bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="h-5 w-5 text-primary" />
                  {isRTL ? 'المستشار الذكي' : 'AI Advisor'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? 'اسأل المستشار الذكي عن أي شيء يتعلق بدراستك'
                    : 'Ask the AI advisor about anything related to your studies'}
                </p>
                <div className="space-y-2">
                  {[
                    { ar: 'ما هي المتطلبات السابقة لمقرر CS301؟', en: 'Prerequisites for CS301?' },
                    { ar: 'كيف أحسن معدلي؟', en: 'How to improve my GPA?' },
                    { ar: 'ما هي الخطة الأمثل للتخرج؟', en: 'Best graduation plan?' },
                  ].map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left text-xs h-auto py-2 hover:bg-primary/10"
                      onClick={() => navigate('/chat')}
                    >
                      {isRTL ? q.ar : q.en}
                    </Button>
                  ))}
                </div>
                <Button 
                  className="w-full gap-2"
                  onClick={() => navigate('/chat')}
                >
                  <MessageSquare className="h-4 w-4" />
                  {isRTL ? 'بدء محادثة' : 'Start Chat'}
                </Button>
              </CardContent>
            </CardGlass>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
