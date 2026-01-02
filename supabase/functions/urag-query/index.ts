/**
 * IntelliPath URAG Query - Simplified Version
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Environment configuration | إعدادات البيئة
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_API_KEY = Deno.env.get("AI_API_KEY");
const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") || "https://api.openai.com/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function hashQuery(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash << 5) - hash + query.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { question, student_context, conversation_id, top_k = 5 } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: true, message: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const sanitized = question.trim().substring(0, 2000);
    const queryHash = hashQuery(sanitized);
    const isAr = isArabic(sanitized);

    // Check cache
    const { data: cached } = await supabase
      .from("query_cache")
      .select("*")
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .single() as any;

    if (cached) {
      console.log("[URAG] Cache HIT");
      return new Response(JSON.stringify({
        ...cached.response,
        cache_hit: true,
        latency_ms: Date.now() - startTime
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check FAQs
    const { data: faqs } = await supabase
      .from("faqs")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false }) as any;

    let faqMatch = null;
    if (faqs) {
      for (const faq of faqs) {
        const keywords = faq.keywords || [];
        const matches = keywords.filter((k: string) => 
          sanitized.toLowerCase().includes(k.toLowerCase())
        ).length;
        if (matches >= 2) {
          faqMatch = {
            answer: isAr ? (faq.answer_ar || faq.answer) : faq.answer,
            confidence: 0.9
          };
          break;
        }
      }
    }

    if (faqMatch) {
      const response = {
        answer: faqMatch.answer,
        sources: [],
        mode: "faq",
        confidence: faqMatch.confidence,
        cache_hit: false,
        faq_match: true,
        latency_ms: Date.now() - startTime
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Search courses
    const { data: courses } = await supabase
      .from("courses")
      .select("*")
      .eq("is_active", true)
      .limit(top_k) as any;

    const context = (courses || []).map((c: any) => 
      `${c.code}: ${isAr ? (c.name_ar || c.name) : c.name}\n${c.description || ""}`
    ).join("\n\n");

    const studentCtx = student_context 
      ? `Department: ${student_context.department || "N/A"}, Year: ${student_context.year_level || "N/A"}, GPA: ${student_context.gpa || "N/A"}`
      : "";

    // Generate AI response | توليد استجابة الذكاء الاصطناعي
    const systemPrompt = isAr
      ? `أنت "إنتيليباث"، مستشار أكاديمي ذكي. أجب بناءً على السياق المقدم فقط بلغة عربية واضحة.`
      : `You are "IntelliPath", an intelligent academic advisor. Answer based only on the provided context.`;

    const aiResponse = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Context:\n${context}\n\nStudent: ${studentCtx}\n\nQuestion: ${sanitized}` }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || (isAr ? "عذراً، لم أتمكن من الإجابة." : "Sorry, I couldn't answer.");

    const finalResponse = {
      answer,
      sources: (courses || []).slice(0, 3).map((c: any) => ({
        title: isAr ? (c.name_ar || c.name) : c.name,
        content: c.description?.substring(0, 150) || ""
      })),
      mode: "rag",
      confidence: 0.85,
      cache_hit: false,
      faq_match: false,
      latency_ms: Date.now() - startTime
    };

    // Cache response
    await supabase.from("query_cache").insert({
      query_hash: queryHash,
      query_text: sanitized,
      response: finalResponse,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    } as any);

    // Log analytics
    await supabase.from("chat_analytics").insert({
      query_text: sanitized,
      response_mode: "rag",
      cache_hit: false,
      latency_ms: finalResponse.latency_ms,
      sources_count: finalResponse.sources.length
    } as any);

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[URAG] Error:", error);
    return new Response(JSON.stringify({
      error: true,
      message: "An error occurred",
      message_ar: "حدث خطأ",
      latency_ms: Date.now() - startTime
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
