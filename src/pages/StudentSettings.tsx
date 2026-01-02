import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock, CheckCircle, AlertCircle, Link2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function StudentSettings() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isArabic = language === 'ar';
  
  const [studentIdInput, setStudentIdInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');

  const texts = {
    title: isArabic ? 'إعدادات الطالب' : 'Student Settings',
    subtitle: isArabic ? 'ربط حسابك برقمك الجامعي' : 'Link your account to your university ID',
    studentIdLabel: isArabic ? 'الرقم الجامعي' : 'University ID',
    studentIdPlaceholder: isArabic ? 'مثال: 4220212' : 'e.g., 4220212',
    fullNameLabel: isArabic ? 'الاسم الكامل' : 'Full Name',
    fullNamePlaceholder: isArabic ? 'اسمك كما هو مسجل في الجامعة' : 'Your name as registered',
    linkButton: isArabic ? 'ربط الحساب' : 'Link Account',
    linking: isArabic ? 'جاري الربط...' : 'Linking...',
    alreadyLinked: isArabic ? 'حسابك مرتبط بالفعل' : 'Your account is already linked',
    linkedTo: isArabic ? 'مرتبط بالرقم الجامعي:' : 'Linked to University ID:',
    notLinked: isArabic ? 'لم يتم ربط حسابك بعد' : 'Your account is not linked yet',
    linkDescription: isArabic 
      ? 'أدخل رقمك الجامعي لربط حسابك بسجلك الأكاديمي. هذا الربط نهائي ولا يمكن تغييره لاحقاً.'
      : 'Enter your university ID to link your account to your academic record. This is permanent and cannot be changed.',
    warningTitle: isArabic ? 'تنبيه مهم' : 'Important Notice',
    warningText: isArabic 
      ? 'الربط نهائي! تأكد من صحة الرقم الجامعي قبل الإرسال. لا يمكنك تغييره بعد الربط.'
      : 'This is permanent! Make sure your university ID is correct before submitting. You cannot change it later.',
    successTitle: isArabic ? 'تم الربط بنجاح' : 'Successfully Linked',
    successText: isArabic ? 'تم ربط حسابك برقمك الجامعي' : 'Your account has been linked to your university ID',
    errorTitle: isArabic ? 'فشل الربط' : 'Linking Failed',
    noRecords: isArabic 
      ? 'لا توجد سجلات أكاديمية مرتبطة حالياً. ستظهر بياناتك هنا بعد استيرادها من قبل الإدارة.'
      : 'No academic records linked yet. Your data will appear here after it\'s imported by the administration.',
    academicRecords: isArabic ? 'السجلات الأكاديمية' : 'Academic Records',
    recordsCount: isArabic ? 'عدد السجلات:' : 'Records count:',
  };

  // Fetch current student data
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch academic records count
  const { data: recordsCount } = useQuery({
    queryKey: ['academic-records-count', studentData?.student_id],
    queryFn: async () => {
      if (!studentData?.student_id) return 0;
      
      const { count, error } = await supabase
        .from('student_academic_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentData.student_id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!studentData?.student_id,
  });

  // Link student mutation
  const linkMutation = useMutation({
    mutationFn: async ({ studentId, fullName }: { studentId: string; fullName: string }) => {
      const { data, error } = await supabase.functions.invoke('link-student', {
        body: { student_id: studentId, full_name: fullName },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast({
        title: texts.successTitle,
        description: texts.successText,
      });
      queryClient.invalidateQueries({ queryKey: ['student-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: texts.errorTitle,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleLink = () => {
    if (!studentIdInput.trim()) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'الرجاء إدخال الرقم الجامعي' : 'Please enter your university ID',
        variant: 'destructive',
      });
      return;
    }

    // Validate format (7 digits)
    if (!/^\d{7}$/.test(studentIdInput.trim())) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'الرقم الجامعي يجب أن يكون 7 أرقام' : 'University ID must be 7 digits',
        variant: 'destructive',
      });
      return;
    }

    linkMutation.mutate({ 
      studentId: studentIdInput.trim(), 
      fullName: fullNameInput.trim() || '' 
    });
  };

  // Check if student_id looks like a real linked ID (not auto-generated)
  const isLinked = studentData?.student_id && /^\d{7}$/.test(studentData.student_id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground mt-2">{texts.subtitle}</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {isArabic ? 'حالة الربط' : 'Link Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLinked ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">{texts.alreadyLinked}</p>
                  <p className="text-sm text-muted-foreground">
                    {texts.linkedTo} <Badge variant="secondary" className="font-mono">{studentData.student_id}</Badge>
                  </p>
                </div>
                <Lock className="h-4 w-4 text-muted-foreground ms-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{texts.warningTitle}</AlertTitle>
                  <AlertDescription>{texts.warningText}</AlertDescription>
                </Alert>

                <p className="text-sm text-muted-foreground">{texts.linkDescription}</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-id">{texts.studentIdLabel}</Label>
                    <Input
                      id="student-id"
                      type="text"
                      placeholder={texts.studentIdPlaceholder}
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, '').slice(0, 7))}
                      className="font-mono text-lg"
                      dir="ltr"
                      maxLength={7}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full-name">{texts.fullNameLabel}</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder={texts.fullNamePlaceholder}
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleLink} 
                    disabled={linkMutation.isPending || !studentIdInput}
                    className="w-full"
                  >
                    {linkMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin me-2" />
                        {texts.linking}
                      </>
                    ) : (
                      texts.linkButton
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Records Status */}
        {isLinked && (
          <Card>
            <CardHeader>
              <CardTitle>{texts.academicRecords}</CardTitle>
              <CardDescription>
                {recordsCount && recordsCount > 0 
                  ? `${texts.recordsCount} ${recordsCount}`
                  : texts.noRecords
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recordsCount && recordsCount > 0 ? (
                <Badge variant="default" className="bg-green-500">
                  {isArabic ? `${recordsCount} سجل أكاديمي` : `${recordsCount} academic records`}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {isArabic ? 'لا توجد سجلات' : 'No records'}
                </Badge>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
