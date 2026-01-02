import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Database, 
  MessageSquare, 
  Zap,
  Users,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  total_queries: number;
  cache_hits: number;
  faq_matches: number;
  avg_latency: number;
  queries_by_mode: { mode: string; count: number }[];
  queries_over_time: { date: string; count: number }[];
  top_queries: { query: string; count: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#14B8A6', '#F59E0B', '#EF4444'];

export default function ChatAnalytics() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const isRTL = language === 'ar';
  
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const t = (ar: string, en: string) => isRTL ? ar : en;

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, user]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get date range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch analytics data
      const { data: analyticsData, error } = await supabase
        .from('chat_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data
      const total_queries = analyticsData?.length || 0;
      const cache_hits = analyticsData?.filter(a => a.cache_hit).length || 0;
      const faq_matches = analyticsData?.filter(a => a.faq_match).length || 0;
      const avg_latency = analyticsData?.length 
        ? Math.round(analyticsData.reduce((sum, a) => sum + (a.latency_ms || 0), 0) / analyticsData.length)
        : 0;

      // Group by mode
      const modeGroups = analyticsData?.reduce((acc, a) => {
        const mode = a.response_mode || 'rag';
        acc[mode] = (acc[mode] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const queries_by_mode = Object.entries(modeGroups).map(([mode, count]) => ({
        mode: mode === 'faq' ? t('أسئلة شائعة', 'FAQ') : 
              mode === 'rag' ? t('بحث', 'RAG') : 
              mode === 'fast' ? t('سريع', 'Fast') : mode,
        count: count as number
      }));

      // Group by date
      const dateGroups = analyticsData?.reduce((acc, a) => {
        const date = new Date(a.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const queries_over_time = Object.entries(dateGroups)
        .map(([date, count]) => ({ date, count: count as number }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Top queries
      const queryGroups = analyticsData?.reduce((acc, a) => {
        const query = a.query_text?.slice(0, 50) || 'Unknown';
        acc[query] = (acc[query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const top_queries = Object.entries(queryGroups)
        .map(([query, count]) => ({ query, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setAnalytics({
        total_queries,
        cache_hits,
        faq_matches,
        avg_latency,
        queries_by_mode,
        queries_over_time,
        top_queries
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: number;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              <TrendingUp className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}% {t('من الفترة السابقة', 'from last period')}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('تحليلات المحادثات', 'Chat Analytics')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('إحصائيات استخدام نظام URAG', 'URAG system usage statistics')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{t('7 أيام', '7 days')}</SelectItem>
                <SelectItem value="30d">{t('30 يوم', '30 days')}</SelectItem>
                <SelectItem value="90d">{t('90 يوم', '90 days')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={loadAnalytics} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('إجمالي الاستعلامات', 'Total Queries')}
            value={analytics?.total_queries || 0}
            icon={MessageSquare}
            color="from-primary to-primary/50"
          />
          <StatCard
            title={t('نتائج من الذاكرة المؤقتة', 'Cache Hits')}
            value={`${analytics?.cache_hits || 0} (${analytics?.total_queries ? Math.round((analytics.cache_hits / analytics.total_queries) * 100) : 0}%)`}
            icon={Database}
            color="from-emerald-500 to-emerald-500/50"
          />
          <StatCard
            title={t('مطابقات الأسئلة الشائعة', 'FAQ Matches')}
            value={analytics?.faq_matches || 0}
            icon={Zap}
            color="from-amber-500 to-amber-500/50"
          />
          <StatCard
            title={t('متوسط وقت الاستجابة', 'Avg Response Time')}
            value={`${analytics?.avg_latency || 0}ms`}
            icon={Clock}
            color="from-secondary to-secondary/50"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queries Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('الاستعلامات عبر الزمن', 'Queries Over Time')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.queries_over_time || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Queries by Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('الاستعلامات حسب النوع', 'Queries by Mode')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.queries_by_mode || []}
                      dataKey="count"
                      nameKey="mode"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ mode, percent }) => `${mode} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics?.queries_by_mode?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Queries */}
        <Card>
          <CardHeader>
            <CardTitle>{t('أكثر الاستعلامات شيوعاً', 'Most Common Queries')}</CardTitle>
            <CardDescription>
              {t('الأسئلة الأكثر تكراراً من المستخدمين', 'Most frequently asked questions by users')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.top_queries?.map((query, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {i + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{query.query}</p>
                    <Progress 
                      value={(query.count / (analytics.top_queries[0]?.count || 1)) * 100} 
                      className="h-2 mt-1"
                    />
                  </div>
                  <Badge variant="secondary">{query.count}</Badge>
                </div>
              ))}
              
              {(!analytics?.top_queries?.length) && (
                <p className="text-center text-muted-foreground py-8">
                  {t('لا توجد بيانات متاحة', 'No data available')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
