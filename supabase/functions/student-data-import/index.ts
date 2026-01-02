import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ZipReader, BlobReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Flexible column mapping for CSV headers
const COLUMN_MAPPINGS: Record<string, string[]> = {
  student_id: ['student_id', 'رقم الطالب', 'Student ID', 'id', 'الرقم الجامعي'],
  course_code: ['course_code', 'رمز المقرر', 'Course Code', 'code', 'رمز المادة'],
  course_name: ['course_name', 'اسم المقرر', 'Course Name', 'name', 'اسم المادة'],
  college: ['college', 'الكلية', 'College', 'faculty'],
  major: ['major', 'التخصص', 'Major', 'specialization'],
  department: ['department', 'القسم', 'Department'],
  academic_year: ['academic_year', 'السنة الأكاديمية', 'Academic Year', 'year'],
  semester: ['semester', 'الفصل الدراسي', 'Semester', 'term'],
  cumulative_gpa: ['cumulative_gpa', 'cumulative_gpa_points', 'المعدل التراكمي', 'GPA', 'gpa'],
  completed_hours: ['completed_hours', 'completed_hours_total', 'إجمالي الساعات المكتملة', 'total_credits'],
  letter_grade: ['letter_grade', 'الدرجة الحرفية', 'Letter Grade', 'grade'],
  final_grade: ['final_grade', 'الدرجة النهائية', 'Final Grade', 'score'],
  points: ['points', 'النقاط', 'Points', 'grade_points'],
  credits: ['credits', 'الساعات', 'Credits', 'hours'],
};

function findColumn(headers: string[], field: string): string | null {
  const mappings = COLUMN_MAPPINGS[field] || [field];
  const normalizedMappings = mappings.map((m) => m.trim().toLowerCase());

  for (const header of headers) {
    const normalizedHeader = header.trim().toLowerCase();
    for (const mapping of normalizedMappings) {
      if (normalizedHeader === mapping || normalizedHeader.includes(mapping)) {
        return header;
      }
    }
  }

  return null;
}

function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleanContent = content.replace(/^\uFEFF/, '');
  const firstLine = cleanContent.split('\n')[0] || '';

  const candidates: Array<'\t' | ',' | ';'> = ['\t', ',', ';'];
  const delimiter = candidates.reduce((best, d) => {
    const count = firstLine.split(d).length - 1;
    const bestCount = firstLine.split(best).length - 1;
    return count > bestCount ? d : best;
  }, ',' as '\t' | ',' | ';');

  const lines = cleanContent.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(delimiter)
      .map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function getValue(row: Record<string, string>, headers: string[], field: string): string {
  const column = findColumn(headers, field);
  return column ? (row[column] || '').trim() : '';
}

function parseFloatValue(value: string): number | null {
  const num = Number(value.replace(',', '.'));
  return isNaN(num) ? null : num;
}

interface StudentRecord {
  student_id: string;
  college?: string;
  major?: string;
  department?: string;
  gpa?: number | null;
  completed_credits?: number | null;
  metadata: Record<string, any>;
  courses: Array<{
    code: string;
    name: string;
    semester?: string;
    academic_year?: string;
    letter_grade?: string;
    final_grade?: number | null;
    points?: number | null;
    credits?: number | null;
  }>;
}

function processCSVData(headers: string[], rows: Record<string, string>[]): StudentRecord[] {
  const studentsMap = new Map<string, StudentRecord>();
  
  for (const row of rows) {
    const studentId = getValue(row, headers, 'student_id');
    if (!studentId || studentId.length < 5) continue;
    
    const courseCode = getValue(row, headers, 'course_code');
    const courseName = getValue(row, headers, 'course_name');
    
    if (!studentsMap.has(studentId)) {
      studentsMap.set(studentId, {
        student_id: studentId,
        college: getValue(row, headers, 'college') || undefined,
        major: getValue(row, headers, 'major') || getValue(row, headers, 'department') || undefined,
        department: getValue(row, headers, 'department') || undefined,
        gpa: parseFloatValue(getValue(row, headers, 'cumulative_gpa')),
        completed_credits: parseFloatValue(getValue(row, headers, 'completed_hours')) ? 
          Math.floor(parseFloatValue(getValue(row, headers, 'completed_hours'))!) : null,
        metadata: { ...row },
        courses: [],
      });
    }
    
    const student = studentsMap.get(studentId)!;
    
    if (courseCode && courseName) {
      student.courses.push({
        code: courseCode.replace(/\s+/g, ''),
        name: courseName,
        semester: getValue(row, headers, 'semester') || undefined,
        academic_year: getValue(row, headers, 'academic_year') || undefined,
        letter_grade: getValue(row, headers, 'letter_grade') || undefined,
        final_grade: parseFloatValue(getValue(row, headers, 'final_grade')),
        points: parseFloatValue(getValue(row, headers, 'points')),
        credits: parseFloatValue(getValue(row, headers, 'credits')) ? 
          Math.floor(parseFloatValue(getValue(row, headers, 'credits'))!) : 3,
      });
    }
    
    const gpa = parseFloatValue(getValue(row, headers, 'cumulative_gpa'));
    const credits = parseFloatValue(getValue(row, headers, 'completed_hours'));
    if (gpa !== null && (student.gpa === null || student.gpa === undefined)) {
      student.gpa = gpa;
    }
    if (credits !== null && (student.completed_credits === null || student.completed_credits === undefined)) {
      student.completed_credits = Math.floor(credits);
    }
  }
  
  return Array.from(studentsMap.values());
}

