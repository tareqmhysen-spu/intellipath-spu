import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguageStore } from '@/stores/languageStore';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, Code, Briefcase, FileText, Download, Plus, Star, 
  ExternalLink, Calendar, CheckCircle2, Trash2, Edit, Share2,
  Linkedin, Globe, QrCode, Sparkles
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  nameAr: string;
  level: number;
  category: string;
  verified: boolean;
}

interface Project {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  technologies: string[];
  link?: string;
  date: string;
}

interface Certificate {
  id: string;
  name: string;
  nameAr: string;
  issuer: string;
  issuerAr: string;
  date: string;
  credentialId?: string;
  link?: string;
}

const initialSkills: Skill[] = [
  { id: '1', name: 'Python', nameAr: 'بايثون', level: 85, category: 'Programming', verified: true },
  { id: '2', name: 'JavaScript', nameAr: 'جافاسكريبت', level: 90, category: 'Programming', verified: true },
  { id: '3', name: 'React', nameAr: 'رياكت', level: 80, category: 'Framework', verified: false },
  { id: '4', name: 'SQL', nameAr: 'SQL', level: 75, category: 'Database', verified: true },
  { id: '5', name: 'Machine Learning', nameAr: 'تعلم الآلة', level: 60, category: 'AI', verified: false },
  { id: '6', name: 'Data Analysis', nameAr: 'تحليل البيانات', level: 70, category: 'Data', verified: true },
];

const initialProjects: Project[] = [
  {
    id: '1',
    title: 'E-Commerce Platform',
    titleAr: 'منصة تجارة إلكترونية',
    description: 'Full-stack e-commerce solution with payment integration',
    descriptionAr: 'حل متكامل للتجارة الإلكترونية مع تكامل الدفع',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    link: 'https://github.com/example/ecommerce',
    date: '2024-01',
  },
  {
    id: '2',
    title: 'AI Chatbot',
    titleAr: 'روبوت دردشة ذكي',
    description: 'NLP-powered chatbot for customer support',
    descriptionAr: 'روبوت دردشة مدعوم بمعالجة اللغة الطبيعية',
    technologies: ['Python', 'TensorFlow', 'Flask'],
    date: '2023-11',
  },
];

const initialCertificates: Certificate[] = [
  {
    id: '1',
    name: 'AWS Solutions Architect',
    nameAr: 'مهندس حلول AWS',
    issuer: 'Amazon Web Services',
    issuerAr: 'خدمات أمازون السحابية',
    date: '2024-03',
    credentialId: 'AWS-123456',
    link: 'https://aws.amazon.com/verification',
  },
  {
    id: '2',
    name: 'Google Data Analytics',
    nameAr: 'تحليل البيانات من جوجل',
    issuer: 'Google',
    issuerAr: 'جوجل',
    date: '2023-12',
    credentialId: 'GDA-789012',
  },
];

const skillCategories = ['Programming', 'Framework', 'Database', 'AI', 'Data', 'DevOps', 'Design'];

