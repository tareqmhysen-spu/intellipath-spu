import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { CardGlass, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguageStore } from '@/stores/languageStore';
import { useCareerPaths, CareerPath } from '@/hooks/useCareerPaths';
import { 
  Briefcase, Target, TrendingUp, BookOpen, Award, ChevronRight, 
  Code, Database, Brain, Palette, Globe, Shield, Rocket, CheckCircle2,
  Network, Heart, Cpu, MapPin, DollarSign, Sparkles
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, any> = {
  code: Code,
  brain: Brain,
  database: Database,
  palette: Palette,
  shield: Shield,
  network: Network,
  heart: Heart,
  cpu: Cpu,
  globe: Globe,
};

const milestones = [
  { id: 1, title: 'Complete Core Courses', titleAr: 'إكمال المقررات الأساسية', completed: true },
  { id: 2, title: 'Build Portfolio Projects', titleAr: 'بناء مشاريع للمحفظة', completed: true },
  { id: 3, title: 'Get Internship', titleAr: 'الحصول على تدريب', completed: false },
  { id: 4, title: 'Earn Certifications', titleAr: 'الحصول على شهادات', completed: false },
  { id: 5, title: 'Land First Job', titleAr: 'الحصول على أول وظيفة', completed: false },
];

interface CareerPathWithProgress extends CareerPath {
  progress: number;
  completedCourses: string[];
}

export default function Career() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  const { careerPaths, isLoading } = useCareerPaths();
  const [selectedPath, setSelectedPath] = useState<CareerPathWithProgress | null>(null);

  const getDemandBadge = (demand: string) => {
    switch (demand) {
      case 'high':
        return <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0">{t('career.high')}</Badge>;
      case 'medium':
        return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0">{t('career.medium')}</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-slate-500 to-gray-600 text-white border-0">{t('career.low')}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header with gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-glow">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('career.title')}
              </h1>
              <p className="text-muted-foreground">{t('career.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="paths" className="space-y-6">
          <TabsList className="glass p-1">
            <TabsTrigger value="paths" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <Briefcase className="h-4 w-4" />
              {t('career.paths')}
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <Target className="h-4 w-4" />
              {t('career.roadmap')}
            </TabsTrigger>
          </TabsList>

          {/* Career Paths Tab */}
          <TabsContent value="paths" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <CardGlass key={i}>
                    <CardHeader>
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <Skeleton className="h-6 w-3/4 mt-4" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-2 w-full" />
                    </CardContent>
                  </CardGlass>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {careerPaths.map((path: CareerPathWithProgress, index: number) => {
                  const Icon = iconMap[path.icon] || Code;
                  return (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <CardGlass 
                        className={`cursor-pointer transition-all duration-300 hover:shadow-xl group ${
                          selectedPath?.id === path.id ? 'ring-2 ring-primary shadow-glow' : ''
                        }`}
                        onClick={() => setSelectedPath(path)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <motion.div 
                              className={`p-3 rounded-xl ${path.color} shadow-lg group-hover:scale-110 transition-transform`}
                              whileHover={{ rotate: [0, -10, 10, 0] }}
                            >
                              <Icon className="h-6 w-6 text-white" />
                            </motion.div>
                            {getDemandBadge(path.demand)}
                          </div>
                          <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                            {isRTL ? path.titleAr : path.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {isRTL ? path.descriptionAr : path.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">{t('career.progress')}</span>
                                <span className="font-semibold text-primary">{path.progress}%</span>
                              </div>
                              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${path.progress}%` }}
                                  transition={{ duration: 1, delay: 0.2 }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span>{t('career.salary')}</span>
                              </div>
                              <span className="font-semibold">{path.salaryRange}</span>
                            </div>
                          </div>
                        </CardContent>
                      </CardGlass>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Selected Path Details */}
            {selectedPath && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CardGlass className="overflow-hidden">
                  <div className={`${selectedPath.color} p-6`}>
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                        {(() => {
                          const Icon = iconMap[selectedPath.icon] || Code;
                          return <Icon className="h-8 w-8 text-white" />;
                        })()}
                      </div>
                      <div className="text-white">
                        <CardTitle className="text-xl text-white">
                          {isRTL ? selectedPath.titleAr : selectedPath.title}
                        </CardTitle>
                        <CardDescription className="text-white/80">
                          {isRTL ? selectedPath.descriptionAr : selectedPath.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          {t('career.requiredSkills')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(isRTL ? selectedPath.skillsAr : selectedPath.skills).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="glass">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          {t('career.requiredCourses')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPath.courses.map((course: string) => (
                            <Badge 
                              key={course} 
                              variant={selectedPath.completedCourses.includes(course) ? "default" : "outline"}
                              className={selectedPath.completedCourses.includes(course) ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0" : ""}
                            >
                              {selectedPath.completedCourses.includes(course) && (
                                <CheckCircle2 className="h-3 w-3 me-1" />
                              )}
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button variant="gradient" className="w-full md:w-auto gap-2">
                      <Rocket className="h-4 w-4" />
                      {t('career.startPath')}
                    </Button>
                  </CardContent>
                </CardGlass>
              </motion.div>
            )}
          </TabsContent>

          {/* Roadmap Tab */}
          <TabsContent value="roadmap">
            <CardGlass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t('career.yourMilestones')}
                </CardTitle>
                <CardDescription>
                  {t('career.trackProgress')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <motion.div 
                      key={milestone.id}
                      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        milestone.completed 
                          ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30' 
                          : 'glass border-border/50 hover:border-primary/30'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        milestone.completed 
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {milestone.completed ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${milestone.completed ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                          {isRTL ? milestone.titleAr : milestone.title}
                        </p>
                      </div>
                      {!milestone.completed && (
                        <Button variant="outline" size="sm" className="glass">
                          {t('common.start')}
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </CardGlass>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
