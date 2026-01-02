import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ZoomIn, ZoomOut, Info, BookOpen, Route, Loader2, GraduationCap, ArrowRight, Clock, Download, Eye, ChevronLeft, ChevronRight, ArrowDown, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguageStore } from '@/stores/languageStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface GraphNode {
  id: string;
  code: string;
  name: string;
  name_ar?: string;
  credits: number;
  department: string;
  year_level: number;
  semester?: number;
  hours_theory?: number;
  hours_lab?: number;
  is_bottleneck?: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'REQUIRES';
}

interface Major {
  id: string;
  name: string;
  name_en: string | null;
  description?: string | null;
  total_credits?: number | null;
  duration_years?: number | null;
}

// Color palette for year levels - vibrant and distinct
const yearColors: Record<number, string> = {
  1: '#3B82F6', // Blue - Year 1
  2: '#10B981', // Green - Year 2
  3: '#F59E0B', // Amber - Year 3
  4: '#EF4444', // Red - Year 4
  5: '#8B5CF6', // Purple - Year 5
};

// Category colors based on course type
const categoryColors: Record<string, { bg: string; border: string; text: string; label: string; label_ar: string }> = {
  'university': { bg: 'hsl(var(--muted))', border: 'hsl(var(--border))', text: 'hsl(var(--muted-foreground))', label: 'University Req', label_ar: 'متطلبات جامعة' },
  'faculty': { bg: 'hsl(217 91% 60% / 0.15)', border: 'hsl(217 91% 60%)', text: 'hsl(217 91% 60%)', label: 'Faculty Req', label_ar: 'متطلبات كلية' },
  'specialization': { bg: 'hsl(142 76% 36% / 0.15)', border: 'hsl(142 76% 36%)', text: 'hsl(142 76% 36%)', label: 'Specialization', label_ar: 'تخصص' },
  'elective': { bg: 'hsl(280 65% 60% / 0.15)', border: 'hsl(280 65% 60%)', text: 'hsl(280 65% 60%)', label: 'Elective', label_ar: 'اختياري' },
};

// Get category from course code
const getCourseCategory = (code: string): string => {
  if (code.startsWith('CIUR')) return 'university';
  if (code.startsWith('CIFR')) return 'faculty';
  if (code.startsWith('CIEE')) return 'elective';
  return 'specialization';
};