export default function TalentLedger() {
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const isRTL = language === 'ar';

  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  
  const [newSkill, setNewSkill] = useState({ name: '', nameAr: '', level: 50, category: 'Programming' });
  const [newProject, setNewProject] = useState({ title: '', titleAr: '', description: '', descriptionAr: '', technologies: '', link: '' });
  const [newCertificate, setNewCertificate] = useState({ name: '', nameAr: '', issuer: '', issuerAr: '', credentialId: '', link: '' });

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddCertificate, setShowAddCertificate] = useState(false);

  const texts = {
    title: isRTL ? 'سجل المواهب' : 'Talent Ledger',
    subtitle: isRTL ? 'وثّق مهاراتك وإنجازاتك' : 'Document your skills and achievements',
    skills: isRTL ? 'المهارات' : 'Skills',
    projects: isRTL ? 'المشاريع' : 'Projects',
    certificates: isRTL ? 'الشهادات' : 'Certificates',
    addSkill: isRTL ? 'إضافة مهارة' : 'Add Skill',
    addProject: isRTL ? 'إضافة مشروع' : 'Add Project',
    addCertificate: isRTL ? 'إضافة شهادة' : 'Add Certificate',
    export: isRTL ? 'تصدير' : 'Export',
    exportPDF: isRTL ? 'تصدير PDF' : 'Export PDF',
    exportLinkedIn: isRTL ? 'مشاركة على LinkedIn' : 'Share on LinkedIn',
    verified: isRTL ? 'موثقة' : 'Verified',
    name: isRTL ? 'الاسم' : 'Name',
    nameAr: isRTL ? 'الاسم بالعربية' : 'Arabic Name',
    level: isRTL ? 'المستوى' : 'Level',
    category: isRTL ? 'الفئة' : 'Category',
    description: isRTL ? 'الوصف' : 'Description',
    technologies: isRTL ? 'التقنيات' : 'Technologies',
    link: isRTL ? 'الرابط' : 'Link',
    issuer: isRTL ? 'الجهة المانحة' : 'Issuer',
    credentialId: isRTL ? 'رقم الشهادة' : 'Credential ID',
    save: isRTL ? 'حفظ' : 'Save',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    delete: isRTL ? 'حذف' : 'Delete',
    verifyQR: isRTL ? 'رمز التحقق QR' : 'QR Verification',
    totalSkills: isRTL ? 'إجمالي المهارات' : 'Total Skills',
    totalProjects: isRTL ? 'إجمالي المشاريع' : 'Total Projects',
    totalCertificates: isRTL ? 'إجمالي الشهادات' : 'Total Certificates',
  };

  const handleAddSkill = () => {
    if (!newSkill.name) return;
    const skill: Skill = {
      id: Date.now().toString(),
      ...newSkill,
      verified: false,
    };
    setSkills(prev => [...prev, skill]);
    setNewSkill({ name: '', nameAr: '', level: 50, category: 'Programming' });
    setShowAddSkill(false);
    toast({ title: isRTL ? 'تمت الإضافة' : 'Added', description: isRTL ? 'تمت إضافة المهارة بنجاح' : 'Skill added successfully' });
  };

  const handleAddProject = () => {
    if (!newProject.title) return;
    const project: Project = {
      id: Date.now().toString(),
      title: newProject.title,
      titleAr: newProject.titleAr,
      description: newProject.description,
      descriptionAr: newProject.descriptionAr,
      technologies: newProject.technologies.split(',').map(t => t.trim()),
      link: newProject.link || undefined,
      date: new Date().toISOString().slice(0, 7),
    };
    setProjects(prev => [...prev, project]);
    setNewProject({ title: '', titleAr: '', description: '', descriptionAr: '', technologies: '', link: '' });
    setShowAddProject(false);
    toast({ title: isRTL ? 'تمت الإضافة' : 'Added', description: isRTL ? 'تم إضافة المشروع بنجاح' : 'Project added successfully' });
  };

  const handleAddCertificate = () => {
    if (!newCertificate.name) return;
    const cert: Certificate = {
      id: Date.now().toString(),
      name: newCertificate.name,
      nameAr: newCertificate.nameAr,
      issuer: newCertificate.issuer,
      issuerAr: newCertificate.issuerAr,
      credentialId: newCertificate.credentialId || undefined,
      link: newCertificate.link || undefined,
      date: new Date().toISOString().slice(0, 7),
    };
    setCertificates(prev => [...prev, cert]);
    setNewCertificate({ name: '', nameAr: '', issuer: '', issuerAr: '', credentialId: '', link: '' });
    setShowAddCertificate(false);
    toast({ title: isRTL ? 'تمت الإضافة' : 'Added', description: isRTL ? 'تمت إضافة الشهادة بنجاح' : 'Certificate added successfully' });
  };

  const handleExportPDF = () => {
    toast({ title: isRTL ? 'جاري التصدير' : 'Exporting', description: isRTL ? 'جاري إعداد ملف PDF...' : 'Preparing PDF file...' });
    // In a real app, this would generate a PDF
    setTimeout(() => {
      toast({ title: isRTL ? 'تم التصدير' : 'Exported', description: isRTL ? 'تم تصدير سجل المواهب بنجاح' : 'Talent ledger exported successfully' });
    }, 1500);
  };

  const deleteSkill = (id: string) => setSkills(prev => prev.filter(s => s.id !== id));
  const deleteProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));
  const deleteCertificate = (id: string) => setCertificates(prev => prev.filter(c => c.id !== id));

  const getLevelColor = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-blue-500';
    if (level >= 40) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-secondary" />
              {texts.title}
            </h1>
            <p className="text-muted-foreground">{texts.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              {texts.exportPDF}
            </Button>
            <Button variant="outline" className="gap-2">
              <Linkedin className="h-4 w-4" />
              {texts.exportLinkedIn}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: texts.totalSkills, value: skills.length, icon: Code, color: 'bg-blue-500' },
            { label: texts.totalProjects, value: projects.length, icon: Briefcase, color: 'bg-green-500' },
            { label: texts.totalCertificates, value: certificates.length, icon: Award, color: 'bg-purple-500' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="skills" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="skills" className="gap-2">
              <Code className="h-4 w-4" />
              {texts.skills}
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Briefcase className="h-4 w-4" />
              {texts.projects}
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <Award className="h-4 w-4" />
              {texts.certificates}
            </TabsTrigger>
          </TabsList>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {texts.addSkill}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{texts.addSkill}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{texts.name}</Label>
                        <Input value={newSkill.name} onChange={e => setNewSkill(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>{texts.nameAr}</Label>
                        <Input value={newSkill.nameAr} onChange={e => setNewSkill(p => ({ ...p, nameAr: e.target.value }))} dir="rtl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{texts.category}</Label>
                      <Select value={newSkill.category} onValueChange={v => setNewSkill(p => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {skillCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{texts.level}: {newSkill.level}%</Label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={newSkill.level}
                        onChange={e => setNewSkill(p => ({ ...p, level: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddSkill(false)}>{texts.cancel}</Button>
                      <Button onClick={handleAddSkill}>{texts.save}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map(skill => (
                <motion.div key={skill.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="group hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {isRTL ? skill.nameAr || skill.name : skill.name}
                            {skill.verified && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </h4>
                          <Badge variant="secondary" className="mt-1 text-xs">{skill.category}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => deleteSkill(skill.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{texts.level}</span>
                          <span className="font-medium">{skill.level}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${getLevelColor(skill.level)} transition-all`} style={{ width: `${skill.level}%` }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {texts.addProject}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{texts.addProject}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{texts.name}</Label>
                        <Input value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>{texts.nameAr}</Label>
                        <Input value={newProject.titleAr} onChange={e => setNewProject(p => ({ ...p, titleAr: e.target.value }))} dir="rtl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{texts.description}</Label>
                      <Textarea value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{texts.technologies} ({isRTL ? 'مفصولة بفواصل' : 'comma separated'})</Label>
                      <Input value={newProject.technologies} onChange={e => setNewProject(p => ({ ...p, technologies: e.target.value }))} placeholder="React, Node.js, MongoDB" />
                    </div>
                    <div className="space-y-2">
                      <Label>{texts.link}</Label>
                      <Input value={newProject.link} onChange={e => setNewProject(p => ({ ...p, link: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddProject(false)}>{texts.cancel}</Button>
                      <Button onClick={handleAddProject}>{texts.save}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(project => (
                <motion.div key={project.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="group hover:shadow-md transition-all h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {isRTL ? project.titleAr || project.title : project.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {project.date}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {project.link && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={project.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProject(project.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {isRTL ? project.descriptionAr || project.description : project.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showAddCertificate} onOpenChange={setShowAddCertificate}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {texts.addCertificate}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{texts.addCertificate}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{texts.name}</Label>
                        <Input value={newCertificate.name} onChange={e => setNewCertificate(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>{texts.nameAr}</Label>
                        <Input value={newCertificate.nameAr} onChange={e => setNewCertificate(p => ({ ...p, nameAr: e.target.value }))} dir="rtl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{texts.issuer}</Label>
                        <Input value={newCertificate.issuer} onChange={e => setNewCertificate(p => ({ ...p, issuer: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>{texts.credentialId}</Label>
                        <Input value={newCertificate.credentialId} onChange={e => setNewCertificate(p => ({ ...p, credentialId: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{texts.link}</Label>
                      <Input value={newCertificate.link} onChange={e => setNewCertificate(p => ({ ...p, link: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddCertificate(false)}>{texts.cancel}</Button>
                      <Button onClick={handleAddCertificate}>{texts.save}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map(cert => (
                <motion.div key={cert.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="group hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                          <Award className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {isRTL ? cert.nameAr || cert.name : cert.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {isRTL ? cert.issuerAr || cert.issuer : cert.issuer}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {cert.date}
                            {cert.credentialId && (
                              <>
                                <span>•</span>
                                <span>{cert.credentialId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {cert.link && (
                          <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                            <a href={cert.link} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-3 w-3" />
                              {isRTL ? 'تحقق' : 'Verify'}
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-1">
                          <QrCode className="h-3 w-3" />
                          QR
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCertificate(cert.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
