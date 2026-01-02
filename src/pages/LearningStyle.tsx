import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { CardGlass, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguageStore } from '@/stores/languageStore';
import { 
  Eye, Ear, Hand, BookOpen, CheckCircle2, 
  RotateCcw, Share2, Download, Lightbulb, ArrowRight, ArrowLeft, Brain, Sparkles
} from 'lucide-react';

interface Question {
  id: number;
  textAr: string;
  textEn: string;
  options: {
    textAr: string;
    textEn: string;
    type: 'V' | 'A' | 'R' | 'K';
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    textAr: 'عندما تتعلم شيئاً جديداً، تفضل:',
    textEn: 'When learning something new, you prefer:',
    options: [
      { textAr: 'مشاهدة فيديو أو رسوم توضيحية', textEn: 'Watching videos or diagrams', type: 'V' },
      { textAr: 'الاستماع إلى شرح صوتي', textEn: 'Listening to audio explanations', type: 'A' },
      { textAr: 'قراءة الكتب والمقالات', textEn: 'Reading books and articles', type: 'R' },
      { textAr: 'التجربة العملية المباشرة', textEn: 'Hands-on practice', type: 'K' },
    ],
  },
  {
    id: 2,
    textAr: 'عندما تحتاج تذكر معلومة مهمة:',
    textEn: 'When you need to remember important information:',
    options: [
      { textAr: 'أتخيل صورة ذهنية لها', textEn: 'I visualize a mental image', type: 'V' },
      { textAr: 'أكررها بصوت عالٍ', textEn: 'I repeat it out loud', type: 'A' },
      { textAr: 'أكتبها عدة مرات', textEn: 'I write it down multiple times', type: 'R' },
      { textAr: 'أربطها بحركة أو نشاط', textEn: 'I associate it with movement', type: 'K' },
    ],
  },
  {
    id: 3,
    textAr: 'في الامتحانات، تتذكر المعلومات بشكل أفضل عندما:',
    textEn: 'In exams, you remember information better when:',
    options: [
      { textAr: 'رأيتها في جدول أو رسم بياني', textEn: 'You saw it in a table or chart', type: 'V' },
      { textAr: 'سمعتها من المحاضر', textEn: 'You heard it from the lecturer', type: 'A' },
      { textAr: 'قرأتها في الكتاب', textEn: 'You read it in the book', type: 'R' },
      { textAr: 'طبقتها في مختبر أو تمرين', textEn: 'You applied it in a lab or exercise', type: 'K' },
    ],
  },
  {
    id: 4,
    textAr: 'عند حل مشكلة معقدة:',
    textEn: 'When solving a complex problem:',
    options: [
      { textAr: 'أرسم مخططاً توضيحياً', textEn: 'I draw a diagram', type: 'V' },
      { textAr: 'أناقشها مع الآخرين', textEn: 'I discuss it with others', type: 'A' },
      { textAr: 'أقرأ عن حالات مشابهة', textEn: 'I read about similar cases', type: 'R' },
      { textAr: 'أجرب حلولاً مختلفة عملياً', textEn: 'I try different solutions practically', type: 'K' },
    ],
  },
  {
    id: 5,
    textAr: 'أفضل طريقة للمذاكرة بالنسبة لي:',
    textEn: 'My preferred study method is:',
    options: [
      { textAr: 'استخدام خرائط ذهنية ملونة', textEn: 'Using colorful mind maps', type: 'V' },
      { textAr: 'تسجيل المحاضرات وإعادة سماعها', textEn: 'Recording lectures and replaying them', type: 'A' },
      { textAr: 'تلخيص المادة كتابياً', textEn: 'Writing summaries', type: 'R' },
      { textAr: 'حل أكبر عدد من التمارين', textEn: 'Solving as many exercises as possible', type: 'K' },
    ],
  },
];

const styleInfo = {
  V: {
    nameAr: 'بصري',
    nameEn: 'Visual',
    icon: Eye,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
    descAr: 'تتعلم بشكل أفضل من خلال الصور والرسوم البيانية والمخططات',
    descEn: 'You learn best through images, charts, and diagrams',
    tipsAr: ['استخدم الخرائط الذهنية', 'شاهد الفيديوهات التعليمية', 'استخدم أقلام ملونة للتلخيص', 'ارسم المفاهيم'],
    tipsEn: ['Use mind maps', 'Watch educational videos', 'Use colored pens for summaries', 'Draw concepts'],
  },
  A: {
    nameAr: 'سمعي',
    nameEn: 'Auditory',
    icon: Ear,
    gradient: 'from-emerald-500 to-green-500',
    bgGradient: 'from-emerald-500/10 to-green-500/10',
    descAr: 'تتعلم بشكل أفضل من خلال الاستماع والمناقشة',
    descEn: 'You learn best through listening and discussion',
    tipsAr: ['سجل المحاضرات', 'ناقش المواضيع مع زملائك', 'استخدم البودكاست التعليمية', 'اقرأ بصوت عالٍ'],
    tipsEn: ['Record lectures', 'Discuss topics with peers', 'Use educational podcasts', 'Read aloud'],
  },
  R: {
    nameAr: 'قرائي/كتابي',
    nameEn: 'Reading/Writing',
    icon: BookOpen,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
    descAr: 'تتعلم بشكل أفضل من خلال القراءة والكتابة',
    descEn: 'You learn best through reading and writing',
    tipsAr: ['اكتب ملخصات تفصيلية', 'أعد كتابة الملاحظات', 'اقرأ الكتب المرجعية', 'دوّن الملاحظات أثناء المحاضرة'],
    tipsEn: ['Write detailed summaries', 'Rewrite notes', 'Read reference books', 'Take notes during lectures'],
  },
  K: {
    nameAr: 'حركي',
    nameEn: 'Kinesthetic',
    icon: Hand,
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-500/10 to-red-500/10',
    descAr: 'تتعلم بشكل أفضل من خلال الممارسة والتجربة العملية',
    descEn: 'You learn best through practice and hands-on experience',
    tipsAr: ['طبق ما تتعلمه عملياً', 'قم بالتجارب المخبرية', 'استخدم المحاكاة', 'خذ فترات راحة قصيرة متكررة'],
    tipsEn: ['Apply what you learn practically', 'Do lab experiments', 'Use simulations', 'Take frequent short breaks'],
  },
};

