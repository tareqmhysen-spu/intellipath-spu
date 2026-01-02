import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ZipReader, BlobReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedCourse {
  code: string;
  name: string;
  name_ar?: string;
  credits: number;
  department?: string;
  year_level?: number;
  semester?: string;
  description?: string;
  description_ar?: string;
  prerequisites?: string[];
  classification?: string;
  theoretical_hours?: number;
  practical_hours?: number;
}

// Parse the structured TXT format with [بطاقة مقرر] cards
function parseStructuredPlan(content: string, fileName: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const lines = content.split('\n');
  
  console.log(`Parsing structured plan file: ${fileName}, lines: ${lines.length}`);
  
  // Extract department from first line or filename
  let department = 'هندسة المعلوماتية';
  const firstLine = lines[0] || '';
  if (firstLine.includes('هندسة البرمجيات')) {
    department = 'هندسة البرمجيات ونظم المعلومات';
  } else if (firstLine.includes('هندسة الشبكات')) {
    department = 'هندسة الشبكات والنظم الموزعة';
  } else if (firstLine.includes('هندسة الذكاء')) {
    department = 'هندسة الذكاء الاصطناعي';
  } else if (firstLine.includes('الأمن السيبراني')) {
    department = 'الأمن السيبراني';
  } else if (firstLine.includes('علوم البيانات')) {
    department = 'علوم البيانات';
  }
  
  // Track current year/level for context
  let currentYear = 1;
  let currentLevel = 1;
  
  // Find all course card blocks
  let currentCard: Partial<ParsedCourse> | null = null;
  let currentPrerequisites: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check for year/level headers
    const yearMatch = line.match(/السنة\s*(الأولى|الثانية|الثالثة|الرابعة|الخامسة)/);
    if (yearMatch) {
      const yearMap: Record<string, number> = {
        'الأولى': 1, 'الثانية': 2, 'الثالثة': 3, 'الرابعة': 4, 'الخامسة': 5
      };
      currentYear = yearMap[yearMatch[1]] || currentYear;
    }
    
    const levelMatch = line.match(/المستوى\s*(الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر)/);
    if (levelMatch) {
      const levelMap: Record<string, number> = {
        'الأول': 1, 'الثاني': 2, 'الثالث': 3, 'الرابع': 4, 'الخامس': 5,
        'السادس': 6, 'السابع': 7, 'الثامن': 8, 'التاسع': 9, 'العاشر': 10
      };
      currentLevel = levelMap[levelMatch[1]] || currentLevel;
    }
    
    // New card starts
    if (line === '[بطاقة مقرر]') {
      // Save previous card if exists and has a valid code
      if (currentCard && currentCard.code && currentCard.code !== '-') {
        currentCard.prerequisites = currentPrerequisites.length > 0 ? currentPrerequisites : undefined;
        courses.push(currentCard as ParsedCourse);
      }
      currentCard = {
        department,
        year_level: currentYear,
        semester: `الفصل ${currentLevel}`,
      };
      currentPrerequisites = [];
      continue;
    }
    
    if (!currentCard) continue;
    
    // Parse card fields
    if (line.startsWith('رمز_المقرر:')) {
      const code = line.replace('رمز_المقرر:', '').trim();
      if (code && code !== '-') {
        currentCard.code = code;
      }
    }
    else if (line.startsWith('اسم_المقرر_عربي:')) {
      currentCard.name_ar = line.replace('اسم_المقرر_عربي:', '').trim();
      currentCard.name = currentCard.name_ar; // Default name to Arabic
    }
    else if (line.startsWith('اسم_المقرر_إنكليزي:')) {
      const engName = line.replace('اسم_المقرر_إنكليزي:', '').trim();
      currentCard.name = engName; // Prefer English name
    }
    else if (line.startsWith('عدد_الساعات_المعتمدة:')) {
      const credits = parseInt(line.replace('عدد_الساعات_المعتمدة:', '').trim(), 10);
      currentCard.credits = isNaN(credits) ? 3 : credits;
    }
    else if (line.startsWith('عدد_الساعات_الأسبوعية_نظري:')) {
      const hours = parseInt(line.replace('عدد_الساعات_الأسبوعية_نظري:', '').trim(), 10);
      currentCard.theoretical_hours = isNaN(hours) ? undefined : hours;
    }
    else if (line.startsWith('عدد_الساعات_الأسبوعية_عملي:')) {
      const val = line.replace('عدد_الساعات_الأسبوعية_عملي:', '').trim();
      const hours = parseInt(val, 10);
      currentCard.practical_hours = isNaN(hours) ? 0 : hours;
    }
    else if (line.startsWith('المتطلب_السابق:') || line.startsWith('المتطلب_السابق_1:') || line.startsWith('المتطلب_السابق_2:')) {
      const prereqText = line.replace(/المتطلب_السابق[_\d]*:/, '').trim();
      // Extract course codes from text like "CIFC.1.01 (مدخل إلى الخوارزميات والبرمجة)"
      if (prereqText && prereqText !== 'لا يوجد' && prereqText !== '-') {
        const codeMatch = prereqText.match(/^([A-Z]{4}\.[0-9]+\.[0-9]+)/i);
        if (codeMatch) {
          currentPrerequisites.push(codeMatch[1]);
        }
      }
    }
    else if (line.startsWith('التصنيف:')) {
      currentCard.classification = line.replace('التصنيف:', '').trim();
    }
    else if (line.startsWith('الترتيب_الزمني:')) {
      const timing = line.replace('الترتيب_الزمني:', '').trim();
      // Extract year and level from "السنة 1 - المستوى 1"
      const yearNum = timing.match(/السنة\s*(\d+)/);
      const levelNum = timing.match(/المستوى\s*(\d+)/);
      if (yearNum) currentCard.year_level = parseInt(yearNum[1], 10);
      if (levelNum) currentCard.semester = `الفصل ${levelNum[1]}`;
    }
  }
  
  // Don't forget the last card
  if (currentCard && currentCard.code && currentCard.code !== '-') {
    currentCard.prerequisites = currentPrerequisites.length > 0 ? currentPrerequisites : undefined;
    courses.push(currentCard as ParsedCourse);
  }
  
  console.log(`Extracted ${courses.length} courses from structured plan`);
  return courses;
}

