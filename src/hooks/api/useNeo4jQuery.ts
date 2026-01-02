import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Neo4jNode {
  id: string;
  code: string;
  name: string;
  name_ar?: string;
  credits: number;
  department: string;
  year_level: number;
  semester?: number;
  hours_theory?: number;
  hours_lab?: number;
  description?: string;
  objectives?: string[];
  major_ids?: string[];
  skills?: string[];
  topics?: string[];
  tools?: string[];
  career_paths?: string[];
}

interface Neo4jEdge {
  from_code: string;
  to_code: string;
  type?: string;
}

interface Neo4jMajor {
  id: string;
  name: string;
  name_en: string;
  description?: string;
  total_credits?: number;
}

interface FullGraphResponse {
  nodes: Neo4jNode[];
  edges: Neo4jEdge[];
  majors: Neo4jMajor[];
  total_nodes: number;
  total_edges: number;
}

interface MajorGraphResponse {
  nodes: Neo4jNode[];
  edges: Neo4jEdge[];
  major: Neo4jMajor | null;
  total_nodes: number;
  total_edges: number;
}

interface ImportAllResponse {
  courses: Neo4jNode[];
  prerequisites: Neo4jEdge[];
  majors: Neo4jMajor[];
  skills: { name: string; description?: string; category?: string }[];
  topics: { name: string; description?: string }[];
  tools: { name: string; description?: string; category?: string }[];
  career_paths: { name: string; name_en?: string; description?: string }[];
  stats: {
    courses: number;
    prerequisites: number;
    majors: number;
    skills: number;
    topics: number;
    tools: number;
    career_paths: number;
  };
}

/**
 * Hook for direct Neo4j database queries
 * Connects to real Neo4j Aura database
 */
export function useNeo4jQuery() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async <T>(
    operation: string,
    params?: Record<string, any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('neo4j-query', {
        body: { operation, ...params }
      });

      if (fnError) throw fnError;
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Extract from results array
      if (data.results && data.results.length > 0) {
        return data.results[0] as T;
      }
      
      return data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Neo4j query failed';
      setError(message);
      console.error('Neo4j query error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Execute raw Cypher query
   */
  const query = useCallback(async (cypher: string, params?: Record<string, any>) => {
    return executeQuery<{ results: any[] }>('query', { cypher, params });
  }, [executeQuery]);

  /**
   * Get list of all majors
   */
  const getMajors = useCallback(async (): Promise<Neo4jMajor[] | null> => {
    const result = await executeQuery<{ results: Neo4jMajor[] }>('get_majors');
    return result ? (result as any).results || result : null;
  }, [executeQuery]);

  /**
   * Get all courses
   */
  const getCourses = useCallback(async (): Promise<Neo4jNode[] | null> => {
    const result = await executeQuery<{ results: Neo4jNode[] }>('get_courses');
    return result ? (result as any).results || result : null;
  }, [executeQuery]);

  /**
   * Get all prerequisites relationships
   */
  const getPrerequisites = useCallback(async (): Promise<Neo4jEdge[] | null> => {
    const result = await executeQuery<{ results: Neo4jEdge[] }>('get_prerequisites');
    return result ? (result as any).results || result : null;
  }, [executeQuery]);

  /**
   * Get full graph with all courses and relationships
   */
  const getFullGraph = useCallback(async (): Promise<FullGraphResponse | null> => {
    return executeQuery<FullGraphResponse>('get_full_graph');
  }, [executeQuery]);

  /**
   * Get graph for a specific major
   */
  const getMajorGraph = useCallback(async (major_id: string): Promise<MajorGraphResponse | null> => {
    return executeQuery<MajorGraphResponse>('get_major_graph', { major_id });
  }, [executeQuery]);

  /**
   * Import all data from Neo4j (for syncing to Supabase)
   */
  const importAll = useCallback(async (): Promise<ImportAllResponse | null> => {
    return executeQuery<ImportAllResponse>('import_all');
  }, [executeQuery]);

  return {
    query,
    getMajors,
    getCourses,
    getPrerequisites,
    getFullGraph,
    getMajorGraph,
    importAll,
    isLoading,
    error
  };
}
