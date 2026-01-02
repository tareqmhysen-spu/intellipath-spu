import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CardGlass, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useLanguageStore } from '@/stores/languageStore';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Heart, Brain, Smile, Frown, Meh, Sun, Moon, 
  Activity, TrendingUp, Calendar, Phone, MessageCircle,
  BookOpen, Coffee, Zap, Shield, ExternalLink, CheckCircle
} from 'lucide-react';

const moodOptions = [
  { emoji: '😊', label: 'Great', label_ar: 'ممتاز', value: 5, color: 'from-green-400 to-emerald-500' },
  { emoji: '🙂', label: 'Good', label_ar: 'جيد', value: 4, color: 'from-lime-400 to-green-500' },
  { emoji: '😐', label: 'Okay', label_ar: 'عادي', value: 3, color: 'from-yellow-400 to-amber-500' },
  { emoji: '😔', label: 'Low', label_ar: 'منخفض', value: 2, color: 'from-orange-400 to-red-500' },
  { emoji: '😢', label: 'Struggling', label_ar: 'صعب', value: 1, color: 'from-red-400 to-rose-500' },
];

const wellnessHistory = [
  { date: '2024-01-14', mood: 4, stress: 3, sleep: 7 },
  { date: '2024-01-13', mood: 3, stress: 5, sleep: 6 },
  { date: '2024-01-12', mood: 4, stress: 4, sleep: 8 },
  { date: '2024-01-11', mood: 5, stress: 2, sleep: 7 },
  { date: '2024-01-10', mood: 3, stress: 6, sleep: 5 },
  { date: '2024-01-09', mood: 4, stress: 3, sleep: 7 },
  { date: '2024-01-08', mood: 4, stress: 4, sleep: 6 },
];

const resources = [
  {
    title: 'University Counseling Center',
    title_ar: 'مركز الإرشاد الجامعي',
    description: 'Free counseling services for all students',
    description_ar: 'خدمات إرشادية مجانية لجميع الطلاب',
    icon: MessageCircle,
    color: 'from-blue-500 to-cyan-500',
    link: '#',
  },
  {
    title: 'Mental Health Hotline',
    title_ar: 'خط الدعم النفسي',
    description: '24/7 support available',
    description_ar: 'دعم متاح على مدار الساعة',
    icon: Phone,
    color: 'from-green-500 to-emerald-500',
    link: 'tel:+963999999999',
  },
  {
    title: 'Study-Life Balance Guide',
    title_ar: 'دليل التوازن بين الدراسة والحياة',
    description: 'Tips and strategies for managing stress',
    description_ar: 'نصائح واستراتيجيات لإدارة التوتر',
    icon: BookOpen,
    color: 'from-purple-500 to-pink-500',
    link: '#',
  },
  {
    title: 'Relaxation Techniques',
    title_ar: 'تقنيات الاسترخاء',
    description: 'Guided meditation and breathing exercises',
    description_ar: 'تأمل موجه وتمارين تنفس',
    icon: Coffee,
    color: 'from-amber-500 to-orange-500',
    link: '#',
  },
];

const tips = [
  { icon: Sun, text: 'Get 15 minutes of sunlight daily', text_ar: 'احصل على 15 دقيقة من ضوء الشمس يومياً' },
  { icon: Activity, text: 'Take a 5-minute break every hour', text_ar: 'خذ استراحة 5 دقائق كل ساعة' },
  { icon: Moon, text: 'Aim for 7-8 hours of sleep', text_ar: 'استهدف 7-8 ساعات من النوم' },
  { icon: Zap, text: 'Stay hydrated throughout the day', text_ar: 'حافظ على ترطيب جسمك طوال اليوم' },
];

