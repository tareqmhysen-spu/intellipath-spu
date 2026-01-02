-- Add unique constraint on query_hash for cache upsert to work
CREATE UNIQUE INDEX IF NOT EXISTS idx_query_cache_hash_unique ON public.query_cache (query_hash);