import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, 
  Medal, 
  Star, 
  Flame, 
  Target, 
  BookOpen, 
  Clock, 
  Award,
  Crown,
  Zap,
  Gift,
  Lock,
  CheckCircle2,
  Sparkles,
  MessageSquare, 
  Calendar,
  Loader2
} from 'lucide-react';
import { CardGlass, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguageStore } from '@/stores/languageStore';
import { cn } from '@/lib/utils';
import { celebrateAchievement } from '@/utils/confetti';
import { useAchievements } from '@/hooks/useAchievements';

// Icon mapping for achievements
const iconMap: Record<string, any> = {
  star: Star,
  book: BookOpen,
  flame: Flame,
  crown: Crown,
  target: Target,
  zap: Zap,
  award: Award,
  gift: Gift,
  trophy: Trophy,
  medal: Medal,
};

const colorMap: Record<string, { text: string; bg: string; gradient: string }> = {
  primary: { text: 'text-primary', bg: 'bg-primary/10', gradient: 'from-primary to-primary/70' },
  yellow: { text: 'text-amber-500', bg: 'bg-amber-500/10', gradient: 'from-amber-500 to-yellow-500' },
  blue: { text: 'text-blue-500', bg: 'bg-blue-500/10', gradient: 'from-blue-500 to-cyan-500' },
  orange: { text: 'text-orange-500', bg: 'bg-orange-500/10', gradient: 'from-orange-500 to-red-500' },
  purple: { text: 'text-purple-500', bg: 'bg-purple-500/10', gradient: 'from-purple-500 to-pink-500' },
  green: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500 to-green-500' },
  cyan: { text: 'text-cyan-500', bg: 'bg-cyan-500/10', gradient: 'from-cyan-500 to-teal-500' },
  amber: { text: 'text-amber-500', bg: 'bg-amber-500/10', gradient: 'from-amber-500 to-orange-500' },
  pink: { text: 'text-pink-500', bg: 'bg-pink-500/10', gradient: 'from-pink-500 to-rose-500' },
  red: { text: 'text-red-500', bg: 'bg-red-500/10', gradient: 'from-red-500 to-rose-500' },
};

// Mock leaderboard data
const leaderboard = [
  { rank: 1, name: 'سارة أحمد', nameEn: 'Sara Ahmed', xp: 5420, level: 18, avatar: '' },
  { rank: 2, name: 'محمد علي', nameEn: 'Mohammed Ali', xp: 4890, level: 16, avatar: '' },
  { rank: 3, name: 'ليلى حسن', nameEn: 'Laila Hassan', xp: 4650, level: 15, avatar: '' },
  { rank: 4, name: 'أحمد خالد', nameEn: 'Ahmed Khaled', xp: 4200, level: 14, avatar: '' },
  { rank: 5, name: 'نور الدين', nameEn: 'Nour Eldin', xp: 3980, level: 13, avatar: '' },
];

// Mock weekly challenges
const weeklyChalllenges = [
  { id: '1', title: 'أكمل 3 محادثات', titleEn: 'Complete 3 chats', xp: 100, progress: 2, total: 3, icon: MessageSquare },
  { id: '2', title: 'سجل دخولك 5 أيام', titleEn: 'Login 5 days', xp: 75, progress: 3, total: 5, icon: Calendar },
  { id: '3', title: 'استعرض 5 مقررات', titleEn: 'View 5 courses', xp: 50, progress: 5, total: 5, completed: true, icon: BookOpen },
];

