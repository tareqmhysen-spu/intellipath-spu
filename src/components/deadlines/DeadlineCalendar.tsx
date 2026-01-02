import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguageStore } from '@/stores/languageStore';
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Clock, BookOpen } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  getDay,
  isPast
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Deadline {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  due_date: string;
  course?: {
    name: string;
    name_ar: string | null;
    code: string;
  } | null;
}

interface DeadlineCalendarProps {
  deadlines: Deadline[];
  onDateSelect?: (date: Date, deadlines: Deadline[]) => void;
}

export function DeadlineCalendar({ deadlines, onDateSelect }: DeadlineCalendarProps) {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  const locale = isRTL ? ar : enUS;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const startDay = getDay(monthStart);

  // Create padding for days before the first of the month
  const paddingDays = Array(startDay).fill(null);

  const weekDays = isRTL
    ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDeadlinesForDate = (date: Date): Deadline[] => {
    return deadlines.filter(d => isSameDay(new Date(d.due_date), date));
  };

  const handleDateClick = (date: Date) => {
    const dayDeadlines = getDeadlinesForDate(date);
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date, dayDeadlines);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const texts = {
    title: isRTL ? 'تقويم المواعيد' : 'Deadline Calendar',
    today: isRTL ? 'اليوم' : 'Today',
    noDeadlines: isRTL ? 'لا توجد مواعيد' : 'No deadlines',
    deadlinesOn: isRTL ? 'المواعيد في' : 'Deadlines on',
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {texts.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale })}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding for days before month start */}
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}

          {/* Month days */}
          {monthDays.map((day) => {
            const dayDeadlines = getDeadlinesForDate(day);
            const hasDeadlines = dayDeadlines.length > 0;
            const hasOverdue = dayDeadlines.some(d => isPast(new Date(d.due_date)) && !isToday(new Date(d.due_date)));
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square p-1 rounded-lg text-sm relative transition-colors
                  ${isToday(day) ? 'bg-primary text-primary-foreground font-bold' : ''}
                  ${isSelected && !isToday(day) ? 'bg-primary/20 ring-2 ring-primary' : ''}
                  ${!isToday(day) && !isSelected ? 'hover:bg-muted' : ''}
                  ${hasOverdue ? 'text-red-500' : ''}
                `}
              >
                <span className="block">{format(day, 'd')}</span>
                
                {/* Deadline indicators */}
                {hasDeadlines && (
                  <div className="absolute bottom-1 inset-x-0 flex justify-center gap-0.5">
                    {dayDeadlines.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          hasOverdue ? 'bg-red-500' : 'bg-primary'
                        }`}
                      />
                    ))}
                    {dayDeadlines.length > 3 && (
                      <span className="text-[8px] leading-none">+{dayDeadlines.length - 3}</span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Selected date details */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 border-t pt-4"
            >
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                {texts.deadlinesOn} {format(selectedDate, 'PPP', { locale })}
              </h4>
              {getDeadlinesForDate(selectedDate).length === 0 ? (
                <p className="text-sm text-muted-foreground">{texts.noDeadlines}</p>
              ) : (
                <div className="space-y-2">
                  {getDeadlinesForDate(selectedDate).map((deadline) => {
                    const title = isRTL ? (deadline.title_ar || deadline.title) : deadline.title;
                    const isOverdue = isPast(new Date(deadline.due_date)) && !isToday(new Date(deadline.due_date));

                    return (
                      <div
                        key={deadline.id}
                        className={`p-2 rounded-lg border ${
                          isOverdue ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            {isOverdue ? (
                              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{title}</p>
                              {deadline.course && (
                                <Badge variant="outline" className="text-xs mt-1 gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {deadline.course.code}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(deadline.due_date), 'HH:mm', { locale })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
