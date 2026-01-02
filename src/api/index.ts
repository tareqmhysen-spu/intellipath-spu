// IntelliPath API - Main Export
export { apiClient } from './client';
export { API_CONFIG, getApiUrl } from './config';

// Endpoint APIs
export { authApi } from './endpoints/auth';
export { chatApi } from './endpoints/chat';
export { academicApi } from './endpoints/academic';
export { simulatorApi } from './endpoints/simulator';
export { predictionsApi } from './endpoints/predictions';
export { wellnessApi } from './endpoints/wellness';
export { peerMatchingApi } from './endpoints/peerMatching';
export { learningStyleApi } from './endpoints/learningStyle';
export { pathsApi } from './endpoints/paths';
export { memoryApi } from './endpoints/memory';
export { gamificationApi } from './endpoints/gamification';
export { talentLedgerApi } from './endpoints/talentLedger';
export { jobsApi } from './endpoints/jobs';
export { feedbackApi } from './endpoints/feedback';
export { healthApi } from './endpoints/health';

// Types
export * from './types';