export default function LearningStyle() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (type: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: type }));
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const calculateResults = () => {
    const counts = { V: 0, A: 0, R: 0, K: 0 };
    Object.values(answers).forEach(type => {
      counts[type as keyof typeof counts]++;
    });
    
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([type, count]) => ({
      type: type as 'V' | 'A' | 'R' | 'K',
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    })).sort((a, b) => b.percentage - a.percentage);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const results = calculateResults();
  const dominantStyle = results.length > 0 ? results[0] : { type: 'V' as const, count: 0, percentage: 0 };

  if (showResults) {
    const style = styleInfo[dominantStyle.type];
    const StyleIcon = style.icon;

    return (
      <MainLayout>
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CardGlass className="overflow-hidden">
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${style.gradient} p-8 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 flex items-center gap-6">
                  <motion.div 
                    className="p-5 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30"
                    animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <StyleIcon className="h-12 w-12" />
                  </motion.div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">{t('learningStyle.dominantStyle')}</p>
                    <h2 className="text-4xl font-bold">
                      {isRTL ? style.nameAr : style.nameEn}
                    </h2>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground text-lg">
                  {isRTL ? style.descAr : style.descEn}
                </p>

                {/* Results Chart */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    {t('learningStyle.yourResults')}
                  </h3>
                  {results.map((result, index) => {
                    const info = styleInfo[result.type];
                    const Icon = info.icon;
                    return (
                      <motion.div 
                        key={result.type} 
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${info.gradient} text-white`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium">
                              {isRTL ? info.nameAr : info.nameEn}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            {result.percentage}%
                          </span>
                        </div>
                        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                          <motion.div 
                            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${info.gradient} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${result.percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Tips */}
                <CardGlass className={`bg-gradient-to-br ${style.bgGradient}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      {t('learningStyle.tips')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(isRTL ? style.tipsAr : style.tipsEn).map((tip, i) => (
                        <motion.li 
                          key={i} 
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                        >
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </CardGlass>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button onClick={resetQuiz} variant="outline" className="gap-2 glass">
                    <RotateCcw className="h-4 w-4" />
                    {t('learningStyle.retake')}
                  </Button>
                  <Button variant="outline" className="gap-2 glass">
                    <Share2 className="h-4 w-4" />
                    {t('learningStyle.share')}
                  </Button>
                  <Button variant="gradient" className="gap-2">
                    <Download className="h-4 w-4" />
                    {t('learningStyle.download')}
                  </Button>
                </div>
              </CardContent>
            </CardGlass>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  const question = questions[currentQuestion];

  if (!question) {
    return (
      <MainLayout>
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-glow">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('learningStyle.title')}
              </h1>
              <p className="text-muted-foreground">{t('learningStyle.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        {/* Progress */}
        <CardGlass>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                {t('learningStyle.question')} {currentQuestion + 1} {t('learningStyle.of')} {questions.length}
              </span>
              <Badge variant="secondary" className="glass">
                {Math.round(progress)}%
              </Badge>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </CardContent>
        </CardGlass>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
            transition={{ duration: 0.3 }}
          >
            <CardGlass>
              <CardHeader>
                <CardTitle className="text-xl leading-relaxed">
                  {isRTL ? question.textAr : question.textEn}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.options.map((option, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Button
                      variant={answers[currentQuestion] === option.type ? "default" : "outline"}
                      className={`w-full justify-start text-start h-auto py-4 px-4 transition-all ${
                        answers[currentQuestion] === option.type 
                          ? 'bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-lg' 
                          : 'glass hover:border-primary/50'
                      }`}
                      onClick={() => handleAnswer(option.type)}
                    >
                      <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center me-3 font-semibold ${
                        answers[currentQuestion] === option.type 
                          ? 'bg-white/20' 
                          : 'bg-gradient-to-br from-primary/10 to-secondary/10'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {isRTL ? option.textAr : option.textEn}
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </CardGlass>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentQuestion > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              variant="ghost"
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              className="gap-2 glass"
            >
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {t('learningStyle.previousQuestion')}
            </Button>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
