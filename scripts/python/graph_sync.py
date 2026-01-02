#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
IntelliPath - Graph Database Sync Script
المرشد الأكاديمي الذكي - سكريبت مزامنة قاعدة البيانات البيانية
=============================================================================
This script syncs course data and prerequisites from PostgreSQL to Neo4j
for graph-based queries (prerequisite chains, course relationships).
هذا السكريبت يزامن بيانات المقررات والمتطلبات من PostgreSQL إلى Neo4j.
=============================================================================
Version: 1.0.0 | الإصدار: 1.0.0
Last Updated: 2026-01-02 | آخر تحديث: 2026-01-02
=============================================================================
"""

import os
import sys
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

# Third-party imports | المكتبات الخارجية
try:
    from neo4j import GraphDatabase, Driver
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Install with: pip install neo4j supabase python-dotenv")
    sys.exit(1)

# Load environment variables | تحميل متغيرات البيئة
load_dotenv()

# =============================================================================
# LOGGING CONFIGURATION | إعداد التسجيل
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('graph_sync.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION | الإعدادات
# =============================================================================

@dataclass
class SyncConfig:
    """
    Configuration for graph sync | إعدادات مزامنة الرسم البياني
    """
    # Supabase settings | إعدادات Supabase
    supabase_url: str
    supabase_key: str
    
    # Neo4j settings | إعدادات Neo4j
    neo4j_uri: str
    neo4j_user: str
    neo4j_password: str
    
    # Sync options | خيارات المزامنة
    clear_existing: bool = False  # Clear existing data before sync | مسح البيانات قبل المزامنة
    batch_size: int = 100  # Batch size for operations | حجم الدفعة للعمليات


# =============================================================================
# NEO4J GRAPH SYNC CLASS | فئة مزامنة Neo4j
# =============================================================================

class GraphSync:
    """
    Main class for syncing data to Neo4j graph database
    الفئة الرئيسية لمزامنة البيانات إلى قاعدة Neo4j البيانية
    """
    
    def __init__(self, config: SyncConfig):
        """
        Initialize the sync | تهيئة المزامنة
        
        Args:
            config: Sync configuration | إعدادات المزامنة
        """
        self.config = config
        
        # Initialize Supabase client | تهيئة عميل Supabase
        self.supabase: Client = create_client(config.supabase_url, config.supabase_key)
        
        # Initialize Neo4j driver | تهيئة برنامج تشغيل Neo4j
        self.neo4j_driver: Driver = GraphDatabase.driver(
            config.neo4j_uri,
            auth=(config.neo4j_user, config.neo4j_password)
        )
        
        # Statistics | الإحصائيات
        self.stats = {
            'courses_synced': 0,
            'majors_synced': 0,
            'skills_synced': 0,
            'prerequisites_synced': 0,
            'career_paths_synced': 0,
            'relationships_created': 0,
            'errors': 0
        }
        
        logger.info("Graph sync initialized | تم تهيئة مزامنة الرسم البياني")
    
    def close(self):
        """Close connections | إغلاق الاتصالات"""
        if self.neo4j_driver:
            self.neo4j_driver.close()
            logger.info("Neo4j connection closed | تم إغلاق اتصال Neo4j")
    
    def verify_connection(self) -> bool:
        """
        Verify Neo4j connection | التحقق من اتصال Neo4j
        
        Returns:
            True if connected | True إذا متصل
        """
        try:
            with self.neo4j_driver.session() as session:
                result = session.run("RETURN 1 AS test")
                record = result.single()
                if record and record['test'] == 1:
                    logger.info("Neo4j connection verified | تم التحقق من اتصال Neo4j")
                    return True
        except Exception as e:
            logger.error(f"Neo4j connection failed: {e} | فشل اتصال Neo4j: {e}")
        return False
    
    def setup_constraints(self):
        """
        Create Neo4j constraints and indexes | إنشاء قيود وفهارس Neo4j
        """
        logger.info("Setting up Neo4j constraints | إعداد قيود Neo4j")
        
        constraints = [
            # Course constraints | قيود المقررات
            "CREATE CONSTRAINT course_code IF NOT EXISTS FOR (c:Course) REQUIRE c.code IS UNIQUE",
            # Major constraints | قيود التخصصات
            "CREATE CONSTRAINT major_name IF NOT EXISTS FOR (m:Major) REQUIRE m.name IS UNIQUE",
            # Skill constraints | قيود المهارات
            "CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE",
            # CareerPath constraints | قيود المسارات المهنية
            "CREATE CONSTRAINT career_name IF NOT EXISTS FOR (cp:CareerPath) REQUIRE cp.name IS UNIQUE",
        ]
        
        indexes = [
            # Course indexes | فهارس المقررات
            "CREATE INDEX course_department IF NOT EXISTS FOR (c:Course) ON (c.department)",
            "CREATE INDEX course_year IF NOT EXISTS FOR (c:Course) ON (c.year_level)",
            # Full-text search index | فهرس البحث النصي
            "CREATE FULLTEXT INDEX course_search IF NOT EXISTS FOR (c:Course) ON EACH [c.name, c.name_ar, c.description_ar]"
        ]
        
        with self.neo4j_driver.session() as session:
            for constraint in constraints:
                try:
                    session.run(constraint)
                except Exception as e:
                    if "already exists" not in str(e).lower():
                        logger.warning(f"Constraint warning: {e}")
            
            for index in indexes:
                try:
                    session.run(index)
                except Exception as e:
                    if "already exists" not in str(e).lower():
                        logger.warning(f"Index warning: {e}")
        
        logger.info("Constraints and indexes set up | تم إعداد القيود والفهارس")
    
    def clear_graph(self):
        """
        Clear all nodes and relationships | مسح جميع العقد والعلاقات
        """
        if not self.config.clear_existing:
            return
            
        logger.warning("Clearing existing graph data | مسح بيانات الرسم البياني")
        
        with self.neo4j_driver.session() as session:
            # Delete in batches to avoid memory issues | الحذف على دفعات
            session.run("MATCH (n) DETACH DELETE n")
        
        logger.info("Graph cleared | تم مسح الرسم البياني")
    
    def sync_courses(self) -> Dict[str, str]:
        """
        Sync courses from PostgreSQL to Neo4j | مزامنة المقررات من PostgreSQL إلى Neo4j
        
        Returns:
            Mapping of course code to Neo4j node ID | تعيين رمز المقرر إلى معرف عقدة Neo4j
        """
        logger.info("Syncing courses | مزامنة المقررات")
        
        # Fetch courses from Supabase | جلب المقررات من Supabase
        result = self.supabase.table('courses').select('*').eq('is_active', True).execute()
        courses = result.data
        
        logger.info(f"Found {len(courses)} courses to sync | تم إيجاد {len(courses)} مقرر للمزامنة")
        
        code_to_id = {}
        
        with self.neo4j_driver.session() as session:
            for course in courses:
                try:
                    # Create or update course node | إنشاء أو تحديث عقدة المقرر
                    query = """
                    MERGE (c:Course {code: $code})
                    SET c.name = $name,
                        c.name_ar = $name_ar,
                        c.description = $description,
                        c.description_ar = $description_ar,
                        c.credits = $credits,
                        c.department = $department,
                        c.year_level = $year_level,
                        c.hours_theory = $hours_theory,
                        c.hours_lab = $hours_lab,
                        c.difficulty_rating = $difficulty_rating,
                        c.is_bottleneck = $is_bottleneck,
                        c.supabase_id = $supabase_id,
                        c.updated_at = datetime()
                    RETURN elementId(c) as node_id
                    """
                    
                    result = session.run(query, {
                        'code': course['code'],
                        'name': course['name'],
                        'name_ar': course.get('name_ar'),
                        'description': course.get('description'),
                        'description_ar': course.get('description_ar'),
                        'credits': course['credits'],
                        'department': course['department'],
                        'year_level': course['year_level'],
                        'hours_theory': course.get('hours_theory', 2),
                        'hours_lab': course.get('hours_lab', 2),
                        'difficulty_rating': float(course.get('difficulty_rating', 3.0)),
                        'is_bottleneck': course.get('is_bottleneck', False),
                        'supabase_id': course['id']
                    })
                    
                    record = result.single()
                    if record:
                        code_to_id[course['code']] = record['node_id']
                        self.stats['courses_synced'] += 1
                        
                except Exception as e:
                    logger.error(f"Error syncing course {course['code']}: {e}")
                    self.stats['errors'] += 1
        
        logger.info(f"Synced {self.stats['courses_synced']} courses")
        return code_to_id
    
    def sync_prerequisites(self, code_to_id: Dict[str, str]):
        """
        Sync prerequisite relationships | مزامنة علاقات المتطلبات السابقة
        
        Args:
            code_to_id: Mapping of course codes to Neo4j IDs | تعيين رموز المقررات
        """
        logger.info("Syncing prerequisites | مزامنة المتطلبات السابقة")
        
        # Fetch prerequisites with course codes | جلب المتطلبات مع رموز المقررات
        result = self.supabase.table('course_prerequisites').select(
            '*, course:courses!course_prerequisites_course_id_fkey(code), prerequisite:courses!course_prerequisites_prerequisite_id_fkey(code)'
        ).execute()
        
        prerequisites = result.data
        logger.info(f"Found {len(prerequisites)} prerequisites | تم إيجاد {len(prerequisites)} متطلب سابق")
        
        with self.neo4j_driver.session() as session:
            for prereq in prerequisites:
                try:
                    course_code = prereq.get('course', {}).get('code')
                    prereq_code = prereq.get('prerequisite', {}).get('code')
                    
                    if not course_code or not prereq_code:
                        continue
                    
                    # Create REQUIRES relationship | إنشاء علاقة REQUIRES
                    query = """
                    MATCH (c:Course {code: $course_code})
                    MATCH (p:Course {code: $prereq_code})
                    MERGE (c)-[r:REQUIRES]->(p)
                    SET r.created_at = datetime()
                    RETURN type(r) as rel_type
                    """
                    
                    result = session.run(query, {
                        'course_code': course_code,
                        'prereq_code': prereq_code
                    })
                    
                    if result.single():
                        self.stats['prerequisites_synced'] += 1
                        self.stats['relationships_created'] += 1
                        
                except Exception as e:
                    logger.error(f"Error syncing prerequisite: {e}")
                    self.stats['errors'] += 1
        
        logger.info(f"Synced {self.stats['prerequisites_synced']} prerequisites")
    
    def sync_majors(self):
        """
        Sync majors/specializations | مزامنة التخصصات
        """
        logger.info("Syncing majors | مزامنة التخصصات")
        
        result = self.supabase.table('majors').select('*').execute()
        majors = result.data
        
        with self.neo4j_driver.session() as session:
            for major in majors:
                try:
                    query = """
                    MERGE (m:Major {name: $name})
                    SET m.name_en = $name_en,
                        m.description = $description,
                        m.total_credits = $total_credits,
                        m.duration_years = $duration_years,
                        m.supabase_id = $supabase_id,
                        m.updated_at = datetime()
                    RETURN elementId(m) as node_id
                    """
                    
                    result = session.run(query, {
                        'name': major['name'],
                        'name_en': major.get('name_en'),
                        'description': major.get('description'),
                        'total_credits': major.get('total_credits', 171),
                        'duration_years': major.get('duration_years', 5),
                        'supabase_id': major['id']
                    })
                    
                    if result.single():
                        self.stats['majors_synced'] += 1
                        
                except Exception as e:
                    logger.error(f"Error syncing major {major['name']}: {e}")
                    self.stats['errors'] += 1
        
        logger.info(f"Synced {self.stats['majors_synced']} majors")
    
    def sync_skills(self):
        """
        Sync skills | مزامنة المهارات
        """
        logger.info("Syncing skills | مزامنة المهارات")
        
        result = self.supabase.table('skills').select('*').execute()
        skills = result.data
        
        with self.neo4j_driver.session() as session:
            for skill in skills:
                try:
                    query = """
                    MERGE (s:Skill {name: $name})
                    SET s.name_ar = $name_ar,
                        s.category = $category,
                        s.description = $description,
                        s.supabase_id = $supabase_id,
                        s.updated_at = datetime()
                    RETURN elementId(s) as node_id
                    """
                    
                    result = session.run(query, {
                        'name': skill['name'],
                        'name_ar': skill.get('name_ar'),
                        'category': skill.get('category'),
                        'description': skill.get('description'),
                        'supabase_id': skill['id']
                    })
                    
                    if result.single():
                        self.stats['skills_synced'] += 1
                        
                except Exception as e:
                    logger.error(f"Error syncing skill {skill['name']}: {e}")
                    self.stats['errors'] += 1
        
        logger.info(f"Synced {self.stats['skills_synced']} skills")
    
    def sync_course_skills(self):
        """
        Sync course-skill relationships | مزامنة علاقات المقرر-المهارة
        """
        logger.info("Syncing course-skill relationships | مزامنة علاقات المقرر-المهارة")
        
        result = self.supabase.table('course_skills').select(
            '*, course:courses(code), skill:skills(name)'
        ).execute()
        
        relations = result.data
        
        with self.neo4j_driver.session() as session:
            for rel in relations:
                try:
                    course_code = rel.get('course', {}).get('code')
                    skill_name = rel.get('skill', {}).get('name')
                    level = rel.get('level', 'beginner')
                    
                    if not course_code or not skill_name:
                        continue
                    
                    query = """
                    MATCH (c:Course {code: $course_code})
                    MATCH (s:Skill {name: $skill_name})
                    MERGE (c)-[r:TEACHES]->(s)
                    SET r.level = $level,
                        r.created_at = datetime()
                    RETURN type(r) as rel_type
                    """
                    
                    result = session.run(query, {
                        'course_code': course_code,
                        'skill_name': skill_name,
                        'level': level
                    })
                    
                    if result.single():
                        self.stats['relationships_created'] += 1
                        
                except Exception as e:
                    logger.error(f"Error syncing course-skill: {e}")
                    self.stats['errors'] += 1
    
    def sync_career_paths(self):
        """
        Sync career paths | مزامنة المسارات المهنية
        """
        logger.info("Syncing career paths | مزامنة المسارات المهنية")
        
        result = self.supabase.table('career_paths').select('*').execute()
        careers = result.data
        
        with self.neo4j_driver.session() as session:
            for career in careers:
                try:
                    query = """
                    MERGE (cp:CareerPath {name: $name})
                    SET cp.name_ar = $name_ar,
                        cp.description = $description,
                        cp.description_ar = $description_ar,
                        cp.demand = $demand,
                        cp.salary_min = $salary_min,
                        cp.salary_max = $salary_max,
                        cp.supabase_id = $supabase_id,
                        cp.updated_at = datetime()
                    RETURN elementId(cp) as node_id
                    """
                    
                    result = session.run(query, {
                        'name': career['name'],
                        'name_ar': career.get('name_ar'),
                        'description': career.get('description'),
                        'description_ar': career.get('description_ar'),
                        'demand': career.get('demand', 'متوسط'),
                        'salary_min': career.get('salary_range_min'),
                        'salary_max': career.get('salary_range_max'),
                        'supabase_id': career['id']
                    })
                    
                    if result.single():
                        self.stats['career_paths_synced'] += 1
                        
                except Exception as e:
                    logger.error(f"Error syncing career {career['name']}: {e}")
                    self.stats['errors'] += 1
        
        logger.info(f"Synced {self.stats['career_paths_synced']} career paths")
    
    def sync_course_careers(self):
        """
        Sync course-career path relationships | مزامنة علاقات المقرر-المسار المهني
        """
        logger.info("Syncing course-career relationships | مزامنة علاقات المقرر-المسار")
        
        result = self.supabase.table('course_career_paths').select(
            '*, course:courses(code), career:career_paths(name)'
        ).execute()
        
        relations = result.data
        
        with self.neo4j_driver.session() as session:
            for rel in relations:
                try:
                    course_code = rel.get('course', {}).get('code')
                    career_name = rel.get('career', {}).get('name')
                    importance = rel.get('importance', 'core')
                    
                    if not course_code or not career_name:
                        continue
                    
                    query = """
                    MATCH (c:Course {code: $course_code})
                    MATCH (cp:CareerPath {name: $career_name})
                    MERGE (c)-[r:PREPARES_FOR]->(cp)
                    SET r.importance = $importance,
                        r.created_at = datetime()
                    RETURN type(r) as rel_type
                    """
                    
                    result = session.run(query, {
                        'course_code': course_code,
                        'career_name': career_name,
                        'importance': importance
                    })
                    
                    if result.single():
                        self.stats['relationships_created'] += 1
                        
                except Exception as e:
                    logger.error(f"Error syncing course-career: {e}")
                    self.stats['errors'] += 1
    
    def calculate_critical_paths(self):
        """
        Calculate and mark critical path courses | حساب وتعليم مقررات المسار الحرج
        """
        logger.info("Calculating critical paths | حساب المسارات الحرجة")
        
        with self.neo4j_driver.session() as session:
            # Find courses that are prerequisites for many other courses
            # إيجاد المقررات التي هي متطلبات لكثير من المقررات الأخرى
            query = """
            MATCH (c:Course)<-[:REQUIRES]-(dependent:Course)
            WITH c, count(dependent) as dependent_count
            WHERE dependent_count >= 2
            SET c.is_bottleneck = true,
                c.dependent_count = dependent_count
            RETURN c.code as code, dependent_count
            """
            
            result = session.run(query)
            bottlenecks = list(result)
            
            logger.info(f"Marked {len(bottlenecks)} bottleneck courses")
            
            # Calculate depth for each course (longest path to a leaf)
            # حساب العمق لكل مقرر (أطول مسار إلى ورقة)
            depth_query = """
            MATCH (c:Course)
            OPTIONAL MATCH path = (c)-[:REQUIRES*]->(leaf:Course)
            WHERE NOT (leaf)-[:REQUIRES]->()
            WITH c, max(length(path)) as max_depth
            SET c.critical_path_depth = coalesce(max_depth, 0)
            RETURN c.code as code, c.critical_path_depth as depth
            ORDER BY depth DESC
            LIMIT 10
            """
            
            result = session.run(depth_query)
            depths = list(result)
            
            logger.info(f"Calculated depths for courses. Top 10 deepest:")
            for d in depths:
                logger.info(f"  {d['code']}: depth {d['depth']}")
    
    def run(self) -> Dict[str, int]:
        """
        Run the complete sync process | تشغيل عملية المزامنة الكاملة
        
        Returns:
            Sync statistics | إحصائيات المزامنة
        """
        start_time = datetime.now()
        logger.info("=" * 60)
        logger.info("Starting graph sync | بدء مزامنة الرسم البياني")
        logger.info("=" * 60)
        
        try:
            # Verify connection | التحقق من الاتصال
            if not self.verify_connection():
                raise Exception("Cannot connect to Neo4j")
            
            # Setup constraints | إعداد القيود
            self.setup_constraints()
            
            # Clear if requested | المسح إذا طُلب
            self.clear_graph()
            
            # Sync all entities | مزامنة جميع الكيانات
            code_to_id = self.sync_courses()
            self.sync_prerequisites(code_to_id)
            self.sync_majors()
            self.sync_skills()
            self.sync_course_skills()
            self.sync_career_paths()
            self.sync_course_careers()
            
            # Calculate derived data | حساب البيانات المشتقة
            self.calculate_critical_paths()
            
        except Exception as e:
            logger.error(f"Sync failed: {e} | فشلت المزامنة: {e}")
            raise
        finally:
            self.close()
        
        # Print summary | طباعة الملخص
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info("=" * 60)
        logger.info("SYNC COMPLETE | اكتملت المزامنة")
        logger.info(f"Time elapsed: {elapsed:.2f}s | الوقت المنقضي: {elapsed:.2f} ثانية")
        logger.info(f"Courses synced: {self.stats['courses_synced']}")
        logger.info(f"Prerequisites synced: {self.stats['prerequisites_synced']}")
        logger.info(f"Majors synced: {self.stats['majors_synced']}")
        logger.info(f"Skills synced: {self.stats['skills_synced']}")
        logger.info(f"Career paths synced: {self.stats['career_paths_synced']}")
        logger.info(f"Relationships created: {self.stats['relationships_created']}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info("=" * 60)
        
        return self.stats


# =============================================================================
# MAIN ENTRY POINT | نقطة الدخول الرئيسية
# =============================================================================

def main():
    """
    Main entry point | نقطة الدخول الرئيسية
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description='IntelliPath Graph Sync | مزامنة رسم IntelliPath البياني'
    )
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear existing graph data before sync | مسح البيانات الموجودة قبل المزامنة'
    )
    
    args = parser.parse_args()
    
    # Get credentials | الحصول على بيانات الاعتماد
    supabase_url = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    neo4j_uri = os.getenv('NEO4J_URI')
    neo4j_user = os.getenv('NEO4J_USERNAME', 'neo4j')
    neo4j_password = os.getenv('NEO4J_PASSWORD')
    
    # Validate credentials | التحقق من بيانات الاعتماد
    missing = []
    if not supabase_url:
        missing.append('SUPABASE_URL')
    if not supabase_key:
        missing.append('SUPABASE_SERVICE_ROLE_KEY')
    if not neo4j_uri:
        missing.append('NEO4J_URI')
    if not neo4j_password:
        missing.append('NEO4J_PASSWORD')
    
    if missing:
        logger.error(f"Missing environment variables: {', '.join(missing)}")
        logger.error(f"متغيرات البيئة المفقودة: {', '.join(missing)}")
        sys.exit(1)
    
    # Create configuration | إنشاء الإعدادات
    config = SyncConfig(
        supabase_url=supabase_url,
        supabase_key=supabase_key,
        neo4j_uri=neo4j_uri,
        neo4j_user=neo4j_user,
        neo4j_password=neo4j_password,
        clear_existing=args.clear
    )
    
    # Run sync | تشغيل المزامنة
    syncer = GraphSync(config)
    stats = syncer.run()
    
    sys.exit(1 if stats['errors'] > 0 else 0)


if __name__ == '__main__':
    main()