// Parse Markdown content to extract courses
function parseMarkdownCourses(content: string, fileName: string): ParsedCourse[] {
  // First check if it's the structured format
  if (content.includes('[بطاقة مقرر]')) {
    return parseStructuredPlan(content, fileName);
  }
  
  const courses: ParsedCourse[] = [];
  const lines = content.split('\n');
  
  console.log(`Parsing markdown file: ${fileName}, lines: ${lines.length}`);
  
  let currentCourse: Partial<ParsedCourse> | null = null;
  let detectedDepartment = '';
  
  const deptPatterns = [
    /هندسة\s*(المعلوماتية|البرمجيات|الحواسيب|الشبكات)/i,
    /علوم\s*(الحاسوب|الحاسب)/i,
    /نظم\s*المعلومات/i,
  ];
  
  for (const pattern of deptPatterns) {
    const match = content.match(pattern) || fileName.match(pattern);
    if (match) {
      detectedDepartment = match[0];
      break;
    }
  }
  
  // Pattern to match course codes
  const courseCodePattern = /^(?:[-*•]?\s*)?([A-Z]{2,4}[\.\s]?\d+[\.\s]?\d*[A-Z]?)\s*[-–:]\s*(.+)/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const courseMatch = line.match(courseCodePattern);
    if (courseMatch) {
      if (currentCourse && currentCourse.code) {
        courses.push({
          code: currentCourse.code,
          name: currentCourse.name || currentCourse.code,
          name_ar: currentCourse.name_ar,
          credits: currentCourse.credits || 3,
          department: currentCourse.department || detectedDepartment,
          year_level: currentCourse.year_level || 1,
        });
      }
      
      const [, code, name] = courseMatch;
      currentCourse = {
        code: code.replace(/\s+/g, '').toUpperCase(),
        name: name.trim(),
        department: detectedDepartment,
      };
    }
  }
  
  if (currentCourse && currentCourse.code) {
    courses.push({
      code: currentCourse.code,
      name: currentCourse.name || currentCourse.code,
      credits: currentCourse.credits || 3,
      department: currentCourse.department || detectedDepartment,
      year_level: currentCourse.year_level || 1,
    });
  }
  
  console.log(`Extracted ${courses.length} courses from markdown`);
  return courses;
}

