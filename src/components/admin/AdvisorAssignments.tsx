import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Trash2, UserCheck, Users, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguageStore } from '@/stores/languageStore';
import { toast } from 'sonner';

interface Advisor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface Student {
  id: string;
  student_id: string;
  user_id: string;
  full_name: string;
  department: string;
  gpa: number | null;
}

interface Assignment {
  id: string;
  advisor_id: string;
  student_id: string;
  assigned_at: string;
  advisor_name?: string;
  student_name?: string;
  student_code?: string;
}

export const AdvisorAssignments = () => {
  const { t } = useLanguageStore();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ advisor_id: '', student_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch advisors (users with advisor role)
      const { data: advisorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'advisor');

      if (advisorRoles && advisorRoles.length > 0) {
        const advisorIds = advisorRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, email')
          .in('user_id', advisorIds);
        
        setAdvisors(profiles || []);
      }

      // Fetch all students with their profiles
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, student_id, user_id, department, gpa');

      if (studentsData && studentsData.length > 0) {
        const userIds = studentsData.map(s => s.user_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        setStudents(studentsData.map(s => ({
          ...s,
          full_name: profileMap.get(s.user_id) || s.student_id
        })));
      }

      // Fetch existing assignments
      const { data: assignmentsData } = await supabase
        .from('advisor_student_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (assignmentsData) {
        // Get advisor and student names
        const advisorIds = [...new Set(assignmentsData.map(a => a.advisor_id))];
        const studentIds = [...new Set(assignmentsData.map(a => a.student_id))];

        const { data: advisorProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', advisorIds);

        const { data: studentRecords } = await supabase
          .from('students')
          .select('id, student_id, user_id')
          .in('id', studentIds);

        const studentUserIds = studentRecords?.map(s => s.user_id).filter(Boolean) || [];
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', studentUserIds);

        const advisorMap = new Map(advisorProfiles?.map(p => [p.user_id, p.full_name]) || []);
        const studentUserMap = new Map(studentRecords?.map(s => [s.id, s.user_id]) || []);
        const studentCodeMap = new Map(studentRecords?.map(s => [s.id, s.student_id]) || []);
        const profileMap = new Map(studentProfiles?.map(p => [p.user_id, p.full_name]) || []);

        setAssignments(assignmentsData.map(a => ({
          ...a,
          advisor_name: advisorMap.get(a.advisor_id) || 'Unknown',
          student_name: profileMap.get(studentUserMap.get(a.student_id) || '') || 'Unknown',
          student_code: studentCodeMap.get(a.student_id) || ''
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('خطأ في تحميل البيانات', 'Error loading data'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.advisor_id || !newAssignment.student_id) {
      toast.error(t('الرجاء اختيار المشرف والطالب', 'Please select both advisor and student'));
      return;
    }

    try {
      const { error } = await supabase
        .from('advisor_student_assignments')
        .insert({
          advisor_id: newAssignment.advisor_id,
          student_id: newAssignment.student_id
        });

      if (error) throw error;

      toast.success(t('تم إنشاء التعيين بنجاح', 'Assignment created successfully'));
      setIsDialogOpen(false);
      setNewAssignment({ advisor_id: '', student_id: '' });
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error(t('هذا التعيين موجود مسبقاً', 'This assignment already exists'));
      } else {
        toast.error(t('خطأ في إنشاء التعيين', 'Error creating assignment'));
      }
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('advisor_student_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(t('تم حذف التعيين', 'Assignment deleted'));
      fetchData();
    } catch (error) {
      toast.error(t('خطأ في حذف التعيين', 'Error deleting assignment'));
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = 
      a.advisor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student_code?.includes(searchQuery);
    const matchesAdvisor = selectedAdvisor === 'all' || a.advisor_id === selectedAdvisor;
    return matchesSearch && matchesAdvisor;
  });

  const unassignedStudents = students.filter(
    s => !assignments.some(a => a.student_id === s.id)
  );

  const stats = [
    { label: t('إجمالي التعيينات', 'Total Assignments'), value: assignments.length, icon: Link2, color: 'text-primary' },
    { label: t('المشرفين النشطين', 'Active Advisors'), value: advisors.length, icon: UserCheck, color: 'text-green-500' },
    { label: t('طلاب بدون مشرف', 'Unassigned Students'), value: unassignedStudents.length, icon: Users, color: 'text-orange-500' },
  ];

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                {t('تعيينات المشرفين', 'Advisor Assignments')}
              </CardTitle>
              <CardDescription>
                {t('إدارة ربط الطلاب بالمشرفين الأكاديميين', 'Manage student-advisor relationships')}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  {t('تعيين جديد', 'New Assignment')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('تعيين مشرف لطالب', 'Assign Advisor to Student')}</DialogTitle>
                  <DialogDescription>
                    {t('اختر المشرف والطالب لإنشاء علاقة إشرافية', 'Select advisor and student to create supervisory relationship')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('المشرف', 'Advisor')}</label>
                    <Select value={newAssignment.advisor_id} onValueChange={(v) => setNewAssignment(prev => ({ ...prev, advisor_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('اختر مشرفاً', 'Select advisor')} />
                      </SelectTrigger>
                      <SelectContent>
                        {advisors.map(advisor => (
                          <SelectItem key={advisor.user_id} value={advisor.user_id}>
                            {advisor.full_name} ({advisor.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('الطالب', 'Student')}</label>
                    <Select value={newAssignment.student_id} onValueChange={(v) => setNewAssignment(prev => ({ ...prev, student_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('اختر طالباً', 'Select student')} />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedStudents.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.full_name} ({student.student_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {unassignedStudents.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('جميع الطلاب لديهم مشرفين', 'All students have advisors assigned')}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('إلغاء', 'Cancel')}
                  </Button>
                  <Button onClick={handleCreateAssignment}>
                    <UserCheck className="w-4 h-4 ml-2" />
                    {t('إنشاء التعيين', 'Create Assignment')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('البحث عن مشرف أو طالب...', 'Search advisor or student...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('جميع المشرفين', 'All Advisors')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('جميع المشرفين', 'All Advisors')}</SelectItem>
                {advisors.map(advisor => (
                  <SelectItem key={advisor.user_id} value={advisor.user_id}>
                    {advisor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignments Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">{t('المشرف', 'Advisor')}</TableHead>
                  <TableHead className="text-right">{t('الطالب', 'Student')}</TableHead>
                  <TableHead className="text-right">{t('رقم الطالب', 'Student ID')}</TableHead>
                  <TableHead className="text-right">{t('تاريخ التعيين', 'Assigned Date')}</TableHead>
                  <TableHead className="text-right">{t('الإجراءات', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('لا توجد تعيينات', 'No assignments found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                          {assignment.advisor_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{assignment.student_name}</TableCell>
                      <TableCell className="text-muted-foreground">{assignment.student_code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(assignment.assigned_at).toLocaleDateString('ar-SY')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
