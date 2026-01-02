import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import {
  FileText, Search, Download, GraduationCap, AlertCircle, Filter,
  TrendingUp, BookOpen, Award, Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AcademicRecord() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const isArabic = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  const texts = {
    title: isArabic ? 'السجل الأكاديمي' : 'Academic Record',
    subtitle: isArabic ? 'عرض جميع مقرراتك ودرجاتك' : 'View all your courses and grades',
    search: isArabic ? 'بحث عن مقرر...' : 'Search course...',
    year: isArabic ? 'السنة الدراسية' : 'Academic Year',
    semester: isArabic ? 'الفصل' : 'Semester',
    allYears: isArabic ? 'كل السنوات' : 'All Years',
    allSemesters: isArabic ? 'كل الفصول' : 'All Semesters',
    courseCode: isArabic ? 'رمز المقرر' : 'Course Code',
    courseName: isArabic ? 'اسم المقرر' : 'Course Name',
    credits: isArabic ? 'الساعات' : 'Credits',
    grade: isArabic ? 'الدرجة' : 'Grade',
    points: isArabic ? 'النقاط' : 'Points',
    exportPDF: isArabic ? 'تصدير PDF' : 'Export PDF',
    noRecords: isArabic ? 'لا توجد سجلات أكاديمية' : 'No academic records found',
    linkFirst: isArabic
      ? 'يرجى ربط حسابك برقمك الجامعي أولاً من صفحة الإعدادات'
      : 'Please link your account to your university ID first in Settings',
    goToSettings: isArabic ? 'الذهاب للإعدادات' : 'Go to Settings',
    totalCredits: isArabic ? 'إجمالي الساعات' : 'Total Credits',
    completedCredits: isArabic ? 'الساعات المنجزة' : 'Completed Credits',
    gpa: isArabic ? 'المعدل التراكمي' : 'GPA',
    coursesCount: isArabic ? 'عدد المقررات' : 'Courses Count',
    loading: isArabic ? 'جاري التحميل...' : 'Loading...',
  };

  // Fetch student data
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student-data', user?.id],
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

  const isLinked = studentData?.student_id && /^\d{5,10}$/.test(studentData.student_id);

  // Fetch academic records
  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['academic-records', studentData?.student_id],
    queryFn: async () => {
      if (!studentData?.student_id) return [];
      const { data, error } = await supabase
        .from('student_academic_records')
        .select('*')
        .eq('student_id', studentData.student_id)
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!isLinked,
  });

  // Extract unique years and semesters
  const { years, semesters } = useMemo(() => {
    if (!records) return { years: [], semesters: [] };
    const uniqueYears = [...new Set(records.map(r => r.academic_year).filter(Boolean))];
    const uniqueSemesters = [...new Set(records.map(r => r.semester).filter(Boolean))];
    return { years: uniqueYears, semesters: uniqueSemesters };
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return records
      .filter(r => r.course_code !== '__SUMMARY__')
      .filter(r => {
        const matchesSearch =
          !searchQuery ||
          r.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.course_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesYear = selectedYear === 'all' || r.academic_year === selectedYear;
        const matchesSemester = selectedSemester === 'all' || r.semester === selectedSemester;
        return matchesSearch && matchesYear && matchesSemester;
      });
  }, [records, searchQuery, selectedYear, selectedSemester]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!filteredRecords.length) return { totalCredits: 0, coursesCount: 0, avgGPA: 0 };
    const totalCredits = filteredRecords.reduce((sum, r) => sum + (r.course_credits || 0), 0);
    const coursesCount = filteredRecords.length;
    const gpaPoints = filteredRecords.filter(r => r.grade_points !== null);
    const avgGPA = gpaPoints.length > 0
      ? gpaPoints.reduce((sum, r) => sum + (r.grade_points || 0), 0) / gpaPoints.length
      : 0;
    return { totalCredits, coursesCount, avgGPA };
  }, [filteredRecords]);

  // Get grade color
  const getGradeColor = (letter: string | null) => {
    if (!letter) return 'secondary';
    const grade = letter.toUpperCase();
    if (grade.startsWith('A')) return 'default';
    if (grade.startsWith('B')) return 'default';
    if (grade.startsWith('C')) return 'secondary';
    if (grade.startsWith('D')) return 'secondary';
    if (grade === 'F') return 'destructive';
    if (grade === 'W') return 'outline';
    return 'secondary';
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text(isArabic ? 'السجل الأكاديمي' : 'Academic Record', 14, 20);
    
    // Student info
    doc.setFontSize(12);
    doc.text(`${isArabic ? 'الرقم الجامعي:' : 'Student ID:'} ${studentData?.student_id}`, 14, 30);
    doc.text(`${isArabic ? 'التاريخ:' : 'Date:'} ${new Date().toLocaleDateString()}`, 14, 36);

    // Table
    autoTable(doc, {
      startY: 45,
      head: [[
        isArabic ? 'رمز المقرر' : 'Code',
        isArabic ? 'اسم المقرر' : 'Course',
        isArabic ? 'الساعات' : 'Credits',
        isArabic ? 'الدرجة' : 'Grade',
        isArabic ? 'النقاط' : 'Points',
        isArabic ? 'الفصل' : 'Semester',
      ]],
      body: filteredRecords.map(r => [
        r.course_code || '-',
        r.course_name || '-',
        r.course_credits?.toString() || '-',
        r.letter_grade || '-',
        r.grade_points?.toFixed(2) || '-',
        `${r.semester} ${r.academic_year}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`${isArabic ? 'إجمالي الساعات:' : 'Total Credits:'} ${stats.totalCredits}`, 14, finalY);
    doc.text(`${isArabic ? 'عدد المقررات:' : 'Courses:'} ${stats.coursesCount}`, 14, finalY + 6);
    doc.text(`${isArabic ? 'متوسط النقاط:' : 'Avg GPA:'} ${stats.avgGPA.toFixed(2)}`, 14, finalY + 12);

    doc.save(`academic-record-${studentData?.student_id}.pdf`);
  };

  const isLoading = studentLoading || recordsLoading;

  if (studentLoading) {
    return (
      <MainLayout>
        <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!isLinked) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto py-16 px-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{texts.noRecords}</AlertTitle>
            <AlertDescription className="mt-2">
              {texts.linkFirst}
              <Button variant="link" className="px-2" onClick={() => window.location.href = '/student-settings'}>
                {texts.goToSettings}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              {texts.title}
            </h1>
            <p className="text-muted-foreground mt-1">{texts.subtitle}</p>
          </div>
          <Button onClick={exportToPDF} disabled={!filteredRecords.length}>
            <Download className="w-4 h-4 me-2" />
            {texts.exportPDF}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.coursesCount}</div>
                  <div className="text-xs text-muted-foreground">{texts.coursesCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Award className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalCredits}</div>
                  <div className="text-xs text-muted-foreground">{texts.totalCredits}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.avgGPA.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{texts.gpa}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{years.length}</div>
                  <div className="text-xs text-muted-foreground">{isArabic ? 'سنوات دراسية' : 'Academic Years'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              {isArabic ? 'تصفية النتائج' : 'Filter Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={texts.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10"
                />
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={texts.allYears} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allYears}</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={texts.allSemesters} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allSemesters}</SelectItem>
                  {semesters.map(sem => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {isArabic ? 'المقررات الدراسية' : 'Course Records'}
            </CardTitle>
            <CardDescription>
              {filteredRecords.length} {isArabic ? 'مقرر' : 'courses'}
              {(selectedYear !== 'all' || selectedSemester !== 'all' || searchQuery) && (
                <span className="text-primary ms-2">({isArabic ? 'مُصفّى' : 'filtered'})</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {texts.noRecords}
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{texts.courseCode}</TableHead>
                      <TableHead>{texts.courseName}</TableHead>
                      <TableHead className="text-center">{texts.credits}</TableHead>
                      <TableHead className="text-center">{texts.grade}</TableHead>
                      <TableHead className="text-center">{texts.points}</TableHead>
                      <TableHead>{texts.semester}</TableHead>
                      <TableHead>{texts.year}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record, idx) => (
                      <TableRow key={record.id || idx}>
                        <TableCell className="font-mono">{record.course_code}</TableCell>
                        <TableCell>{record.course_name}</TableCell>
                        <TableCell className="text-center">{record.course_credits}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getGradeColor(record.letter_grade)}>
                            {record.letter_grade || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {record.grade_points?.toFixed(2) || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.semester}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.academic_year}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
