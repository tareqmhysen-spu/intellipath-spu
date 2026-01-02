import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CardGlass, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguageStore } from '@/stores/languageStore';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, Search, BookOpen, Clock, MessageSquare, 
  Star, Sparkles, Brain, Calendar, MapPin, Zap
} from 'lucide-react';

// Mock peer data
const mockPeers = [
  {
    id: '1',
    name: 'أحمد محمد',
    name_en: 'Ahmed Mohammed',
    avatar: null,
    department: 'Computer Engineering',
    yearLevel: 3,
    compatibility: 92,
    learningStyle: 'Visual',
    sharedCourses: ['CS301', 'CS305', 'MATH301'],
    availability: 'Evenings',
    studyPreference: 'Group Study',
    skills: ['Python', 'Machine Learning', 'Data Analysis'],
    online: true,
  },
  {
    id: '2',
    name: 'سارة أحمد',
    name_en: 'Sara Ahmed',
    avatar: null,
    department: 'Software Engineering',
    yearLevel: 3,
    compatibility: 88,
    learningStyle: 'Reading/Writing',
    sharedCourses: ['CS301', 'CS302'],
    availability: 'Mornings',
    studyPreference: 'Pair Study',
    skills: ['JavaScript', 'React', 'Node.js'],
    online: false,
  },
  {
    id: '3',
    name: 'محمد علي',
    name_en: 'Mohammed Ali',
    avatar: null,
    department: 'Computer Engineering',
    yearLevel: 3,
    compatibility: 85,
    learningStyle: 'Kinesthetic',
    sharedCourses: ['CS305', 'MATH301', 'CS310'],
    availability: 'Afternoons',
    studyPreference: 'Project-based',
    skills: ['Java', 'Android', 'Database'],
    online: true,
  },
  {
    id: '4',
    name: 'لينا حسن',
    name_en: 'Lina Hassan',
    avatar: null,
    department: 'Information Technology',
    yearLevel: 2,
    compatibility: 78,
    learningStyle: 'Auditory',
    sharedCourses: ['CS301'],
    availability: 'Flexible',
    studyPreference: 'Discussion Groups',
    skills: ['Web Design', 'UI/UX', 'Figma'],
    online: true,
  },
  {
    id: '5',
    name: 'عمر خالد',
    name_en: 'Omar Khaled',
    avatar: null,
    department: 'Computer Engineering',
    yearLevel: 4,
    compatibility: 75,
    learningStyle: 'Visual',
    sharedCourses: ['CS305', 'CS310'],
    availability: 'Weekends',
    studyPreference: 'Group Study',
    skills: ['C++', 'Embedded Systems', 'IoT'],
    online: false,
  },
];

const studyGroups = [
  {
    id: '1',
    name: 'CS301 Study Group',
    course: 'Data Structures',
    members: 5,
    maxMembers: 8,
    nextSession: '2024-01-15 18:00',
    location: 'Library Room B',
  },
  {
    id: '2',
    name: 'Machine Learning Team',
    course: 'CS305',
    members: 4,
    maxMembers: 6,
    nextSession: '2024-01-16 14:00',
    location: 'Online - Discord',
  },
];

