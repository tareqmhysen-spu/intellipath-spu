import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { CardGlass, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useLanguageStore } from '@/stores/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAcademicRecord } from '@/hooks/useAcademicRecord';
import { 
  Search, BookOpen, Clock, Users, Star, Filter, TrendingUp, 
  BarChart3, Target, Award, ThumbsUp, ThumbsDown, Percent, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';

interface Course {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  credits: number;
  department: string;
  year_level: number;
  semester: string | null;
  difficulty_rating: number | null;
  is_active: boolean;
}

export default function Courses() {
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [compareList, setCompareList] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Get student's academic records
  const { allCourses: myCourses, summary, isLoading: academicLoading } = useAcademicRecord();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('year_level', { ascending: true });
      
      if (error) throw error;
      return data as Course[];
    }
  });

  // Enrich courses with student's grades
  const enrichedCourses = useMemo(() => {
    return courses.map(course => {
      const myRecord = myCourses.find(c => c.course_code === course.code);
      return {
        ...course,
        myGrade: myRecord?.letter_grade || null,
        myFinalGrade: myRecord?.final_grade || null,
        isPassed: myRecord?.isPassed || false,
        isFailed: myRecord?.isFailed || false,
        isExcludedFromGPA: myRecord?.isExcludedFromGPA || false,
        isTaken: !!myRecord,
      };
    });
  }, [courses, myCourses]);

  const departments = [...new Set(courses.map(c => c.department))];
  const years = [...new Set(courses.map(c => c.year_level))].sort();

  const filteredCourses = enrichedCourses.filter(course => {
    const name = isRTL && course.name_ar ? course.name_ar : course.name;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || course.department === selectedDepartment;
    const matchesYear = selectedYear === 'all' || course.year_level === parseInt(selectedYear);
    
    // Filter by tab
    if (activeTab === 'taken') return matchesSearch && matchesDepartment && matchesYear && course.isTaken;
    if (activeTab === 'passed') return matchesSearch && matchesDepartment && matchesYear && course.isPassed;
    if (activeTab === 'failed') return matchesSearch && matchesDepartment && matchesYear && course.isFailed;
    if (activeTab === 'remaining') return matchesSearch && matchesDepartment && matchesYear && !course.isTaken;
    
    return matchesSearch && matchesDepartment && matchesYear;
  });

  const getDifficultyColor = (rating: number | null) => {
    if (!rating) return 'bg-muted';
    if (rating <= 2) return 'bg-green-500';
    if (rating <= 3.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDifficultyText = (rating: number | null) => {
    if (!rating) return isRTL ? 'غير محدد' : 'N/A';
    if (rating <= 2) return isRTL ? 'سهل' : 'Easy';
    if (rating <= 3.5) return isRTL ? 'متوسط' : 'Medium';
    return isRTL ? 'صعب' : 'Hard';
  };

  // Mock analytics (would come from backend)
  const getCourseAnalytics = (courseId: string) => ({
    passRate: Math.floor(Math.random() * 30) + 65,
    avgGrade: (Math.random() * 2 + 2).toFixed(2),
    totalEnrollments: Math.floor(Math.random() * 500) + 100,
    studentReviews: Math.floor(Math.random() * 100) + 20,
    recommendationRate: Math.floor(Math.random() * 20) + 75,
    difficultyVotes: {
      easy: Math.floor(Math.random() * 50) + 10,
      medium: Math.floor(Math.random() * 80) + 20,
      hard: Math.floor(Math.random() * 40) + 5,
    },
  });

  const getGradeColor = (grade: string | null, isExcluded: boolean = false) => {
    if (!grade) return 'bg-muted';
    if (isExcluded) return 'bg-blue-500'; // P grade
    if (grade.startsWith('A')) return 'bg-emerald-500';
    if (grade.startsWith('B')) return 'bg-green-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    if (grade.startsWith('D')) return 'bg-orange-500';
    if (grade === 'F') return 'bg-red-500';
    return 'bg-muted';
  };

  const toggleCompare = (course: Course) => {
    if (compareList.find(c => c.id === course.id)) {
      setCompareList(compareList.filter(c => c.id !== course.id));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, course]);
    }
  };

  const texts = {
    title: isRTL ? 'بصمة المقررات' : 'Course Fingerprint',
    subtitle: isRTL ? 'تحليلات مفصلة للمقررات الدراسية' : 'Detailed course analytics and insights',
    search: isRTL ? 'ابحث عن مقرر...' : 'Search courses...',
    allDepartments: isRTL ? 'جميع الأقسام' : 'All Departments',
    allYears: isRTL ? 'جميع السنوات' : 'All Years',
    year: isRTL ? 'السنة' : 'Year',
    credits: isRTL ? 'ساعات' : 'Credits',
    difficulty: isRTL ? 'الصعوبة' : 'Difficulty',
    prerequisites: isRTL ? 'المتطلبات السابقة' : 'Prerequisites',
    description: isRTL ? 'الوصف' : 'Description',
    enroll: isRTL ? 'تسجيل' : 'Enroll',
    noResults: isRTL ? 'لا توجد نتائج' : 'No results found',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    analytics: isRTL ? 'التحليلات' : 'Analytics',
    passRate: isRTL ? 'نسبة النجاح' : 'Pass Rate',
    avgGrade: isRTL ? 'متوسط الدرجات' : 'Average Grade',
    enrollments: isRTL ? 'المسجلين' : 'Enrollments',
    reviews: isRTL ? 'التقييمات' : 'Reviews',
    recommend: isRTL ? 'نسبة التوصية' : 'Recommendation',
    compare: isRTL ? 'مقارنة' : 'Compare',
    addToCompare: isRTL ? 'أضف للمقارنة' : 'Add to Compare',
    clearCompare: isRTL ? 'مسح المقارنة' : 'Clear Compare',
    difficultyVotes: isRTL ? 'تصويتات الصعوبة' : 'Difficulty Votes',
    allCourses: isRTL ? 'جميع المقررات' : 'All Courses',
    myCourses: isRTL ? 'مقرراتي' : 'My Courses',
    passed: isRTL ? 'ناجح' : 'Passed',
    failed: isRTL ? 'راسب' : 'Failed',
    remaining: isRTL ? 'متبقية' : 'Remaining',
    pGradeNote: isRTL ? 'لا يحسب بالمعدل' : 'Not in GPA',
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header with Gradient */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-cyan-500/10 p-6 md:p-8"
        >
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {texts.title}
                </h1>
                <p className="text-muted-foreground mt-1">{texts.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm bg-primary/10 text-primary">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {filteredCourses.length} {isRTL ? 'مقرر' : 'courses'}
                </Badge>
                {summary && (
                  <Badge variant="outline" className="text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                    {summary.passedCourses} {isRTL ? 'ناجح' : 'passed'}
                  </Badge>
                )}
                {compareList.length > 0 && (
                  <Badge variant="outline" className="text-sm">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    {compareList.length}/3 {texts.compare}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Course Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="all">{texts.allCourses}</TabsTrigger>
            <TabsTrigger value="taken">{texts.myCourses}</TabsTrigger>
            <TabsTrigger value="passed" className="text-emerald-600">{texts.passed}</TabsTrigger>
            <TabsTrigger value="failed" className="text-red-600">{texts.failed}</TabsTrigger>
            <TabsTrigger value="remaining">{texts.remaining}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <CardGlass>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={texts.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 bg-background/50"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full md:w-[200px] bg-background/50">
                  <SelectValue placeholder={texts.allDepartments} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allDepartments}</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full md:w-[150px] bg-background/50">
                  <SelectValue placeholder={texts.allYears} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allYears}</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {texts.year} {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {compareList.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setCompareList([])}
                  className="bg-background/50"
                >
                  {texts.clearCompare}
                </Button>
              )}
            </div>
          </CardContent>
        </CardGlass>

        {/* Compare Panel */}
        {compareList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CardGlass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {isRTL ? 'مقارنة المقررات' : 'Course Comparison'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {compareList.map((course) => {
                    const analytics = getCourseAnalytics(course.id);
                    return (
                      <div key={course.id} className="p-4 rounded-xl bg-gradient-to-br from-background to-muted/30 border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <Badge variant="outline" className="mb-2">{course.code}</Badge>
                            <h4 className="font-semibold text-sm">
                              {isRTL && course.name_ar ? course.name_ar : course.name}
                            </h4>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleCompare(course)}
                          >
                            ✕
                          </Button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{texts.passRate}</span>
                            <span className="font-semibold text-green-500">{analytics.passRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{texts.avgGrade}</span>
                            <span className="font-semibold">{analytics.avgGrade}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{texts.recommend}</span>
                            <span className="font-semibold text-primary">{analytics.recommendationRate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </CardGlass>
          </motion.div>
        )}

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <CardGlass>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{texts.noResults}</p>
            </CardContent>
          </CardGlass>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course, index) => {
              const analytics = getCourseAnalytics(course.id);
              const isInCompare = compareList.find(c => c.id === course.id);
              
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <CardGlass className={`cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] group ${isInCompare ? 'ring-2 ring-primary' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <Badge variant="outline" className="text-xs bg-primary/5">
                              {course.code}
                            </Badge>
                            <Badge className={`${getDifficultyColor(course.difficulty_rating)} text-white text-xs`}>
                              {getDifficultyText(course.difficulty_rating)}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {isRTL && course.name_ar ? course.name_ar : course.name}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {isRTL && course.description_ar ? course.description_ar : course.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Quick Analytics */}
                          <div className="grid grid-cols-3 gap-2 mb-3 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">{texts.passRate}</div>
                              <div className="font-bold text-green-500">{analytics.passRate}%</div>
                            </div>
                            <div className="text-center border-x border-border/50">
                              <div className="text-xs text-muted-foreground">{texts.avgGrade}</div>
                              <div className="font-bold">{analytics.avgGrade}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">{texts.reviews}</div>
                              <div className="font-bold text-primary">{analytics.studentReviews}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{course.credits} {texts.credits}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{analytics.totalEnrollments}</span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {course.department}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompare(course);
                              }}
                              className={isInCompare ? 'text-primary' : ''}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </CardGlass>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-primary/10">{course.code}</Badge>
                          <Badge className={`${getDifficultyColor(course.difficulty_rating)} text-white`}>
                            {getDifficultyText(course.difficulty_rating)}
                          </Badge>
                        </div>
                        <DialogTitle className="text-xl">
                          {isRTL && course.name_ar ? course.name_ar : course.name}
                        </DialogTitle>
                        <DialogDescription>
                          {course.department} • {texts.year} {course.year_level}
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="info" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="info">{texts.description}</TabsTrigger>
                          <TabsTrigger value="analytics">{texts.analytics}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">{texts.description}</h4>
                            <p className="text-sm text-muted-foreground">
                              {isRTL && course.description_ar ? course.description_ar : course.description || (isRTL ? 'لا يوجد وصف' : 'No description available')}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{course.credits} {texts.credits}</span>
                            </div>
                            {course.semester && (
                              <Badge variant="secondary">{course.semester}</Badge>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-4">
                          {/* Pass Rate */}
                          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium flex items-center gap-2">
                                <Percent className="h-4 w-4 text-green-500" />
                                {texts.passRate}
                              </span>
                              <span className="text-2xl font-bold text-green-500">{analytics.passRate}%</span>
                            </div>
                            <Progress value={analytics.passRate} className="h-2" />
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm">{texts.avgGrade}</span>
                              </div>
                              <div className="text-2xl font-bold">{analytics.avgGrade}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">{texts.enrollments}</span>
                              </div>
                              <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
                            </div>
                          </div>

                          {/* Difficulty Distribution */}
                          <div className="p-4 rounded-xl bg-muted/30">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              {texts.difficultyVotes}
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs w-16">{isRTL ? 'سهل' : 'Easy'}</span>
                                <Progress value={analytics.difficultyVotes.easy} className="h-2 flex-1" />
                                <span className="text-xs w-8">{analytics.difficultyVotes.easy}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs w-16">{isRTL ? 'متوسط' : 'Medium'}</span>
                                <Progress value={analytics.difficultyVotes.medium} className="h-2 flex-1" />
                                <span className="text-xs w-8">{analytics.difficultyVotes.medium}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs w-16">{isRTL ? 'صعب' : 'Hard'}</span>
                                <Progress value={analytics.difficultyVotes.hard} className="h-2 flex-1" />
                                <span className="text-xs w-8">{analytics.difficultyVotes.hard}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Recommendation Rate */}
                          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10">
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="h-5 w-5 text-primary" />
                              <span className="font-medium">{texts.recommend}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-primary">{analytics.recommendationRate}%</span>
                              <span className="text-muted-foreground text-sm">({analytics.studentReviews} {texts.reviews})</span>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <Button className="w-full mt-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                        {texts.enroll}
                      </Button>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
