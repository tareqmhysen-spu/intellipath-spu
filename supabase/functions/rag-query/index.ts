import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// ERROR HANDLING
// =============================================================================
function createErrorResponse(code: string, message: string, message_ar: string, status: number) {
  return new Response(
    JSON.stringify({ error: { code, message, message_ar } }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// =============================================================================
// INPUT VALIDATION
// =============================================================================
const StudentContextSchema = z.object({
  gpa: z.number().min(0).max(4).optional(),
  department: z.string().max(100).optional(),
  year_level: z.number().min(1).max(6).optional(),
}).optional();

const FiltersSchema = z.object({
  department: z.string().max(100).optional(),
  year_level: z.number().min(1).max(6).optional(),
}).optional();

const RequestSchema = z.object({
  query: z.string().min(1).max(2000).transform(s => s.trim()),
  conversation_id: z.string().uuid().optional(),
  filters: FiltersSchema,
  use_hybrid_search: z.boolean().default(true),
  top_k: z.number().min(1).max(20).default(5),
  student_context: StudentContextSchema,
});

// =============================================================================
// RAG SYSTEM PROMPT
// =============================================================================
const RAG_SYSTEM_PROMPT = `أنت "IntelliPath" - المستشار الأكاديمي الذكي للجامعة السورية الخاصة.

## مهمتك:
استخدم المعلومات المقدمة في السياق للإجابة على أسئلة الطالب بدقة.

## قواعد مهمة:
1. اعتمد فقط على المعلومات الموجودة في السياق
2. إذا لم تجد المعلومة في السياق، قل ذلك بوضوح
3. قدم إجابات منظمة وواضحة
4. استخدم التنسيق المناسب (قوائم، عناوين)
5. أضف نصائح عملية عند الإمكان

## السياق المتاح:
{context}

## ملاحظة:
إذا كان السؤال خارج نطاق المعلومات المتاحة، اعترف بذلك واقترح مصادر بديلة.`;

// =============================================================================
// SEARCH FUNCTIONS
// =============================================================================

// Sanitize search input to prevent injection
function sanitizeSearchInput(input: string): string {
  return input
    .trim()
    .slice(0, 200)
    .replace(/[%_\\'"]/g, '') // Remove SQL special chars
    .replace(/\s+/g, ' '); // Normalize whitespace
}

async function searchDocuments(query: string, supabase: any, filters?: z.infer<typeof FiltersSchema>, limit = 10) {
  const sanitized = sanitizeSearchInput(query);
  const keywords = sanitized.split(/\s+/).filter(k => k.length > 2);
  
  let queryBuilder = supabase
    .from('courses')
    .select('code, name, name_ar, description, description_ar, credits, year_level, department')
    .eq('is_active', true);
  
  // Apply text search
  if (keywords.length > 0) {
    const searchConditions = keywords.map(keyword => 
      `name.ilike.%${keyword}%,name_ar.ilike.%${keyword}%,description.ilike.%${keyword}%,description_ar.ilike.%${keyword}%,code.ilike.%${keyword}%`
    ).join(',');
    queryBuilder = queryBuilder.or(searchConditions);
  }
  
  // Apply filters
  if (filters?.department) {
    queryBuilder = queryBuilder.eq('department', sanitizeSearchInput(filters.department));
  }
  if (filters?.year_level) {
    queryBuilder = queryBuilder.eq('year_level', filters.year_level);
  }
  
  const { data, error } = await queryBuilder.limit(limit);
  
  if (error) {
    console.error("Search error:", error);
    return [];
  }
  
  return data || [];
}

function buildContext(documents: any[]): string {
  if (!documents || documents.length === 0) {
    return "لا توجد وثائق متاحة للسؤال المطروح.";
  }
  
  return documents.map((doc, index) => `
### المقرر ${index + 1}: ${doc.name_ar || doc.name} (${doc.code})
- القسم: ${doc.department}
- السنة: ${doc.year_level}
- الساعات المعتمدة: ${doc.credits}
- الوصف: ${doc.description_ar || doc.description || 'غير متوفر'}
`).join('\n');
}

// Query expansion for better search
function expandQuery(query: string): string[] {
  const expansions: string[] = [query];
  
  const courseKeywords: Record<string, string[]> = {
    'برمجة': ['programming', 'بايثون', 'جافا', 'coding'],
    'قواعد بيانات': ['database', 'sql', 'db'],
    'شبكات': ['networks', 'networking'],
    'ذكاء اصطناعي': ['ai', 'artificial intelligence', 'machine learning'],
    'رياضيات': ['math', 'mathematics', 'calculus'],
    'فيزياء': ['physics'],
    'متطلبات': ['prerequisites', 'requirements'],
    'خطة': ['plan', 'schedule'],
    'معدل': ['gpa', 'grade'],
  };
  
  for (const [key, values] of Object.entries(courseKeywords)) {
    if (query.includes(key)) {
      expansions.push(...values);
    }
  }
  
  return [...new Set(expansions)];
}

// =============================================================================
// MAIN HANDLER
// =============================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('VALIDATION_ERR_001', 'Invalid JSON', 'JSON غير صالح', 400);
    }
    
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error("Validation errors:", errors);
      return createErrorResponse('VALIDATION_ERR_001', `Validation failed: ${errors.join(', ')}`, 'فشل التحقق من البيانات', 400);
    }
    
    const { query, filters, use_hybrid_search, top_k, student_context } = parseResult.data;
    
    // Get AI API credentials | الحصول على بيانات اعتماد API للذكاء الاصطناعي
    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") || "https://api.openai.com/v1";

    if (!AI_API_KEY) {
      return createErrorResponse('CONFIG_ERR_001', 'AI service not configured', 'خدمة الذكاء الاصطناعي غير مكونة', 500);
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    console.log("Processing RAG query:", query.slice(0, 100));
    
    // Expand query for better search
    const expandedQueries = use_hybrid_search ? expandQuery(query) : [query];
    
    // Search for relevant documents
    const allDocuments: any[] = [];
    for (const q of expandedQueries.slice(0, 5)) { // Limit expansions
      const docs = await searchDocuments(q, supabase, filters, top_k);
      allDocuments.push(...docs);
    }
    
    // Deduplicate by code
    const uniqueDocs = Array.from(
      new Map(allDocuments.map(doc => [doc.code, doc])).values()
    ).slice(0, top_k);
    
    // Build context
    const context = buildContext(uniqueDocs);
    
    // Add student context if available
    let studentInfo = "";
    if (student_context) {
      studentInfo = `
معلومات الطالب:
- القسم: ${student_context.department ?? 'غير محدد'}
- السنة: ${student_context.year_level ?? 'غير محدد'}
- المعدل: ${student_context.gpa ?? 'غير محدد'}
`;
    }
    
    // Build the prompt | بناء الـ prompt
    const systemPrompt = RAG_SYSTEM_PROMPT.replace('{context}', context + studentInfo);
    
    // Call AI with context | استدعاء الذكاء الاصطناعي مع السياق
    const response = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return createErrorResponse('RATE_ERR_001', 'Rate limit exceeded', 'تم تجاوز الحد المسموح من الطلبات', 429);
      }
      
      if (response.status === 402) {
        return createErrorResponse('PAYMENT_ERR_001', 'Payment required', 'يرجى إضافة رصيد', 402);
      }
      
      return createErrorResponse('AI_ERR_001', 'AI service error', 'خطأ في خدمة الذكاء الاصطناعي', 502);
    }

    // Transform stream to include sources at end
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      flush(controller) {
        // Send sources at the end
        const sourcesEvent = {
          type: 'sources',
          sources: uniqueDocs.map(doc => ({
            code: doc.code,
            name: doc.name_ar || doc.name,
            department: doc.department,
            score: 0.9
          }))
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourcesEvent)}\n\n`));
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("RAG query error:", error);
    return createErrorResponse(
      'UNKNOWN_ERR_001',
      error instanceof Error ? error.message : 'Unknown error',
      'حدث خطأ غير متوقع',
      500
    );
  }
});
