import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useLanguageStore } from '@/stores/languageStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import KnowledgeGraph from '@/pages/KnowledgeGraph';
import Achievements from '@/pages/Achievements';
import Courses from '@/pages/Courses';
import Profile from '@/pages/Profile';
import Career from '@/pages/Career';
import LearningStyle from '@/pages/LearningStyle';
import DecisionSimulator from '@/pages/DecisionSimulator';
import TalentLedger from '@/pages/TalentLedger';
import AdvisorDashboard from '@/pages/AdvisorDashboard';
import Admin from '@/pages/Admin';
import Messages from '@/pages/Messages';
import Deadlines from '@/pages/Deadlines';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';
import PeerMatching from '@/pages/PeerMatching';
import WellnessCheck from '@/pages/WellnessCheck';
import GpaCalculator from '@/pages/GpaCalculator';
import Analytics from '@/pages/Analytics';
import StudyMaterials from '@/pages/StudyMaterials';
import ChatAnalytics from '@/pages/ChatAnalytics';
import SyncManagement from '@/pages/SyncManagement';
import StudentSettings from '@/pages/StudentSettings';
import AcademicRecord from '@/pages/AcademicRecord';

const queryClient = new QueryClient();

function AppContent() {
  const { language } = useLanguageStore();
  useKeyboardShortcuts(); // Enable keyboard shortcuts

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/knowledge-graph" element={<ProtectedRoute><KnowledgeGraph /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
      <Route path="/career" element={<ProtectedRoute><Career /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/student-settings" element={<ProtectedRoute><StudentSettings /></ProtectedRoute>} />
      <Route path="/academic-record" element={<ProtectedRoute><AcademicRecord /></ProtectedRoute>} />
      <Route path="/learning-style" element={<ProtectedRoute><LearningStyle /></ProtectedRoute>} />
      <Route path="/simulator" element={<ProtectedRoute><DecisionSimulator /></ProtectedRoute>} />
      <Route path="/talent-ledger" element={<ProtectedRoute><TalentLedger /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/deadlines" element={<ProtectedRoute><Deadlines /></ProtectedRoute>} />
      <Route path="/advisor-dashboard" element={<ProtectedRoute allowedRoles={['advisor', 'admin']}><AdvisorDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
      <Route path="/peer-matching" element={<ProtectedRoute><PeerMatching /></ProtectedRoute>} />
      <Route path="/wellness" element={<ProtectedRoute><WellnessCheck /></ProtectedRoute>} />
      <Route path="/gpa-calculator" element={<ProtectedRoute><GpaCalculator /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/study-materials" element={<ProtectedRoute><StudyMaterials /></ProtectedRoute>} />
      <Route path="/chat-analytics" element={<ProtectedRoute allowedRoles={['advisor', 'admin']}><ChatAnalytics /></ProtectedRoute>} />
      <Route path="/sync-management" element={<ProtectedRoute allowedRoles={['admin']}><SyncManagement /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
