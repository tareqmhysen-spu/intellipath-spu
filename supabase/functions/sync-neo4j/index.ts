import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';
import neo4j from "https://deno.land/x/neo4j_driver_lite@5.27.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  majors: number;
  courses: number;
  prerequisites: number;
  skills: number;
  tools: number;
  topics: number;
  career_paths: number;
  course_majors: number;
  course_skills: number;
  course_topics: number;
  course_tools: number;
  course_career_paths: number;
  errors: string[];
}

async function executeNeo4jQuery(driver: any, cypher: string, params: Record<string, any> = {}): Promise<any[]> {
  const session = driver.session({ database: 'neo4j' });
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record: any) => {
      const obj: Record<string, any> = {};
      const keys = record.keys as string[];
      keys.forEach((key: string) => {
        const value = record.get(key);
        if (neo4j.isInt(value)) {
          obj[key] = value.toNumber();
        } else if (Array.isArray(value)) {
          obj[key] = value.map((v: any) => neo4j.isInt(v) ? v.toNumber() : v);
        } else {
          obj[key] = value;
        }
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const errors: string[] = [];
  const result: SyncResult = {
    majors: 0, courses: 0, prerequisites: 0, skills: 0, tools: 0,
    topics: 0, career_paths: 0, course_majors: 0, course_skills: 0,
    course_topics: 0, course_tools: 0, course_career_paths: 0, errors: []
  };

  let driver: any = null;

  try {
    // Initialize Neo4j
    const neo4jUri = Deno.env.get('NEO4J_URI');
    const neo4jUsername = Deno.env.get('NEO4J_USERNAME');
    const neo4jPassword = Deno.env.get('NEO4J_PASSWORD');

    if (!neo4jUri || !neo4jUsername || !neo4jPassword) {
      throw new Error('Neo4j connection details not configured');
    }

    driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUsername, neo4jPassword));
    console.log('Connected to Neo4j');

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Sync Majors
    console.log('Syncing majors...');
    const majors = await executeNeo4jQuery(driver, `
      MATCH (m:Major)
      RETURN m.name as name, m.name_en as name_en, m.description as description, 
             m.total_credits as total_credits
      ORDER BY m.name
    `);
    
    for (const major of majors) {
      const { error } = await supabase.from('majors').upsert({
        name: major.name,
        name_en: major.name_en,
        description: major.description,
        total_credits: major.total_credits || 171
      }, { onConflict: 'name' });
      if (error) errors.push(`Major ${major.name}: ${error.message}`);
      else result.majors++;
    }
    console.log(`Synced ${result.majors} majors`);

    // Get majors map for later use
    const { data: majorsData } = await supabase.from('majors').select('id, name');
    const majorsMap = new Map(majorsData?.map(m => [m.name, m.id]) || []);

    // 2. Sync Career Paths
    console.log('Syncing career paths...');
    const careerPaths = await executeNeo4jQuery(driver, `
      MATCH (cp:CareerPath)
      RETURN cp.name as name, cp.name_en as name_en, cp.description as description
      ORDER BY cp.name
    `);
    
    for (const cp of careerPaths) {
      const { error } = await supabase.from('career_paths').upsert({
        name: cp.name,
        name_ar: cp.name_en || cp.name,
        description: cp.description
      }, { onConflict: 'name' });
      if (error) errors.push(`CareerPath ${cp.name}: ${error.message}`);
      else result.career_paths++;
    }
    console.log(`Synced ${result.career_paths} career paths`);

    // Get career paths map
    const { data: cpData } = await supabase.from('career_paths').select('id, name');
    const careerPathsMap = new Map(cpData?.map(cp => [cp.name, cp.id]) || []);

    // 3. Sync Skills
    console.log('Syncing skills...');
    const skills = await executeNeo4jQuery(driver, `
      MATCH (s:Skill)
      RETURN s.name as name, s.description as description, s.category as category
      ORDER BY s.name
    `);
    
    for (const skill of skills) {
      const { error } = await supabase.from('skills').upsert({
        name: skill.name,
        description: skill.description,
        category: skill.category
      }, { onConflict: 'name' });
      if (error) errors.push(`Skill ${skill.name}: ${error.message}`);
      else result.skills++;
    }
    console.log(`Synced ${result.skills} skills`);

    // Get skills map
    const { data: skillsData } = await supabase.from('skills').select('id, name');
    const skillsMap = new Map(skillsData?.map(s => [s.name, s.id]) || []);

    // 4. Sync Tools
    console.log('Syncing tools...');
    const tools = await executeNeo4jQuery(driver, `
      MATCH (t:Tool)
      RETURN t.name as name, t.description as description, t.category as category
      ORDER BY t.name
    `);
    
    for (const tool of tools) {
      const { error } = await supabase.from('tools').upsert({
        name: tool.name,
        description: tool.description,
        category: tool.category
      }, { onConflict: 'name' });
      if (error) errors.push(`Tool ${tool.name}: ${error.message}`);
      else result.tools++;
    }
    console.log(`Synced ${result.tools} tools`);

    // Get tools map
    const { data: toolsData } = await supabase.from('tools').select('id, name');
    const toolsMap = new Map(toolsData?.map(t => [t.name, t.id]) || []);

    // 5. Sync Topics
    console.log('Syncing topics...');
    const topics = await executeNeo4jQuery(driver, `
      MATCH (t:Topic)
      RETURN t.name as name, t.description as description
      ORDER BY t.name
    `);
    
    for (const topic of topics) {
      const { error } = await supabase.from('topics').upsert({
        name: topic.name,
        description: topic.description
      }, { onConflict: 'name' });
      if (error) errors.push(`Topic ${topic.name}: ${error.message}`);
      else result.topics++;
    }
    console.log(`Synced ${result.topics} topics`);

    // Get topics map
    const { data: topicsData } = await supabase.from('topics').select('id, name');
    const topicsMap = new Map(topicsData?.map(t => [t.name, t.id]) || []);

    // 6. Sync Courses
    console.log('Syncing courses...');
    const courses = await executeNeo4jQuery(driver, `
      MATCH (c:Course)
      RETURN c.code as code, c.name_en as name, c.name_ar as name_ar,
             c.credits as credits, c.category as department, 
             c.year as year_level, c.level as semester,
             c.hours_theory as hours_theory, c.hours_lab as hours_lab,
             c.description_en as description, c.description_ar as description_ar,
             c.objectives_ar as objectives_ar, c.objectives_en as objectives_en,
             c.is_bottleneck as is_bottleneck, c.critical_path_depth as critical_path_depth
      ORDER BY c.code
    `);
    
    for (const course of courses) {
      if (!course.code || course.code === '-') continue;
      
      // Parse year from 'year' field (might be number or string)
      let yearLevel = 1;
      if (course.year_level) {
        yearLevel = typeof course.year_level === 'number' ? course.year_level : parseInt(course.year_level) || 1;
      }
      
      const { error } = await supabase.from('courses').upsert({
        code: course.code,
        name: course.name || course.name_ar || course.code,
        name_ar: course.name_ar,
        credits: course.credits || 3,
        department: course.department || 'هندسة المعلوماتية',
        year_level: yearLevel,
        semester: course.semester?.toString(),
        hours_theory: course.hours_theory || 2,
        hours_lab: course.hours_lab || 2,
        description: course.description,
        description_ar: course.description_ar,
        objectives_ar: course.objectives_ar,
        objectives_en: course.objectives_en,
        is_bottleneck: course.is_bottleneck === 'True' || course.is_bottleneck === true,
        critical_path_depth: course.critical_path_depth || 0
      }, { onConflict: 'code' });
      if (error) errors.push(`Course ${course.code}: ${error.message}`);
      else result.courses++;
    }
    console.log(`Synced ${result.courses} courses`);

    // Get courses map
    const { data: coursesData } = await supabase.from('courses').select('id, code');
    const coursesMap = new Map(coursesData?.map(c => [c.code, c.id]) || []);

    // 7. Sync Course-Major relationships
    console.log('Syncing course-major relationships...');
    const courseMajors = await executeNeo4jQuery(driver, `
      MATCH (c:Course)-[:BELONGS_TO]->(m:Major)
      RETURN c.code as course_code, m.name as major_name
      ORDER BY c.code
    `);
    
    // Clear existing relationships first
    await supabase.from('course_majors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const cm of courseMajors) {
      const courseId = coursesMap.get(cm.course_code);
      const majorId = majorsMap.get(cm.major_name);
      if (courseId && majorId) {
        const { error } = await supabase.from('course_majors').insert({
          course_id: courseId,
          major_id: majorId
        });
        if (error && !error.message.includes('duplicate')) {
          errors.push(`Course-Major ${cm.course_code}-${cm.major_name}: ${error.message}`);
        } else {
          result.course_majors++;
        }
      }
    }
    console.log(`Synced ${result.course_majors} course-major relationships`);

    // 8. Sync Prerequisites
    console.log('Syncing prerequisites...');
    const prerequisites = await executeNeo4jQuery(driver, `
      MATCH (c1:Course)-[:IS_PREREQUISITE_FOR]->(c2:Course)
      WHERE c1.code <> c2.code
      RETURN c1.code as prereq_code, c2.code as course_code
      ORDER BY c2.code
    `);
    
    // Clear existing prerequisites
    await supabase.from('course_prerequisites').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const prereq of prerequisites) {
      const courseId = coursesMap.get(prereq.course_code);
      const prereqId = coursesMap.get(prereq.prereq_code);
      if (courseId && prereqId) {
        const { error } = await supabase.from('course_prerequisites').insert({
          course_id: courseId,
          prerequisite_id: prereqId
        });
        if (error && !error.message.includes('duplicate')) {
          errors.push(`Prereq ${prereq.prereq_code}->${prereq.course_code}: ${error.message}`);
        } else {
          result.prerequisites++;
        }
      }
    }
    console.log(`Synced ${result.prerequisites} prerequisites`);

    // 9. Sync Course-Skill relationships
    console.log('Syncing course-skill relationships...');
    const courseSkills = await executeNeo4jQuery(driver, `
      MATCH (c:Course)-[:TEACHES_SKILL]->(s:Skill)
      RETURN c.code as course_code, s.name as skill_name
      ORDER BY c.code
    `);
    
    await supabase.from('course_skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const cs of courseSkills) {
      const courseId = coursesMap.get(cs.course_code);
      const skillId = skillsMap.get(cs.skill_name);
      if (courseId && skillId) {
        const { error } = await supabase.from('course_skills').insert({
          course_id: courseId,
          skill_id: skillId
        });
        if (error && !error.message.includes('duplicate')) {
          errors.push(`Course-Skill ${cs.course_code}-${cs.skill_name}: ${error.message}`);
        } else {
          result.course_skills++;
        }
      }
    }
    console.log(`Synced ${result.course_skills} course-skill relationships`);

    // 10. Sync Course-Topic relationships
    console.log('Syncing course-topic relationships...');
    const courseTopics = await executeNeo4jQuery(driver, `
      MATCH (c:Course)-[:COVERS_TOPIC]->(t:Topic)
      RETURN c.code as course_code, t.name as topic_name
      ORDER BY c.code
    `);
    
    await supabase.from('course_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const ct of courseTopics) {
      const courseId = coursesMap.get(ct.course_code);
      const topicId = topicsMap.get(ct.topic_name);
      if (courseId && topicId) {
        const { error } = await supabase.from('course_topics').insert({
          course_id: courseId,
          topic_id: topicId
        });
        if (error && !error.message.includes('duplicate')) {
          errors.push(`Course-Topic ${ct.course_code}-${ct.topic_name}: ${error.message}`);
        } else {
          result.course_topics++;
        }
      }
    }
    console.log(`Synced ${result.course_topics} course-topic relationships`);

    // 11. Sync Course-Tool relationships
    console.log('Syncing course-tool relationships...');
    const courseTools = await executeNeo4jQuery(driver, `
      MATCH (c:Course)-[:TEACHES_TOOL]->(t:Tool)
      RETURN c.code as course_code, t.name as tool_name
      ORDER BY c.code
    `);
    
    await supabase.from('course_tools').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const ct of courseTools) {
      const courseId = coursesMap.get(ct.course_code);
      const toolId = toolsMap.get(ct.tool_name);
      if (courseId && toolId) {
        const { error } = await supabase.from('course_tools').insert({
          course_id: courseId,
          tool_id: toolId
        });
        if (error && !error.message.includes('duplicate')) {
          errors.push(`Course-Tool ${ct.course_code}-${ct.tool_name}: ${error.message}`);
        } else {
          result.course_tools++;
        }
      }
    }
    console.log(`Synced ${result.course_tools} course-tool relationships`);

    // 12. Sync Course-CareerPath relationships
    console.log('Syncing course-career path relationships...');
    const courseCareerPaths = await executeNeo4jQuery(driver, `
      MATCH (c:Course)-[:LEADS_TO_CAREER]->(cp:CareerPath)
      RETURN c.code as course_code, cp.name as career_path_name
      ORDER BY c.code
    `);
    
    await supabase.from('course_career_paths').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const ccp of courseCareerPaths) {
      const courseId = coursesMap.get(ccp.course_code);
      const cpId = careerPathsMap.get(ccp.career_path_name);
      if (courseId && cpId) {
        const { error } = await supabase.from('course_career_paths').insert({
          course_id: courseId,
          career_path_id: cpId
        });
        if (error && !error.message.includes('duplicate')) {
          errors.push(`Course-CareerPath ${ccp.course_code}-${ccp.career_path_name}: ${error.message}`);
        } else {
          result.course_career_paths++;
        }
      }
    }
    console.log(`Synced ${result.course_career_paths} course-career path relationships`);

    result.errors = errors;
    console.log('Sync completed!', result);

    return new Response(JSON.stringify({
      success: true,
      message: 'تمت المزامنة بنجاح',
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', errorMessage);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      result
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    if (driver) {
      await driver.close();
    }
  }
});
