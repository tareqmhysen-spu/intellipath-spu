import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguageStore } from '@/stores/languageStore';
import { useDeadlines } from '@/hooks/useDeadlines';
import { useToast } from '@/hooks/use-toast';
import { DeadlineCalendar } from '@/components/deadlines/DeadlineCalendar';
import { 
  Calendar, Plus, Clock, AlertTriangle, CheckCircle2, Trash2,
  CalendarDays, BookOpen, List
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function Deadlines() {
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const { 
    deadlines, 
    upcomingDeadlines, 
    overdueDeadlines, 
    isLoading, 
    addDeadline, 
    completeDeadline, 
    deleteDeadline 
  } = useDeadlines();
  const isRTL = language === 'ar';

  const [showAdd, setShowAdd] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    title_ar: '',
    description: '',
    due_date: '',
    reminder_days: '3'
  });

  const handleAdd = async () => {
    if (!newDeadline.title.trim() || !newDeadline.due_date) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      await addDeadline.mutateAsync({
        title: newDeadline.title,
        title_ar: newDeadline.title_ar || undefined,
        description: newDeadline.description || undefined,
        due_date: newDeadline.due_date,
        reminder_days: parseInt(newDeadline.reminder_days)
      });
      toast({
        title: isRTL ? 'تمت الإضافة' : 'Added',
        description: isRTL ? 'تمت إضافة الموعد النهائي' : 'Deadline added successfully'
      });
      setShowAdd(false);
      setNewDeadline({ title: '', title_ar: '', description: '', due_date: '', reminder_days: '3' });
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل في إضافة الموعد' : 'Failed to add deadline',
        variant: 'destructive'
      });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeDeadline.mutateAsync(id);
      toast({
        title: isRTL ? 'تم الإنجاز' : 'Completed',
        description: isRTL ? 'تم تحديد الموعد كمنجز' : 'Deadline marked as complete'
      });
    } catch (error) {
      toast({ title: isRTL ? 'خطأ' : 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDeadline.mutateAsync(id);
      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف الموعد النهائي' : 'Deadline deleted'
      });
    } catch (error) {
      toast({ title: isRTL ? 'خطأ' : 'Error', variant: 'destructive' });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: isRTL ? ar : enUS });
  };

  const getDaysRemaining = (dateString: string) => {
    const days = differenceInDays(new Date(dateString), new Date());
    if (days < 0) return isRTL ? `متأخر ${Math.abs(days)} يوم` : `${Math.abs(days)} days overdue`;
    if (days === 0) return isRTL ? 'اليوم!' : 'Today!';
    if (days === 1) return isRTL ? 'غداً' : 'Tomorrow';
    return isRTL ? `${days} يوم متبقي` : `${days} days left`;
  };

  const getDeadlineStatus = (dateString: string) => {
    const days = differenceInDays(new Date(dateString), new Date());
    if (days < 0) return 'overdue';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'upcoming';
    return 'normal';
  };

  const texts = {
    title: isRTL ? 'المواعيد النهائية' : 'Deadlines',
    subtitle: isRTL ? 'إدارة مواعيدك النهائية والتذكيرات' : 'Manage your deadlines and reminders',
    addNew: isRTL ? 'إضافة موعد' : 'Add Deadline',
    titleLabel: isRTL ? 'العنوان (English)' : 'Title',
    titleArLabel: isRTL ? 'العنوان (عربي)' : 'Title (Arabic)',
    description: isRTL ? 'الوصف' : 'Description',
    dueDate: isRTL ? 'تاريخ الاستحقاق' : 'Due Date',
    reminderDays: isRTL ? 'التذكير قبل (أيام)' : 'Remind before (days)',
    add: isRTL ? 'إضافة' : 'Add',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    noDeadlines: isRTL ? 'لا توجد مواعيد نهائية' : 'No deadlines',
    overdue: isRTL ? 'متأخرة' : 'Overdue',
    upcoming: isRTL ? 'قادمة' : 'Upcoming',
    all: isRTL ? 'جميع المواعيد' : 'All Deadlines',
    listView: isRTL ? 'قائمة' : 'List',
    calendarView: isRTL ? 'تقويم' : 'Calendar',
  };

  const statusConfig = {
    overdue: { badge: 'destructive', icon: AlertTriangle, color: 'text-red-500' },
    urgent: { badge: 'destructive', icon: Clock, color: 'text-orange-500' },
    upcoming: { badge: 'secondary', icon: Calendar, color: 'text-yellow-500' },
    normal: { badge: 'outline', icon: CalendarDays, color: 'text-muted-foreground' }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-primary" />
              {texts.title}
            </h1>
            <p className="text-muted-foreground">{texts.subtitle}</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {texts.addNew}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{texts.addNew}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{texts.titleLabel} *</label>
                  <Input
                    value={newDeadline.title}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Assignment submission..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{texts.titleArLabel}</label>
                  <Input
                    value={newDeadline.title_ar}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, title_ar: e.target.value }))}
                    placeholder="تسليم الواجب..."
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{texts.description}</label>
                  <Textarea
                    value={newDeadline.description}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{texts.dueDate} *</label>
                    <Input
                      type="datetime-local"
                      value={newDeadline.due_date}
                      onChange={(e) => setNewDeadline(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{texts.reminderDays}</label>
                    <Select 
                      value={newDeadline.reminder_days} 
                      onValueChange={(v) => setNewDeadline(prev => ({ ...prev, reminder_days: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>{texts.cancel}</Button>
                  <Button onClick={handleAdd} disabled={addDeadline.isPending} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {texts.add}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{overdueDeadlines.length}</p>
                <p className="text-xs text-muted-foreground">{texts.overdue}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{upcomingDeadlines.length}</p>
                <p className="text-xs text-muted-foreground">{texts.upcoming}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deadlines.length}</p>
                <p className="text-xs text-muted-foreground">{texts.all}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for List/Calendar View */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              {texts.listView}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              {texts.calendarView}
            </TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list" className="space-y-3">
            {isLoading ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : deadlines.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {texts.noDeadlines}
                </CardContent>
              </Card>
            ) : (
              deadlines.map((deadline) => {
                const status = getDeadlineStatus(deadline.due_date);
                const config = statusConfig[status as keyof typeof statusConfig];
                const StatusIcon = config.icon;
                const title = isRTL ? (deadline.title_ar || deadline.title) : deadline.title;

                return (
                  <motion.div
                    key={deadline.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`transition-all ${status === 'overdue' ? 'border-red-300 dark:border-red-800' : status === 'urgent' ? 'border-orange-300 dark:border-orange-800' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                              <StatusIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium">{title}</h3>
                                <Badge variant={config.badge as any}>{getDaysRemaining(deadline.due_date)}</Badge>
                                {deadline.course && (
                                  <Badge variant="outline" className="gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {deadline.course.code}
                                  </Badge>
                                )}
                              </div>
                              {deadline.description && (
                                <p className="text-sm text-muted-foreground mt-1">{deadline.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(deadline.due_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-100"
                              onClick={() => handleComplete(deadline.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={() => handleDelete(deadline.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <DeadlineCalendar deadlines={deadlines} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
