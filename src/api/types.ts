// IntelliPath API Types

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: 'student' | 'advisor' | 'admin';
}

export interface StudentRegisterRequest extends RegisterRequest {
  student_id: string;
  major: string;
  year: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'advisor' | 'admin';
  student_id?: string;
}

// Chat & RAG Types
export interface ChatQueryRequest {
  query: string;
  conversation_id?: string;
  filters?: {
    major?: string;
    year?: number;
    plan_version?: string;
  };
  use_memory?: boolean;
}

export interface ChatQueryResponse {
  answer: string;
  sources: Source[];
  conversation_id: string;
  confidence: number;
}

export interface Source {
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  sources?: Source[];
}

// Academic Types
export interface GPACalculateRequest {
  grades: GradeEntry[];
}

export interface GradeEntry {
  course_code: string;
  grade: number;
  credits: number;
}

export interface GPAResponse {
  gpa: number;
  total_credits: number;
  total_points: number;
  letter_grade: string;
  courses_count: number;
}

export interface AcademicPlanAnalysis {
  current_gpa: number;
  projected_gpa: number;
  remaining_credits: number;
  completed_credits: number;
  progress_percentage: number;
  recommendations: string[];
  warnings: string[];
}

export interface CriticalPathRequest {
  target_course: string;
  current_completed: string[];
}

export interface CriticalPathResponse {
  path: CourseNode[];
  total_semesters: number;
  total_credits: number;
}

export interface CourseNode {
  code: string;
  name: string;
  name_ar: string;
  credits: number;
  semester: number;
  prerequisites: string[];
}

export interface CoursePrerequisites {
  course_code: string;
  course_name: string;
  prerequisites: PrerequisiteCourse[];
  corequisites: PrerequisiteCourse[];
  dependents: PrerequisiteCourse[];
}

export interface PrerequisiteCourse {
  code: string;
  name: string;
  name_ar: string;
  credits: number;
}

// Simulator Types
export interface DropSimulationRequest {
  course_code: string;
  reason?: string;
}

export interface DropSimulationResponse {
  impact: {
    gpa_change: number;
    graduation_delay: number;
    affected_courses: string[];
  };
  recommendations: string[];
  warnings: string[];
}

export interface RetakeSimulationRequest {
  course_code: string;
  target_grade: number;
}

export interface RetakeSimulationResponse {
  impact: {
    new_gpa: number;
    gpa_improvement: number;
  };
  recommendations: string[];
}

export interface GradeProjectionRequest {
  scenarios: ScenarioInput[];
}

export interface ScenarioInput {
  name: string;
  courses: {
    code: string;
    expected_grade: number;
  }[];
}

export interface GradeProjectionResponse {
  scenarios: ScenarioResult[];
  best_scenario: string;
  worst_scenario: string;
}

export interface ScenarioResult {
  name: string;
  projected_gpa: number;
  probability: number;
}

// Predictions & Early Warning Types
export interface StudentRiskPrediction {
  student_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  factors: RiskFactor[];
  recommendations: string[];
  predicted_gpa: number;
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
  description: string;
}

export interface AtRiskDashboard {
  total_students: number;
  at_risk_count: number;
  high_risk_count: number;
  students: StudentRiskSummary[];
}

export interface StudentRiskSummary {
  student_id: string;
  name: string;
  risk_level: string;
  risk_score: number;
  gpa: number;
  major: string;
}

export interface TemporalRisk {
  student_id: string;
  history: RiskHistoryPoint[];
  trend: 'improving' | 'stable' | 'declining';
}

export interface RiskHistoryPoint {
  date: string;
  risk_score: number;
  gpa: number;
}

export interface InterventionRecommendation {
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  expected_impact: number;
}

// Wellness Types
export interface WellnessAnalysis {
  student_id: string;
  overall_score: number;
  dimensions: WellnessDimension[];
  alerts: WellnessAlert[];
  recommendations: string[];
}

export interface WellnessDimension {
  name: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface WellnessAlert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  created_at: string;
  acknowledged: boolean;
}

// Peer Matching Types
export interface PeerMatchRequest {
  course_codes?: string[];
  study_preferences?: string[];
  availability?: string[];
}

export interface PeerMatch {
  id: string;
  student_id: string;
  name: string;
  major: string;
  shared_courses: string[];
  compatibility_score: number;
  status: 'pending' | 'accepted' | 'declined';
}

// Learning Style Types
export interface LearningStyleAnalysis {
  primary_style: string;
  secondary_style: string;
  scores: LearningStyleScore[];
  recommendations: LearningResource[];
}

export interface LearningStyleScore {
  style: string;
  score: number;
  description: string;
}

export interface LearningResource {
  type: string;
  title: string;
  url?: string;
  description: string;
}

// Paths & Specializations Types
export interface Specialization {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  paths: AcademicPath[];
}

export interface AcademicPath {
  id: string;
  name: string;
  name_ar: string;
  courses: PathCourse[];
  total_credits: number;
}

export interface PathCourse {
  code: string;
  name: string;
  name_ar: string;
  credits: number;
  semester: number;
  is_required: boolean;
}

// Memory Types
export interface Memory {
  id: string;
  content: string;
  type: string;
  importance: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface MemorySearchRequest {
  query: string;
  limit?: number;
  type?: string;
}

export interface UserPreferences {
  language: 'ar' | 'en';
  notification_enabled: boolean;
  theme: 'light' | 'dark';
  custom: Record<string, unknown>;
}

// Gamification Types
export interface GamificationProfile {
  points: number;
  level: number;
  badges: Badge[];
  achievements: Achievement[];
  rank: number;
}

export interface Badge {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  student_id: string;
  name: string;
  points: number;
  level: number;
}

// Talent Ledger Types
export interface Skill {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  level: number;
  verified: boolean;
  certifications: Certification[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issued_at: string;
  expires_at?: string;
  url?: string;
}

// Jobs Types
export interface Job {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: unknown;
  error?: string;
  created_at: string;
  updated_at: string;
}

// Feedback Types
export interface FeedbackSubmission {
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  rating?: number;
}

export interface Feedback {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
  reply?: string;
}

// Analytics Types
export interface AnalyticsSummary {
  total_students: number;
  active_students: number;
  average_gpa: number;
  at_risk_percentage: number;
  chat_queries_today: number;
  popular_topics: TopicCount[];
}

export interface TopicCount {
  topic: string;
  count: number;
}

// Health Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  timestamp: string;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency_ms: number;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