export default function PeerMatching() {
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');

  const filteredPeers = mockPeers.filter(peer => {
    const name = isRTL ? peer.name : peer.name_en;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse === 'all' || peer.sharedCourses.includes(filterCourse);
    const matchesAvailability = filterAvailability === 'all' || peer.availability === filterAvailability;
    return matchesSearch && matchesCourse && matchesAvailability;
  });

  const texts = {
    title: isRTL ? 'مطابقة الأقران' : 'Peer Matching',
    subtitle: isRTL ? 'ابحث عن زملاء للدراسة معاً' : 'Find study partners to learn together',
    findPeers: isRTL ? 'البحث عن أقران' : 'Find Peers',
    studyGroups: isRTL ? 'مجموعات الدراسة' : 'Study Groups',
    myConnections: isRTL ? 'اتصالاتي' : 'My Connections',
    search: isRTL ? 'ابحث عن زميل...' : 'Search for a peer...',
    allCourses: isRTL ? 'جميع المقررات' : 'All Courses',
    allAvailability: isRTL ? 'جميع الأوقات' : 'All Times',
    compatibility: isRTL ? 'التوافق' : 'Compatibility',
    sharedCourses: isRTL ? 'المقررات المشتركة' : 'Shared Courses',
    learningStyle: isRTL ? 'نمط التعلم' : 'Learning Style',
    availability: isRTL ? 'التوفر' : 'Availability',
    studyPreference: isRTL ? 'أسلوب الدراسة' : 'Study Preference',
    connect: isRTL ? 'تواصل' : 'Connect',
    message: isRTL ? 'رسالة' : 'Message',
    joinGroup: isRTL ? 'انضم للمجموعة' : 'Join Group',
    createGroup: isRTL ? 'إنشاء مجموعة' : 'Create Group',
    members: isRTL ? 'عضو' : 'members',
    nextSession: isRTL ? 'الجلسة القادمة' : 'Next Session',
    location: isRTL ? 'المكان' : 'Location',
    online: isRTL ? 'متصل' : 'Online',
    offline: isRTL ? 'غير متصل' : 'Offline',
    skills: isRTL ? 'المهارات' : 'Skills',
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
                  {texts.title}
                </h1>
                <p className="text-muted-foreground">{texts.subtitle}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="peers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="peers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Search className="h-4 w-4 mr-2" />
              {texts.findPeers}
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              {texts.studyGroups}
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              {texts.myConnections}
            </TabsTrigger>
          </TabsList>

          {/* Find Peers Tab */}
          <TabsContent value="peers" className="space-y-6">
            {/* Filters */}
            <CardGlass>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={texts.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-9 bg-background/50"
                    />
                  </div>
                  <Select value={filterCourse} onValueChange={setFilterCourse}>
                    <SelectTrigger className="w-full md:w-[180px] bg-background/50">
                      <SelectValue placeholder={texts.allCourses} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{texts.allCourses}</SelectItem>
                      <SelectItem value="CS301">CS301 - Data Structures</SelectItem>
                      <SelectItem value="CS305">CS305 - Machine Learning</SelectItem>
                      <SelectItem value="MATH301">MATH301 - Linear Algebra</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                    <SelectTrigger className="w-full md:w-[150px] bg-background/50">
                      <SelectValue placeholder={texts.allAvailability} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{texts.allAvailability}</SelectItem>
                      <SelectItem value="Mornings">{isRTL ? 'صباحاً' : 'Mornings'}</SelectItem>
                      <SelectItem value="Afternoons">{isRTL ? 'ظهراً' : 'Afternoons'}</SelectItem>
                      <SelectItem value="Evenings">{isRTL ? 'مساءً' : 'Evenings'}</SelectItem>
                      <SelectItem value="Weekends">{isRTL ? 'عطل الأسبوع' : 'Weekends'}</SelectItem>
                      <SelectItem value="Flexible">{isRTL ? 'مرن' : 'Flexible'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </CardGlass>

            {/* Peers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeers.map((peer, index) => (
                <motion.div
                  key={peer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CardGlass className="hover:shadow-xl transition-all hover:scale-[1.02]">
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12 ring-2 ring-background">
                              <AvatarImage src={peer.avatar || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                                {(isRTL ? peer.name : peer.name_en).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {peer.online && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{isRTL ? peer.name : peer.name_en}</h3>
                            <p className="text-xs text-muted-foreground">{peer.department}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 ${getCompatibilityColor(peer.compatibility)}`}>
                          <Sparkles className="h-4 w-4" />
                          <span className="font-bold text-lg">{peer.compatibility}%</span>
                        </div>
                      </div>

                      {/* Compatibility Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{texts.compatibility}</span>
                          <span className={getCompatibilityColor(peer.compatibility)}>{peer.compatibility}%</span>
                        </div>
                        <Progress value={peer.compatibility} className="h-2" />
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <div>
                            <div className="text-xs text-muted-foreground">{texts.learningStyle}</div>
                            <div className="font-medium text-xs">{peer.learningStyle}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="text-xs text-muted-foreground">{texts.availability}</div>
                            <div className="font-medium text-xs">{peer.availability}</div>
                          </div>
                        </div>
                      </div>

                      {/* Shared Courses */}
                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {texts.sharedCourses}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {peer.sharedCourses.map(course => (
                            <Badge key={course} variant="secondary" className="text-xs bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {texts.skills}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {peer.skills.slice(0, 3).map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                          <UserPlus className="h-4 w-4 mr-2" />
                          {texts.connect}
                        </Button>
                        <Button variant="outline" size="icon">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </CardGlass>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Study Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <UserPlus className="h-4 w-4 mr-2" />
                {texts.createGroup}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studyGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CardGlass className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <CardDescription>{group.course}</CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {group.members}/{group.maxMembers} {texts.members}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{texts.nextSession}: {new Date(group.nextSession).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{group.location}</span>
                      </div>
                      <Progress value={(group.members / group.maxMembers) * 100} className="h-2" />
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
                        {texts.joinGroup}
                      </Button>
                    </CardContent>
                  </CardGlass>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* My Connections Tab */}
          <TabsContent value="connections">
            <CardGlass>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  {isRTL ? 'لا توجد اتصالات بعد' : 'No connections yet'}
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  {isRTL 
                    ? 'ابدأ بالتواصل مع زملائك للدراسة معاً وتبادل المعرفة'
                    : 'Start connecting with your peers to study together and share knowledge'}
                </p>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Search className="h-4 w-4 mr-2" />
                  {texts.findPeers}
                </Button>
              </CardContent>
            </CardGlass>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
