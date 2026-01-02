export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_color: string | null
          category: string
          condition_type: string
          condition_value: Json | null
          created_at: string
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          xp_reward: number | null
        }
        Insert: {
          badge_color?: string | null
          category?: string
          condition_type: string
          condition_value?: Json | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          xp_reward?: number | null
        }
        Update: {
          badge_color?: string | null
          category?: string
          condition_type?: string
          condition_value?: Json | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      advisor_student_assignments: {
        Row: {
          advisor_id: string
          assigned_at: string
          id: string
          student_id: string
        }
        Insert: {
          advisor_id: string
          assigned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          advisor_id?: string
          assigned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      career_paths: {
        Row: {
          color: string | null
          created_at: string
          demand: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          name: string
          name_ar: string | null
          neo4j_id: number | null
          salary_range_max: number | null
          salary_range_min: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          demand?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          name: string
          name_ar?: string | null
          neo4j_id?: number | null
          salary_range_max?: number | null
          salary_range_min?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          demand?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          neo4j_id?: number | null
          salary_range_max?: number | null
          salary_range_min?: number | null
        }
        Relationships: []
      }
      chat_analytics: {
        Row: {
          cache_hit: boolean | null
          confidence: number | null
          conversation_id: string | null
          created_at: string
          faq_match: boolean | null
          id: string
          latency_ms: number | null
          query_text: string
          response_mode: string
          route_type: string | null
          sources_count: number | null
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          faq_match?: boolean | null
          id?: string
          latency_ms?: number | null
          query_text: string
          response_mode?: string
          route_type?: string | null
          sources_count?: number | null
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean | null
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          faq_match?: boolean | null
          id?: string
          latency_ms?: number | null
          query_text?: string
          response_mode?: string
          route_type?: string | null
          sources_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_career_paths: {
        Row: {
          career_path_id: string
          course_id: string
          created_at: string
          id: string
          importance: string | null
        }
        Insert: {
          career_path_id: string
          course_id: string
          created_at?: string
          id?: string
          importance?: string | null
        }
        Update: {
          career_path_id?: string
          course_id?: string
          created_at?: string
          id?: string
          importance?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_career_paths_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_career_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_majors: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean | null
          major_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          major_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          major_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_majors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_majors_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
        ]
      }
      course_prerequisites: {
        Row: {
          course_id: string
          created_at: string
          id: string
          prerequisite_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          prerequisite_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          prerequisite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_id_fkey"
            columns: ["prerequisite_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_relations: {
        Row: {
          course_id: string
          created_at: string
          id: string
          related_course_id: string
          relation_type: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          related_course_id: string
          relation_type?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          related_course_id?: string
          relation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_relations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_relations_related_course_id_fkey"
            columns: ["related_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_skills: {
        Row: {
          course_id: string
          created_at: string
          id: string
          level: string | null
          skill_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          level?: string | null
          skill_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          level?: string | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tools: {
        Row: {
          course_id: string
          created_at: string
          id: string
          tool_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          tool_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tools_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      course_topics: {
        Row: {
          course_id: string
          created_at: string
          id: string
          topic_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          topic_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_topics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          credits: number
          critical_path_depth: number | null
          department: string
          description: string | null
          description_ar: string | null
          difficulty_rating: number | null
          hours_lab: number | null
          hours_theory: number | null
          id: string
          is_active: boolean | null
          is_bottleneck: boolean | null
          name: string
          name_ar: string | null
          neo4j_id: number | null
          objectives_ar: string | null
          objectives_en: string | null
          semester: string | null
          updated_at: string
          year_level: number
        }
        Insert: {
          code: string
          created_at?: string
          credits?: number
          critical_path_depth?: number | null
          department: string
          description?: string | null
          description_ar?: string | null
          difficulty_rating?: number | null
          hours_lab?: number | null
          hours_theory?: number | null
          id?: string
          is_active?: boolean | null
          is_bottleneck?: boolean | null
          name: string
          name_ar?: string | null
          neo4j_id?: number | null
          objectives_ar?: string | null
          objectives_en?: string | null
          semester?: string | null
          updated_at?: string
          year_level?: number
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          critical_path_depth?: number | null
          department?: string
          description?: string | null
          description_ar?: string | null
          difficulty_rating?: number | null
          hours_lab?: number | null
          hours_theory?: number | null
          id?: string
          is_active?: boolean | null
          is_bottleneck?: boolean | null
          name?: string
          name_ar?: string | null
          neo4j_id?: number | null
          objectives_ar?: string | null
          objectives_en?: string | null
          semester?: string | null
          updated_at?: string
          year_level?: number
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          is_completed: boolean
          reminder_days: number
          student_id: string
          title: string
          title_ar: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          is_completed?: boolean
          reminder_days?: number
          student_id: string
          title: string
          title_ar?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean
          reminder_days?: number
          student_id?: string
          title?: string
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          academic_year: string
          completed_hours: number | null
          course_id: string
          created_at: string
          grade: number | null
          grade_points: number | null
          id: string
          letter_grade: string | null
          registered_hours: number | null
          semester: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          completed_hours?: number | null
          course_id: string
          created_at?: string
          grade?: number | null
          grade_points?: number | null
          id?: string
          letter_grade?: string | null
          registered_hours?: number | null
          semester: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          completed_hours?: number | null
          course_id?: string
          created_at?: string
          grade?: number | null
          grade_points?: number | null
          id?: string
          letter_grade?: string | null
          registered_hours?: number | null
          semester?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          answer_ar: string | null
          category: string
          created_at: string
          department: string | null
          hit_count: number | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          priority: number | null
          question: string
          question_ar: string | null
          updated_at: string
          year_level: number | null
        }
        Insert: {
          answer: string
          answer_ar?: string | null
          category?: string
          created_at?: string
          department?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question: string
          question_ar?: string | null
          updated_at?: string
          year_level?: number | null
        }
        Update: {
          answer?: string
          answer_ar?: string | null
          category?: string
          created_at?: string
          department?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question?: string
          question_ar?: string | null
          updated_at?: string
          year_level?: number | null
        }
        Relationships: []
      }
      import_file_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_name: string
          id: string
          import_log_id: string | null
          records_count: number | null
          status: string
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          id?: string
          import_log_id?: string | null
          records_count?: number | null
          status?: string
          student_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          id?: string
          import_log_id?: string | null
          records_count?: number | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_file_logs_import_log_id_fkey"
            columns: ["import_log_id"]
            isOneToOne: false
            referencedRelation: "import_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          duplicates_merged: number
          errors: Json
          failed_records: number
          file_name: string
          file_type: string
          id: string
          inserted_records: number
          parsed_rows: number
          status: string
          successful_records: number
          total_records: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duplicates_merged?: number
          errors?: Json
          failed_records?: number
          file_name: string
          file_type: string
          id?: string
          inserted_records?: number
          parsed_rows?: number
          status?: string
          successful_records?: number
          total_records?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duplicates_merged?: number
          errors?: Json
          failed_records?: number
          file_name?: string
          file_type?: string
          id?: string
          inserted_records?: number
          parsed_rows?: number
          status?: string
          successful_records?: number
          total_records?: number
          user_id?: string
        }
        Relationships: []
      }
      majors: {
        Row: {
          created_at: string
          description: string | null
          duration_years: number | null
          id: string
          name: string
          name_en: string | null
          neo4j_id: number | null
          total_credits: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_years?: number | null
          id?: string
          name: string
          name_en?: string | null
          neo4j_id?: number | null
          total_credits?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_years?: number | null
          id?: string
          name?: string
          name_en?: string | null
          neo4j_id?: number | null
          total_credits?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          message_ar: string | null
          title: string
          title_ar: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          message_ar?: string | null
          title: string
          title_ar?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          message_ar?: string | null
          title?: string
          title_ar?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          full_name_ar: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          full_name_ar?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          full_name_ar?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      query_cache: {
        Row: {
          created_at: string
          expires_at: string
          hit_count: number | null
          id: string
          metadata_filter: Json | null
          query_hash: string
          query_text: string
          response: Json
        }
        Insert: {
          created_at?: string
          expires_at: string
          hit_count?: number | null
          id?: string
          metadata_filter?: Json | null
          query_hash: string
          query_text: string
          response: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          hit_count?: number | null
          id?: string
          metadata_filter?: Json | null
          query_hash?: string
          query_text?: string
          response?: Json
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number | null
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number | null
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number | null
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          name_ar: string | null
          neo4j_id: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          name_ar?: string | null
          neo4j_id?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          neo4j_id?: number | null
        }
        Relationships: []
      }
      student_academic_records: {
        Row: {
          academic_warning: string | null
          academic_year: string
          baccalaureate_country: string | null
          baccalaureate_type: string | null
          certificate_average: number | null
          certificate_score: number | null
          college: string | null
          completed_hours_semester: number | null
          course_code: string
          course_credits: number | null
          course_name: string
          created_at: string
          cumulative_gpa_percent: number | null
          cumulative_gpa_points: number | null
          final_grade: number | null
          grade_points: number | null
          has_ministry_scholarship: boolean | null
          id: string
          last_registration_semester: string | null
          letter_grade: string | null
          major: string | null
          permanent_status: string | null
          previous_academic_warning: string | null
          raw_data: Json | null
          registered_hours_semester: number | null
          semester: string
          semester_status: string | null
          student_id: string
          study_mode: string | null
          total_completed_hours: number | null
          updated_at: string
        }
        Insert: {
          academic_warning?: string | null
          academic_year: string
          baccalaureate_country?: string | null
          baccalaureate_type?: string | null
          certificate_average?: number | null
          certificate_score?: number | null
          college?: string | null
          completed_hours_semester?: number | null
          course_code: string
          course_credits?: number | null
          course_name: string
          created_at?: string
          cumulative_gpa_percent?: number | null
          cumulative_gpa_points?: number | null
          final_grade?: number | null
          grade_points?: number | null
          has_ministry_scholarship?: boolean | null
          id?: string
          last_registration_semester?: string | null
          letter_grade?: string | null
          major?: string | null
          permanent_status?: string | null
          previous_academic_warning?: string | null
          raw_data?: Json | null
          registered_hours_semester?: number | null
          semester: string
          semester_status?: string | null
          student_id: string
          study_mode?: string | null
          total_completed_hours?: number | null
          updated_at?: string
        }
        Update: {
          academic_warning?: string | null
          academic_year?: string
          baccalaureate_country?: string | null
          baccalaureate_type?: string | null
          certificate_average?: number | null
          certificate_score?: number | null
          college?: string | null
          completed_hours_semester?: number | null
          course_code?: string
          course_credits?: number | null
          course_name?: string
          created_at?: string
          cumulative_gpa_percent?: number | null
          cumulative_gpa_points?: number | null
          final_grade?: number | null
          grade_points?: number | null
          has_ministry_scholarship?: boolean | null
          id?: string
          last_registration_semester?: string | null
          letter_grade?: string | null
          major?: string | null
          permanent_status?: string | null
          previous_academic_warning?: string | null
          raw_data?: Json | null
          registered_hours_semester?: number | null
          semester?: string
          semester_status?: string | null
          student_id?: string
          study_mode?: string | null
          total_completed_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          student_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_warning: string | null
          baccalaureate_country: string | null
          baccalaureate_type: string | null
          certificate_average: number | null
          certificate_score: number | null
          created_at: string
          department: string
          gpa: number | null
          has_ministry_scholarship: boolean | null
          id: string
          last_activity_at: string | null
          level: number | null
          major: string | null
          permanent_status: string | null
          streak_days: number | null
          student_id: string
          study_mode: string | null
          total_credits: number | null
          updated_at: string
          user_id: string
          xp_points: number | null
          year_level: number
        }
        Insert: {
          academic_warning?: string | null
          baccalaureate_country?: string | null
          baccalaureate_type?: string | null
          certificate_average?: number | null
          certificate_score?: number | null
          created_at?: string
          department: string
          gpa?: number | null
          has_ministry_scholarship?: boolean | null
          id?: string
          last_activity_at?: string | null
          level?: number | null
          major?: string | null
          permanent_status?: string | null
          streak_days?: number | null
          student_id: string
          study_mode?: string | null
          total_credits?: number | null
          updated_at?: string
          user_id: string
          xp_points?: number | null
          year_level?: number
        }
        Update: {
          academic_warning?: string | null
          baccalaureate_country?: string | null
          baccalaureate_type?: string | null
          certificate_average?: number | null
          certificate_score?: number | null
          created_at?: string
          department?: string
          gpa?: number | null
          has_ministry_scholarship?: boolean | null
          id?: string
          last_activity_at?: string | null
          level?: number | null
          major?: string | null
          permanent_status?: string | null
          streak_days?: number | null
          student_id?: string
          study_mode?: string | null
          total_credits?: number | null
          updated_at?: string
          user_id?: string
          xp_points?: number | null
          year_level?: number
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          content_chunks: Json | null
          content_text: string | null
          course_id: string | null
          created_at: string
          description: string | null
          download_count: number | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_processed: boolean | null
          is_public: boolean | null
          metadata: Json | null
          title: string
          title_ar: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_chunks?: Json | null
          content_text?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_processed?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          title: string
          title_ar?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_chunks?: Json | null
          content_text?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_processed?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          name_ar: string | null
          neo4j_id: number | null
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          name_ar?: string | null
          neo4j_id?: number | null
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          neo4j_id?: number | null
          url?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          name_ar: string | null
          neo4j_id: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          name_ar?: string | null
          neo4j_id?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          neo4j_id?: number | null
        }
        Relationships: []
      }
      user_memories: {
        Row: {
          access_count: number | null
          content: Json | null
          created_at: string
          expires_at: string | null
          id: string
          importance: number | null
          last_accessed_at: string | null
          memory_type: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          content?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number | null
          last_accessed_at?: string | null
          memory_type: string
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          content?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number | null
          last_accessed_at?: string | null
          memory_type?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_memories: { Args: never; Returns: undefined }
      get_cleanup_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      upsert_rate_limit: {
        Args: {
          p_endpoint: string
          p_request_count?: number
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "student" | "advisor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "advisor", "admin"],
    },
  },
} as const
