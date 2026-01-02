import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GraphNode {
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
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'REQUIRES';
}

interface Major {
  id: string;
  name: string;
  name_en: string;
  description?: string;
  total_credits?: number;
  duration_years?: number;
}

interface PrerequisitesResponse {
  course: GraphNode;
  prerequisites: GraphNode[];
  total: number;
}

interface DependentsResponse {
  course: GraphNode;
  dependents: GraphNode[];
  total: number;
}

interface PathResponse {
  from: GraphNode;
  to: GraphNode;
  path: GraphNode[];
  exists: boolean;
}

interface CriticalPathResponse {
  course: GraphNode;
  critical_path: GraphNode[];
  length: number;
  total_credits: number;
}

interface FullGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  major?: Major;
}

interface MajorsListResponse {
  majors: Major[];
}

/**
 * Hook for graph queries (simulates Neo4j)
 * Provides course prerequisites and dependency analysis
 */
export function useGraphQuery() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async <T>(
    operation: string,
    params?: Record<string, any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-query', {
        body: { operation, ...params }
      });

      if (fnError) throw fnError;
      return data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Graph query failed';
      setError(message);
      console.error('Graph query error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get list of all majors/specializations
   */
  const getMajorsList = useCallback(async (): Promise<MajorsListResponse | null> => {
    return executeQuery<MajorsListResponse>('majors_list');
  }, [executeQuery]);

  /**
   * Get all prerequisites for a course (recursive)
   */
  const getPrerequisites = useCallback(async (
    course_code: string
  ): Promise<PrerequisitesResponse | null> => {
    return executeQuery<PrerequisitesResponse>('prerequisites', { course_code });
  }, [executeQuery]);

  /**
   * Get all courses that depend on a course
   */
  const getDependents = useCallback(async (
    course_code: string
  ): Promise<DependentsResponse | null> => {
    return executeQuery<DependentsResponse>('dependents', { course_code });
  }, [executeQuery]);

  /**
   * Find path between two courses
   */
  const findPath = useCallback(async (
    course_code: string,
    target_code: string
  ): Promise<PathResponse | null> => {
    return executeQuery<PathResponse>('path', { course_code, target_code });
  }, [executeQuery]);

  /**
   * Get critical (longest) path to a course
   */
  const getCriticalPath = useCallback(async (
    course_code: string
  ): Promise<CriticalPathResponse | null> => {
    return executeQuery<CriticalPathResponse>('critical_path', { course_code });
  }, [executeQuery]);

  /**
   * Get full prerequisite graph
   */
  const getFullGraph = useCallback(async (
    department?: string
  ): Promise<FullGraphResponse | null> => {
    return executeQuery<FullGraphResponse>('full_graph', { department });
  }, [executeQuery]);

  /**
   * Get graph for a specific major/specialization
   */
  const getMajorGraph = useCallback(async (
    major_id: string
  ): Promise<FullGraphResponse | null> => {
    return executeQuery<FullGraphResponse>('major_graph', { major_id });
  }, [executeQuery]);

  return {
    getMajorsList,
    getPrerequisites,
    getDependents,
    findPath,
    getCriticalPath,
    getFullGraph,
    getMajorGraph,
    isLoading,
    error
  };
}
