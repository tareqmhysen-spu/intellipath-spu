import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface GraphNode {
  id: string;
  code: string;
  name: string;
  name_ar?: string;
  credits: number;
  department: string;
  year_level: number;
  semester?: number;
  hours_theory?: number;
  hours_lab?: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'REQUIRES';
}

interface Major {
  id: string;
  name: string;
  name_en: string;
}

interface GraphQueryRequest {
  operation: 'prerequisites' | 'dependents' | 'path' | 'full_graph' | 'critical_path' | 'major_graph' | 'majors_list';
  course_code?: string;
  target_code?: string;
  department?: string;
  major_id?: string;
}

// Simulates Neo4j graph queries using course_prerequisites table
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { operation, course_code, target_code, department, major_id }: GraphQueryRequest = await req.json();

    console.log(`Graph query: ${operation}, course: ${course_code}, major: ${major_id}`);

    // Handle majors_list operation first
    if (operation === 'majors_list') {
      const { data: majors, error: majorsError } = await supabase
        .from('majors')
        .select('id, name, name_en, description, total_credits, duration_years')
        .order('name_en');

      if (majorsError) throw majorsError;

      return new Response(
        JSON.stringify({ majors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all courses - optionally filtered by major
    let coursesQuery = supabase
      .from('courses')
      .select('id, code, name, name_ar, credits, department, year_level, semester, hours_theory, hours_lab')
      .eq('is_active', true);

    if (department) {
      coursesQuery = coursesQuery.eq('department', department);
    }

    const { data: courses, error: coursesError } = await coursesQuery;
    if (coursesError) throw coursesError;

    // Get courses for specific major if major_id is provided
    let majorCourseIds: Set<string> | null = null;
    if (major_id && operation === 'major_graph') {
      const { data: courseMajors, error: cmError } = await supabase
        .from('course_majors')
        .select('course_id')
        .eq('major_id', major_id);

      if (cmError) throw cmError;
      majorCourseIds = new Set(courseMajors?.map(cm => cm.course_id) || []);
    }

    // Get all prerequisites
    const { data: prerequisites, error: prereqError } = await supabase
      .from('course_prerequisites')
      .select(`
        course_id,
        prerequisite_id,
        course:courses!course_prerequisites_course_id_fkey(code, name),
        prerequisite:courses!course_prerequisites_prerequisite_id_fkey(code, name)
      `);

    if (prereqError) throw prereqError;

    // Build course map
    const courseMap = new Map<string, GraphNode>();
    const codeToId = new Map<string, string>();
    const idToCode = new Map<string, string>();

    if (courses) {
      for (const course of courses) {
        // If major filter is active, only include courses from that major
        if (majorCourseIds && !majorCourseIds.has(course.id)) {
          continue;
        }

        const node: GraphNode = {
          id: course.id,
          code: course.code,
          name: course.name,
          name_ar: course.name_ar,
          credits: course.credits,
          department: course.department,
          year_level: course.year_level,
          semester: course.semester,
          hours_theory: course.hours_theory,
          hours_lab: course.hours_lab
        };
        courseMap.set(course.id, node);
        codeToId.set(course.code, course.id);
        idToCode.set(course.id, course.code);
      }
    }

    // Build adjacency lists
    const prerequisitesOf = new Map<string, Set<string>>(); // course -> its prerequisites
    const dependentsOf = new Map<string, Set<string>>(); // course -> courses that require it

    if (prerequisites) {
      for (const prereq of prerequisites) {
        const courseId = prereq.course_id;
        const prereqId = prereq.prerequisite_id;

        // Only include edges where both nodes are in the filtered set
        if (!courseMap.has(courseId) && !majorCourseIds) continue;

        if (!prerequisitesOf.has(courseId)) {
          prerequisitesOf.set(courseId, new Set());
        }
        prerequisitesOf.get(courseId)!.add(prereqId);

        if (!dependentsOf.has(prereqId)) {
          dependentsOf.set(prereqId, new Set());
        }
        dependentsOf.get(prereqId)!.add(courseId);
      }
    }

    // Helper: Get all prerequisites recursively (DFS)
    const getAllPrerequisites = (courseId: string, visited = new Set<string>()): string[] => {
      if (visited.has(courseId)) return [];
      visited.add(courseId);

      const directPrereqs = prerequisitesOf.get(courseId) || new Set();
      const allPrereqs: string[] = [];

      for (const prereqId of directPrereqs) {
        allPrereqs.push(prereqId);
        allPrereqs.push(...getAllPrerequisites(prereqId, visited));
      }

      return [...new Set(allPrereqs)];
    };

    // Helper: Get all dependents recursively
    const getAllDependents = (courseId: string, visited = new Set<string>()): string[] => {
      if (visited.has(courseId)) return [];
      visited.add(courseId);

      const directDeps = dependentsOf.get(courseId) || new Set();
      const allDeps: string[] = [];

      for (const depId of directDeps) {
        allDeps.push(depId);
        allDeps.push(...getAllDependents(depId, visited));
      }

      return [...new Set(allDeps)];
    };

    // Helper: Find shortest path (BFS)
    const findPath = (startId: string, endId: string): string[] => {
      const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { id, path } = queue.shift()!;
        
        if (id === endId) {
          return path;
        }

        if (visited.has(id)) continue;
        visited.add(id);

        const prereqs = prerequisitesOf.get(id) || new Set();
        for (const prereqId of prereqs) {
          if (!visited.has(prereqId)) {
            queue.push({ id: prereqId, path: [...path, prereqId] });
          }
        }
      }

      return [];
    };

    // Helper: Find critical path (longest path to course with no prerequisites)
    const findCriticalPath = (courseId: string): string[] => {
      const prereqs = getAllPrerequisites(courseId);
      if (prereqs.length === 0) return [courseId];

      // Find course with no prerequisites
      let longestPath: string[] = [];
      
      const dfs = (current: string, path: string[]): void => {
        const currentPrereqs = prerequisitesOf.get(current) || new Set();
        
        if (currentPrereqs.size === 0) {
          if (path.length > longestPath.length) {
            longestPath = [...path];
          }
          return;
        }

        for (const prereqId of currentPrereqs) {
          if (!path.includes(prereqId)) {
            dfs(prereqId, [...path, prereqId]);
          }
        }
      };

      dfs(courseId, [courseId]);
      return longestPath.reverse();
    };

    let result: any;

    switch (operation) {
      case 'prerequisites': {
        if (!course_code) {
          return new Response(
            JSON.stringify({ error: "course_code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const courseId = codeToId.get(course_code);
        if (!courseId) {
          return new Response(
            JSON.stringify({ error: `Course ${course_code} not found` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const prereqIds = getAllPrerequisites(courseId);
        const prereqNodes = prereqIds
          .map(id => courseMap.get(id))
          .filter(Boolean)
          .sort((a, b) => (a?.year_level || 0) - (b?.year_level || 0));

        result = {
          course: courseMap.get(courseId),
          prerequisites: prereqNodes,
          total: prereqNodes.length
        };
        break;
      }

      case 'dependents': {
        if (!course_code) {
          return new Response(
            JSON.stringify({ error: "course_code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const courseId = codeToId.get(course_code);
        if (!courseId) {
          return new Response(
            JSON.stringify({ error: `Course ${course_code} not found` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const depIds = getAllDependents(courseId);
        const depNodes = depIds
          .map(id => courseMap.get(id))
          .filter(Boolean)
          .sort((a, b) => (a?.year_level || 0) - (b?.year_level || 0));

        result = {
          course: courseMap.get(courseId),
          dependents: depNodes,
          total: depNodes.length
        };
        break;
      }

      case 'path': {
        if (!course_code || !target_code) {
          return new Response(
            JSON.stringify({ error: "course_code and target_code are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const startId = codeToId.get(course_code);
        const endId = codeToId.get(target_code);

        if (!startId || !endId) {
          return new Response(
            JSON.stringify({ error: "One or both courses not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const pathIds = findPath(startId, endId);
        const pathNodes = pathIds.map(id => courseMap.get(id)).filter(Boolean);

        result = {
          from: courseMap.get(startId),
          to: courseMap.get(endId),
          path: pathNodes,
          exists: pathIds.length > 0
        };
        break;
      }

      case 'critical_path': {
        if (!course_code) {
          return new Response(
            JSON.stringify({ error: "course_code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const courseId = codeToId.get(course_code);
        if (!courseId) {
          return new Response(
            JSON.stringify({ error: `Course ${course_code} not found` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const pathIds = findCriticalPath(courseId);
        const pathNodes = pathIds.map(id => courseMap.get(id)).filter(Boolean);

        result = {
          course: courseMap.get(courseId),
          critical_path: pathNodes,
          length: pathNodes.length,
          total_credits: pathNodes.reduce((sum, n) => sum + (n?.credits || 0), 0)
        };
        break;
      }

      case 'major_graph':
      case 'full_graph': {
        // For major_graph, we already filtered courses above
        // Build nodes from the filtered courseMap
        const nodes: GraphNode[] = Array.from(courseMap.values())
          .sort((a, b) => {
            if (a.year_level !== b.year_level) return a.year_level - b.year_level;
            return a.code.localeCompare(b.code);
          });

        const edges: GraphEdge[] = [];
        const nodeIds = new Set(nodes.map(n => n.id));

        if (prerequisites) {
          for (const prereq of prerequisites) {
            // For major_graph, include edges where EITHER course is in the major
            // This shows the full prerequisite context
            if (operation === 'major_graph') {
              // Include edge if the main course is in the major
              if (!nodeIds.has(prereq.course_id)) continue;
            }

            edges.push({
              from: prereq.course_id,
              to: prereq.prerequisite_id,
              type: 'REQUIRES'
            });
          }
        }

        // Get major info if major_id is provided
        let majorInfo = null;
        if (major_id) {
          const { data: major } = await supabase
            .from('majors')
            .select('id, name, name_en, description, total_credits, duration_years')
            .eq('id', major_id)
            .single();
          majorInfo = major;
        }

        result = {
          nodes,
          edges,
          total_nodes: nodes.length,
          total_edges: edges.length,
          major: majorInfo
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Graph query error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Query failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
