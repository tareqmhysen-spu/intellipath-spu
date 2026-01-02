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

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header", success: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the JWT and get the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", success: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { student_id, full_name } = body;

    // Validate university ID format (7-10 digits)
    if (student_id && !/^\d{7,10}$/.test(String(student_id))) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERR_001",
            message: "Invalid student ID",
            message_ar: "الرقم الجامعي غير صالح",
          },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    
    // Security: User can only link themselves, not other users
    const user_id = user.id;

    console.log(`Attempting to link user ${user_id} with student_id: ${student_id}, name: ${full_name}`);

    let linkedStudent = null;

    // Link by student_id if provided
    if (student_id) {
      // First check if user already has a linked student record
      const { data: existingLink } = await supabase
        .from("students")
        .select("id, student_id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (existingLink && /^\d{7,10}$/.test(existingLink.student_id)) {
        // User already linked - cannot change
        return new Response(
          JSON.stringify({ 
            error: "Your account is already linked to a university ID. This cannot be changed.",
            success: false,
            linked: true,
            student_id: existingLink.student_id,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if student_id exists and is available
      const { data: student } = await supabase
        .from("students")
        .select("id, student_id, user_id")
        .eq("student_id", student_id)
        .maybeSingle();

      if (student && student.user_id && student.user_id !== user_id) {
        // Linked to different user - security issue
        console.log(`Student ${student_id} already linked to different user - access denied`);
        return new Response(
          JSON.stringify({ 
            error: "This student ID is already linked to another account",
            success: false,
            linked: false,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (student && !student.user_id) {
        // Student exists and not linked - link them
        const { error: updateError } = await supabase
          .from("students")
          .update({ user_id: user_id })
          .eq("id", student.id);

        if (!updateError) {
          linkedStudent = student;
          console.log(`Successfully linked user ${user_id} to existing student ${student_id}`);
        } else {
          console.error(`Error linking student: ${updateError.message}`);
        }
      } else if (student && student.user_id === user_id) {
        // Already linked to this user
        linkedStudent = student;
        console.log(`Student ${student_id} already linked to user ${user_id}`);
      } else {
        // Student doesn't exist - update existing student record or create one
        if (existingLink) {
          // Update existing auto-generated record with real student_id
          const { error: updateError } = await supabase
            .from("students")
            .update({ student_id: student_id })
            .eq("id", existingLink.id);

          if (!updateError) {
            linkedStudent = { ...existingLink, student_id };
            console.log(`Updated user ${user_id} with student_id ${student_id}`);
          }
        } else {
          // Create new student record
          const { data: newStudent, error: insertError } = await supabase
            .from("students")
            .insert({
              user_id: user_id,
              student_id: student_id,
              department: "غير محدد",
              year_level: 1,
            })
            .select()
            .single();

          if (!insertError && newStudent) {
            linkedStudent = newStudent;
            console.log(`Created new student ${student_id} for user ${user_id}`);
          }
        }
      }
    }

    // Update the profiles table if we have data
    if (full_name) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user_id)
        .single();

      if (!existingProfile) {
        await supabase
          .from("profiles")
          .insert({
            user_id: user_id,
            full_name: full_name,
            email: user.email || '',
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        linked: !!linkedStudent,
        student_id: linkedStudent?.student_id || null,
        message: linkedStudent 
          ? `Successfully linked to student ${linkedStudent.student_id}`
          : student_id 
            ? `Student ${student_id} not found or already linked`
            : "No student_id provided for linking",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in link-student:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
        linked: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
