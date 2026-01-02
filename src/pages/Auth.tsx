import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Loader2, Building2, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';
import { Moon, Sun, Languages } from 'lucide-react';
import { ParticlesBackground, FloatingOrbs, GridPattern } from '@/components/ui/particles-background';

const departments = [
  { value: 'هندسة المعلوماتية', labelAr: 'هندسة المعلوماتية', labelEn: 'Information Engineering' },
  { value: 'هندسة الاتصالات', labelAr: 'هندسة الاتصالات', labelEn: 'Telecom Engineering' },
  { value: 'الهندسة الطبية', labelAr: 'الهندسة الطبية', labelEn: 'Biomedical Engineering' },
  { value: 'هندسة الميكاترونكس', labelAr: 'هندسة الميكاترونكس', labelEn: 'Mechatronics Engineering' },
  { value: 'الهندسة المعمارية', labelAr: 'الهندسة المعمارية', labelEn: 'Architecture Engineering' },
  { value: 'الهندسة المدنية', labelAr: 'الهندسة المدنية', labelEn: 'Civil Engineering' },
  { value: 'هندسة الطاقة', labelAr: 'هندسة الطاقة', labelEn: 'Energy Engineering' },
];

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  studentId: z.string().regex(/^[0-9]{7,10}$/, 'الرقم الجامعي يجب أن يكون 7-10 أرقام'),
  department: z.string().min(1, 'يجب اختيار القسم'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t: translate } = useTranslation();
  const { toggleLanguage, language } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse(loginForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: translate('auth.errors.unauthorized'),
        description: error.message === 'Invalid login credentials' 
          ? t('بيانات الدخول غير صحيحة', 'Invalid login credentials')
          : error.message,
      });
      return;
    }

    toast({
      title: t('مرحباً بك!', 'Welcome!'),
      description: t('تم تسجيل الدخول بنجاح', 'Successfully logged in'),
    });
    
    navigate('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      registerSchema.parse(registerForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: registerForm.fullName,
          student_id: registerForm.studentId,
          department: registerForm.department,
        },
      },
    });

    if (error) {
      setIsLoading(false);
      if (error.message.includes('already registered')) {
        toast({
          variant: 'destructive',
          title: t('خطأ في التسجيل', 'Registration Error'),
          description: t('هذا البريد الإلكتروني مسجل مسبقاً', 'This email is already registered'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('خطأ في التسجيل', 'Registration Error'),
          description: error.message,
        });
      }
      return;
    }

    // Try to auto-link student if user was created
    if (data?.user && registerForm.studentId) {
      try {
        await supabase.functions.invoke('link-student', {
          body: {
            user_id: data.user.id,
            student_id: registerForm.studentId,
            full_name: registerForm.fullName,
          },
        });
        console.log('Student linking attempted for:', registerForm.studentId);
      } catch (linkError) {
        console.error('Error linking student:', linkError);
        // Don't fail registration if linking fails
      }
    }

    setIsLoading(false);

    toast({
      title: t('تم إنشاء الحساب!', 'Account Created!'),
      description: t('مرحباً بك في IntelliPath', 'Welcome to IntelliPath'),
    });
    
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      {/* Animated Background */}
      <FloatingOrbs />
      <ParticlesBackground particleCount={60} />
      <GridPattern />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
            <GraduationCap className="h-7 w-7" />
          </div>
          <span className="text-2xl font-bold text-white">IntelliPath</span>
        </motion.div>
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Languages className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </motion.div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Card with glassmorphism */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 pointer-events-none" />
            
            {/* Animated glow */}
            <motion.div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-indigo-500/30 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-purple-500/30 blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
            />
            
            <div className="relative z-10">
              {/* Title */}
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="mb-2 text-2xl font-bold text-white">
                  {isLogin
                    ? translate('auth.login.title')
                    : translate('auth.register.title')}
                </h1>
                <p className="text-sm text-white/60">
                  {isLogin
                    ? translate('auth.login.subtitle')
                    : translate('auth.register.subtitle')}
                </p>
              </div>

              {/* Toggle */}
              <div className="mb-6 flex rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    isLogin
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {isLogin && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{translate('auth.login.button')}</span>
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    !isLogin
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {!isLogin && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{t('حساب جديد', 'Register')}</span>
                </button>
              </div>

              {/* Forms */}
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80">{translate('auth.login.email')}</Label>
                      <div className="relative group">
                        <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors rtl:left-3 rtl:right-auto" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={translate('auth.login.emailPlaceholder')}
                          className="pr-10 rtl:pl-10 rtl:pr-3 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-400">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/80">{translate('auth.login.password')}</Label>
                      <div className="relative group">
                        <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors rtl:left-3 rtl:right-auto" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={translate('auth.login.passwordPlaceholder')}
                          className="pl-10 pr-10 rtl:pl-10 rtl:pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 rtl:left-auto rtl:right-3"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-400">{errors.password}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin rtl:ml-0 rtl:mr-2" />
                          {translate('auth.login.loading')}
                        </>
                      ) : (
                        translate('auth.login.button')
                      )}
                    </Button>

                    <div className="text-center text-sm text-white/50">
                      <span>{translate('auth.login.noAccount')}</span>{' '}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        {translate('auth.login.createAccount')}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleRegister}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white/80">{translate('auth.register.fullName')}</Label>
                      <div className="relative group">
                        <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors rtl:left-3 rtl:right-auto" />
                        <Input
                          id="fullName"
                          placeholder={translate('auth.register.fullNamePlaceholder')}
                          className="pr-10 rtl:pl-10 rtl:pr-3 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                          value={registerForm.fullName}
                          onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-xs text-red-400">{errors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regEmail" className="text-white/80">{translate('auth.register.email')}</Label>
                      <div className="relative group">
                        <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors rtl:left-3 rtl:right-auto" />
                        <Input
                          id="regEmail"
                          type="email"
                          placeholder={translate('auth.register.emailPlaceholder')}
                          className="pr-10 rtl:pl-10 rtl:pr-3 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-400">{errors.email}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="studentId" className="text-white/80">{translate('auth.register.studentId')}</Label>
                        <Input
                          id="studentId"
                          placeholder={translate('auth.register.studentIdPlaceholder')}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                          value={registerForm.studentId}
                          onChange={(e) => setRegisterForm({ ...registerForm, studentId: e.target.value })}
                        />
                        {errors.studentId && (
                          <p className="text-xs text-red-400">{errors.studentId}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-white/80">{translate('auth.register.department')}</Label>
                        <Select
                          value={registerForm.department}
                          onValueChange={(value) => setRegisterForm({ ...registerForm, department: value })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-indigo-500/50 focus:ring-indigo-500/20 [&>span]:text-white/60">
                            <SelectValue placeholder={translate('auth.register.selectDepartment')} />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10">
                            {departments.map((dept) => (
                              <SelectItem key={dept.value} value={dept.value} className="text-white focus:bg-indigo-500/20">
                                {language === 'ar' ? dept.labelAr : dept.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.department && (
                          <p className="text-xs text-red-400">{errors.department}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regPassword" className="text-white/80">{translate('auth.register.password')}</Label>
                      <div className="relative group">
                        <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors rtl:left-3 rtl:right-auto" />
                        <Input
                          id="regPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={translate('auth.login.passwordPlaceholder')}
                          className="pl-10 pr-10 rtl:pl-10 rtl:pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 rtl:left-auto rtl:right-3"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-400">{errors.password}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white/80">{translate('auth.register.confirmPassword')}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder={t('أعد إدخال كلمة المرور', 'Re-enter password')}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-400">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin rtl:ml-0 rtl:mr-2" />
                          {translate('auth.register.loading')}
                        </>
                      ) : (
                        translate('auth.register.button')
                      )}
                    </Button>

                    <div className="text-center text-sm text-white/50">
                      <span>{translate('auth.register.hasAccount')}</span>{' '}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        {translate('auth.register.loginLink')}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
