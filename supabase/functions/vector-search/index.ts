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

interface VectorSearchRequest {
  query: string;
  top_k?: number;
  metadata_filter?: {
    major?: string;
    year?: number;
    department?: string;
    course_id?: string;
  };
  use_hybrid?: boolean;
}

interface DocumentResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

// Simulates Qdrant vector search using AI embeddings + Supabase
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { query, top_k = 5, metadata_filter, use_hybrid = true }: VectorSearchRequest = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Vector search: "${query}", top_k: ${top_k}, hybrid: ${use_hybrid}`);

    // 1. Get documents from study_materials and courses
    let documentsQuery = supabase
      .from('study_materials')
      .select('id, title, content_text, metadata, course_id, file_type')
      .eq('is_processed', true);

    // Apply metadata filters
    if (metadata_filter?.course_id) {
      documentsQuery = documentsQuery.eq('course_id', metadata_filter.course_id);
    }

    const { data: materials, error: materialsError } = await documentsQuery.limit(100);

    // Get courses for additional context
    let coursesQuery = supabase
      .from('courses')
      .select('id, code, name, name_ar, description, description_ar, department, year_level, credits')
      .eq('is_active', true);

    if (metadata_filter?.department) {
      coursesQuery = coursesQuery.eq('department', metadata_filter.department);
    }
    if (metadata_filter?.year) {
      coursesQuery = coursesQuery.eq('year_level', metadata_filter.year);
    }

    const { data: courses, error: coursesError } = await coursesQuery.limit(50);

    if (materialsError) console.error("Materials error:", materialsError);
    if (coursesError) console.error("Courses error:", coursesError);

    // 2. Build document corpus
    const documents: { id: string; content: string; type: string; metadata: Record<string, any> }[] = [];

    // Add study materials
    if (materials) {
      for (const material of materials) {
        if (material.content_text) {
          documents.push({
            id: `material_${material.id}`,
            content: `${material.title}\n\n${material.content_text}`,
            type: 'study_material',
            metadata: {
              title: material.title,
              file_type: material.file_type,
              course_id: material.course_id,
              ...(material.metadata as Record<string, any> || {})
            }
          });
        }
      }
    }

    // Add courses as documents
    if (courses) {
      for (const course of courses) {
        const content = `
          Course: ${course.code} - ${course.name}
          Arabic: ${course.name_ar || ''}
          Department: ${course.department}
          Year Level: ${course.year_level}
          Credits: ${course.credits}
          Description: ${course.description || ''}
          Arabic Description: ${course.description_ar || ''}
        `.trim();

        documents.push({
          id: `course_${course.id}`,
          content,
          type: 'course',
          metadata: {
            code: course.code,
            name: course.name,
            department: course.department,
            year_level: course.year_level,
            credits: course.credits
          }
        });
      }
    }

    if (documents.length === 0) {
      return new Response(
        JSON.stringify({
          results: [],
          total: 0,
          query,
          message: "No documents found"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Use AI for semantic ranking (simulating vector similarity) | استخدام الذكاء الاصطناعي للترتيب الدلالي
    if (!AI_API_KEY) {
      // Fallback: Simple keyword matching | البديل: المطابقة البسيطة للكلمات المفتاحية
      const queryLower = query.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);

      const scoredDocs = documents.map(doc => {
        const contentLower = doc.content.toLowerCase();
        let score = 0;

        for (const term of queryTerms) {
          if (contentLower.includes(term)) {
            score += 1;
          }
        }

        // Boost exact phrase match
        if (contentLower.includes(queryLower)) {
          score += 5;
        }

        return { ...doc, score: score / (queryTerms.length + 1) };
      });

      const results = scoredDocs
        .filter(d => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, top_k)
        .map(d => ({
          id: d.id,
          content: d.content.substring(0, 500),
          score: d.score,
          metadata: d.metadata
        }));

      return new Response(
        JSON.stringify({
          results,
          total: results.length,
          query,
          search_type: 'keyword'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI for semantic ranking | استخدام الذكاء الاصطناعي للترتيب الدلالي
    const rankingPrompt = `You are a document ranking system. Given a query and a list of documents, rank them by relevance.

Query: "${query}"

Documents:
${documents.slice(0, 20).map((doc, i) => `[${i}] ${doc.content.substring(0, 300)}`).join('\n\n')}

Return ONLY a JSON array of the top ${top_k} most relevant document indices with scores, like:
[{"index": 0, "score": 0.95}, {"index": 3, "score": 0.87}]

Consider semantic similarity, not just keyword matching. Return valid JSON only.`;

    const aiResponse = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: rankingPrompt }],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI ranking failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rankingText = aiData.choices?.[0]?.message?.content || "[]";

    // Parse ranking results
    let rankings: { index: number; score: number }[] = [];
    try {
      const jsonMatch = rankingText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        rankings = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse rankings:", e);
    }

    // Build final results
    const results: DocumentResult[] = rankings
      .filter(r => r.index >= 0 && r.index < documents.length)
      .slice(0, top_k)
      .map(r => {
        const doc = documents[r.index];
        return {
          id: doc.id,
          content: doc.content.substring(0, 500),
          score: r.score,
          metadata: doc.metadata
        };
      });

    return new Response(
      JSON.stringify({
        results,
        total: results.length,
        query,
        search_type: 'semantic'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Vector search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Search failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
