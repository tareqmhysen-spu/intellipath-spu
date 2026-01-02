import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

type MemoryType = 'fact' | 'preference' | 'context' | 'skill' | 'goal' | 'interaction';

interface Memory {
  id?: string;
  user_id: string;
  memory_type: MemoryType;
  summary: string;
  content?: Record<string, any>;
  importance?: number;
  expires_at?: string;
  access_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface MemoriesResponse {
  memories: Memory[];
  total: number;
  search_type?: 'semantic' | 'keyword';
}

/**
 * Hook for long-term memory operations
 * Stores user preferences, facts, and context for personalized responses
 */
export function useMemoryService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const executeOperation = useCallback(async <T>(
    operation: string,
    params?: Record<string, any>
  ): Promise<T | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('memory-service', {
        body: { operation, user_id: user.id, ...params }
      });

      if (fnError) throw fnError;
      return data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Memory operation failed';
      setError(message);
      console.error('Memory error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Store a new memory
   */
  const storeMemory = useCallback(async (
    memory_type: MemoryType,
    summary: string,
    content?: Record<string, any>,
    importance = 0.5,
    expires_at?: string
  ): Promise<Memory | null> => {
    const result = await executeOperation<{ success: boolean; memory: Memory }>('store', {
      memory: { memory_type, summary, content, importance, expires_at }
    });
    return result?.memory || null;
  }, [executeOperation]);

  /**
   * Retrieve memories by type
   */
  const getMemories = useCallback(async (
    memory_types?: MemoryType[],
    top_k = 10
  ): Promise<Memory[]> => {
    const result = await executeOperation<MemoriesResponse>('retrieve', {
      memory_types,
      top_k
    });
    return result?.memories || [];
  }, [executeOperation]);

  /**
   * Search memories semantically
   */
  const searchMemories = useCallback(async (
    query: string,
    memory_types?: MemoryType[],
    top_k = 5
  ): Promise<MemoriesResponse | null> => {
    return executeOperation<MemoriesResponse>('search', {
      query,
      memory_types,
      top_k
    });
  }, [executeOperation]);

  /**
   * Update an existing memory
   */
  const updateMemory = useCallback(async (
    memory_id: string,
    updates: Partial<Pick<Memory, 'summary' | 'content' | 'importance' | 'memory_type' | 'expires_at'>>
  ): Promise<Memory | null> => {
    const result = await executeOperation<{ success: boolean; memory: Memory }>('update', {
      memory_id,
      memory: updates
    });
    return result?.memory || null;
  }, [executeOperation]);

  /**
   * Delete a memory
   */
  const deleteMemory = useCallback(async (memory_id: string): Promise<boolean> => {
    const result = await executeOperation<{ success: boolean }>('delete', { memory_id });
    return result?.success || false;
  }, [executeOperation]);

  // Convenience methods for specific memory types

  /**
   * Store a fact about the user
   */
  const storeFact = useCallback(async (
    summary: string,
    content?: Record<string, any>
  ) => storeMemory('fact', summary, content, 0.7), [storeMemory]);

  /**
   * Store a user preference
   */
  const storePreference = useCallback(async (
    summary: string,
    content?: Record<string, any>
  ) => storeMemory('preference', summary, content, 0.8), [storeMemory]);

  /**
   * Store a user goal
   */
  const storeGoal = useCallback(async (
    summary: string,
    content?: Record<string, any>
  ) => storeMemory('goal', summary, content, 0.9), [storeMemory]);

  /**
   * Store an interaction summary
   */
  const storeInteraction = useCallback(async (
    summary: string,
    content?: Record<string, any>
  ) => storeMemory('interaction', summary, content, 0.3), [storeMemory]);

  /**
   * Get context for RAG queries
   */
  const getContextForQuery = useCallback(async (
    query: string
  ): Promise<string> => {
    const result = await searchMemories(query, undefined, 5);
    if (!result?.memories?.length) return '';

    return result.memories
      .map(m => `- [${m.memory_type}] ${m.summary}`)
      .join('\n');
  }, [searchMemories]);

  return {
    storeMemory,
    getMemories,
    searchMemories,
    updateMemory,
    deleteMemory,
    // Convenience methods
    storeFact,
    storePreference,
    storeGoal,
    storeInteraction,
    getContextForQuery,
    isLoading,
    error
  };
}
