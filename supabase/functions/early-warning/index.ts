import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentRisk {
  studentId: string;
  studentName: string;
  userId: string;
  gpa: number;
  riskLevel: 'high' | 'medium' | 'low';
  riskFactors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting early warning check...');

    // Get all students with their profiles
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        user_id,
        student_id,
        gpa,
        year_level,
        department,
        streak_days,
        total_credits
      `);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      throw studentsError;
    }

    console.log(`Found ${students?.length || 0} students to check`);

    // Get all advisors
    const { data: advisors, error: advisorsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['advisor', 'admin']);

    if (advisorsError) {
      console.error('Error fetching advisors:', advisorsError);
      throw advisorsError;
    }

    const advisorIds = advisors?.map(a => a.user_id) || [];
    console.log(`Found ${advisorIds.length} advisors`);

    // Get profiles for student names
    const studentUserIds = students?.map(s => s.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, full_name_ar')
      .in('user_id', studentUserIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Analyze each student for risk factors
    const atRiskStudents: StudentRisk[] = [];

    for (const student of students || []) {
      const gpa = Number(student.gpa) || 0;
      const riskFactors: string[] = [];
      
      // Determine risk level based on GPA
      let riskLevel: 'high' | 'medium' | 'low';
      
      if (gpa < 1.5) {
        riskFactors.push('المعدل التراكمي أقل من 1.5 - خطر الفصل');
        riskLevel = 'high';
      } else if (gpa < 2.0) {
        riskFactors.push('المعدل التراكمي أقل من 2.0 - إنذار أكاديمي');
        riskLevel = 'medium';
      } else if (gpa < 2.5) {
        riskFactors.push('المعدل التراكمي يحتاج للتحسين');
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      // Check activity streak
      if (student.streak_days === 0) {
        riskFactors.push('لم يسجل دخول منذ فترة');
      }

      // Only include students with risk factors
      if (riskFactors.length > 0 && (riskLevel === 'high' || riskLevel === 'medium')) {
        const profile = profileMap.get(student.user_id);
        atRiskStudents.push({
          studentId: student.id,
          studentName: profile?.full_name_ar || profile?.full_name || student.student_id,
          userId: student.user_id,
          gpa,
          riskLevel,
          riskFactors,
        });
      }
    }

    console.log(`Found ${atRiskStudents.length} at-risk students`);

    // Create notifications for advisors about high-risk students
    const notifications = [];
    const highRiskStudents = atRiskStudents.filter(s => s.riskLevel === 'high');

    if (highRiskStudents.length > 0) {
      for (const advisorId of advisorIds) {
        for (const student of highRiskStudents) {
          notifications.push({
            user_id: advisorId,
            title: 'تنبيه: طالب معرض للخطر',
            title_ar: 'تنبيه: طالب معرض للخطر',
            message: `الطالب ${student.studentName} بمعدل ${student.gpa.toFixed(2)} يحتاج تدخل عاجل`,
            message_ar: `الطالب ${student.studentName} بمعدل ${student.gpa.toFixed(2)} يحتاج تدخل عاجل`,
            type: 'warning',
            link: '/advisor-dashboard',
          });
        }
      }
    }

    // Insert notifications if any
    if (notifications.length > 0) {
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifyError) {
        console.error('Error creating notifications:', notifyError);
      } else {
        console.log(`Created ${notifications.length} notifications`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalStudents: students?.length || 0,
        atRiskCount: atRiskStudents.length,
        highRiskCount: highRiskStudents.length,
        notificationsCreated: notifications.length,
        atRiskStudents: atRiskStudents.map(s => ({
          name: s.studentName,
          gpa: s.gpa,
          riskLevel: s.riskLevel,
          factors: s.riskFactors,
        })),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Early warning check failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
