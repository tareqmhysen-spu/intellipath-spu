import { motion } from 'framer-motion';
import { Sparkles, BookOpen, TrendingUp, Calendar, Briefcase, GraduationCap, Brain } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const suggestionsAr = [
  { text: 'ما هي المقررات المتاحة هذا الفصل؟', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
  { text: 'كيف أحسن معدلي التراكمي؟', icon: TrendingUp, color: 'from-green-500 to-green-600' },
  { text: 'ما هي المتطلبات المسبقة لمقرر هياكل البيانات؟', icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
  { text: 'اقترح لي خطة دراسية للفصل القادم', icon: Calendar, color: 'from-orange-500 to-orange-600' },
  { text: 'ما هي فرص العمل في هندسة المعلوماتية؟', icon: Briefcase, color: 'from-pink-500 to-pink-600' },
  { text: 'كيف أستعد لامتحان البرمجة؟', icon: Brain, color: 'from-cyan-500 to-cyan-600' },
];

const suggestionsEn = [
  { text: 'What courses are available this semester?', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
  { text: 'How can I improve my GPA?', icon: TrendingUp, color: 'from-green-500 to-green-600' },
  { text: 'What are the prerequisites for Data Structures?', icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
  { text: 'Suggest a study plan for next semester', icon: Calendar, color: 'from-orange-500 to-orange-600' },
  { text: 'What are job opportunities in IT Engineering?', icon: Briefcase, color: 'from-pink-500 to-pink-600' },
  { text: 'How do I prepare for programming exams?', icon: Brain, color: 'from-cyan-500 to-cyan-600' },
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  const { t, language } = useLanguageStore();
  const suggestions = language === 'ar' ? suggestionsAr : suggestionsEn;

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        {/* Animated logo */}
        <motion.div 
          className="relative mx-auto mb-6"
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="relative flex h-20 w-20 items-center justify-center">
            {/* Glow rings */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-secondary/30 to-primary/30 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <motion.div
              className="absolute inset-2 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 blur-md"
              animate={{
                scale: [1.1, 1, 1.1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.5,
              }}
            />
            
            {/* Main icon container */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 shadow-glow">
              <Sparkles className="h-8 w-8 text-secondary-foreground" />
            </div>
          </div>
        </motion.div>
        
        <motion.h2 
          className="mb-3 text-3xl font-bold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {t('مرحباً! أنا IntelliPath', 'Hello! I\'m IntelliPath')}
        </motion.h2>
        
        <motion.p 
          className="text-muted-foreground text-lg max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {t(
            'المستشار الأكاديمي الذكي الخاص بك. كيف يمكنني مساعدتك اليوم؟',
            'Your intelligent academic advisor. How can I help you today?'
          )}
        </motion.p>
      </motion.div>

      {/* Suggestions grid */}
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              onClick={() => onSelect(suggestion.text)}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 text-right transition-all duration-300 hover:border-secondary/50 hover:bg-card hover:shadow-lg rtl:text-right ltr:text-left"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${suggestion.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className="relative flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${suggestion.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-foreground group-hover:text-foreground transition-colors pt-2">
                  {suggestion.text}
                </p>
              </div>
              
              {/* Arrow indicator */}
              <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rtl:left-auto rtl:right-4"
                initial={{ x: -10 }}
                whileHover={{ x: 0 }}
              >
                <div className="h-6 w-6 rounded-full bg-secondary/20 flex items-center justify-center">
                  <span className="text-secondary text-xs">→</span>
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-sm text-muted-foreground/60"
      >
        {t(
          'أو اكتب سؤالك الخاص في الأسفل',
          'Or type your own question below'
        )}
      </motion.p>
    </div>
  );
}
