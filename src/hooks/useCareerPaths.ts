import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export interface CareerPath {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  color: string;
  skills: string[];
  skillsAr: string[];
  courses: string[];
  salaryRange: string;
  demand: 'high' | 'medium' | 'low';
  department: string;
}

// Career paths mapped to departments
const careerPathsData: CareerPath[] = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    titleAr: 'مهندس برمجيات',
    description: 'Build and maintain software applications and systems',
    descriptionAr: 'بناء وصيانة التطبيقات والأنظمة البرمجية',
    icon: 'code',
    color: 'bg-blue-500',
    skills: ['Programming', 'Data Structures', 'Algorithms', 'System Design', 'Git'],
    skillsAr: ['البرمجة', 'هياكل البيانات', 'الخوارزميات', 'تصميم الأنظمة', 'Git'],
    courses: ['CS101', 'CS102', 'CS201', 'CS301', 'CS302'],
    salaryRange: '$60,000 - $150,000',
    demand: 'high',
    department: 'هندسة المعلوماتية',
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    titleAr: 'عالم بيانات',
    description: 'Analyze complex data and build ML models',
    descriptionAr: 'تحليل البيانات المعقدة وبناء نماذج التعلم الآلي',
    icon: 'brain',
    color: 'bg-purple-500',
    skills: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Data Visualization'],
    skillsAr: ['بايثون', 'تعلم الآلة', 'الإحصاء', 'SQL', 'تصور البيانات'],
    courses: ['CS401', 'CS402', 'MATH101', 'CS202'],
    salaryRange: '$70,000 - $160,000',
    demand: 'high',
    department: 'هندسة المعلوماتية',
  },
  {
    id: 'network-engineer',
    title: 'Network Engineer',
    titleAr: 'مهندس شبكات',
    description: 'Design and maintain computer networks',
    descriptionAr: 'تصميم وصيانة شبكات الحاسوب',
    icon: 'network',
    color: 'bg-green-500',
    skills: ['Networking', 'Security', 'Cloud', 'Linux', 'Troubleshooting'],
    skillsAr: ['الشبكات', 'الأمان', 'السحابة', 'لينكس', 'استكشاف الأخطاء'],
    courses: ['CS302', 'CS303'],
    salaryRange: '$55,000 - $120,000',
    demand: 'medium',
    department: 'هندسة الاتصالات',
  },
  {
    id: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    titleAr: 'محلل أمن سيبراني',
    description: 'Protect systems from cyber threats',
    descriptionAr: 'حماية الأنظمة من التهديدات السيبرانية',
    icon: 'shield',
    color: 'bg-red-500',
    skills: ['Security', 'Penetration Testing', 'Risk Assessment', 'Forensics'],
    skillsAr: ['الأمان', 'اختبار الاختراق', 'تقييم المخاطر', 'الطب الشرعي الرقمي'],
    courses: ['CS302', 'CS303'],
    salaryRange: '$65,000 - $140,000',
    demand: 'high',
    department: 'هندسة المعلوماتية',
  },
  {
    id: 'ai-engineer',
    title: 'AI Engineer',
    titleAr: 'مهندس ذكاء اصطناعي',
    description: 'Develop AI and machine learning solutions',
    descriptionAr: 'تطوير حلول الذكاء الاصطناعي والتعلم الآلي',
    icon: 'cpu',
    color: 'bg-indigo-500',
    skills: ['Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch'],
    skillsAr: ['التعلم العميق', 'معالجة اللغة الطبيعية', 'الرؤية الحاسوبية', 'TensorFlow', 'PyTorch'],
    courses: ['CS401', 'CS402'],
    salaryRange: '$80,000 - $180,000',
    demand: 'high',
    department: 'هندسة المعلوماتية',
  },
  {
    id: 'biomedical-engineer',
    title: 'Biomedical Engineer',
    titleAr: 'مهندس طبي حيوي',
    description: 'Design medical devices and healthcare solutions',
    descriptionAr: 'تصميم الأجهزة الطبية وحلول الرعاية الصحية',
    icon: 'heart',
    color: 'bg-pink-500',
    skills: ['Medical Imaging', 'Signal Processing', 'Biomechanics', 'Regulatory Affairs'],
    skillsAr: ['التصوير الطبي', 'معالجة الإشارات', 'الميكانيكا الحيوية', 'الشؤون التنظيمية'],
    courses: ['MATH101'],
    salaryRange: '$60,000 - $130,000',
    demand: 'medium',
    department: 'الهندسة الطبية',
  },
];

export function useCareerPaths() {
  const { user } = useAuthStore();

  // Fetch student data to get department
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['career-student', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('students')
        .select('id, department, year_level, gpa')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch completed courses to calculate progress
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['career-enrollments', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return [];

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          status,
          courses:course_id (code)
        `)
        .eq('student_id', studentData.id)
        .eq('status', 'completed');

      if (error) return [];
      return data;
    },
    enabled: !!studentData?.id,
  });

  // Calculate progress for each career path
  const completedCourseCodes = enrollments?.map((e: any) => e.courses?.code).filter(Boolean) || [];

  const careerPathsWithProgress = careerPathsData.map(path => {
    const matchingCourses = path.courses.filter(code => completedCourseCodes.includes(code));
    const progress = path.courses.length > 0 
      ? Math.round((matchingCourses.length / path.courses.length) * 100)
      : 0;

    return {
      ...path,
      progress,
      completedCourses: matchingCourses,
    };
  });

  // Filter paths by department if available
  const relevantPaths = studentData?.department
    ? careerPathsWithProgress.filter(p => p.department === studentData.department || p.department === 'هندسة المعلوماتية')
    : careerPathsWithProgress;

  return {
    careerPaths: relevantPaths,
    allCareerPaths: careerPathsWithProgress,
    studentData,
    isLoading: studentLoading || enrollmentsLoading,
  };
}