// Parse CSV content to extract courses
function parseCSVCourses(content: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const cleanContent = content.replace(/^\uFEFF/, '');
  const firstLine = cleanContent.split('\n')[0] || '';
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  
  const lines = cleanContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return courses;
  
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  
  const codeIdx = headers.findIndex(h => ['code', 'course_code', 'رمز', 'رمز_المقرر'].includes(h));
  const nameIdx = headers.findIndex(h => ['name', 'course_name', 'اسم', 'اسم_المقرر'].includes(h));
  const nameArIdx = headers.findIndex(h => ['name_ar', 'اسم_المقرر_عربي'].includes(h));
  const creditsIdx = headers.findIndex(h => ['credits', 'ساعات', 'عدد_الساعات_المعتمدة'].includes(h));
  const deptIdx = headers.findIndex(h => ['department', 'قسم', 'القسم'].includes(h));
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    
    const code = codeIdx >= 0 ? values[codeIdx] : '';
    const name = nameIdx >= 0 ? values[nameIdx] : '';
    
    if (!code && !name) continue;
    
    courses.push({
      code: code.replace(/\s+/g, '').toUpperCase() || `COURSE${i}`,
      name: name || code,
      name_ar: nameArIdx >= 0 ? values[nameArIdx] : undefined,
      credits: creditsIdx >= 0 ? parseInt(values[creditsIdx], 10) || 3 : 3,
      department: deptIdx >= 0 ? values[deptIdx] : undefined,
    });
  }
  
  return courses;
}

