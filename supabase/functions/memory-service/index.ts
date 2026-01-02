import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment configuration | إعدادات البيئة
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_API_KEY = Deno.env.get("AI_API_KEY");
const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") || "https://api.openai.com/v1";

type MemoryType = 'fact' | 'preference' | 'context' | 'skill' | 'goal' | 'interaction';

interface Memory {
  id?: string;
  user_id: string;
  memory_type: MemoryType;
  summary: string;
  content?: Record<string, any>;
  importance?: number;
  expires_at?: string;
}

interface MemoryRequest {
  operation: 'store' | 'retrieve' | 'update' | 'delete' | 'search';
  user_id: string;
  memory?: Memory;
  memory_id?: string;
  query?: string;
  top_k?: number;
  memory_types?: MemoryType[];
}

// Long-term memory service for personalized responses
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const request: MemoryRequest = await req.json();
    const { operation, user_id } = request;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Memory operation: ${operation} for user: ${user_id}`);

    switch (operation) {
      case 'store': {
        const { memory } = request;
        if (!memory || !memory.summary || !memory.memory_type) {
          return new Response(
            JSON.stringify({ error: "memory with summary and memory_type is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from('user_memories')
          .insert({
            user_id,
            memory_type: memory.memory_type,
            summary: memory.summary,
            content: memory.content || null,
            importance: memory.importance || 0.5,
            expires_at: memory.expires_at || null,
            access_count: 0
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, memory: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'retrieve': {
        const { memory_types, top_k = 10 } = request;

        let query = supabase
          .from('user_memories')
          .select('*')
          .eq('user_id', user_id)
          .order('importance', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(top_k);

        if (memory_types && memory_types.length > 0) {
          query = query.in('memory_type', memory_types);
        }

        // Exclude expired memories
        query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

        const { data: memories, error } = await query;

        if (error) throw error;

        // Update access counts
        if (memories && memories.length > 0) {
          for (const memory of memories) {
            await supabase
              .from('user_memories')
              .update({
                access_count: (memory.access_count || 0) + 1,
                last_accessed_at: new Date().toISOString()
              })
              .eq('id', memory.id);
          }
        }

        return new Response(
          JSON.stringify({ memories: memories || [], total: memories?.length || 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'search': {
        const { query: searchQuery, top_k = 5, memory_types } = request;
        if (!searchQuery) {
          return new Response(
            JSON.stringify({ error: "query is required for search" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all user memories
        let memoryQuery = supabase
          .from('user_memories')
          .select('*')
          .eq('user_id', user_id)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

        if (memory_types && memory_types.length > 0) {
          memoryQuery = memoryQuery.in('memory_type', memory_types);
        }

        const { data: memories, error } = await memoryQuery;

        if (error) throw error;

        if (!memories || memories.length === 0) {
          return new Response(
            JSON.stringify({ memories: [], total: 0 }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Use AI for semantic search if available | استخدام الذكاء الاصطناعي للبحث الدلالي
        if (AI_API_KEY && memories.length > 5) {
          const searchPrompt = `Given the search query and list of user memories, return the indices of the most relevant memories.

Query: "${searchQuery}"

Memories:
${memories.map((m, i) => `[${i}] Type: ${m.memory_type} | Summary: ${m.summary}`).join('\n')}

Return ONLY a JSON array of the top ${top_k} most relevant memory indices, like: [0, 3, 5]
Consider semantic similarity. Return valid JSON only.`;

          try {
            const aiResponse = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${AI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [{ role: "user", content: searchPrompt }],
                temperature: 0.1,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const resultText = aiData.choices?.[0]?.message?.content || "[]";
              const jsonMatch = resultText.match(/\[[\d,\s]*\]/);
              
              if (jsonMatch) {
                const indices: number[] = JSON.parse(jsonMatch[0]);
                const relevantMemories = indices
                  .filter(i => i >= 0 && i < memories.length)
                  .slice(0, top_k)
                  .map(i => memories[i]);

                return new Response(
                  JSON.stringify({ memories: relevantMemories, total: relevantMemories.length, search_type: 'semantic' }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }
          } catch (e) {
            console.error("AI search failed, falling back to keyword:", e);
          }
        }

        // Fallback: keyword matching
        const queryLower = searchQuery.toLowerCase();
        const scored = memories.map(m => {
          const summaryLower = m.summary.toLowerCase();
          let score = 0;
          
          if (summaryLower.includes(queryLower)) score += 3;
          
          const queryTerms = queryLower.split(/\s+/);
          for (const term of queryTerms) {
            if (term.length > 2 && summaryLower.includes(term)) score += 1;
          }
          
          // Boost by importance
          score *= (1 + (m.importance || 0.5));
          
          return { ...m, score };
        });

        const relevant = scored
          .filter(m => m.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, top_k);

        return new Response(
          JSON.stringify({ memories: relevant, total: relevant.length, search_type: 'keyword' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'update': {
        const { memory_id, memory } = request;
        if (!memory_id) {
          return new Response(
            JSON.stringify({ error: "memory_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
        if (memory?.summary) updateData.summary = memory.summary;
        if (memory?.content) updateData.content = memory.content;
        if (memory?.importance !== undefined) updateData.importance = memory.importance;
        if (memory?.memory_type) updateData.memory_type = memory.memory_type;
        if (memory?.expires_at) updateData.expires_at = memory.expires_at;

        const { data, error } = await supabase
          .from('user_memories')
          .update(updateData)
          .eq('id', memory_id)
          .eq('user_id', user_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, memory: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'delete': {
        const { memory_id } = request;
        if (!memory_id) {
          return new Response(
            JSON.stringify({ error: "memory_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from('user_memories')
          .delete()
          .eq('id', memory_id)
          .eq('user_id', user_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, deleted: true }),
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
    console.error("Memory error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Operation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
