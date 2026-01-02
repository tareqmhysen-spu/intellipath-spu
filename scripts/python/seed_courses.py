#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
IntelliPath - Course Data Seeder Script
المرشد الأكاديمي الذكي - سكريبت تعبئة بيانات المقررات
=============================================================================
This script reads course data from Excel/CSV files and populates the database.
هذا السكريبت يقرأ بيانات المقررات من ملفات Excel/CSV ويعبئ قاعدة البيانات.
=============================================================================
Version: 1.0.0 | الإصدار: 1.0.0
Last Updated: 2026-01-02 | آخر تحديث: 2026-01-02
=============================================================================
"""

import os
import sys
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

# Third-party imports | المكتبات الخارجية
try:
    import pandas as pd
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Install with: pip install pandas supabase python-dotenv openpyxl")
    sys.exit(1)

# Load environment variables | تحميل متغيرات البيئة
load_dotenv()

# =============================================================================
# LOGGING CONFIGURATION | إعداد التسجيل
# =============================================================================

# Setup logging with bilingual messages | إعداد التسجيل برسائل ثنائية اللغة
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('course_seeder.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


# =============================================================================
# DATA CLASSES | فئات البيانات
# =============================================================================

@dataclass
class Course:
    """
    Course data model | نموذج بيانات المقرر
    Represents a university course with all its attributes
    يمثل مقرراً جامعياً بجميع سماته
    """
    code: str  # Course code | رمز المقرر
    name: str  # English name | الاسم بالإنجليزية
    name_ar: Optional[str] = None  # Arabic name | الاسم بالعربية
    description: Optional[str] = None  # English description | الوصف بالإنجليزية
    description_ar: Optional[str] = None  # Arabic description | الوصف بالعربية
    credits: int = 3  # Credit hours | الساعات المعتمدة
    department: str = "هندسة المعلوماتية"  # Department | القسم
    year_level: int = 1  # Year level | السنة الدراسية
    semester: Optional[str] = None  # Semester | الفصل الدراسي
    hours_theory: int = 2  # Theory hours | ساعات نظري
    hours_lab: int = 2  # Lab hours | ساعات عملي
    difficulty_rating: float = 3.0  # Difficulty | الصعوبة
    is_bottleneck: bool = False  # Bottleneck indicator | مؤشر عنق الزجاجة
    objectives_en: Optional[str] = None  # Learning objectives EN | أهداف التعلم EN
    objectives_ar: Optional[str] = None  # Learning objectives AR | أهداف التعلم AR
    prerequisites: List[str] = field(default_factory=list)  # Prerequisites | المتطلبات السابقة
    is_active: bool = True  # Active status | حالة التفعيل


@dataclass
class SeederConfig:
    """
    Configuration for the seeder | إعدادات أداة التعبئة
    """
    supabase_url: str  # Supabase project URL | رابط مشروع Supabase
    supabase_key: str  # Supabase service role key | مفتاح خدمة Supabase
    input_file: str  # Input file path | مسار ملف الإدخال
    batch_size: int = 50  # Batch size for inserts | حجم الدفعة للإدراج
    dry_run: bool = False  # Dry run mode | وضع التجربة


# =============================================================================
# COURSE SEEDER CLASS | فئة أداة تعبئة المقررات
# =============================================================================

class CourseSeeder:
    """
    Main class for seeding course data to database
    الفئة الرئيسية لتعبئة بيانات المقررات في قاعدة البيانات
    """
    
    def __init__(self, config: SeederConfig):
        """
        Initialize the seeder | تهيئة أداة التعبئة
        
        Args:
            config: Seeder configuration | إعدادات أداة التعبئة
        """
        self.config = config
        self.supabase: Client = create_client(config.supabase_url, config.supabase_key)
        self.courses: List[Course] = []
        self.stats = {
            'total_read': 0,
            'inserted': 0,
            'updated': 0,
            'skipped': 0,
            'errors': 0
        }
        logger.info("Course seeder initialized | تم تهيئة أداة تعبئة المقررات")
    
    def read_excel(self, file_path: str) -> pd.DataFrame:
        """
        Read course data from Excel file | قراءة بيانات المقررات من ملف Excel
        
        Args:
            file_path: Path to Excel file | مسار ملف Excel
            
        Returns:
            DataFrame with course data | إطار بيانات المقررات
        """
        logger.info(f"Reading Excel file: {file_path} | قراءة ملف Excel: {file_path}")
        
        try:
            # Read Excel file with multiple possible encodings
            # قراءة ملف Excel بترميزات متعددة محتملة
            df = pd.read_excel(file_path, engine='openpyxl')
            logger.info(f"Read {len(df)} rows from Excel | تمت قراءة {len(df)} صف من Excel")
            return df
        except Exception as e:
            logger.error(f"Error reading Excel: {e} | خطأ في قراءة Excel: {e}")
            raise
    
    def read_csv(self, file_path: str) -> pd.DataFrame:
        """
        Read course data from CSV file | قراءة بيانات المقررات من ملف CSV
        
        Args:
            file_path: Path to CSV file | مسار ملف CSV
            
        Returns:
            DataFrame with course data | إطار بيانات المقررات
        """
        logger.info(f"Reading CSV file: {file_path} | قراءة ملف CSV: {file_path}")
        
        # Try different encodings | تجربة ترميزات مختلفة
        encodings = ['utf-8', 'utf-8-sig', 'cp1256', 'iso-8859-6', 'windows-1256']
        
        for encoding in encodings:
            try:
                df = pd.read_csv(file_path, encoding=encoding)
                logger.info(f"Read {len(df)} rows with encoding: {encoding}")
                return df
            except UnicodeDecodeError:
                continue
        
        raise ValueError("Could not read CSV with any supported encoding")
    
    def parse_courses(self, df: pd.DataFrame) -> List[Course]:
        """
        Parse DataFrame to Course objects | تحليل إطار البيانات إلى كائنات المقررات
        
        Args:
            df: DataFrame with course data | إطار بيانات المقررات
            
        Returns:
            List of Course objects | قائمة كائنات المقررات
        """
        courses = []
        
        # Column mapping - handle various column name formats
        # تعيين الأعمدة - التعامل مع تنسيقات أسماء الأعمدة المختلفة
        column_map = {
            'code': ['code', 'course_code', 'رمز المقرر', 'الرمز', 'رمز'],
            'name': ['name', 'course_name', 'name_en', 'اسم المقرر انجليزي'],
            'name_ar': ['name_ar', 'arabic_name', 'اسم المقرر', 'الاسم بالعربية'],
            'credits': ['credits', 'credit_hours', 'الساعات المعتمدة', 'ساعات'],
            'department': ['department', 'dept', 'القسم'],
            'year_level': ['year_level', 'year', 'level', 'السنة', 'المستوى'],
            'semester': ['semester', 'الفصل', 'الفصل الدراسي'],
            'hours_theory': ['hours_theory', 'theory', 'نظري', 'ساعات نظري'],
            'hours_lab': ['hours_lab', 'lab', 'practical', 'عملي', 'ساعات عملي'],
            'description': ['description', 'desc', 'description_en'],
            'description_ar': ['description_ar', 'arabic_desc', 'الوصف'],
            'prerequisites': ['prerequisites', 'prereqs', 'المتطلبات السابقة', 'متطلبات']
        }
        
        def get_column(df: pd.DataFrame, options: List[str]) -> Optional[str]:
            """Find matching column name | إيجاد اسم العمود المطابق"""
            df_columns_lower = [c.lower().strip() for c in df.columns]
            for opt in options:
                if opt.lower() in df_columns_lower:
                    idx = df_columns_lower.index(opt.lower())
                    return df.columns[idx]
            return None
        
        # Get actual column names | الحصول على أسماء الأعمدة الفعلية
        columns = {key: get_column(df, opts) for key, opts in column_map.items()}
        
        # Validate required columns | التحقق من الأعمدة المطلوبة
        if not columns['code']:
            raise ValueError("Missing required 'code' column | عمود 'code' مفقود")
        if not columns['name'] and not columns['name_ar']:
            raise ValueError("Missing name column | عمود الاسم مفقود")
        
        # Parse each row | تحليل كل صف
        for idx, row in df.iterrows():
            try:
                # Get code (required) | الحصول على الرمز (مطلوب)
                code = str(row[columns['code']]).strip().upper()
                if not code or code == 'NAN':
                    continue
                
                # Get name | الحصول على الاسم
                name = str(row[columns['name']]).strip() if columns['name'] and pd.notna(row[columns['name']]) else ''
                name_ar = str(row[columns['name_ar']]).strip() if columns['name_ar'] and pd.notna(row[columns['name_ar']]) else None
                
                # Use Arabic name as fallback | استخدام الاسم العربي كبديل
                if not name and name_ar:
                    name = name_ar
                
                if not name:
                    logger.warning(f"Row {idx}: Missing name for course {code} | اسم مفقود للمقرر")
                    continue
                
                # Get optional fields | الحصول على الحقول الاختيارية
                credits = int(row[columns['credits']]) if columns['credits'] and pd.notna(row[columns['credits']]) else 3
                department = str(row[columns['department']]).strip() if columns['department'] and pd.notna(row[columns['department']]) else 'هندسة المعلوماتية'
                year_level = int(row[columns['year_level']]) if columns['year_level'] and pd.notna(row[columns['year_level']]) else 1
                semester = str(row[columns['semester']]).strip() if columns['semester'] and pd.notna(row[columns['semester']]) else None
                hours_theory = int(row[columns['hours_theory']]) if columns['hours_theory'] and pd.notna(row[columns['hours_theory']]) else 2
                hours_lab = int(row[columns['hours_lab']]) if columns['hours_lab'] and pd.notna(row[columns['hours_lab']]) else 2
                description = str(row[columns['description']]).strip() if columns['description'] and pd.notna(row[columns['description']]) else None
                description_ar = str(row[columns['description_ar']]).strip() if columns['description_ar'] and pd.notna(row[columns['description_ar']]) else None
                
                # Parse prerequisites | تحليل المتطلبات السابقة
                prerequisites = []
                if columns['prerequisites'] and pd.notna(row[columns['prerequisites']]):
                    prereq_str = str(row[columns['prerequisites']])
                    # Split by common delimiters | القسمة بالفواصل الشائعة
                    for delim in [',', '،', ';', '|', '-']:
                        if delim in prereq_str:
                            prerequisites = [p.strip().upper() for p in prereq_str.split(delim) if p.strip()]
                            break
                    if not prerequisites and prereq_str.strip():
                        prerequisites = [prereq_str.strip().upper()]
                
                # Create course object | إنشاء كائن المقرر
                course = Course(
                    code=code,
                    name=name,
                    name_ar=name_ar,
                    description=description,
                    description_ar=description_ar,
                    credits=min(max(credits, 1), 10),  # Clamp 1-10 | تقييد 1-10
                    department=department,
                    year_level=min(max(year_level, 1), 6),  # Clamp 1-6 | تقييد 1-6
                    semester=semester,
                    hours_theory=hours_theory,
                    hours_lab=hours_lab,
                    prerequisites=prerequisites
                )
                courses.append(course)
                
            except Exception as e:
                logger.error(f"Error parsing row {idx}: {e} | خطأ في تحليل الصف {idx}: {e}")
                self.stats['errors'] += 1
        
        self.stats['total_read'] = len(courses)
        logger.info(f"Parsed {len(courses)} courses | تم تحليل {len(courses)} مقرر")
        return courses
    
    def seed_courses(self, courses: List[Course]) -> None:
        """
        Insert courses into database | إدراج المقررات في قاعدة البيانات
        
        Args:
            courses: List of Course objects | قائمة كائنات المقررات
        """
        if self.config.dry_run:
            logger.info("DRY RUN MODE - No data will be inserted | وضع التجربة - لن يتم إدراج بيانات")
            for course in courses[:5]:
                logger.info(f"Would insert: {course.code} - {course.name_ar or course.name}")
            return
        
        logger.info(f"Seeding {len(courses)} courses in batches of {self.config.batch_size}")
        logger.info(f"تعبئة {len(courses)} مقرر في دفعات من {self.config.batch_size}")
        
        # Process in batches | المعالجة على دفعات
        for i in range(0, len(courses), self.config.batch_size):
            batch = courses[i:i + self.config.batch_size]
            self._insert_batch(batch)
            logger.info(f"Processed batch {i // self.config.batch_size + 1}")
        
        # Insert prerequisites after all courses exist
        # إدراج المتطلبات السابقة بعد وجود جميع المقررات
        logger.info("Inserting prerequisites | إدراج المتطلبات السابقة")
        self._insert_prerequisites(courses)
    
    def _insert_batch(self, courses: List[Course]) -> None:
        """
        Insert a batch of courses | إدراج دفعة من المقررات
        
        Args:
            courses: Batch of courses to insert | دفعة المقررات للإدراج
        """
        for course in courses:
            try:
                course_data = {
                    'code': course.code,
                    'name': course.name,
                    'name_ar': course.name_ar,
                    'description': course.description,
                    'description_ar': course.description_ar,
                    'credits': course.credits,
                    'department': course.department,
                    'year_level': course.year_level,
                    'semester': course.semester,
                    'hours_theory': course.hours_theory,
                    'hours_lab': course.hours_lab,
                    'difficulty_rating': course.difficulty_rating,
                    'is_bottleneck': course.is_bottleneck,
                    'objectives_en': course.objectives_en,
                    'objectives_ar': course.objectives_ar,
                    'is_active': course.is_active
                }
                
                # Upsert - insert or update on conflict | إدراج أو تحديث عند التعارض
                result = self.supabase.table('courses').upsert(
                    course_data,
                    on_conflict='code'
                ).execute()
                
                if result.data:
                    self.stats['inserted'] += 1
                else:
                    self.stats['skipped'] += 1
                    
            except Exception as e:
                logger.error(f"Error inserting {course.code}: {e}")
                self.stats['errors'] += 1
    
    def _insert_prerequisites(self, courses: List[Course]) -> None:
        """
        Insert prerequisite relationships | إدراج علاقات المتطلبات السابقة
        
        Args:
            courses: List of courses with prerequisites | قائمة المقررات مع متطلباتها
        """
        # Get all course IDs | الحصول على جميع معرفات المقررات
        result = self.supabase.table('courses').select('id, code').execute()
        code_to_id = {row['code']: row['id'] for row in result.data}
        
        prereq_count = 0
        for course in courses:
            if not course.prerequisites:
                continue
                
            course_id = code_to_id.get(course.code)
            if not course_id:
                continue
            
            for prereq_code in course.prerequisites:
                prereq_id = code_to_id.get(prereq_code)
                if not prereq_id:
                    logger.warning(f"Prerequisite not found: {prereq_code} for {course.code}")
                    continue
                
                try:
                    self.supabase.table('course_prerequisites').upsert(
                        {
                            'course_id': course_id,
                            'prerequisite_id': prereq_id
                        },
                        on_conflict='course_id,prerequisite_id'
                    ).execute()
                    prereq_count += 1
                except Exception as e:
                    logger.error(f"Error inserting prereq {prereq_code} -> {course.code}: {e}")
        
        logger.info(f"Inserted {prereq_count} prerequisite relationships | تم إدراج {prereq_count} علاقة متطلب سابق")
    
    def run(self) -> Dict[str, int]:
        """
        Run the seeding process | تشغيل عملية التعبئة
        
        Returns:
            Statistics dictionary | قاموس الإحصائيات
        """
        start_time = datetime.now()
        logger.info("=" * 60)
        logger.info("Starting course seeding process | بدء عملية تعبئة المقررات")
        logger.info("=" * 60)
        
        try:
            # Read input file | قراءة ملف الإدخال
            file_ext = os.path.splitext(self.config.input_file)[1].lower()
            if file_ext in ['.xlsx', '.xls']:
                df = self.read_excel(self.config.input_file)
            elif file_ext == '.csv':
                df = self.read_csv(self.config.input_file)
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")
            
            # Parse courses | تحليل المقررات
            courses = self.parse_courses(df)
            
            # Seed to database | التعبئة في قاعدة البيانات
            self.seed_courses(courses)
            
        except Exception as e:
            logger.error(f"Seeding failed: {e} | فشلت التعبئة: {e}")
            raise
        
        # Print summary | طباعة الملخص
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info("=" * 60)
        logger.info("SEEDING COMPLETE | اكتملت التعبئة")
        logger.info(f"Time elapsed: {elapsed:.2f}s | الوقت المنقضي: {elapsed:.2f} ثانية")
        logger.info(f"Total read: {self.stats['total_read']} | إجمالي القراءة: {self.stats['total_read']}")
        logger.info(f"Inserted: {self.stats['inserted']} | تم الإدراج: {self.stats['inserted']}")
        logger.info(f"Skipped: {self.stats['skipped']} | تم التخطي: {self.stats['skipped']}")
        logger.info(f"Errors: {self.stats['errors']} | الأخطاء: {self.stats['errors']}")
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
        description='IntelliPath Course Seeder | أداة تعبئة مقررات IntelliPath'
    )
    parser.add_argument(
        'input_file',
        help='Path to Excel or CSV file | مسار ملف Excel أو CSV'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=50,
        help='Batch size for database inserts (default: 50) | حجم الدفعة للإدراج'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without inserting data | تشغيل بدون إدراج بيانات'
    )
    
    args = parser.parse_args()
    
    # Get Supabase credentials | الحصول على بيانات اعتماد Supabase
    supabase_url = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
        logger.error("مفقود: متغيرات بيئة SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    # Create configuration | إنشاء الإعدادات
    config = SeederConfig(
        supabase_url=supabase_url,
        supabase_key=supabase_key,
        input_file=args.input_file,
        batch_size=args.batch_size,
        dry_run=args.dry_run
    )
    
    # Run seeder | تشغيل أداة التعبئة
    seeder = CourseSeeder(config)
    stats = seeder.run()
    
    # Exit with error code if there were errors | الخروج برمز خطأ إذا كانت هناك أخطاء
    sys.exit(1 if stats['errors'] > 0 else 0)


if __name__ == '__main__':
    main()
