import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, BookOpen, Settings, Shield, Search, Plus, Edit, Trash2, 
  BarChart3, Activity, Database, Bell, Lock, Globe,
  Download, RefreshCw, CheckCircle, XCircle, AlertTriangle, Send, Upload
} from 'lucide-react';
import { StudentDataImport } from '@/components/admin/StudentDataImport';
import { CourseDataImport } from '@/components/admin/CourseDataImport';
import { AdvisorAssignments } from '@/components/admin/AdvisorAssignments';
import { AcademicRecordsImport } from '@/components/admin/AcademicRecordsImport';
import { useLanguageStore } from '@/stores/languageStore';
import { useAdminUsers, useAdminCourses, useSendNotification } from '@/hooks/useAdminData';
import { toast } from 'sonner';

const Admin = () => {
  const { language, t } = useLanguageStore();
  const isRTL = language === 'ar';
  
  const { users, isLoading: usersLoading, updateUserRole } = useAdminUsers();
  const { courses, isLoading: coursesLoading, addCourse, deleteCourse } = useAdminCourses();
  const { sendNotification, sendBulkNotifications } = useSendNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // New course form state
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    name_ar: '',
    department: '',
    credits: 3,
  });

  // Notification form state
  const [notification, setNotification] = useState({
    title: '',
    title_ar: '',
    message: '',
    message_ar: '',
    type: 'info',
  });

  const stats = [
    { label: 'إجمالي المستخدمين', value: users.length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'المقررات النشطة', value: courses.filter(c => c.is_active).length.toString(), icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'المشرفين', value: users.filter(u => u.role === 'advisor').length.toString(), icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'الطلاب', value: users.filter(u => u.role === 'student').length.toString(), icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.includes(searchQuery) || user.email.includes(searchQuery);
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const styles = {
      student: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      advisor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    const labels = { student: 'طالب', advisor: 'مشرف', admin: 'مدير' };
    return <Badge variant="outline" className={styles[role as keyof typeof styles]}>{labels[role as keyof typeof labels]}</Badge>;
  };

  const handleAddCourse = async () => {
    if (!newCourse.code || !newCourse.name || !newCourse.department) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }
    try {
      await addCourse(newCourse);
      setIsAddCourseOpen(false);
      setNewCourse({ code: '', name: '', name_ar: '', department: '', credits: 3 });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSendNotification = async () => {
    if (!notification.title || !notification.message) {
      toast.error('الرجاء ملء عنوان ورسالة الإشعار');
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast.error('الرجاء اختيار مستخدم واحد على الأقل');
      return;
    }

    try {
      await sendBulkNotifications(selectedUsers, notification);
      setIsNotifyOpen(false);
      setSelectedUsers([]);
      setNotification({ title: '', title_ar: '', message: '', message_ar: '', type: 'info' });
    } catch (error) {
      // Error handled in hook
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.user_id));
    }
  };

  return (
    <MainLayout>
      <div className={`min-h-screen p-4 md:p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('لوحة تحكم المدير', 'Admin Dashboard')}</h1>
              <p className="text-muted-foreground mt-1">{t('إدارة المستخدمين والمقررات وإعدادات النظام', 'Manage users, courses, and system settings')}</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={selectedUsers.length === 0}>
                    <Send className="w-4 h-4 ml-2" />
                    {t('إرسال إشعار', 'Send Notification')} ({selectedUsers.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('إرسال إشعار جماعي', 'Send Bulk Notification')}</DialogTitle>
                    <DialogDescription>{t('سيتم إرسال الإشعار للمستخدمين المحددين', 'Notification will be sent to selected users')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t('العنوان (عربي)', 'Title (Arabic)')}</Label>
                      <Input 
                        value={notification.title_ar}
                        onChange={(e) => setNotification(prev => ({ ...prev, title_ar: e.target.value, title: e.target.value }))}
                        placeholder="عنوان الإشعار"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('الرسالة (عربي)', 'Message (Arabic)')}</Label>
                      <Input 
                        value={notification.message_ar}
                        onChange={(e) => setNotification(prev => ({ ...prev, message_ar: e.target.value, message: e.target.value }))}
                        placeholder="نص الإشعار"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('النوع', 'Type')}</Label>
                      <Select value={notification.type} onValueChange={(v) => setNotification(prev => ({ ...prev, type: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">{t('معلومات', 'Info')}</SelectItem>
                          <SelectItem value="warning">{t('تحذير', 'Warning')}</SelectItem>
                          <SelectItem value="success">{t('نجاح', 'Success')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNotifyOpen(false)}>{t('إلغاء', 'Cancel')}</Button>
                    <Button onClick={handleSendNotification}>
                      <Send className="w-4 h-4 ml-2" />
                      {t('إرسال', 'Send')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('المستخدمين', 'Users')}
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t('المقررات', 'Courses')}
              </TabsTrigger>
              <TabsTrigger value="import-students" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t('استيراد الطلاب', 'Import Students')}
              </TabsTrigger>
              <TabsTrigger value="import-records" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                {t('السجلات الأكاديمية', 'Academic Records')}
              </TabsTrigger>
              <TabsTrigger value="import-courses" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t('استيراد المقررات', 'Import Courses')}
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t('تعيينات المشرفين', 'Advisor Assignments')}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t('الإعدادات', 'Settings')}
              </TabsTrigger>
            </TabsList>

            {/* Import Students Tab */}
            <TabsContent value="import-students">
              <StudentDataImport />
            </TabsContent>

            {/* Import Academic Records Tab */}
            <TabsContent value="import-records">
              <AcademicRecordsImport />
            </TabsContent>

            {/* Import Courses Tab */}
            <TabsContent value="import-courses">
              <CourseDataImport />
            </TabsContent>

            {/* Advisor Assignments Tab */}
            <TabsContent value="assignments">
              <AdvisorAssignments />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle>{t('إدارة المستخدمين', 'User Management')}</CardTitle>
                      <CardDescription>{t('عرض وإدارة جميع مستخدمي النظام', 'View and manage all system users')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={t('البحث عن مستخدم...', 'Search users...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue placeholder={t('الدور', 'Role')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('الكل', 'All')}</SelectItem>
                        <SelectItem value="student">{t('طلاب', 'Students')}</SelectItem>
                        <SelectItem value="advisor">{t('مشرفين', 'Advisors')}</SelectItem>
                        <SelectItem value="admin">{t('مدراء', 'Admins')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={selectAllUsers}>
                      {selectedUsers.length === filteredUsers.length ? t('إلغاء التحديد', 'Deselect All') : t('تحديد الكل', 'Select All')}
                    </Button>
                  </div>

                  {/* Users Table */}
                  {usersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-right w-10"></TableHead>
                            <TableHead className="text-right">{t('المستخدم', 'User')}</TableHead>
                            <TableHead className="text-right">{t('الدور', 'Role')}</TableHead>
                            <TableHead className="text-right">{t('القسم', 'Department')}</TableHead>
                            <TableHead className="text-right">{t('الإجراءات', 'Actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/30">
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.user_id)}
                                  onChange={() => toggleUserSelection(user.user_id)}
                                  className="rounded border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-foreground">{user.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>{getRoleBadge(user.role)}</TableCell>
                              <TableCell className="text-muted-foreground">{user.department || '-'}</TableCell>
                              <TableCell>
                                <Select 
                                  value={user.role} 
                                  onValueChange={(value) => updateUserRole(user.user_id, value as 'student' | 'advisor' | 'admin')}
                                >
                                  <SelectTrigger className="w-28 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="student">{t('طالب', 'Student')}</SelectItem>
                                    <SelectItem value="advisor">{t('مشرف', 'Advisor')}</SelectItem>
                                    <SelectItem value="admin">{t('مدير', 'Admin')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle>{t('إدارة المقررات', 'Course Management')}</CardTitle>
                      <CardDescription>{t('عرض وإدارة جميع المقررات الدراسية', 'View and manage all courses')}</CardDescription>
                    </div>
                    <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 ml-2" />
                          {t('إضافة مقرر', 'Add Course')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('إضافة مقرر جديد', 'Add New Course')}</DialogTitle>
                          <DialogDescription>{t('أدخل بيانات المقرر الجديد', 'Enter new course details')}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('رمز المقرر', 'Course Code')}</Label>
                              <Input 
                                placeholder="CS101"
                                value={newCourse.code}
                                onChange={(e) => setNewCourse(prev => ({ ...prev, code: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('عدد الساعات', 'Credits')}</Label>
                              <Input 
                                type="number" 
                                placeholder="3"
                                value={newCourse.credits}
                                onChange={(e) => setNewCourse(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>{t('اسم المقرر (إنجليزي)', 'Course Name (English)')}</Label>
                            <Input 
                              placeholder="Introduction to Programming"
                              value={newCourse.name}
                              onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('اسم المقرر (عربي)', 'Course Name (Arabic)')}</Label>
                            <Input 
                              placeholder="مقدمة في البرمجة"
                              value={newCourse.name_ar}
                              onChange={(e) => setNewCourse(prev => ({ ...prev, name_ar: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('القسم', 'Department')}</Label>
                            <Select value={newCourse.department} onValueChange={(v) => setNewCourse(prev => ({ ...prev, department: v }))}>
                              <SelectTrigger>
                                <SelectValue placeholder={t('اختر القسم', 'Select Department')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="هندسة المعلوماتية">هندسة المعلوماتية</SelectItem>
                                <SelectItem value="هندسة الاتصالات">هندسة الاتصالات</SelectItem>
                                <SelectItem value="هندسة العمارة">هندسة العمارة</SelectItem>
                                <SelectItem value="هندسة الميكاترونيكس">هندسة الميكاترونيكس</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddCourseOpen(false)}>{t('إلغاء', 'Cancel')}</Button>
                          <Button onClick={handleAddCourse}>
                            {t('إضافة', 'Add')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {coursesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-right">{t('رمز المقرر', 'Code')}</TableHead>
                            <TableHead className="text-right">{t('اسم المقرر', 'Name')}</TableHead>
                            <TableHead className="text-right">{t('القسم', 'Department')}</TableHead>
                            <TableHead className="text-right">{t('الساعات', 'Credits')}</TableHead>
                            <TableHead className="text-right">{t('الحالة', 'Status')}</TableHead>
                            <TableHead className="text-right">{t('الإجراءات', 'Actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courses.map((course) => (
                            <TableRow key={course.id} className="hover:bg-muted/30">
                              <TableCell className="font-mono font-medium">{course.code}</TableCell>
                              <TableCell className="font-medium text-foreground">
                                {isRTL && course.name_ar ? course.name_ar : course.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{course.department}</TableCell>
                              <TableCell>{course.credits}</TableCell>
                              <TableCell>
                                {course.is_active ? (
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                    <CheckCircle className="w-3 h-3 ml-1" />{t('نشط', 'Active')}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                    <XCircle className="w-3 h-3 ml-1" />{t('غير نشط', 'Inactive')}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                  onClick={() => deleteCourse(course.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {courses.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                {t('لا توجد مقررات', 'No courses found')}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      {t('إعدادات عامة', 'General Settings')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('اسم الموقع', 'Site Name')}</Label>
                      <Input defaultValue="IntelliPath" className="w-32" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t('اللغة الافتراضية', 'Default Language')}</Label>
                      <Select defaultValue="ar">
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">عربي</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t('وضع الصيانة', 'Maintenance Mode')}</Label>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-red-500" />
                      {t('إعدادات الأمان', 'Security Settings')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('المصادقة الثنائية', 'Two-Factor Auth')}</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t('مهلة الجلسة (دقائق)', 'Session Timeout')}</Label>
                      <Input type="number" defaultValue="30" className="w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t('محاولات تسجيل الدخول', 'Login Attempts')}</Label>
                      <Input type="number" defaultValue="5" className="w-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-yellow-500" />
                      {t('إعدادات الإشعارات', 'Notification Settings')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('إشعارات البريد', 'Email Notifications')}</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t('الإشعارات الفورية', 'Push Notifications')}</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t('التقارير الأسبوعية', 'Weekly Reports')}</Label>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => toast.success(t('تم حفظ الإعدادات بنجاح', 'Settings saved successfully'))}>
                  {t('حفظ الإعدادات', 'Save Settings')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Admin;
