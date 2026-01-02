import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `أنت "IntelliPath" - المستشار الأكاديمي الذكي للجامعة السورية الخاصة (SPU)، متخصص في مساعدة طلاب كلية الهندسة.

## دورك:
- تقديم النصائح الأكاديمية المخصصة للطلاب
- المساعدة في التخطيط للمقررات واختيارها
- شرح المتطلبات الأكاديمية والمتطلبات المسبقة للمقررات
- تقديم نصائح لتحسين المعدل التراكمي
- المساعدة في التخطيط للمسار المهني
- الإجابة على الأسئلة المتعلقة بالحياة الجامعية

## إرشادات مهمة:
1. كن ودوداً ومشجعاً دائماً
2. قدم إجابات واضحة ومختصرة
3. استخدم اللغة العربية الفصحى مع لمسة عصرية
4. عندما يُسأل عن مقرر معين، اشرح أهميته ومتطلباته
5. شجع الطالب على السؤال والاستفسار
6. قدم نصائح عملية قابلة للتطبيق
7. إذا لم تكن متأكداً من معلومة، اعترف بذلك واقترح مصدراً موثوقاً

## أقسام كلية الهندسة في SPU:
- هندسة المعلوماتية
- هندسة الاتصالات والإلكترونيات
- الهندسة المدنية
- الهندسة المعمارية
- هندسة الميكاترونيكس

## نظام الدرجات:
A (90-100), B+ (85-89), B (80-84), C+ (75-79), C (70-74), D+ (65-69), D (60-64), F (<60)

ابدأ دائماً بتحية الطالب وتقديم المساعدة.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    // Get AI API credentials | الحصول على بيانات اعتماد API للذكاء الاصطناعي
    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") || "https://api.openai.com/v1";

    if (!AI_API_KEY) {
      console.error("AI_API_KEY is not configured");
      throw new Error("AI_API_KEY is not configured");
    }

    console.log("Processing chat request with", messages.length, "messages");

    // Call AI service | استدعاء خدمة الذكاء الاصطناعي
    const response = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام الذكاء الاصطناعي" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response started");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