export default function Achievements() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState('achievements');
  const { achievements, studentData, unlockedCount, isLoading } = useAchievements();

  const userStats = {
    xp: studentData?.xp_points || 0,
    level: studentData?.level || 1,
    nextLevelXp: ((studentData?.level || 1) + 1) * 500,
    rank: 15,
    streak: studentData?.streak_days || 0,
    totalAchievements: unlockedCount,
  };

  const xpProgress = (userStats.xp / userStats.nextLevelXp) * 100;

  return (
    <MainLayout>
      <div className="container mx-auto space-y-6 p-4 md:p-6">
        {/* Header Stats with enhanced gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardGlass className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/20">
            <CardContent className="p-6 relative">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <motion.div 
                      className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-3xl font-bold border border-white/30"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {userStats.level}
                    </motion.div>
                    <motion.div 
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Flame className="h-4 w-4" />
                    </motion.div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {t('achievements.level', { level: userStats.level })}
                    </h2>
                    <p className="text-white/80">
                      {userStats.xp} / {userStats.nextLevelXp} XP
                    </p>
                    <div className="mt-2 relative h-2 w-40 rounded-full bg-white/20 overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-white/80 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <Button 
                    variant="secondary" 
                    className="gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                    onClick={() => celebrateAchievement()}
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('achievements.celebrate')}
                  </Button>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
                      <p className="text-2xl font-bold">{userStats.rank}</p>
                      <p className="text-xs text-white/80">{t('achievements.rank')}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
                      <p className="text-2xl font-bold">{userStats.streak}</p>
                      <p className="text-xs text-white/80">{t('achievements.streak')}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
                      <p className="text-2xl font-bold">{userStats.totalAchievements}</p>
                      <p className="text-xs text-white/80">{t('achievements.badges')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CardGlass>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass grid w-full grid-cols-3 p-1">
            <TabsTrigger value="achievements" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <Trophy className="h-4 w-4" />
              {t('achievements.title')}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <Medal className="h-4 w-4" />
              {t('achievements.leaderboard')}
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <Target className="h-4 w-4" />
              {t('achievements.challenges')}
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {achievements.map((achievement, index) => {
                  const IconComponent = iconMap[achievement.icon || 'trophy'] || Trophy;
                  const colors = colorMap[achievement.badge_color || 'primary'] || colorMap.primary;
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <CardGlass
                        className={cn(
                          'relative overflow-hidden transition-all hover:shadow-xl group',
                          !achievement.unlocked && 'opacity-60'
                        )}
                      >
                        {!achievement.unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                            <div className="p-3 rounded-full bg-muted">
                              <Lock className="h-6 w-6 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <motion.div 
                              className={cn('rounded-xl p-3 bg-gradient-to-br', colors.gradient, 'text-white shadow-lg')}
                              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                            >
                              <IconComponent className="h-6 w-6" />
                            </motion.div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">
                                {language === 'ar' ? (achievement.name_ar || achievement.name) : achievement.name}
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {language === 'ar' ? (achievement.description_ar || achievement.description) : achievement.description}
                              </p>
                              <Badge variant="secondary" className="mt-2 text-xs glass">
                                +{achievement.xp_reward || 0} XP
                              </Badge>
                            </div>
                          </div>
                          {achievement.unlocked && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 left-2 rtl:left-auto rtl:right-2"
                            >
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            </motion.div>
                          )}
                        </CardContent>
                      </CardGlass>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-6">
            <CardGlass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-amber-500" />
                  {t('achievements.topStudents')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((student, index) => (
                    <motion.div
                      key={student.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={cn(
                        'flex items-center gap-4 rounded-xl p-4 transition-all',
                        student.rank <= 3 
                          ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20' 
                          : 'glass'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl font-bold shadow-lg',
                          student.rank === 1 && 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white',
                          student.rank === 2 && 'bg-gradient-to-br from-slate-400 to-gray-500 text-white',
                          student.rank === 3 && 'bg-gradient-to-br from-amber-600 to-orange-700 text-white',
                          student.rank > 3 && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {student.rank <= 3 ? (
                          <Crown className="h-6 w-6" />
                        ) : (
                          student.rank
                        )}
                      </div>
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                          {(language === 'ar' ? student.name : student.nameEn).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {language === 'ar' ? student.name : student.nameEn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('achievements.level', { level: student.level })}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {student.xp.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </CardGlass>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weeklyChalllenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -3 }}
                >
                  <CardGlass className={cn(
                    'transition-all',
                    challenge.completed && 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-green-500/5'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'rounded-xl p-3 shadow-lg',
                            challenge.completed 
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                              : 'bg-gradient-to-br from-primary to-secondary'
                          )}>
                            <challenge.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {language === 'ar' ? challenge.title : challenge.titleEn}
                            </h3>
                            <Badge variant="secondary" className="mt-1 text-xs glass">
                              +{challenge.xp} XP
                            </Badge>
                          </div>
                        </div>
                        {challenge.completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          </motion.div>
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {t('achievements.progressLabel')}
                          </span>
                          <span className="font-semibold">
                            {challenge.progress}/{challenge.total}
                          </span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={cn(
                              'absolute inset-y-0 left-0 rounded-full',
                              challenge.completed
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                                : 'bg-gradient-to-r from-primary to-secondary'
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CardGlass>
                </motion.div>
              ))}
            </div>

            {/* Weekly Reset Timer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardGlass className="mt-6">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {t('achievements.resetIn')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('achievements.resetTime')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="glass">
                    {t('achievements.completedCount')}
                  </Badge>
                </CardContent>
              </CardGlass>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
