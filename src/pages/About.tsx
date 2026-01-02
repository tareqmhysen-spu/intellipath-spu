import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion, useInView } from 'framer-motion';
import { useLanguageStore } from '@/stores/languageStore';
import {
  Target,
  Zap,
  Users,
  BookOpen,
  Brain,
  TrendingUp,
  Shield,
  Globe,
  Code,
  Camera,
  Mail,
  MessageCircle,
  Instagram,
  Award,
  Calendar,
  Sparkles,
  Eye,
  Compass,
  Calculator,
  Trophy,
  FileText,
  AlertTriangle,
  Database,
  Server,
  Cpu,
  Layers,
  GitBranch,
  BarChart3,
  GraduationCap,
  Briefcase,
  Palette,
  Video,
  Image,
  Star,
  Heart,
  Rocket,
  CheckCircle2,
  Settings,
  UserCog,
  Bell,
  LineChart,
  PieChart,
  Activity,
  Fingerprint,
  Lightbulb,
  Network,
  Cloud,
  Lock,
  Smartphone,
  Monitor,
  Wand2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';

const About: React.FC = () => {
  const { language, t } = useLanguageStore();
  const isRTL = language === 'ar';
  
  // Refs for scroll animations
  const heroRef = useRef(null);
  const systemRef = useRef(null);
  const featuresRef = useRef(null);
  const techRef = useRef(null);
  const expertiseRef = useRef(null);
  const skillsRef = useRef(null);
  const journeyRef = useRef(null);
  const contactRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const systemInView = useInView(systemRef, { once: true, amount: 0.2 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const techInView = useInView(techRef, { once: true, amount: 0.2 });
  const expertiseInView = useInView(expertiseRef, { once: true, amount: 0.2 });
  const skillsInView = useInView(skillsRef, { once: true, amount: 0.2 });
  const journeyInView = useInView(journeyRef, { once: true, amount: 0.2 });
  const contactInView = useInView(contactRef, { once: true, amount: 0.2 });

  // System Features
  const systemFeatures = [
    {
      icon: Brain,
      title: t('ذكاء اصطناعي متقدم', 'Advanced AI'),
      description: t(
        'نظام RAG متطور مع Agentic RAG للرد على أسئلتك الأكاديمية بدقة عالية',
        'Advanced RAG system with Agentic RAG for answering academic questions with high accuracy'
      ),
      gradient: 'from-blue-500 to-cyan-500',
      category: 'student',
    },
    {
      icon: TrendingUp,
      title: t('تتبع التقدم الأكاديمي', 'Academic Progress Tracking'),
      description: t(
        'مراقبة شاملة لتقدمك الدراسي مع تحليلات مفصلة ورسوم بيانية تفاعلية',
        'Comprehensive monitoring with detailed analytics and interactive charts'
      ),
      gradient: 'from-green-500 to-emerald-500',
      category: 'student',
    },
    {
      icon: Compass,
      title: t('تخطيط المسار الأكاديمي', 'Academic Path Planning'),
      description: t(
        'مساعدة ذكية في تخطيط مسارك الدراسي بناءً على خطة التخصص',
        'Smart assistance in planning your academic path based on specialization'
      ),
      gradient: 'from-purple-500 to-pink-500',
      category: 'student',
    },
    {
      icon: Calculator,
      title: t('محاكاة القرارات', 'Decision Simulator'),
      description: t(
        'جرب سيناريوهات مختلفة قبل اتخاذ القرارات الأكاديمية المهمة',
        'Try different scenarios before making important academic decisions'
      ),
      gradient: 'from-indigo-500 to-blue-500',
      category: 'student',
    },
    {
      icon: Trophy,
      title: t('نظام الإنجازات', 'Achievement System'),
      description: t(
        'احصل على نقاط XP، إنجازات، وشارات لتطوير مهاراتك',
        'Earn XP points, achievements, and badges to develop your skills'
      ),
      gradient: 'from-yellow-500 to-orange-500',
      category: 'student',
    },
    {
      icon: Briefcase,
      title: t('التخطيط المهني', 'Career Planning'),
      description: t(
        'خطط لمستقبلك المهني واكتشف الفرص المتاحة',
        'Plan your professional future and discover available opportunities'
      ),
      gradient: 'from-teal-500 to-cyan-500',
      category: 'student',
    },
    {
      icon: Settings,
      title: t('لوحة تحكم المسؤول', 'Admin Dashboard'),
      description: t(
        'إدارة شاملة للنظام والطلاب مع إحصائيات متقدمة',
        'Comprehensive system and student management with advanced statistics'
      ),
      gradient: 'from-slate-500 to-gray-600',
      category: 'admin',
    },
    {
      icon: AlertTriangle,
      title: t('نظام الإنذار المبكر', 'Early Warning System'),
      description: t(
        'تنبيهات ذكية للطلاب المعرضين للخطر الأكاديمي',
        'Smart alerts for at-risk students with improvement recommendations'
      ),
      gradient: 'from-red-500 to-orange-500',
      category: 'admin',
    },
  ];

  // Technology Stack
  const frontendTech = [
    { name: 'React 18', icon: Code, description: t('مكتبة واجهات المستخدم', 'UI Library') },
    { name: 'TypeScript', icon: FileText, description: t('لغة برمجة آمنة', 'Type-safe Language') },
    { name: 'Tailwind CSS', icon: Palette, description: t('إطار تنسيق حديث', 'Modern Styling') },
    { name: 'Framer Motion', icon: Sparkles, description: t('حركات سلسة', 'Smooth Animations') },
    { name: 'Zustand', icon: Database, description: t('إدارة الحالة', 'State Management') },
    { name: 'React Query', icon: GitBranch, description: t('إدارة البيانات', 'Data Management') },
  ];

  const backendTech = [
    { name: 'Supabase', icon: Database, description: t('قاعدة البيانات والمصادقة', 'Database & Auth') },
    { name: 'Edge Functions', icon: Zap, description: t('وظائف سحابية', 'Serverless Functions') },
    { name: 'PostgreSQL', icon: Database, description: t('قاعدة بيانات علائقية', 'Relational DB') },
    { name: 'AI Models', icon: Brain, description: t('نماذج الذكاء الاصطناعي', 'AI Models') },
  ];

  // Journey Timeline
  const journey = [
    { 
      year: '2021', 
      title: t('بداية الرحلة', 'Journey Begins'),
      description: t(
        'التحقت بالجامعة السورية الخاصة SPU لدراسة الذكاء الاصطناعي وعلوم البيانات',
        'Enrolled at Syrian Private University SPU to study AI and Data Science'
      ),
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-500',
    },
    { 
      year: '2022', 
      title: t('التعمق في البرمجة', 'Deep Dive into Programming'),
      description: t(
        'بدأت رحلتي في عالم البرمجة وتطوير التطبيقات والمواقع',
        'Started my journey in programming and application development'
      ),
      icon: Code,
      color: 'from-purple-500 to-pink-500',
    },
    { 
      year: '2023', 
      title: t('المشاريع الأولى', 'First Projects'),
      description: t(
        'بدأت العمل على مشاريع حقيقية وتطبيقات عملية للعملاء',
        'Started working on real projects and practical applications'
      ),
      icon: Rocket,
      color: 'from-green-500 to-emerald-500',
    },
    { 
      year: '2024', 
      title: t('التوسع والنمو', 'Expansion and Growth'),
      description: t(
        'توسعت في مجالات التصوير وإنتاج المحتوى البصري والذكاء الاصطناعي',
        'Expanded into photography, visual content production, and AI'
      ),
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
    },
    { 
      year: '2025', 
      title: t('التميز والاحتراف', 'Excellence and Professionalism'),
      description: t(
        'تطوير نظام IntelliPath كمشروع تخرج وتحقيق نجاحات ملموسة',
        'Developing IntelliPath as a graduation project and achieving tangible successes'
      ),
      icon: Trophy,
      color: 'from-yellow-500 to-amber-500',
    },
  ];

  // Contact Info
  const contact = {
    whatsapp: '+963940843133',
    email: 'TAREQ.SYRIA2002@gmail.com',
    instagram_personal: '@tareq_mhysen',
    instagram_photography: '@tareq_mhysen_photography',
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 py-8 space-y-16 relative z-10">
          {/* Hero Section */}
          <motion.section 
            ref={heroRef}
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center py-16"
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-teal-500 bg-clip-text text-transparent mb-4"
              initial={{ scale: 0.9 }}
              animate={heroInView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t('طارق محيسن', 'Tareq Mhysen')}
            </motion.h1>
            
            <motion.p 
              className="text-2xl text-primary font-semibold mb-2"
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
            >
              {t('مطور نظام IntelliPath', 'IntelliPath System Developer')}
            </motion.p>
            
            <motion.p 
              className="text-lg text-muted-foreground mb-2"
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              {t('بكالوريوس في الذكاء الاصطناعي وعلوم البيانات', "Bachelor's in AI and Data Science")}
            </motion.p>
            
            <motion.div 
              className="flex items-center justify-center gap-2 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
            >
              <GraduationCap className="w-5 h-5" />
              <span>{t('من الجامعة السورية الخاصة SPU', 'From Syrian Private University SPU')}</span>
            </motion.div>
            
            <motion.p 
              className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.7 }}
            >
              {t(
                'شغوف بالتكنولوجيا والابتكار، أجمع بين رؤى علم البيانات والذكاء الاصطناعي لتحويل الأفكار المبتكرة إلى واقع ملموس ونجاحات قابلة للقياس.',
                'Passionate about technology and innovation, I combine data science and AI insights to turn innovative ideas into tangible reality and measurable successes.'
              )}
            </motion.p>
          </motion.section>

          {/* About IntelliPath System */}
          <motion.section
            ref={systemRef}
            initial={{ opacity: 0, y: 30 }}
            animate={systemInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{t('عن نظام IntelliPath', 'About IntelliPath System')}</h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                {t(
                  'نظام ذكي شامل لتوجيه الطلاب أكاديمياً باستخدام أحدث تقنيات الذكاء الاصطناعي',
                  'A comprehensive intelligent system for academic guidance using the latest AI technologies'
                )}
              </p>
            </div>

            {/* Vision, Mission & Goals */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Eye, title: t('الرؤية', 'Vision'), text: t('أن نكون النظام الرائد في توجيه الطلاب أكاديمياً باستخدام الذكاء الاصطناعي والتقنيات الحديثة لتحقيق أفضل النتائج التعليمية.', 'To be the leading system in academic guidance using AI and modern technologies.'), gradient: 'from-blue-500 to-cyan-500' },
                { icon: Target, title: t('الرسالة', 'Mission'), text: t('تزويد الطلاب بأدوات ذكية ومعلومات دقيقة لمساعدتهم على اتخاذ قرارات أكاديمية مدروسة.', 'Providing students with smart tools and accurate information.'), gradient: 'from-purple-500 to-pink-500' },
                { icon: CheckCircle2, title: t('الأهداف', 'Goals'), text: t('تحسين تجربة الطالب الأكاديمية، تقليل معدلات الرسوب، وتمكين الطلاب من اتخاذ قرارات مستنيرة.', 'Improve academic experience, reduce failure rates, empower students.'), gradient: 'from-green-500 to-emerald-500' },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={systemInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-primary/10">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${item.gradient} flex items-center justify-center`}>
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* System Features */}
          <motion.section
            ref={featuresRef}
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{t('ميزات نظام IntelliPath', 'IntelliPath System Features')}</h2>
              <p className="text-muted-foreground">
                {t(
                  'مجموعة شاملة من الأدوات الذكية للطلاب والمرشدين والمسؤولين',
                  'A comprehensive set of smart tools for students, advisors, and administrators'
                )}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 border-primary/10 group">
                      <CardContent className="p-4">
                        <div className={`w-12 h-12 mb-3 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-muted-foreground text-xs">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Technology Stack */}
          <motion.section
            ref={techRef}
            initial={{ opacity: 0, y: 30 }}
            animate={techInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{t('التقنيات المستخدمة', 'Technologies Used')}</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Frontend */}
              <Card className="border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{t('الواجهة الأمامية', 'Frontend')}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {frontendTech.map((tech) => {
                      const Icon = tech.icon;
                      return (
                        <div key={tech.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Icon className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{tech.name}</p>
                            <p className="text-xs text-muted-foreground">{tech.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Backend */}
              <Card className="border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                      <Server className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{t('الخلفية', 'Backend')}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {backendTech.map((tech) => {
                      const Icon = tech.icon;
                      return (
                        <div key={tech.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Icon className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{tech.name}</p>
                            <p className="text-xs text-muted-foreground">{tech.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Journey Timeline */}
          <motion.section
            ref={journeyRef}
            initial={{ opacity: 0, y: 30 }}
            animate={journeyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{t('رحلتي المهنية', 'My Professional Journey')}</h2>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent hidden md:block" />
              
              <div className="space-y-8">
                {journey.map((item, index) => {
                  const Icon = item.icon;
                  const isEven = index % 2 === 0;
                  
                  return (
                    <motion.div
                      key={item.year}
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      animate={journeyInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: index * 0.2 }}
                      className={`flex items-center gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      <div className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                        <Card className="inline-block border-primary/10 hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className={`flex items-center gap-3 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-2xl font-bold text-primary">{item.year}</span>
                            </div>
                            <h3 className="text-lg font-semibold mt-2">{item.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Center Circle */}
                      <div className="hidden md:flex w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg z-10" />
                      
                      <div className="flex-1 hidden md:block" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* Contact Section */}
          <motion.section
            ref={contactRef}
            initial={{ opacity: 0, y: 30 }}
            animate={contactInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{t('تواصل معي', 'Contact Me')}</h2>
              <p className="text-muted-foreground">
                {t(
                  'نحن هنا لمساعدتك في أي وقت. استخدم نظام الدردشة الذكي أو تواصل معي مباشرة.',
                  "We're here to help you anytime. Use the smart chat system or contact me directly."
                )}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <a href={`https://wa.me/${contact.whatsapp.replace('+', '')}`} target="_blank" rel="noopener noreferrer">
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 border-green-500/20 hover:border-green-500/50 cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{contact.whatsapp}</p>
                  </CardContent>
                </Card>
              </a>
              
              <a href={`mailto:${contact.email}`}>
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 border-blue-500/20 hover:border-blue-500/50 cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <Mail className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className="font-medium">Email</p>
                    <p className="text-xs text-muted-foreground break-all">{contact.email}</p>
                  </CardContent>
                </Card>
              </a>
              
              <a href={`https://instagram.com/${contact.instagram_personal.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 border-pink-500/20 hover:border-pink-500/50 cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <Instagram className="w-8 h-8 mx-auto mb-2 text-pink-500" />
                    <p className="font-medium">Instagram</p>
                    <p className="text-xs text-muted-foreground">{contact.instagram_personal}</p>
                  </CardContent>
                </Card>
              </a>
              
              <a href={`https://instagram.com/${contact.instagram_photography.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 border-purple-500/20 hover:border-purple-500/50 cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <p className="font-medium">{t('التصوير', 'Photography')}</p>
                    <p className="text-xs text-muted-foreground">{contact.instagram_photography}</p>
                  </CardContent>
                </Card>
              </a>
            </div>
          </motion.section>

          {/* Back Button */}
          <div className="text-center pb-8">
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t('العودة للوحة التحكم', 'Back to Dashboard')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
