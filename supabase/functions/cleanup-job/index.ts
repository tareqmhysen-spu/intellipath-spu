import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting memory cleanup job...");

    // Call the cleanup function
    const { data, error } = await supabase.rpc('get_cleanup_stats');

    if (error) {
      console.error("Cleanup error:", error);
      throw error;
    }

    console.log("Cleanup completed:", data);

    // Also clean up old rate limits (older than 24 hours)
    const { error: rateLimitError, count: rateLimitCount } = await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (rateLimitError) {
      console.warn("Rate limit cleanup warning:", rateLimitError);
    }

    // Clean up old query cache (expired entries)
    const { error: cacheError, count: cacheCount } = await supabase
      .from('query_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (cacheError) {
      console.warn("Cache cleanup warning:", cacheError);
    }

    const result = {
      success: true,
      memories: data,
      rate_limits_cleaned: rateLimitCount || 0,
      cache_cleaned: cacheCount || 0,
      executed_at: new Date().toISOString()
    };

    console.log("Full cleanup result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in cleanup-job:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