// Extract files from ZIP
async function extractFilesFromZip(zipBlob: Blob): Promise<Array<{ name: string; content: string }>> {
  const files: Array<{ name: string; content: string }> = [];
  
  try {
    const zipReader = new ZipReader(new BlobReader(zipBlob));
    const entries = await zipReader.getEntries();
    
    for (const entry of entries) {
      const fileName = entry.filename.toLowerCase();
      if (!entry.directory && (fileName.endsWith('.csv') || fileName.endsWith('.md') || fileName.endsWith('.txt'))) {
        if (entry.getData) {
          const textWriter = new TextWriter();
          const content = await entry.getData(textWriter);
          files.push({ name: entry.filename, content });
        }
      }
    }
    
    await zipReader.close();
  } catch (error) {
    console.error('Error extracting ZIP:', error);
    throw new Error('Failed to extract ZIP file');
  }
  
  return files;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let allCourses: ParsedCourse[] = [];
    let totalFiles = 0;
    let processedFiles = 0;
    let fileErrors: any[] = [];
    let overwrite = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      overwrite = formData.get("overwrite") === "true";
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.zip')) {
        console.log(`Processing ZIP file: ${file.name}`);
        const zipBlob = new Blob([await file.arrayBuffer()]);
        const files = await extractFilesFromZip(zipBlob);
        
        totalFiles = files.length;
        console.log(`Found ${totalFiles} files in ZIP`);
        
        for (const f of files) {
          try {
            let courses: ParsedCourse[] = [];
            if (f.name.toLowerCase().endsWith('.csv')) {
              courses = parseCSVCourses(f.content);
            } else {
              courses = parseMarkdownCourses(f.content, f.name);
            }
            allCourses.push(...courses);
            processedFiles++;
            console.log(`Processed ${f.name}: ${courses.length} courses`);
          } catch (err) {
            fileErrors.push({ file: f.name, error: String(err) });
          }
        }
      } else {
        totalFiles = 1;
        const content = await file.text();
        
        if (fileName.endsWith('.csv')) {
          allCourses = parseCSVCourses(content);
        } else {
          allCourses = parseMarkdownCourses(content, file.name);
        }
        processedFiles = 1;
      }
    } else {
      const body = await req.json();
      if (body.content) {
        const fileName = body.file_name || 'content.md';
        overwrite = body.overwrite || false;
        
        if (fileName.endsWith('.csv')) {
          allCourses = parseCSVCourses(body.content);
        } else {
          allCourses = parseMarkdownCourses(body.content, fileName);
        }
        totalFiles = 1;
        processedFiles = 1;
      }
    }

    if (allCourses.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No courses found in file(s)",
          total_files: totalFiles,
          processed_files: processedFiles,
          file_errors: fileErrors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate courses by code
    const courseMap = new Map<string, ParsedCourse>();
    for (const course of allCourses) {
      if (!courseMap.has(course.code)) {
        courseMap.set(course.code, course);
      } else {
        const existing = courseMap.get(course.code)!;
        if (!existing.name_ar && course.name_ar) existing.name_ar = course.name_ar;
        if (!existing.description && course.description) existing.description = course.description;
        if (!existing.prerequisites?.length && course.prerequisites?.length) {
          existing.prerequisites = course.prerequisites;
        }
      }
    }
    const uniqueCourses = Array.from(courseMap.values());

    console.log(`Total unique courses to import: ${uniqueCourses.length}`);

    // Import courses to database
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    const errors: any[] = [];
    const importedCodes: string[] = [];
    const prerequisiteMap: Map<string, string[]> = new Map();

    for (const course of uniqueCourses) {
      try {
        // Check if course exists
        const { data: existing } = await supabase
          .from("courses")
          .select("id")
          .eq("code", course.code)
          .single();

        if (existing) {
          if (!overwrite) {
            skipped++;
            continue;
          }
          // Update existing
          const { error: updateError } = await supabase
            .from("courses")
            .update({
              name: course.name,
              name_ar: course.name_ar,
              credits: course.credits,
              department: course.department,
              year_level: course.year_level || 1,
              semester: course.semester,
              description: course.description,
              description_ar: course.description_ar,
            })
            .eq("id", existing.id);
          
          if (updateError) throw updateError;
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from("courses")
            .insert({
              code: course.code,
              name: course.name,
              name_ar: course.name_ar,
              credits: course.credits,
              department: course.department || 'هندسة البرمجيات ونظم المعلومات',
              year_level: course.year_level || 1,
              semester: course.semester,
              description: course.description,
              description_ar: course.description_ar,
            });
          
          if (insertError) throw insertError;
        }

        successful++;
        importedCodes.push(course.code);
        
        // Store prerequisites for later processing
        if (course.prerequisites?.length) {
          prerequisiteMap.set(course.code, course.prerequisites);
        }
      } catch (err) {
        failed++;
        errors.push({
          code: course.code,
          error: err instanceof Error ? err.message : String(err),
        });
        console.error(`Error importing ${course.code}:`, err);
      }
    }

    // Process prerequisites after all courses are imported
    let prereqsAdded = 0;
    for (const [courseCode, prereqCodes] of prerequisiteMap) {
      try {
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("code", courseCode)
          .single();
          
        if (course) {
          for (const prereqCode of prereqCodes) {
            const { data: prereq } = await supabase
              .from("courses")
              .select("id")
              .eq("code", prereqCode)
              .single();
              
            if (prereq) {
              const { data: existingPrereq } = await supabase
                .from("course_prerequisites")
                .select("id")
                .eq("course_id", course.id)
                .eq("prerequisite_id", prereq.id)
                .single();
                
              if (!existingPrereq) {
                await supabase
                  .from("course_prerequisites")
                  .insert({
                    course_id: course.id,
                    prerequisite_id: prereq.id,
                  });
                prereqsAdded++;
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error processing prerequisites for ${courseCode}:`, err);
      }
    }

    console.log(`Import complete: ${successful} successful, ${failed} failed, ${skipped} skipped, ${prereqsAdded} prerequisites added`);

    return new Response(
      JSON.stringify({
        success: true,
        total_files: totalFiles,
        processed_files: processedFiles,
        total_courses: uniqueCourses.length,
        successful_imports: successful,
        failed_imports: failed,
        skipped: skipped,
        prerequisites_added: prereqsAdded,
        imported_codes: importedCodes.slice(0, 30),
        errors: errors.slice(0, 10),
        file_errors: fileErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in course-data-import:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        successful_imports: 0,
        failed_imports: 0,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
