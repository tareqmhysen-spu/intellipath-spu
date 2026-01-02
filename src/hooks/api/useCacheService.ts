import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheGetResponse {
  hit: boolean;
  value: any;
  hit_count?: number;
  created_at?: string;
}

interface CacheSetResponse {
  success: boolean;
  expires_at: string;
}

interface RateLimitResponse {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  reset_at: string;
}

/**
 * Hook for cache operations (simulates Redis)
 * Provides caching and rate limiting functionality
 */
export function useCacheService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOperation = useCallback(async <T>(
    operation: string,
    params?: Record<string, any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('cache-service', {
        body: { operation, ...params }
      });

      if (fnError) throw fnError;
      return data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cache operation failed';
      setError(message);
      console.error('Cache error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get cached value by key
   */
  const get = useCallback(async (
    key: string,
    metadata_filter?: Record<string, any>
  ): Promise<CacheGetResponse | null> => {
    return executeOperation<CacheGetResponse>('get', { key, metadata_filter });
  }, [executeOperation]);

  /**
   * Set cached value with TTL
   */
  const set = useCallback(async (
    key: string,
    value: any,
    ttl_seconds = 600,
    metadata_filter?: Record<string, any>
  ): Promise<CacheSetResponse | null> => {
    return executeOperation<CacheSetResponse>('set', { 
      key, 
      value, 
      ttl_seconds,
      metadata_filter 
    });
  }, [executeOperation]);

  /**
   * Delete cached value
   */
  const del = useCallback(async (key: string): Promise<boolean> => {
    const result = await executeOperation<{ success: boolean }>('delete', { key });
    return result?.success || false;
  }, [executeOperation]);

  /**
   * Check rate limit for user/endpoint
   */
  const checkRateLimit = useCallback(async (
    user_id: string,
    endpoint = 'default',
    limit = 10,
    window_seconds = 60
  ): Promise<RateLimitResponse | null> => {
    return executeOperation<RateLimitResponse>('check_rate_limit', {
      user_id,
      endpoint,
      limit,
      window_seconds
    });
  }, [executeOperation]);

  /**
   * Clear expired cache entries
   */
  const clearExpired = useCallback(async (): Promise<boolean> => {
    const result = await executeOperation<{ success: boolean }>('clear_expired', {});
    return result?.success || false;
  }, [executeOperation]);

  /**
   * Helper: Get or set cache (fetch if not cached)
   */
  const getOrSet = useCallback(async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl_seconds = 600
  ): Promise<T | null> => {
    // Check cache first
    const cached = await get(key);
    if (cached?.hit) {
      return cached.value as T;
    }

    // Fetch and cache
    try {
      const value = await fetchFn();
      await set(key, value, ttl_seconds);
      return value;
    } catch (err) {
      console.error('GetOrSet error:', err);
      return null;
    }
  }, [get, set]);

  return {
    get,
    set,
    del,
    checkRateLimit,
    clearExpired,
    getOrSet,
    isLoading,
    error
  };
}