export default function WellnessCheck() {
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState([5]);
  const [sleepHours, setSleepHours] = useState([7]);
  const [notes, setNotes] = useState('');
  const [optedIn, setOptedIn] = useState(true);
  const [checkInSubmitted, setCheckInSubmitted] = useState(false);

  const texts = {
    title: isRTL ? 'فحص الصحة النفسية' : 'Wellness Check',
    subtitle: isRTL ? 'تتبع صحتك النفسية والعاطفية' : 'Track your mental and emotional wellness',
    checkIn: isRTL ? 'تسجيل الحالة' : 'Check-in',
    history: isRTL ? 'السجل' : 'History',
    resources: isRTL ? 'موارد' : 'Resources',
    howAreYou: isRTL ? 'كيف حالك اليوم؟' : 'How are you feeling today?',
    stressLevel: isRTL ? 'مستوى التوتر' : 'Stress Level',
    low: isRTL ? 'منخفض' : 'Low',
    high: isRTL ? 'مرتفع' : 'High',
    sleepQuality: isRTL ? 'ساعات النوم' : 'Sleep Hours',
    hours: isRTL ? 'ساعات' : 'hours',
    additionalNotes: isRTL ? 'ملاحظات إضافية' : 'Additional Notes',
    notesPlaceholder: isRTL ? 'شارك أي أفكار أو مشاعر...' : 'Share any thoughts or feelings...',
    submit: isRTL ? 'إرسال' : 'Submit Check-in',
    submitted: isRTL ? 'تم التسجيل!' : 'Check-in Submitted!',
    weeklyOverview: isRTL ? 'نظرة أسبوعية' : 'Weekly Overview',
    avgMood: isRTL ? 'متوسط المزاج' : 'Avg. Mood',
    avgStress: isRTL ? 'متوسط التوتر' : 'Avg. Stress',
    avgSleep: isRTL ? 'متوسط النوم' : 'Avg. Sleep',
    helpfulResources: isRTL ? 'موارد مفيدة' : 'Helpful Resources',
    dailyTips: isRTL ? 'نصائح يومية' : 'Daily Tips',
    privacyNote: isRTL ? 'بياناتك سرية وآمنة' : 'Your data is private and secure',
    optIn: isRTL ? 'تفعيل تتبع الصحة النفسية' : 'Enable Wellness Tracking',
    optInDescription: isRTL 
      ? 'يساعدك هذا على تتبع صحتك النفسية بمرور الوقت'
      : 'This helps you track your wellness over time',
  };

  const handleSubmit = () => {
    setCheckInSubmitted(true);
    setTimeout(() => setCheckInSubmitted(false), 3000);
  };

  // Calculate averages
  const avgMood = (wellnessHistory.reduce((a, b) => a + b.mood, 0) / wellnessHistory.length).toFixed(1);
  const avgStress = (wellnessHistory.reduce((a, b) => a + b.stress, 0) / wellnessHistory.length).toFixed(1);
  const avgSleep = (wellnessHistory.reduce((a, b) => a + b.sleep, 0) / wellnessHistory.length).toFixed(1);

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-purple-500/10 p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
                  {texts.title}
                </h1>
                <p className="text-muted-foreground">{texts.subtitle}</p>
              </div>
            </div>
            
            {/* Privacy & Opt-in */}
            <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{texts.privacyNote}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{texts.optIn}</span>
                <Switch checked={optedIn} onCheckedChange={setOptedIn} />
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="checkin" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="checkin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <Heart className="h-4 w-4 mr-2" />
              {texts.checkIn}
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              {texts.history}
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              {texts.resources}
            </TabsTrigger>
          </TabsList>

          {/* Check-in Tab */}
          <TabsContent value="checkin" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Check-in Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Mood Selection */}
                <CardGlass>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smile className="h-5 w-5 text-rose-500" />
                      {texts.howAreYou}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between gap-2">
                      {moodOptions.map((mood) => (
                        <motion.button
                          key={mood.value}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedMood(mood.value)}
                          className={`flex-1 p-4 rounded-xl transition-all ${
                            selectedMood === mood.value
                              ? `bg-gradient-to-br ${mood.color} text-white shadow-lg`
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          <div className="text-3xl mb-1">{mood.emoji}</div>
                          <div className="text-xs font-medium">
                            {isRTL ? mood.label_ar : mood.label}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </CardContent>
                </CardGlass>

                {/* Stress Level */}
                <CardGlass>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      {texts.stressLevel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Slider
                        value={stressLevel}
                        onValueChange={setStressLevel}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Smile className="h-4 w-4 text-green-500" />
                          {texts.low}
                        </span>
                        <span className="text-2xl font-bold text-foreground">{stressLevel[0]}/10</span>
                        <span className="flex items-center gap-1">
                          <Frown className="h-4 w-4 text-red-500" />
                          {texts.high}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </CardGlass>

                {/* Sleep Hours */}
                <CardGlass>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Moon className="h-5 w-5 text-indigo-500" />
                      {texts.sleepQuality}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Slider
                        value={sleepHours}
                        onValueChange={setSleepHours}
                        max={12}
                        min={1}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="text-center">
                        <span className="text-3xl font-bold">{sleepHours[0]}</span>
                        <span className="text-muted-foreground ml-1">{texts.hours}</span>
                      </div>
                    </div>
                  </CardContent>
                </CardGlass>

                {/* Notes */}
                <CardGlass>
                  <CardHeader>
                    <CardTitle>{texts.additionalNotes}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={texts.notesPlaceholder}
                      className="min-h-[100px] bg-background/50"
                    />
                  </CardContent>
                </CardGlass>

                {/* Submit Button */}
                <motion.div
                  initial={false}
                  animate={checkInSubmitted ? { scale: [1, 1.02, 1] } : {}}
                >
                  <Button 
                    onClick={handleSubmit}
                    disabled={!selectedMood || checkInSubmitted}
                    className="w-full h-14 text-lg bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                  >
                    {checkInSubmitted ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {texts.submitted}
                      </>
                    ) : (
                      texts.submit
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Daily Tips */}
                <CardGlass>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      {texts.dailyTips}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tips.map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10"
                      >
                        <tip.icon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                        <span className="text-sm">{isRTL ? tip.text_ar : tip.text}</span>
                      </motion.div>
                    ))}
                  </CardContent>
                </CardGlass>

                {/* Quick Stats */}
                <CardGlass>
                  <CardHeader>
                    <CardTitle>{texts.weeklyOverview}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{texts.avgMood}</span>
                      <Badge className="bg-green-500/10 text-green-600">{avgMood}/5</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{texts.avgStress}</span>
                      <Badge className="bg-purple-500/10 text-purple-600">{avgStress}/10</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{texts.avgSleep}</span>
                      <Badge className="bg-indigo-500/10 text-indigo-600">{avgSleep}h</Badge>
                    </div>
                  </CardContent>
                </CardGlass>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <CardGlass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-rose-500" />
                  {texts.weeklyOverview}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wellnessHistory.map((entry, index) => (
                    <motion.div
                      key={entry.date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10"
                    >
                      <div className="text-center min-w-[60px]">
                        <div className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { weekday: 'short' })}
                        </div>
                        <div className="font-semibold">
                          {new Date(entry.date).getDate()}
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{texts.avgMood}</div>
                          <div className="text-2xl">{moodOptions[5 - entry.mood]?.emoji}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{texts.stressLevel}</div>
                          <Progress value={entry.stress * 10} className="h-2" />
                          <div className="text-xs mt-1">{entry.stress}/10</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{texts.sleepQuality}</div>
                          <div className="font-semibold">{entry.sleep}h</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </CardGlass>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource, index) => (
                <motion.div
                  key={resource.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CardGlass className="h-full hover:shadow-xl transition-all hover:scale-[1.02]">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${resource.color} text-white`}>
                          <resource.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            {isRTL ? resource.title_ar : resource.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {isRTL ? resource.description_ar : resource.description}
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <a href={resource.link} target="_blank" rel="noopener noreferrer">
                              {isRTL ? 'تواصل' : 'Contact'}
                              <ExternalLink className="h-3 w-3 ml-2" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CardGlass>
                </motion.div>
              ))}
            </div>

            {/* Emergency Contact */}
            <CardGlass className="border-rose-500/20 bg-gradient-to-r from-rose-500/5 to-pink-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                    <Phone className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {isRTL ? 'هل تحتاج مساعدة فورية؟' : 'Need immediate help?'}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      {isRTL 
                        ? 'لا تتردد في التواصل مع خط الدعم النفسي'
                        : "Don't hesitate to reach out to our support line"}
                    </p>
                    <Button className="bg-gradient-to-r from-rose-500 to-pink-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {isRTL ? 'اتصل الآن' : 'Call Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CardGlass>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
