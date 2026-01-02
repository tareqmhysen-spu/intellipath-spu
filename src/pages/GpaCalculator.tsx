import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { CardGlass, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguageStore } from '@/stores/languageStore';
import { useToast } from '@/hooks/use-toast';
import { useAcademicAnalysis } from '@/hooks/api/useAcademicAnalysis';
import { useAcademicRecord } from '@/hooks/useAcademicRecord';
import { 
  Calculator, Plus, Trash2, TrendingUp, TrendingDown, 
  GraduationCap, Target, Award, RotateCcw, BookOpen, 
  AlertTriangle, Sparkles, ArrowRight, Brain, Lightbulb
} from 'lucide-react';

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

const gradePoints: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

const gradeOptions = Object.keys(gradePoints);

export default function GpaCalculator() {
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  const { summary, isLoading: academicLoading } = useAcademicRecord();
  const { isLoading, getRiskAssessment, projectGrades, simulateRetake, calculateGPALocal } = useAcademicAnalysis();

  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: '', credits: 3, grade: 'B+' },
  ]);
  // Use real data from academic record (post-equivalency GPA)
  const [previousGpa, setPreviousGpa] = useState<number>(summary?.cumulativeGPA || 0);
  const [previousCredits, setPreviousCredits] = useState<number>(summary?.postEquivalencyHours || 0);
  const [riskData, setRiskData] = useState<any>(null);
  const [projectionData, setProjectionData] = useState<any>(null);
  const [retakeData, setRetakeData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('calculator');

  const texts = {
    title: isRTL ? 'حاسبة المعدل التراكمي' : 'GPA Calculator',
    subtitle: isRTL ? 'احسب معدلك التراكمي بسهولة مع تحليل ذكي' : 'Calculate your GPA with AI-powered analysis',
    courseName: isRTL ? 'اسم المقرر' : 'Course Name',
    credits: isRTL ? 'الساعات' : 'Credits',
    grade: isRTL ? 'الدرجة' : 'Grade',
    addCourse: isRTL ? 'إضافة مقرر' : 'Add Course',
    reset: isRTL ? 'إعادة تعيين' : 'Reset',
    semesterGpa: isRTL ? 'معدل الفصل' : 'Semester GPA',
    cumulativeGpa: isRTL ? 'المعدل التراكمي' : 'Cumulative GPA',
    totalCredits: isRTL ? 'مجموع الساعات' : 'Total Credits',
    previousGpa: isRTL ? 'المعدل السابق' : 'Previous GPA',
    previousCredits: isRTL ? 'الساعات السابقة' : 'Previous Credits',
    optional: isRTL ? '(اختياري)' : '(Optional)',
    gradeScale: isRTL ? 'مقياس الدرجات' : 'Grade Scale',
    yourResult: isRTL ? 'نتيجتك' : 'Your Result',
    excellent: isRTL ? 'ممتاز' : 'Excellent',
    veryGood: isRTL ? 'جيد جداً' : 'Very Good',
    good: isRTL ? 'جيد' : 'Good',
    acceptable: isRTL ? 'مقبول' : 'Acceptable',
    weak: isRTL ? 'ضعيف' : 'Weak',
    aiAnalysis: isRTL ? 'تحليل ذكي' : 'AI Analysis',
    riskAssessment: isRTL ? 'تقييم المخاطر' : 'Risk Assessment',
    gradeProjection: isRTL ? 'توقعات الدرجات' : 'Grade Projection',
    retakeSimulator: isRTL ? 'محاكي الإعادة' : 'Retake Simulator',
    analyzeRisk: isRTL ? 'تحليل المخاطر' : 'Analyze Risk',
    projectGrades: isRTL ? 'توقع الدرجات' : 'Project Grades',
  };

  const addCourse = () => {
    setCourses(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      credits: 3,
      grade: 'B+',
    }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string | number) => {
    setCourses(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const calculateSemesterGpa = () => {
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      const points = gradePoints[course.grade] || 0;
      totalPoints += points * course.credits;
      totalCredits += course.credits;
    });

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const calculateCumulativeGpa = () => {
    const semesterGpa = calculateSemesterGpa();
    const semesterCredits = courses.reduce((sum, c) => sum + c.credits, 0);

    if (previousCredits > 0 && previousGpa > 0) {
      const previousPoints = previousGpa * previousCredits;
      const semesterPoints = semesterGpa * semesterCredits;
      const totalCredits = previousCredits + semesterCredits;
      return (previousPoints + semesterPoints) / totalCredits;
    }

    return semesterGpa;
  };

  const semesterGpa = calculateSemesterGpa();
  const cumulativeGpa = calculateCumulativeGpa();
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0) + previousCredits;

  const getGpaCategory = (gpa: number) => {
    if (gpa >= 3.7) return { text: texts.excellent, color: 'text-emerald-500', bg: 'bg-emerald-500' };
    if (gpa >= 3.0) return { text: texts.veryGood, color: 'text-blue-500', bg: 'bg-blue-500' };
    if (gpa >= 2.3) return { text: texts.good, color: 'text-amber-500', bg: 'bg-amber-500' };
    if (gpa >= 2.0) return { text: texts.acceptable, color: 'text-orange-500', bg: 'bg-orange-500' };
    return { text: texts.weak, color: 'text-red-500', bg: 'bg-red-500' };
  };

  const category = getGpaCategory(cumulativeGpa);

  const resetCalculator = () => {
    setCourses([{ id: '1', name: '', credits: 3, grade: 'B+' }]);
    setPreviousGpa(summary?.cumulativeGPA || 0);
    setPreviousCredits(summary?.postEquivalencyHours || 0);
    setRiskData(null);
    setProjectionData(null);
    setRetakeData(null);
  };

  // AI Analysis Functions
  const handleRiskAnalysis = async () => {
    try {
      const result = await getRiskAssessment(
        cumulativeGpa,
        totalCredits,
        summary?.semesters?.length || 1
      );
      setRiskData(result);
      toast({
        title: isRTL ? 'تم التحليل' : 'Analysis Complete',
        description: isRTL ? 'تم تحليل مخاطرك الأكاديمية' : 'Your academic risk has been analyzed',
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleGradeProjection = async () => {
    const scenarios = [
      {
        name: isRTL ? 'السيناريو الحالي' : 'Current Scenario',
        courses: courses.map(c => ({
          code: c.name || `Course_${c.id}`,
          expected_grade: gradePoints[c.grade],
          credits: c.credits,
        })),
      },
      {
        name: isRTL ? 'السيناريو المتفائل' : 'Optimistic Scenario',
        courses: courses.map(c => ({
          code: c.name || `Course_${c.id}`,
          expected_grade: Math.min(4.0, gradePoints[c.grade] + 0.5),
          credits: c.credits,
        })),
      },
      {
        name: isRTL ? 'السيناريو المتشائم' : 'Pessimistic Scenario',
        courses: courses.map(c => ({
          code: c.name || `Course_${c.id}`,
          expected_grade: Math.max(0, gradePoints[c.grade] - 0.5),
          credits: c.credits,
        })),
      },
    ];

    try {
      const result = await projectGrades(previousGpa, previousCredits, scenarios);
      setProjectionData(result);
    } catch (error) {
      // Error handled in hook
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  {texts.title}
                </h1>
                <p className="text-muted-foreground">{texts.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Brain className="h-3 w-3" />
                {isRTL ? 'مدعوم بالذكاء الاصطناعي' : 'AI-Powered'}
              </Badge>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="h-4 w-4" />
              {isRTL ? 'الحاسبة' : 'Calculator'}
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {texts.aiAnalysis}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Courses Input */}
              <div className="lg:col-span-2 space-y-4">
                {/* Previous GPA */}
                <CardGlass>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      {texts.previousGpa} {texts.optional}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">{texts.previousGpa}</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          value={previousGpa || ''}
                          onChange={(e) => setPreviousGpa(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="bg-background/50"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">{texts.previousCredits}</label>
                        <Input
                          type="number"
                          min="0"
                          value={previousCredits || ''}
                          onChange={(e) => setPreviousCredits(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </CardGlass>

                {/* Courses List */}
                <CardGlass>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {isRTL ? 'مقررات الفصل الحالي' : 'Current Semester Courses'}
                      </CardTitle>
                      <Badge variant="secondary">{courses.length} {isRTL ? 'مقرر' : 'courses'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {courses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-muted/30"
                      >
                        <div className="col-span-5">
                          <Input
                            placeholder={texts.courseName}
                            value={course.name}
                            onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                            className="bg-background/50"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={course.credits.toString()}
                            onValueChange={(v) => updateCourse(course.id, 'credits', parseInt(v))}
                          >
                            <SelectTrigger className="bg-background/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6].map(c => (
                                <SelectItem key={c} value={c.toString()}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Select
                            value={course.grade}
                            onValueChange={(v) => updateCourse(course.id, 'grade', v)}
                          >
                            <SelectTrigger className="bg-background/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeOptions.map(g => (
                                <SelectItem key={g} value={g}>{g} ({gradePoints[g]})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCourse(course.id)}
                            disabled={courses.length === 1}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}

                    <div className="flex gap-2 pt-2">
                      <Button onClick={addCourse} variant="outline" className="flex-1 gap-2">
                        <Plus className="h-4 w-4" />
                        {texts.addCourse}
                      </Button>
                      <Button onClick={resetCalculator} variant="ghost" className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        {texts.reset}
                      </Button>
                    </div>
                  </CardContent>
                </CardGlass>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <CardGlass className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {texts.yourResult}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Cumulative GPA */}
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                      <p className="text-sm text-muted-foreground mb-1">{texts.cumulativeGpa}</p>
                      <motion.p 
                        className="text-5xl font-bold"
                        key={cumulativeGpa}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        {cumulativeGpa.toFixed(2)}
                      </motion.p>
                      <Badge className={`mt-2 ${category.bg} text-white border-0`}>
                        {category.text}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{isRTL ? 'من 4.0' : 'out of 4.0'}</span>
                        <span className={category.color}>{((cumulativeGpa / 4) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={(cumulativeGpa / 4) * 100} className="h-3" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <p className="text-lg font-bold text-primary">{semesterGpa.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{texts.semesterGpa}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <p className="text-lg font-bold">{totalCredits}</p>
                        <p className="text-xs text-muted-foreground">{texts.totalCredits}</p>
                      </div>
                    </div>

                    {/* Trend */}
                    {previousGpa > 0 && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        cumulativeGpa > previousGpa 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : cumulativeGpa < previousGpa 
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-muted'
                      }`}>
                        {cumulativeGpa > previousGpa ? <TrendingUp className="h-5 w-5" /> : 
                         cumulativeGpa < previousGpa ? <TrendingDown className="h-5 w-5" /> : null}
                        <span className="text-sm font-medium">
                          {cumulativeGpa > previousGpa 
                            ? (isRTL ? 'تحسن في المعدل!' : 'GPA improved!')
                            : cumulativeGpa < previousGpa
                              ? (isRTL ? 'انخفاض في المعدل' : 'GPA decreased')
                              : (isRTL ? 'المعدل ثابت' : 'GPA unchanged')
                          }
                        </span>
                      </div>
                    )}

                    {/* AI Analysis Button */}
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => setActiveTab('analysis')}
                    >
                      <Sparkles className="h-4 w-4" />
                      {texts.aiAnalysis}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </CardGlass>

                {/* Grade Scale */}
                <CardGlass>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{texts.gradeScale}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {Object.entries(gradePoints).map(([grade, points]) => (
                        <div key={grade} className="flex justify-between p-1.5 rounded bg-muted/50">
                          <span className="font-medium">{grade}</span>
                          <span className="text-muted-foreground">{points.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CardGlass>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Assessment */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    {texts.riskAssessment}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? 'تحليل مخاطرك الأكاديمية بناءً على معدلك' : 'Analyze your academic risk based on your GPA'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleRiskAnalysis} 
                    disabled={isLoading}
                    className="w-full gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    {texts.analyzeRisk}
                  </Button>

                  <AnimatePresence>
                    {riskData && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <div className={`p-4 rounded-lg border ${getRiskLevelColor(riskData.riskLevel)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold capitalize">{riskData.riskLevel} Risk</span>
                            <span className="text-2xl font-bold">{riskData.riskScore}%</span>
                          </div>
                          <Progress value={riskData.riskScore} className="h-2" />
                        </div>

                        {riskData.factors?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{isRTL ? 'العوامل المؤثرة:' : 'Contributing Factors:'}</p>
                            {riskData.factors.map((factor: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                                <span className="font-medium">{factor.name}</span>
                                <span className="text-muted-foreground">({factor.weight}%)</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {riskData.recommendations?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              {isRTL ? 'التوصيات:' : 'Recommendations:'}
                            </p>
                            {riskData.recommendations.map((rec: string, i: number) => (
                              <p key={i} className="text-sm text-muted-foreground p-2 rounded bg-muted/30">
                                • {rec}
                              </p>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </CardGlass>

              {/* Grade Projection */}
              <CardGlass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {texts.gradeProjection}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? 'توقع معدلك في سيناريوهات مختلفة' : 'Project your GPA in different scenarios'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleGradeProjection} 
                    disabled={isLoading || courses.length === 0}
                    className="w-full gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {texts.projectGrades}
                  </Button>

                  <AnimatePresence>
                    {projectionData && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-3"
                      >
                        {projectionData.scenarios?.map((scenario: any, i: number) => (
                          <div 
                            key={i} 
                            className={`p-4 rounded-lg border ${
                              scenario.name.includes('Optimistic') || scenario.name.includes('متفائل')
                                ? 'border-emerald-500/20 bg-emerald-500/5'
                                : scenario.name.includes('Pessimistic') || scenario.name.includes('متشائم')
                                  ? 'border-red-500/20 bg-red-500/5'
                                  : 'border-border bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{scenario.name}</span>
                              <div className="text-right">
                                <p className="text-xl font-bold">{scenario.projectedGpa.toFixed(2)}</p>
                                <p className={`text-xs ${
                                  scenario.gpaChange > 0 ? 'text-emerald-500' : 
                                  scenario.gpaChange < 0 ? 'text-red-500' : 'text-muted-foreground'
                                }`}>
                                  {scenario.gpaChange > 0 ? '+' : ''}{scenario.gpaChange.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {projectionData.bestScenario && (
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                              ✨ {isRTL ? 'أفضل سيناريو:' : 'Best scenario:'} {projectionData.bestScenario}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </CardGlass>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
