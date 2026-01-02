import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguageStore } from '@/stores/languageStore';
import { useSimulatorData, Course } from '@/hooks/useSimulatorData';
import { 
  Calculator, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle2, RotateCcw, BookOpen, GraduationCap, Calendar, Loader2
} from 'lucide-react';

interface SimulationCourse extends Course {
  expectedGrade: number;
}

const gradeToPoints: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

const pointsToGrade = (points: number): string => {
  if (points >= 4.0) return 'A';
  if (points >= 3.7) return 'A-';
  if (points >= 3.3) return 'B+';
  if (points >= 3.0) return 'B';
  if (points >= 2.7) return 'B-';
  if (points >= 2.3) return 'C+';
  if (points >= 2.0) return 'C';
  if (points >= 1.7) return 'C-';
  if (points >= 1.3) return 'D+';
  if (points >= 1.0) return 'D';
  return 'F';
};

export default function DecisionSimulator() {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  const { availableCourses, currentGpa, completedCredits, gpaEligibleHours, equivalencyHours, isLoading } = useSimulatorData();

  // 173 hours required for graduation
  const totalRequiredCredits = 173;

  // Simulation state
  const [selectedCourses, setSelectedCourses] = useState<SimulationCourse[]>([]);

  const addCourse = (courseId: string) => {
    const course = availableCourses.find(c => c.id === courseId);
    if (course && !selectedCourses.find(c => c.id === courseId)) {
      setSelectedCourses(prev => [...prev, { ...course, expectedGrade: 3.0 }]);
    }
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourses(prev => prev.filter(c => c.id !== courseId));
  };

  const updateGrade = (courseId: string, grade: number) => {
    setSelectedCourses(prev =>
      prev.map(c => c.id === courseId ? { ...c, expectedGrade: grade } : c)
    );
  };

  // Calculate new GPA respecting equivalency logic
  // GPA is calculated ONLY from post-equivalency courses (gpaEligibleHours)
  // NOT from equivalency hours (P grades don't affect GPA)
  const calculateNewGPA = () => {
    // Current GPA points = currentGpa * gpaEligibleHours (not total completed)
    const currentPoints = currentGpa * gpaEligibleHours;
    const newPoints = selectedCourses.reduce((sum, c) => sum + (c.expectedGrade * c.credits), 0);
    const newCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);
    // New total GPA-eligible hours (excluding equivalency)
    const totalGpaCredits = gpaEligibleHours + newCredits;
    return totalGpaCredits > 0 ? (currentPoints + newPoints) / totalGpaCredits : 0;
  };

  const newGPA = calculateNewGPA();
  const gpaChange = newGPA - currentGpa;
  // Total hours = completed (includes equivalency) + new courses
  const newCompletedCredits = completedCredits + selectedCourses.reduce((sum, c) => sum + c.credits, 0);
  const remainingCredits = totalRequiredCredits - newCompletedCredits;
  const graduationProgress = (newCompletedCredits / totalRequiredCredits) * 100;

  const texts = {
    title: isRTL ? 'محاكي القرارات' : 'Decision Simulator',
    subtitle: isRTL ? 'جرب سيناريوهات مختلفة وشاهد تأثيرها على معدلك' : 'Try different scenarios and see their impact on your GPA',
    currentStats: isRTL ? 'إحصائياتك الحالية' : 'Your Current Stats',
    currentGPA: isRTL ? 'المعدل الحالي' : 'Current GPA',
    completedCredits: isRTL ? 'الساعات المكتسبة' : 'Completed Credits',
    simulation: isRTL ? 'المحاكاة' : 'Simulation',
    addCourse: isRTL ? 'إضافة مقرر' : 'Add Course',
    selectCourse: isRTL ? 'اختر مقرراً' : 'Select a course',
    expectedGrade: isRTL ? 'الدرجة المتوقعة' : 'Expected Grade',
    results: isRTL ? 'النتائج المتوقعة' : 'Expected Results',
    newGPA: isRTL ? 'المعدل الجديد' : 'New GPA',
    gpaChange: isRTL ? 'التغير في المعدل' : 'GPA Change',
    graduationProgress: isRTL ? 'نسبة إتمام التخرج' : 'Graduation Progress',
    remainingCredits: isRTL ? 'الساعات المتبقية' : 'Remaining Credits',
    reset: isRTL ? 'إعادة تعيين' : 'Reset',
    noCourses: isRTL ? 'أضف مقررات لبدء المحاكاة' : 'Add courses to start simulation',
    credits: isRTL ? 'ساعة' : 'credits',
    remove: isRTL ? 'حذف' : 'Remove',
  };

  const getRiskLevel = () => {
    if (newGPA >= 3.5) return { level: 'safe', color: 'text-green-500', icon: CheckCircle2 };
    if (newGPA >= 2.5) return { level: 'warning', color: 'text-yellow-500', icon: AlertTriangle };
    return { level: 'danger', color: 'text-red-500', icon: AlertTriangle };
  };

  const risk = getRiskLevel();

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Current Stats & Add Courses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {texts.currentStats}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 text-center">
                    <p className="text-2xl font-bold text-primary">{currentGpa.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{texts.currentGPA}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/10 text-center">
                    <p className="text-2xl font-bold text-secondary">{completedCredits}</p>
                    <p className="text-xs text-muted-foreground">{texts.completedCredits}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <p className="text-2xl font-bold">{totalRequiredCredits}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'إجمالي الساعات' : 'Total Credits'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <p className="text-2xl font-bold">{totalRequiredCredits - completedCredits}</p>
                    <p className="text-xs text-muted-foreground">{texts.remainingCredits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-secondary" />
                  {texts.simulation}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'أضف المقررات التي تخطط لأخذها وحدد درجتك المتوقعة' : 'Add courses you plan to take and set your expected grade'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select onValueChange={addCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder={texts.selectCourse} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses
                      .filter(c => !selectedCourses.find(sc => sc.id === c.id))
                      .map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {isRTL ? (course.name_ar || course.name) : course.name} ({course.credits} {texts.credits})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {selectedCourses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{texts.noCourses}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCourses.map(course => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">
                              {isRTL ? (course.name_ar || course.name) : course.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {course.credits} {texts.credits}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCourse(course.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            {texts.remove}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{texts.expectedGrade}</span>
                            <Badge variant="secondary" className="text-lg font-bold">
                              {pointsToGrade(course.expectedGrade)}
                            </Badge>
                          </div>
                          <Slider
                            value={[course.expectedGrade]}
                            onValueChange={([value]) => updateGrade(course.id, value)}
                            min={0}
                            max={4}
                            step={0.1}
                            className="py-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>F (0.0)</span>
                            <span>A (4.0)</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedCourses([])}
                    >
                      <RotateCcw className="h-4 w-4 me-2" />
                      {texts.reset}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  {texts.results}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* New GPA */}
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  <p className="text-sm text-muted-foreground mb-1">{texts.newGPA}</p>
                  <p className="text-5xl font-bold">{newGPA.toFixed(2)}</p>
                  <div className={`flex items-center justify-center gap-1 mt-2 ${risk.color}`}>
                    {gpaChange !== 0 && (
                      <>
                        {gpaChange > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {gpaChange > 0 ? '+' : ''}{gpaChange.toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Risk Indicator */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  risk.level === 'safe' ? 'bg-green-500/10' :
                  risk.level === 'warning' ? 'bg-yellow-500/10' :
                  'bg-red-500/10'
                }`}>
                  <risk.icon className={`h-5 w-5 ${risk.color}`} />
                  <span className={`text-sm font-medium ${risk.color}`}>
                    {isRTL
                      ? risk.level === 'safe' ? 'أداء ممتاز' : risk.level === 'warning' ? 'تحتاج للتحسين' : 'خطر أكاديمي'
                      : risk.level === 'safe' ? 'Excellent Performance' : risk.level === 'warning' ? 'Needs Improvement' : 'Academic Risk'
                    }
                  </span>
                </div>

                {/* Graduation Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{texts.graduationProgress}</span>
                    <span className="text-sm font-medium">{Math.round(graduationProgress)}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      initial={{ width: `${(completedCredits / totalRequiredCredits) * 100}%` }}
                      animate={{ width: `${graduationProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-lg font-bold">{newCompletedCredits}</p>
                    <p className="text-xs text-muted-foreground">{texts.completedCredits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-lg font-bold">{remainingCredits}</p>
                    <p className="text-xs text-muted-foreground">{texts.remainingCredits}</p>
                  </div>
                </div>

                {/* Expected Graduation */}
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {isRTL ? 'التخرج المتوقع' : 'Expected Graduation'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? `بعد ${Math.ceil(remainingCredits / 15)} فصول` : `In ${Math.ceil(remainingCredits / 15)} semesters`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
