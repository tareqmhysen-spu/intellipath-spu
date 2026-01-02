import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

interface VectorSearchResponse {
  results: VectorSearchResult[];
  total: number;
  query: string;
  search_type: 'semantic' | 'keyword';
}

interface MetadataFilter {
  major?: string;
  year?: number;
  department?: string;
  course_id?: string;
}

/**
 * Hook for vector search operations (simulates Qdrant)
 * Provides semantic and hybrid search capabilities
 */
export function useVectorSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string,
    options?: {
      top_k?: number;
      metadata_filter?: MetadataFilter;
      use_hybrid?: boolean;
    }
  ): Promise<VectorSearchResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('vector-search', {
        body: {
          query,
          top_k: options?.top_k || 5,
          metadata_filter: options?.metadata_filter,
          use_hybrid: options?.use_hybrid ?? true
        }
      });

      if (fnError) throw fnError;
      return data as VectorSearchResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vector search failed';
      setError(message);
      console.error('Vector search error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchByDepartment = useCallback(async (
    query: string,
    department: string,
    top_k = 5
  ) => {
    return search(query, {
      top_k,
      metadata_filter: { department },
      use_hybrid: true
    });
  }, [search]);

  const searchByCourse = useCallback(async (
    query: string,
    course_id: string,
    top_k = 5
  ) => {
    return search(query, {
      top_k,
      metadata_filter: { course_id },
      use_hybrid: true
    });
  }, [search]);

  return {
    search,
    searchByDepartment,
    searchByCourse,
    isLoading,
    error
  };
}
