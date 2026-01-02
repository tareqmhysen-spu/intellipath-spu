import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CardGlass, CardContent } from '@/components/ui/card';
import { useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';
import { 
  Brain, BookOpen, Target, Trophy, MessageSquare, Network,
  Lightbulb, Shield, BarChart3, Briefcase, Sun, Moon, Globe,
  Star, Users, GraduationCap, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Zap
} from 'lucide-react';
import { ParticlesBackground, FloatingOrbs, GridPattern } from '@/components/ui/particles-background';

const features = [
  { icon: Shield, color: 'from-blue-500 to-indigo-600' },
  { icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
  { icon: Brain, color: 'from-purple-500 to-pink-600' },
];

const allFeatures = [
  { icon: Brain },
  { icon: Network },
  { icon: BarChart3 },
  { icon: Briefcase },
  { icon: Shield },
  { icon: Lightbulb },
  { icon: Trophy },
  { icon: BookOpen },
  { icon: Target },
  { icon: MessageSquare },
];

const steps = [
  { num: 1, color: 'from-blue-500 to-cyan-500' },
  { num: 2, color: 'from-emerald-500 to-teal-500' },
  { num: 3, color: 'from-amber-500 to-orange-500' },
  { num: 4, color: 'from-purple-500 to-pink-500' },
];

export default function Index() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  
  // Parallax refs
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">IntelliPath</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="hover:bg-muted"
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="hover:bg-muted"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hover:bg-muted hidden sm:flex"
            >
              {t('common.login')}
            </Button>
            <Button 
              onClick={() => navigate('/auth')} 
              variant="gradient"
            >
              {t('landing.hero.cta.register')}
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950" />
        <FloatingOrbs />
        <ParticlesBackground particleCount={80} />
        <GridPattern />
        
        {/* Parallax Content */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="container relative z-10 mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-sm text-white/80">{t('landing.hero.subtitle').split('-')[0]}</span>
            </motion.div>
            
            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-7xl text-white">
              {t('landing.hero.title').split(' ').slice(0, -1).join(' ')}
              {' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  IntelliPath
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-base text-white/60 md:text-lg lg:text-xl">
              {t('landing.hero.subtitle')}
            </p>

            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                variant="gradient"
                className="gap-2 text-base px-8 group"
              >
                {t('landing.hero.cta.register')}
                <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Button>
              <Button 
                size="lg" 
                variant="glass"
                onClick={() => navigate('/auth')}
              >
                <Zap className="h-5 w-5 me-2" />
                {t('landing.hero.cta.demo')}
              </Button>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto"
          >
            {features.map((feature, i) => {
              const featureKeys = ['security', 'instant', 'ai'] as const;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <CardGlass className="hover:border-indigo-500/30 transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-500/10">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold mb-2 text-white">
                        {t(`landing.features.${featureKeys[i]}.title`)}
                      </h3>
                      <p className="text-sm text-white/60">
                        {t(`landing.features.${featureKeys[i]}.description`)}
                      </p>
                    </CardContent>
                  </CardGlass>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL ? 'أربع خطوات بسيطة للبدء في استخدام النظام' : 'Four simple steps to start using the system'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => {
              const stepKeys = ['step1', 'step2', 'step3', 'step4'] as const;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="text-center relative"
                >
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
                  )}
                  
                  <motion.div 
                    className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <span className="text-2xl font-bold text-white">{step.num}</span>
                  </motion.div>
                  <h3 className="font-bold mb-2">
                    {t(`landing.howItWorks.${stepKeys[i]}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`landing.howItWorks.${stepKeys[i]}.description`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">{t('landing.features.title')}</span>
            </motion.div>
            
            <h2 className="text-3xl font-bold mb-4">
              {isRTL ? '10 أنظمة ذكية متكاملة' : '10 Integrated AI Systems'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL 
                ? 'كل ما تحتاجه لتحقيق النجاح الأكاديمي والمهني في مكان واحد'
                : 'Everything you need for academic and career success in one place'
              }
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {allFeatures.map((feature, i) => {
              const featureLabels = isRTL 
                ? ['المستشار الذكي', 'رسم المعرفة', 'محاكي القرارات', 'المسار المهني', 'الإنذار المبكر', 'نمط التعلم', 'الإنجازات', 'سجل المواهب', 'التوصيات', 'دعم متعدد اللغات']
                : ['AI Advisor', 'Knowledge Graph', 'Decision Simulator', 'Career Path', 'Early Warning', 'Learning Style', 'Achievements', 'Talent Ledger', 'Smart Recommendations', 'Multilingual'];
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <CardGlass className="text-center p-4 hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">{featureLabels[i]}</p>
                    </CardContent>
                  </CardGlass>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              {isRTL ? 'لمن هذا النظام؟' : 'Who is this system for?'}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Students Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <CardGlass className="p-6 h-full hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 border-emerald-500/20">
                <CardContent className="p-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{t('landing.userTypes.students.title')}</h3>
                  <p className="text-muted-foreground mb-6">{t('landing.userTypes.students.description')}</p>
                  <ul className="space-y-3">
                    {(t('landing.userTypes.students.benefits', { returnObjects: true }) as string[]).map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                    onClick={() => navigate('/auth')}
                  >
                    {t('landing.hero.cta.register')}
                  </Button>
                </CardContent>
              </CardGlass>
            </motion.div>

            {/* Staff Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <CardGlass className="p-6 h-full hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 border-purple-500/20">
                <CardContent className="p-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{t('landing.userTypes.staff.title')}</h3>
                  <p className="text-muted-foreground mb-6">{t('landing.userTypes.staff.description')}</p>
                  <ul className="space-y-3">
                    {(t('landing.userTypes.staff.benefits', { returnObjects: true }) as string[]).map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700"
                    onClick={() => navigate('/auth')}
                  >
                    {t('common.login')}
                  </Button>
                </CardContent>
              </CardGlass>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkg4di0yaDI4em0tMTggOHYySDh2LTJoMTB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {isRTL ? 'هل أنت مستعد للبدء؟' : 'Ready to get started?'}
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              {isRTL 
                ? 'انضم إلى آلاف الطلاب الذين يستخدمون IntelliPath لتحقيق أهدافهم الأكاديمية'
                : 'Join thousands of students using IntelliPath to achieve their academic goals'
              }
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl shadow-black/20"
            >
              {t('landing.hero.cta.register')}
              <ArrowIcon className="ms-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">IntelliPath</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t('landing.footer.university')} • {t('landing.footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}
