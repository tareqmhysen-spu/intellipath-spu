// =============================================================================
// IntelliPath API Hooks | خطافات API لـ IntelliPath
// =============================================================================

// Core IntelliPath Hooks | الخطافات الأساسية
export { useIntelliPathAuth } from './useIntelliPathAuth';
export { useIntelliPathChat } from './useIntelliPathChat';
export { useIntelliPathAcademic } from './useIntelliPathAcademic';
export { useIntelliPathPredictions } from './useIntelliPathPredictions';
export { useIntelliPathWellness } from './useIntelliPathWellness';
export { useIntelliPathPeerMatching } from './useIntelliPathPeerMatching';
export { useIntelliPathGamification } from './useIntelliPathGamification';

// Backend Hooks (using Supabase Edge Functions) | خطافات الباكند
export { useAgenticChat } from './useAgenticChat';
export { useAcademicAnalysis } from './useAcademicAnalysis';

// URAG System Hooks
export { useURAGChat } from './useURAGChat';
export { useStudyMaterials } from './useStudyMaterials';

// Database Service Hooks (Qdrant, Neo4j, Redis simulation)
export { useVectorSearch } from './useVectorSearch';
export { useGraphQuery } from './useGraphQuery';
export { useNeo4jQuery } from './useNeo4jQuery';
export { useCacheService } from './useCacheService';
export { useMemoryService } from './useMemoryService';
