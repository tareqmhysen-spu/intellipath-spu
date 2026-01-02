import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CacheRequest {
  operation: 'get' | 'set' | 'delete' | 'check_rate_limit' | 'clear_expired';
  key?: string;
  value?: any;
  ttl_seconds?: number;
  metadata_filter?: Record<string, any>;
  user_id?: string;
  endpoint?: string;
  limit?: number;
  window_seconds?: number;
}

// Simulates Redis cache using query_cache and rate_limits tables
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const request: CacheRequest = await req.json();
    const { operation } = request;

    console.log(`Cache operation: ${operation}`);

    switch (operation) {
      case 'get': {
        const { key, metadata_filter } = request;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "Key is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash the key
        const encoder = new TextEncoder();
        const data = encoder.encode(key);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const queryHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Check cache
        const { data: cached, error } = await supabase
          .from('query_cache')
          .select('*')
          .eq('query_hash', queryHash)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (error) throw error;

        if (cached) {
          // Increment hit count
          await supabase
            .from('query_cache')
            .update({ hit_count: (cached.hit_count || 0) + 1 })
            .eq('id', cached.id);

          return new Response(
            JSON.stringify({
              hit: true,
              value: cached.response,
              hit_count: cached.hit_count,
              created_at: cached.created_at
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ hit: false, value: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'set': {
        const { key, value, ttl_seconds = 600, metadata_filter } = request;
        if (!key || value === undefined) {
          return new Response(
            JSON.stringify({ error: "Key and value are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash the key
        const encoder = new TextEncoder();
        const data = encoder.encode(key);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const queryHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const expiresAt = new Date(Date.now() + ttl_seconds * 1000).toISOString();

        // Upsert cache entry
        const { error } = await supabase
          .from('query_cache')
          .upsert({
            query_hash: queryHash,
            query_text: key,
            response: value,
            metadata_filter: metadata_filter || null,
            expires_at: expiresAt,
            hit_count: 1
          }, {
            onConflict: 'query_hash'
          });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, expires_at: expiresAt }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'delete': {
        const { key } = request;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "Key is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash the key
        const encoder = new TextEncoder();
        const data = encoder.encode(key);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const queryHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const { error } = await supabase
          .from('query_cache')
          .delete()
          .eq('query_hash', queryHash);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, deleted: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'check_rate_limit': {
        const { user_id, endpoint = 'default', limit = 10, window_seconds = 60 } = request;
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "user_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const windowStart = new Date(Date.now() - window_seconds * 1000).toISOString();

        // Check existing rate limit record
        const { data: existing, error: fetchError } = await supabase
          .from('rate_limits')
          .select('*')
          .eq('user_id', user_id)
          .eq('endpoint', endpoint)
          .gte('window_start', windowStart)
          .maybeSingle();

        if (fetchError) {
          console.error("Rate limit fetch error:", fetchError);
          throw fetchError;
        }

        if (existing) {
          const currentCount = existing.request_count || 0;
          const allowed = currentCount < limit;
          const remaining = Math.max(0, limit - currentCount - 1);

          if (allowed) {
            // Increment counter
            await supabase
              .from('rate_limits')
              .update({ request_count: currentCount + 1 })
              .eq('id', existing.id);
          }

          return new Response(
            JSON.stringify({
              allowed,
              current: currentCount + 1,
              limit,
              remaining,
              reset_at: new Date(new Date(existing.window_start).getTime() + window_seconds * 1000).toISOString()
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Use upsert to handle race conditions - use the RPC function if available
        try {
          // Try using the database function first
          const { error: rpcError } = await supabase.rpc('upsert_rate_limit', {
            p_user_id: user_id,
            p_endpoint: endpoint,
            p_request_count: 1
          });

          if (rpcError) {
            console.log("RPC not available, using fallback:", rpcError.message);
            // Fallback: Try insert, if it fails due to constraint, fetch and update
            const { error: insertError } = await supabase
              .from('rate_limits')
              .insert({
                user_id,
                endpoint,
                request_count: 1,
                window_start: new Date().toISOString()
              });

            if (insertError) {
              // Constraint violation - record exists, fetch and update
              if (insertError.code === '23505') {
                const { data: existingRecord } = await supabase
                  .from('rate_limits')
                  .select('*')
                  .eq('user_id', user_id)
                  .eq('endpoint', endpoint)
                  .maybeSingle();

                if (existingRecord) {
                  await supabase
                    .from('rate_limits')
                    .update({ 
                      request_count: (existingRecord.request_count || 0) + 1,
                      window_start: new Date().toISOString()
                    })
                    .eq('id', existingRecord.id);
                }
              } else {
                throw insertError;
              }
            }
          }
        } catch (upsertError) {
          console.error("Upsert error:", upsertError);
          // Continue anyway - rate limiting is not critical
        }

        return new Response(
          JSON.stringify({
            allowed: true,
            current: 1,
            limit,
            remaining: limit - 1,
            reset_at: new Date(Date.now() + window_seconds * 1000).toISOString()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'clear_expired': {
        // Delete expired cache entries
        const { error: cacheError } = await supabase
          .from('query_cache')
          .delete()
          .lt('expires_at', new Date().toISOString());

        // Delete old rate limit records (older than 1 hour)
        const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
        const { error: rateError } = await supabase
          .from('rate_limits')
          .delete()
          .lt('window_start', oneHourAgo);

        if (cacheError) console.error("Cache cleanup error:", cacheError);
        if (rateError) console.error("Rate limit cleanup error:", rateError);

        return new Response(
          JSON.stringify({ success: true, cleaned: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error) {
    console.error("Cache error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Operation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