// Extract CSV files from ZIP
async function extractCSVFromZip(zipBlob: Blob): Promise<Array<{ name: string; content: string }>> {
  const csvFiles: Array<{ name: string; content: string }> = [];
  
  try {
    const zipReader = new ZipReader(new BlobReader(zipBlob));
    const entries = await zipReader.getEntries();
    
    for (const entry of entries) {
      const fileName = entry.filename.toLowerCase();
      if ((fileName.endsWith('.csv') || fileName.endsWith('.tsv')) && !entry.directory) {
        if (entry.getData) {
          const textWriter = new TextWriter();
          const content = await entry.getData(textWriter);
          csvFiles.push({
            name: entry.filename,
            content: content,
          });
        }
      }
    }
    
    await zipReader.close();
  } catch (error) {
    console.error('Error extracting ZIP:', error);
    throw new Error('Failed to extract ZIP file');
  }
  
  return csvFiles;
}

async function importStudents(
  supabase: any,
  students: StudentRecord[],
  overwrite: boolean
): Promise<{ successful: number; failed: number; ids: string[]; errors: any[] }> {
  let successful = 0;
  let failed = 0;
  const importedIds: string[] = [];
  const errors: any[] = [];

  for (const student of students) {
    try {
      const { data: existingStudent } = await supabase
        .from("students")
        .select("id, user_id")
        .eq("student_id", student.student_id)
        .single();

      if (existingStudent) {
        if (!overwrite) continue;
        
        await supabase
          .from("students")
          .update({
            department: student.department || student.major,
            gpa: student.gpa,
            total_credits: student.completed_credits,
          })
          .eq("id", existingStudent.id);

        // Import courses
        for (const course of student.courses) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("id")
            .eq("code", course.code)
            .single();

          if (courseData) {
            await supabase
              .from("enrollments")
              .upsert({
                student_id: existingStudent.id,
                course_id: courseData.id,
                semester: course.semester || 'N/A',
                academic_year: course.academic_year || new Date().getFullYear().toString(),
                letter_grade: course.letter_grade,
                grade: course.final_grade,
              }, {
                onConflict: 'student_id,course_id,semester,academic_year',
                ignoreDuplicates: true,
              });
          }
        }

        successful++;
        importedIds.push(student.student_id);
      }
    } catch (err) {
      failed++;
      errors.push({
        student_id: student.student_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { successful, failed, ids: importedIds, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    let overwrite = false;
    let allStudents: StudentRecord[] = [];
    let totalFiles = 0;
    let processedFiles = 0;
    let fileErrors: any[] = [];

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
      
      // Handle ZIP files
      if (fileName.endsWith('.zip')) {
        console.log(`Processing ZIP file: ${file.name}`);
        const zipBlob = new Blob([await file.arrayBuffer()]);
        const csvFiles = await extractCSVFromZip(zipBlob);
        
        totalFiles = csvFiles.length;
        console.log(`Found ${totalFiles} CSV files in ZIP`);
        
        for (const csvFile of csvFiles) {
          try {
            const { headers, rows } = parseCSV(csvFile.content);
            if (headers.length > 0 && rows.length > 0) {
              const students = processCSVData(headers, rows);
              allStudents.push(...students);
              processedFiles++;
              console.log(`Processed ${csvFile.name}: ${students.length} students`);
            }
          } catch (err) {
            fileErrors.push({ file: csvFile.name, error: String(err) });
          }
        }
        
        // Create import log for ZIP
        await supabase
          .from("import_logs")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_type: "zip",
            total_records: allStudents.length,
            status: "processing",
          });
          
      } else {
        // Handle single CSV/TSV
        totalFiles = 1;
        const csvContent = await file.text();
        const { headers, rows } = parseCSV(csvContent);
        
        if (headers.length > 0 && rows.length > 0) {
          allStudents = processCSVData(headers, rows);
          processedFiles = 1;
        }
        
        await supabase
          .from("import_logs")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_type: "csv",
            total_records: allStudents.length,
            status: "processing",
          });
      }
    } else {
      const body = await req.json();
      const csvContent = body.csv_content;
      overwrite = body.overwrite || false;
      
      if (csvContent) {
        totalFiles = 1;
        const { headers, rows } = parseCSV(csvContent);
        if (headers.length > 0 && rows.length > 0) {
          allStudents = processCSVData(headers, rows);
          processedFiles = 1;
        }
      }
    }

    if (allStudents.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No valid student data found",
          total_files: totalFiles,
          processed_files: processedFiles,
          file_errors: fileErrors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate students by student_id (merge courses)
    const studentMap = new Map<string, StudentRecord>();
    for (const student of allStudents) {
      if (studentMap.has(student.student_id)) {
        const existing = studentMap.get(student.student_id)!;
        existing.courses.push(...student.courses);
        if (!existing.gpa && student.gpa) existing.gpa = student.gpa;
        if (!existing.major && student.major) existing.major = student.major;
      } else {
        studentMap.set(student.student_id, student);
      }
    }
    const uniqueStudents = Array.from(studentMap.values());

    // Import students
    const result = await importStudents(supabase, uniqueStudents, overwrite);

    // Update import log
    await supabase
      .from("import_logs")
      .update({
        successful_records: result.successful,
        failed_records: result.failed,
        errors: [...result.errors, ...fileErrors],
        status: result.failed === 0 ? "completed" : "completed_with_errors",
        completed_at: new Date().toISOString(),
      })
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({
        success: true,
        total_files: totalFiles,
        processed_files: processedFiles,
        total_records: uniqueStudents.length,
        successful_imports: result.successful,
        failed_imports: result.failed,
        imported_student_ids: result.ids,
        errors: result.errors.slice(0, 10),
        file_errors: fileErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in student-data-import:", error);
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
