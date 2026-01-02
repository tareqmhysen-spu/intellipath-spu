import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAcademicRecord } from '@/hooks/useAcademicRecord';
import { User, Settings, Bell, Shield, Palette, Globe, Save, Camera, GraduationCap, BookOpen, Award, Lock } from 'lucide-react';

export default function Profile() {
  const { language, setLanguage } = useLanguageStore();
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = language === 'ar';

  // Get academic record data
  const { studentId, summary, hasAcademicRecord, isLoading: academicLoading } = useAcademicRecord();

  const [formData, setFormData] = useState({
    full_name: '',
    full_name_ar: '',
    phone: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          full_name_ar: data.full_name_ar || '',
          phone: data.phone || '',
        });
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: isRTL ? 'تم الحفظ' : 'Saved',
        description: isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully',
      });
    },
    onError: () => {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  const texts = {
    title: isRTL ? 'الملف الشخصي' : 'Profile',
    subtitle: isRTL ? 'إدارة معلوماتك الشخصية والإعدادات' : 'Manage your personal information and settings',
    profile: isRTL ? 'الملف الشخصي' : 'Profile',
    settings: isRTL ? 'الإعدادات' : 'Settings',
    notifications: isRTL ? 'الإشعارات' : 'Notifications',
    security: isRTL ? 'الأمان' : 'Security',
    fullName: isRTL ? 'الاسم الكامل' : 'Full Name',
    fullNameAr: isRTL ? 'الاسم بالعربية' : 'Name in Arabic',
    email: isRTL ? 'البريد الإلكتروني' : 'Email',
    phone: isRTL ? 'رقم الهاتف' : 'Phone Number',
    save: isRTL ? 'حفظ التغييرات' : 'Save Changes',
    appearance: isRTL ? 'المظهر' : 'Appearance',
    language: isRTL ? 'اللغة' : 'Language',
    theme: isRTL ? 'السمة' : 'Theme',
    light: isRTL ? 'فاتح' : 'Light',
    dark: isRTL ? 'داكن' : 'Dark',
    system: isRTL ? 'النظام' : 'System',
    arabic: 'العربية',
    english: 'English',
    emailNotifications: isRTL ? 'إشعارات البريد' : 'Email Notifications',
    pushNotifications: isRTL ? 'الإشعارات الفورية' : 'Push Notifications',
    weeklyReport: isRTL ? 'التقرير الأسبوعي' : 'Weekly Report',
    courseUpdates: isRTL ? 'تحديثات المقررات' : 'Course Updates',
    changePassword: isRTL ? 'تغيير كلمة المرور' : 'Change Password',
    twoFactor: isRTL ? 'المصادقة الثنائية' : 'Two-Factor Authentication',
    sessions: isRTL ? 'الجلسات النشطة' : 'Active Sessions',
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button size="icon" variant="secondary" className="absolute -bottom-1 -end-1 h-8 w-8 rounded-full">
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.full_name || user?.email}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{texts.profile}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">{texts.settings}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{texts.notifications}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{texts.security}</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Academic Identity Card - Student ID */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {isRTL ? 'الهوية الأكاديمية' : 'Academic Identity'}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'الرقم الجامعي الخاص بك - لا يمكن تغييره' : 'Your university ID - cannot be changed'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Student ID - Read Only */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    {isRTL ? 'الرقم الجامعي' : 'University ID'}
                  </Label>
                  <div className="relative">
                    <Input
                      value={studentId || ''}
                      disabled
                      className="bg-muted font-mono text-lg font-bold tracking-wider"
                    />
                    <Badge className="absolute end-2 top-1/2 -translate-y-1/2 bg-primary/10 text-primary">
                      {isRTL ? 'ثابت' : 'Fixed'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRTL 
                      ? 'تم تحديد الرقم الجامعي عند إنشاء الحساب ولا يمكن تغييره'
                      : 'University ID was set during registration and cannot be changed'}
                  </p>
                </div>

                {/* Academic Summary if has records */}
                {hasAcademicRecord && summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{isRTL ? 'الكلية' : 'College'}</p>
                      <p className="font-semibold text-sm">{summary.college}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{isRTL ? 'التخصص' : 'Major'}</p>
                      <p className="font-semibold text-sm truncate" title={summary.major}>{summary.major}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{isRTL ? 'المعدل التراكمي' : 'GPA'}</p>
                      <p className="font-bold text-lg text-primary">{summary.cumulativeGPA.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{isRTL ? 'الساعات المنجزة' : 'Credits'}</p>
                      <p className="font-bold text-lg">{summary.totalCompletedHours} / 173</p>
                    </div>
                  </div>
                )}

                {/* Progress to Graduation */}
                {hasAcademicRecord && summary && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        {isRTL ? 'التقدم نحو التخرج' : 'Progress to Graduation'}
                      </span>
                      <span className="font-bold">{summary.progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={summary.progressPercentage} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{isRTL ? 'ساعات متبقية:' : 'Remaining:'} {summary.remainingHours}</span>
                      <span>
                        {summary.isGraduationEligible 
                          ? (isRTL ? '✅ مؤهل للتخرج' : '✅ Eligible for Graduation')
                          : (isRTL ? `⚠️ تحتاج معدل ≥ 2.0 و ${summary.remainingHours} ساعة` : `⚠️ Need GPA ≥ 2.0 & ${summary.remainingHours} more credits`)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>{texts.profile}</CardTitle>
                <CardDescription>
                  {isRTL ? 'تحديث معلوماتك الشخصية' : 'Update your personal information'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{texts.fullName}</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name_ar">{texts.fullNameAr}</Label>
                    <Input
                      id="full_name_ar"
                      value={formData.full_name_ar}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name_ar: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{texts.email}</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{texts.phone}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+966 5XX XXX XXXX"
                  />
                </div>
                <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {texts.save}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{texts.appearance}</CardTitle>
                <CardDescription>
                  {isRTL ? 'تخصيص مظهر التطبيق' : 'Customize the app appearance'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{texts.language}</p>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'اختر لغة العرض' : 'Choose display language'}
                      </p>
                    </div>
                  </div>
                  <Select value={language} onValueChange={(v: 'ar' | 'en') => setLanguage(v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">{texts.arabic}</SelectItem>
                      <SelectItem value="en">{texts.english}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{texts.theme}</p>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'اختر سمة الألوان' : 'Choose color theme'}
                      </p>
                    </div>
                  </div>
                  <Select value={theme} onValueChange={(v: 'light' | 'dark') => setTheme(v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{texts.light}</SelectItem>
                      <SelectItem value="dark">{texts.dark}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{texts.notifications}</CardTitle>
                <CardDescription>
                  {isRTL ? 'إدارة تفضيلات الإشعارات' : 'Manage notification preferences'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'email', label: texts.emailNotifications },
                  { key: 'push', label: texts.pushNotifications },
                  { key: 'weekly', label: texts.weeklyReport },
                  { key: 'courses', label: texts.courseUpdates },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.label}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{texts.security}</CardTitle>
                <CardDescription>
                  {isRTL ? 'إدارة إعدادات الأمان' : 'Manage security settings'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{texts.changePassword}</p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'تحديث كلمة المرور الخاصة بك' : 'Update your password'}
                    </p>
                  </div>
                  <Button variant="outline">{isRTL ? 'تغيير' : 'Change'}</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{texts.twoFactor}</p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'إضافة طبقة أمان إضافية' : 'Add an extra layer of security'}
                    </p>
                  </div>
                  <Button variant="outline">{isRTL ? 'تفعيل' : 'Enable'}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