export default function KnowledgeGraph() {
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<GraphNode | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[]; major?: Major } | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [prerequisites, setPrerequisites] = useState<GraphNode[]>([]);
  const [dependents, setDependents] = useState<GraphNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());

  const t = (ar: string, en: string) => isRTL ? ar : en;

  // Load majors list from Supabase
  useEffect(() => {
    const loadMajors = async () => {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching majors:', error);
        toast({
          title: t('خطأ', 'Error'),
          description: t('فشل في تحميل التخصصات', 'Failed to load majors'),
          variant: 'destructive'
        });
        return;
      }
      
      if (data && data.length > 0) {
        setMajors(data);
        if (!selectedMajor) {
          setSelectedMajor(data[0].id);
        }
      }
    };
    loadMajors();
  }, []);

  // Load graph data from Supabase when major changes
  useEffect(() => {
    const loadGraph = async () => {
      if (!selectedMajor) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Get the major info
        const majorData = majors.find(m => m.id === selectedMajor);

        // Get course IDs for this major
        const { data: courseMajors, error: cmError } = await supabase
          .from('course_majors')
          .select('course_id')
          .eq('major_id', selectedMajor);
        
        if (cmError) throw cmError;
        
        if (!courseMajors || courseMajors.length === 0) {
          setGraphData({ nodes: [], edges: [], major: majorData || undefined });
          setIsLoading(false);
          return;
        }
        
        const courseIds = courseMajors.map(cm => cm.course_id);

        // Get course details
        const { data: coursesData, error: cError } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds)
          .eq('is_active', true)
          .order('year_level')
          .order('code');
        
        if (cError) throw cError;

        // Transform to GraphNode format
        const nodes: GraphNode[] = (coursesData || []).map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          name_ar: c.name_ar || undefined,
          credits: c.credits,
          department: c.department,
          year_level: c.year_level,
          semester: c.semester ? parseInt(c.semester) : undefined,
          hours_theory: c.hours_theory || undefined,
          hours_lab: c.hours_lab || undefined,
          is_bottleneck: c.is_bottleneck || false,
        }));

        // Get prerequisites for these courses
        const { data: prereqData, error: pError } = await supabase
          .from('course_prerequisites')
          .select('course_id, prerequisite_id')
          .in('course_id', courseIds);
        
        if (pError) throw pError;

        // Transform to GraphEdge format
        const edges: GraphEdge[] = (prereqData || []).map(p => ({
          from: p.prerequisite_id,
          to: p.course_id,
          type: 'REQUIRES' as const
        }));

        setGraphData({ nodes, edges, major: majorData || undefined });
      } catch (error) {
        console.error('Error loading graph:', error);
        toast({
          title: t('خطأ', 'Error'),
          description: t('فشل في تحميل البيانات', 'Failed to load data'),
          variant: 'destructive'
        });
      }

      setIsLoading(false);
    };
    
    loadGraph();
  }, [selectedMajor, majors]);

  // Calculate course statistics
  const stats = useMemo(() => {
    if (!graphData) return null;
    
    const nodes = graphData.nodes;
    const totalCredits = nodes.reduce((sum, n) => sum + n.credits, 0);
    const byYear = nodes.reduce((acc, n) => {
      acc[n.year_level] = (acc[n.year_level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return {
      totalCourses: nodes.length,
      totalCredits,
      totalEdges: graphData.edges.length,
      byYear
    };
  }, [graphData]);

  // Group courses by year
  const coursesByYear = useMemo(() => {
    if (!graphData) return {};
    
    const grouped: Record<number, GraphNode[]> = {};
    for (let year = 1; year <= 5; year++) {
      grouped[year] = [];
    }
    
    graphData.nodes.forEach(node => {
      if (grouped[node.year_level]) {
        grouped[node.year_level].push(node);
      }
    });
    
    // Sort courses within each year by code
    Object.keys(grouped).forEach(year => {
      grouped[parseInt(year)].sort((a, b) => a.code.localeCompare(b.code));
    });
    
    return grouped;
  }, [graphData]);

  // Filter nodes for search
  const filteredNodes = useMemo(() => {
    if (!graphData) return new Set<string>();
    
    if (!searchQuery) return new Set(graphData.nodes.map(n => n.id));
    
    const query = searchQuery.toLowerCase();
    const matches = graphData.nodes.filter(
      c => c.name?.toLowerCase().includes(query) || 
           c.name_ar?.includes(query) || 
           c.code?.toLowerCase().includes(query)
    );
    
    return new Set(matches.map(n => n.id));
  }, [graphData, searchQuery]);

  // Handle course click
  const handleCourseClick = useCallback(async (course: GraphNode) => {
    setSelectedCourse(course);
    
    // Load prerequisites from Supabase
    const { data: prereqIds } = await supabase
      .from('course_prerequisites')
      .select('prerequisite_id')
      .eq('course_id', course.id);
    
    if (prereqIds && prereqIds.length > 0) {
      const pIds = prereqIds.map(p => p.prerequisite_id);
      const { data: prereqCourses } = await supabase
        .from('courses')
        .select('*')
        .in('id', pIds);
      
      setPrerequisites((prereqCourses || []).map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        name_ar: c.name_ar || undefined,
        credits: c.credits,
        department: c.department,
        year_level: c.year_level,
      })));
      
      // Highlight prerequisite path
      setHighlightedPath(new Set([course.id, ...pIds]));
    } else {
      setPrerequisites([]);
      setHighlightedPath(new Set([course.id]));
    }
    
    // Load dependents from Supabase
    const { data: depIds } = await supabase
      .from('course_prerequisites')
      .select('course_id')
      .eq('prerequisite_id', course.id);
    
    if (depIds && depIds.length > 0) {
      const dIds = depIds.map(d => d.course_id);
      const { data: depCourses } = await supabase
        .from('courses')
        .select('*')
        .in('id', dIds);
      
      setDependents((depCourses || []).map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        name_ar: c.name_ar || undefined,
        credits: c.credits,
        department: c.department,
        year_level: c.year_level,
      })));
    } else {
      setDependents([]);
    }
    
    setShowDialog(true);
  }, []);

  // Get prerequisite arrows for a course
  const getPrerequisiteArrows = useCallback((courseId: string) => {
    if (!graphData) return [];
    return graphData.edges.filter(e => e.to === courseId).map(e => e.from);
  }, [graphData]);

  // Check if an edge exists between two courses
  const hasEdge = useCallback((fromId: string, toId: string) => {
    if (!graphData) return false;
    return graphData.edges.some(e => e.from === fromId && e.to === toId);
  }, [graphData]);

  const handleZoomIn = () => setZoomLevel(z => Math.min(z * 1.2, 2));
  const handleZoomOut = () => setZoomLevel(z => Math.max(z / 1.2, 0.5));

  // Download plan PDF
  const handleDownloadPlan = () => {
    const majorCode = majors.find(m => m.id === selectedMajor)?.name_en?.toLowerCase() || '';
    let pdfName = '';
    if (majorCode.includes('artificial') || majorCode.includes('ai')) pdfName = 'AI-BW-3.pdf';
    else if (majorCode.includes('software') || majorCode.includes('information systems')) pdfName = 'IS-BW-3.pdf';
    else if (majorCode.includes('security') || majorCode.includes('network')) pdfName = 'SS-BW-3.pdf';
    else if (majorCode.includes('communication')) pdfName = 'COM-BW-3.pdf';
    else if (majorCode.includes('control') || majorCode.includes('robot')) pdfName = 'CR-BW-3.pdf';
    
    if (pdfName) {
      window.open(`/data/plans/${pdfName}`, '_blank');
    }
  };

  const selectedMajorData = majors.find(m => m.id === selectedMajor);

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem-4rem)] flex-col md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="border-b border-border bg-background p-4">
          <div className="mx-auto max-w-full">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white"
                  animate={{
                    boxShadow: [
                      '0 0 10px hsl(var(--secondary) / 0.3)',
                      '0 0 25px hsl(var(--secondary) / 0.5)',
                      '0 0 10px hsl(var(--secondary) / 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Grid3X3 className="h-6 w-6" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-foreground md:text-2xl">
                    {t('خريطة المعرفة', 'Knowledge Graph')}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {selectedMajorData 
                      ? (isRTL ? selectedMajorData.name : selectedMajorData.name_en)
                      : t('شجرة المتطلبات المسبقة التفاعلية', 'Interactive prerequisites tree')
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleZoomIn} title={t('تكبير', 'Zoom In')}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut} title={t('تصغير', 'Zoom Out')}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPlan} className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('تحميل PDF', 'Download PDF')}</span>
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Major/Specialization Select */}
              <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                <SelectTrigger className="w-[280px]">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('اختر التخصص', 'Select Major')} />
                </SelectTrigger>
                <SelectContent>
                  {majors.map(major => (
                    <SelectItem key={major.id} value={major.id}>
                      {isRTL ? major.name : major.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('ابحث عن مقرر...', 'Search for a course...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10"
                />
              </div>

              {/* Stats */}
              {stats && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {stats.totalCourses} {t('مقرر', 'courses')}
                  </Badge>
                  <Badge variant="outline">
                    {stats.totalCredits} {t('ساعة', 'credits')}
                  </Badge>
                  <Badge variant="outline">
                    {stats.totalEdges} {t('علاقة', 'relations')}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graph Container - Grid Layout */}
        <ScrollArea className="flex-1">
          <div 
            className="min-w-[1400px] p-6"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          >
            {isLoading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                  <p className="mt-3 text-muted-foreground">
                    {t('جاري تحميل الرسم البياني...', 'Loading graph...')}
                  </p>
                </div>
              </div>
            ) : graphData && graphData.nodes.length === 0 ? (
              <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-3 text-muted-foreground">
                    {t('لا توجد مقررات', 'No courses found')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Years Grid */}
                <TooltipProvider delayDuration={100}>
                  {[1, 2, 3, 4, 5].map(year => (
                    <div key={year} className="relative">
                      {/* Year Header */}
                      <div className="mb-4 flex items-center gap-3">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold shadow-lg"
                          style={{ backgroundColor: yearColors[year] }}
                        >
                          {year}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {t(`السنة ${year}`, `Year ${year}`)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {coursesByYear[year]?.length || 0} {t('مقرر', 'courses')} • {coursesByYear[year]?.reduce((s, c) => s + c.credits, 0) || 0} {t('ساعة', 'credits')}
                          </p>
                        </div>
                      </div>

                      {/* Courses Grid */}
                      <div className="grid grid-cols-11 gap-3">
                        <AnimatePresence>
                          {coursesByYear[year]?.map((course, idx) => {
                            const category = getCourseCategory(course.code);
                            const colors = categoryColors[category];
                            const isFiltered = !filteredNodes.has(course.id);
                            const isHighlighted = highlightedPath.has(course.id);
                            const hasPrereqs = getPrerequisiteArrows(course.id).length > 0;
                            
                            return (
                              <Tooltip key={course.id}>
                                <TooltipTrigger asChild>
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ 
                                      opacity: isFiltered ? 0.3 : 1, 
                                      y: 0,
                                      scale: isHighlighted ? 1.05 : 1,
                                    }}
                                    exit={{ opacity: 0, y: -20 }}
                                    whileHover={{ scale: 1.08, zIndex: 10 }}
                                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                                    onClick={() => handleCourseClick(course)}
                                    className={`
                                      relative cursor-pointer rounded-lg p-3 border-2 transition-all
                                      hover:shadow-xl hover:z-10
                                      ${isHighlighted ? 'ring-2 ring-primary ring-offset-2' : ''}
                                      ${course.is_bottleneck ? 'ring-2 ring-destructive' : ''}
                                    `}
                                    style={{
                                      backgroundColor: colors.bg,
                                      borderColor: isHighlighted ? 'hsl(var(--primary))' : colors.border,
                                    }}
                                  >
                                    {/* Prerequisite indicator arrow */}
                                    {hasPrereqs && (
                                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <ArrowDown className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                    
                                    {/* Course Code */}
                                    <div className="text-xs font-mono font-bold text-center mb-1" style={{ color: colors.text }}>
                                      {course.code}
                                    </div>
                                    
                                    {/* Course Name */}
                                    <div className="text-[10px] text-center text-foreground/80 line-clamp-2 h-8 overflow-hidden">
                                      {isRTL ? (course.name_ar || course.name) : course.name}
                                    </div>
                                    
                                    {/* Credits Badge */}
                                    <div className="mt-2 flex justify-center">
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-background/50 text-muted-foreground">
                                        {course.credits} {t('س', 'cr')}
                                      </span>
                                    </div>

                                    {/* Bottleneck indicator */}
                                    {course.is_bottleneck && (
                                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" title="Bottleneck" />
                                    )}
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-bold">{course.code}</p>
                                    <p>{isRTL ? (course.name_ar || course.name) : course.name}</p>
                                    <p className="text-muted-foreground">
                                      {course.credits} {t('ساعات معتمدة', 'credits')} • {t(`السنة ${course.year_level}`, `Year ${course.year_level}`)}
                                    </p>
                                    {course.hours_theory && (
                                      <p className="text-xs text-muted-foreground">
                                        {course.hours_theory} {t('نظري', 'theory')} + {course.hours_lab || 0} {t('عملي', 'lab')}
                                      </p>
                                    )}
                                    <p className="text-xs mt-1 italic text-primary">
                                      {t('اضغط لعرض التفاصيل', 'Click for details')}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </AnimatePresence>
                      </div>

                      {/* Year Separator Line */}
                      {year < 5 && (
                        <div className="mt-6 flex items-center gap-4">
                          <div className="flex-1 border-t border-dashed border-border" />
                          <ArrowDown className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 border-t border-dashed border-border" />
                        </div>
                      )}
                    </div>
                  ))}
                </TooltipProvider>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Legend - Fixed at bottom */}
        <div className="border-t border-border bg-background/95 backdrop-blur p-3">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span className="font-medium">{t('دليل الألوان:', 'Legend:')}</span>
            </div>
            {Object.entries(categoryColors).map(([key, colors]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="h-4 w-4 rounded border-2"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                />
                <span className="text-xs text-muted-foreground">
                  {isRTL ? colors.label_ar : colors.label}
                </span>
              </div>
            ))}
            <div className="border-l border-border pl-4 flex items-center gap-4">
              {[1, 2, 3, 4, 5].map(year => (
                <div key={year} className="flex items-center gap-1">
                  <div 
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: yearColors[year] }}
                  />
                  <span className="text-xs text-muted-foreground">{year}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Detail Dialog */}
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setHighlightedPath(new Set()); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            {selectedCourse && (
              <>
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
                      style={{ backgroundColor: yearColors[selectedCourse.year_level] }}
                    >
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold truncate">
                        {isRTL ? (selectedCourse.name_ar || selectedCourse.name) : selectedCourse.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedCourse.code}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-4 py-2">
                    {/* Course Info Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        className="text-white" 
                        style={{ backgroundColor: yearColors[selectedCourse.year_level] }}
                      >
                        {t(`السنة ${selectedCourse.year_level}`, `Year ${selectedCourse.year_level}`)}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        {selectedCourse.credits} {t('ساعات', 'credits')}
                      </Badge>
                      {selectedCourse.hours_theory && (
                        <Badge variant="secondary">
                          {selectedCourse.hours_theory} {t('نظري', 'theory')}
                        </Badge>
                      )}
                      {selectedCourse.hours_lab && (
                        <Badge variant="secondary">
                          {selectedCourse.hours_lab} {t('عملي', 'lab')}
                        </Badge>
                      )}
                      {selectedCourse.is_bottleneck && (
                        <Badge variant="destructive">
                          {t('مقرر حرج', 'Bottleneck')}
                        </Badge>
                      )}
                    </div>

                    {/* Prerequisites */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ArrowRight className="h-4 w-4 rotate-180 text-primary" />
                        {t('المتطلبات المسبقة', 'Prerequisites')}
                        {prerequisites.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{prerequisites.length}</Badge>
                        )}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {prerequisites.length > 0 ? (
                          prerequisites.map((course) => (
                            <Badge 
                              key={course.id} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-muted"
                              style={{ borderColor: yearColors[course.year_level] }}
                            >
                              {course.code}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            {t('لا يوجد متطلبات مسبقة', 'No prerequisites')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dependents */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        {t('يفتح المقررات', 'Unlocks Courses')}
                        {dependents.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{dependents.length}</Badge>
                        )}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {dependents.length > 0 ? (
                          dependents.map((course) => (
                            <Badge 
                              key={course.id} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-muted"
                              style={{ borderColor: yearColors[course.year_level] }}
                            >
                              {course.code}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            {t('لا يوجد مقررات تالية', 'No following courses')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
