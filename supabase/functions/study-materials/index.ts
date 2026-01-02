/**
 * IntelliPath Study Materials Edge Function
 * 
 * Handles:
 * - Upload study materials for courses
 * - Process and extract text from documents
 * - List materials by course
 * - Download materials
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaterialMetadata {
  course_id?: string;
  title: string;
  title_ar?: string;
  description?: string;
  is_public?: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    const action = path[path.length - 1];

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: true, message: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: true, message: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route based on action and method
    if (req.method === "GET") {
      // List materials
      const courseId = url.searchParams.get("course_id");
      const page = parseInt(url.searchParams.get("page") || "1");
      const pageSize = parseInt(url.searchParams.get("page_size") || "20");
      const onlyMine = url.searchParams.get("only_mine") === "true";

      let query = supabase
        .from("study_materials")
        .select("*, courses(code, name, name_ar)", { count: "exact" });

      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      if (onlyMine) {
        query = query.eq("user_id", user.id);
      } else {
        query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
      }

      const { data: materials, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.error("Error fetching materials:", error);
        return new Response(
          JSON.stringify({ error: true, message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          materials,
          total: count,
          page,
          page_size: pageSize,
          total_pages: Math.ceil((count || 0) / pageSize),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      // Upload material
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const metadataStr = formData.get("metadata") as string;

      if (!file) {
        return new Response(
          JSON.stringify({ error: true, message: "File is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let metadata: MaterialMetadata;
      try {
        metadata = JSON.parse(metadataStr || "{}");
      } catch {
        metadata = { title: file.name };
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/png",
        "image/jpeg",
      ];

      if (!allowedTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({
            error: true,
            message: "File type not allowed. Supported: PDF, DOC, DOCX, TXT, PNG, JPG",
            message_ar: "نوع الملف غير مسموح. الأنواع المدعومة: PDF, DOC, DOCX, TXT, PNG, JPG",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        return new Response(
          JSON.stringify({
            error: true,
            message: "File size exceeds 50MB limit",
            message_ar: "حجم الملف يتجاوز الحد الأقصى 50 ميجابايت",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const fileBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from("study-materials")
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return new Response(
          JSON.stringify({ error: true, message: uploadError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract text content (for searchability)
      let contentText = "";
      if (file.type === "text/plain") {
        contentText = await file.text();
      }
      // Note: For PDF/DOC, you'd need external services or libraries
      // For now, we'll mark as needing processing

      // Create database record
      const { data: material, error: dbError } = await supabase
        .from("study_materials")
        .insert({
          user_id: user.id,
          course_id: metadata.course_id || null,
          title: metadata.title || file.name,
          title_ar: metadata.title_ar,
          description: metadata.description,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          content_text: contentText || null,
          is_public: metadata.is_public ?? false,
          is_processed: file.type === "text/plain",
          metadata: {
            original_name: file.name,
            upload_date: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        // Try to clean up uploaded file
        await supabase.storage.from("study-materials").remove([filePath]);
        return new Response(
          JSON.stringify({ error: true, message: dbError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          material,
          message: "File uploaded successfully",
          message_ar: "تم رفع الملف بنجاح",
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE") {
      const materialId = url.searchParams.get("id");

      if (!materialId) {
        return new Response(
          JSON.stringify({ error: true, message: "Material ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get material to verify ownership and get file path
      const { data: material, error: fetchError } = await supabase
        .from("study_materials")
        .select("*")
        .eq("id", materialId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !material) {
        return new Response(
          JSON.stringify({ error: true, message: "Material not found or access denied" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete from storage
      await supabase.storage.from("study-materials").remove([material.file_path]);

      // Delete from database
      const { error: deleteError } = await supabase
        .from("study_materials")
        .delete()
        .eq("id", materialId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: true, message: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Material deleted successfully",
          message_ar: "تم حذف المادة بنجاح",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "PATCH") {
      // Update material metadata
      const body = await req.json();
      const { id, title, title_ar, description, is_public, course_id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: true, message: "Material ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (title_ar !== undefined) updateData.title_ar = title_ar;
      if (description !== undefined) updateData.description = description;
      if (is_public !== undefined) updateData.is_public = is_public;
      if (course_id !== undefined) updateData.course_id = course_id;

      const { data: material, error } = await supabase
        .from("study_materials")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: true, message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          material,
          message: "Material updated successfully",
          message_ar: "تم تحديث المادة بنجاح",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: true, message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Study materials error:", error);
    return new Response(
      JSON.stringify({
        error: true,
        message: "An error occurred",
        message_ar: "حدث خطأ",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
