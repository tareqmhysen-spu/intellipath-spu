import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import neo4j from "https://deno.land/x/neo4j_driver_lite@5.27.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Neo4jRequest {
  operation: 'query' | 'import_all' | 'get_courses' | 'get_prerequisites' | 'get_majors' | 'get_full_graph' | 'get_major_graph';
  cypher?: string;
  params?: Record<string, any>;
  major_id?: string;
  course_code?: string;
}

interface Neo4jResponse {
  results: any[];
  errors?: string[];
}

async function executeNeo4jQuery(cypher: string, params: Record<string, any> = {}): Promise<Neo4jResponse> {
  const neo4jUri = Deno.env.get('NEO4J_URI');
  const neo4jUsername = Deno.env.get('NEO4J_USERNAME');
  const neo4jPassword = Deno.env.get('NEO4J_PASSWORD');

  if (!neo4jUri || !neo4jUsername || !neo4jPassword) {
    throw new Error('Neo4j connection details not configured');
  }

  console.log('Connecting to Neo4j:', neo4jUri);

  // Don't pass encrypted option when using neo4j+s:// protocol
  // as the URL already specifies encryption
  const driver = neo4j.driver(
    neo4jUri,
    neo4j.auth.basic(neo4jUsername, neo4jPassword)
  );

  const session = driver.session({ database: 'neo4j' });

  try {
    const result = await session.run(cypher, params);
    
    const records = result.records.map(record => {
      const obj: Record<string, any> = {};
      const keys = record.keys as string[];
      keys.forEach((key: string) => {
        const value = record.get(key);
        // Handle Neo4j Integer type
        if (neo4j.isInt(value)) {
          obj[key] = value.toNumber();
        } else if (Array.isArray(value)) {
          obj[key] = value.map(v => neo4j.isInt(v) ? v.toNumber() : v);
        } else {
          obj[key] = value;
        }
      });
      return obj;
    });

    console.log(`Query returned ${records.length} records`);
    return { results: records };
  } finally {
    await session.close();
    await driver.close();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: Neo4jRequest = await req.json();
    console.log('Neo4j operation:', request.operation);

    let result: any;

    switch (request.operation) {
      case 'query':
        if (!request.cypher) {
          throw new Error('Cypher query required');
        }
        result = await executeNeo4jQuery(request.cypher, request.params || {});
        break;

      case 'get_majors':
        result = await executeNeo4jQuery(`
          MATCH (m:Major)
          RETURN m.id as id, m.name as name, m.name_en as name_en, 
                 m.description as description, m.total_credits as total_credits
          ORDER BY m.name
        `);
        break;

      case 'get_courses':
        result = await executeNeo4jQuery(`
          MATCH (c:Course)
          OPTIONAL MATCH (c)-[:BELONGS_TO]->(m:Major)
          RETURN c.id as id, c.code as code, c.name as name, c.name_ar as name_ar,
                 c.credits as credits, c.department as department, c.year_level as year_level,
                 c.semester as semester, c.hours_theory as hours_theory, c.hours_lab as hours_lab,
                 c.description as description, c.objectives as objectives,
                 collect(DISTINCT m.name) as majors
          ORDER BY c.code
        `);
        break;

      case 'get_prerequisites':
        result = await executeNeo4jQuery(`
          MATCH (c1:Course)-[r:IS_PREREQUISITE_FOR]->(c2:Course)
          RETURN c1.code as prerequisite_code, c1.name as prerequisite_name,
                 c2.code as course_code, c2.name as course_name,
                 r.type as relationship_type
          ORDER BY c2.code, c1.code
        `);
        break;

      case 'get_full_graph':
        // Get all nodes and relationships
        const courses = await executeNeo4jQuery(`
          MATCH (c:Course)
          OPTIONAL MATCH (c)-[:BELONGS_TO]->(m:Major)
          RETURN c.id as id, c.code as code, c.name as name, c.name_ar as name_ar,
                 c.credits as credits, c.department as department, c.year_level as year_level,
                 c.semester as semester, c.hours_theory as hours_theory, c.hours_lab as hours_lab,
                 collect(DISTINCT m.id) as major_ids
          ORDER BY c.year_level, c.semester, c.code
        `);

        const prerequisites = await executeNeo4jQuery(`
          MATCH (c1:Course)-[:IS_PREREQUISITE_FOR]->(c2:Course)
          RETURN c1.code as from_code, c2.code as to_code
        `);

        const majors = await executeNeo4jQuery(`
          MATCH (m:Major)
          RETURN m.id as id, m.name as name, m.name_en as name_en
        `);

        result = {
          results: [{
            nodes: courses.results,
            edges: prerequisites.results,
            majors: majors.results,
            total_nodes: courses.results.length,
            total_edges: prerequisites.results.length
          }]
        };
        break;

      case 'get_major_graph':
        if (!request.major_id) {
          throw new Error('major_id required');
        }

        const majorCourses = await executeNeo4jQuery(`
          MATCH (c:Course)-[:BELONGS_TO]->(m:Major {id: $major_id})
          RETURN c.id as id, c.code as code, c.name as name, c.name_ar as name_ar,
                 c.credits as credits, c.department as department, c.year_level as year_level,
                 c.semester as semester, c.hours_theory as hours_theory, c.hours_lab as hours_lab
          ORDER BY c.year_level, c.semester, c.code
        `, { major_id: request.major_id });

        const courseCodes = majorCourses.results.map((c: any) => c.code);

        const majorPrereqs = await executeNeo4jQuery(`
          MATCH (c1:Course)-[:IS_PREREQUISITE_FOR]->(c2:Course)
          WHERE c1.code IN $codes OR c2.code IN $codes
          RETURN c1.code as from_code, c2.code as to_code
        `, { codes: courseCodes });

        const majorInfo = await executeNeo4jQuery(`
          MATCH (m:Major {id: $major_id})
          RETURN m.id as id, m.name as name, m.name_en as name_en, 
                 m.description as description, m.total_credits as total_credits
        `, { major_id: request.major_id });

        result = {
          results: [{
            nodes: majorCourses.results,
            edges: majorPrereqs.results,
            major: majorInfo.results[0] || null,
            total_nodes: majorCourses.results.length,
            total_edges: majorPrereqs.results.length
          }]
        };
        break;

      case 'import_all':
        // Get all data from Neo4j for syncing to Supabase
        const allCourses = await executeNeo4jQuery(`
          MATCH (c:Course)
          OPTIONAL MATCH (c)-[:BELONGS_TO]->(m:Major)
          OPTIONAL MATCH (c)-[:TEACHES_SKILL]->(s:Skill)
          OPTIONAL MATCH (c)-[:COVERS_TOPIC]->(t:Topic)
          OPTIONAL MATCH (c)-[:TEACHES_TOOL]->(tool:Tool)
          OPTIONAL MATCH (c)-[:LEADS_TO_CAREER]->(cp:CareerPath)
          RETURN c.id as id, c.code as code, c.name as name, c.name_ar as name_ar,
                 c.credits as credits, c.department as department, c.year_level as year_level,
                 c.semester as semester, c.hours_theory as hours_theory, c.hours_lab as hours_lab,
                 c.description as description, c.objectives as objectives,
                 c.is_bottleneck as is_bottleneck, c.critical_path_depth as critical_path_depth,
                 collect(DISTINCT m.id) as major_ids,
                 collect(DISTINCT s.name) as skills,
                 collect(DISTINCT t.name) as topics,
                 collect(DISTINCT tool.name) as tools,
                 collect(DISTINCT cp.name) as career_paths
          ORDER BY c.code
        `);

        const allPrereqs = await executeNeo4jQuery(`
          MATCH (c1:Course)-[r:IS_PREREQUISITE_FOR]->(c2:Course)
          RETURN c1.code as from_code, c2.code as to_code, r.type as type
        `);

        const allMajors = await executeNeo4jQuery(`
          MATCH (m:Major)
          RETURN m.id as id, m.name as name, m.name_en as name_en,
                 m.description as description, m.total_credits as total_credits
        `);

        const allSkills = await executeNeo4jQuery(`
          MATCH (s:Skill)
          RETURN s.name as name, s.description as description, s.category as category
        `);

        const allTopics = await executeNeo4jQuery(`
          MATCH (t:Topic)
          RETURN t.name as name, t.description as description
        `);

        const allTools = await executeNeo4jQuery(`
          MATCH (t:Tool)
          RETURN t.name as name, t.description as description, t.category as category
        `);

        const allCareerPaths = await executeNeo4jQuery(`
          MATCH (cp:CareerPath)
          RETURN cp.name as name, cp.name_en as name_en, cp.description as description
        `);

        result = {
          results: [{
            courses: allCourses.results,
            prerequisites: allPrereqs.results,
            majors: allMajors.results,
            skills: allSkills.results,
            topics: allTopics.results,
            tools: allTools.results,
            career_paths: allCareerPaths.results,
            stats: {
              courses: allCourses.results.length,
              prerequisites: allPrereqs.results.length,
              majors: allMajors.results.length,
              skills: allSkills.results.length,
              topics: allTopics.results.length,
              tools: allTools.results.length,
              career_paths: allCareerPaths.results.length
            }
          }]
        };
        break;

      default:
        throw new Error(`Unknown operation: ${request.operation}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack || error.toString() : String(error);
    console.error('Neo4j function error:', errorMessage, errorDetails);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
