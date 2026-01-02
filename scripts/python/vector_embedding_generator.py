#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
IntelliPath - Vector Embedding Generator
المرشد الأكاديمي الذكي - مولد التضمينات المتجهية
=============================================================================
This script processes documents (PDFs, etc.), generates embeddings, and 
uploads them to Qdrant vector database for RAG retrieval.
هذا السكريبت يعالج المستندات ويولد التضمينات ويرفعها إلى قاعدة Qdrant.
=============================================================================
Version: 1.0.0 | الإصدار: 1.0.0
Last Updated: 2026-01-02 | آخر تحديث: 2026-01-02
=============================================================================
"""

import os
import sys
import json
import hashlib
import logging
from typing import List, Dict, Any, Optional, Iterator
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
import uuid

# Third-party imports | المكتبات الخارجية
try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
    from langchain.schema import Document
    import openai
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Install with: pip install langchain langchain-community pypdf openai qdrant-client python-dotenv")
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
        logging.FileHandler('embedding_generator.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION | الإعدادات
# =============================================================================

@dataclass
class EmbeddingConfig:
    """
    Configuration for embedding generation | إعدادات توليد التضمينات
    """
    # OpenAI settings | إعدادات OpenAI
    openai_api_key: str  # OpenAI API key | مفتاح API OpenAI
    embedding_model: str = "text-embedding-3-small"  # Embedding model | نموذج التضمين
    
    # Qdrant settings | إعدادات Qdrant
    qdrant_url: str = "http://localhost:6333"  # Qdrant URL | رابط Qdrant
    qdrant_api_key: Optional[str] = None  # Qdrant API key | مفتاح Qdrant
    collection_name: str = "intellipath_documents"  # Collection name | اسم المجموعة
    
    # Chunking settings | إعدادات التقطيع
    chunk_size: int = 1000  # Characters per chunk | الأحرف لكل قطعة
    chunk_overlap: int = 200  # Overlap between chunks | التداخل بين القطع
    
    # Processing settings | إعدادات المعالجة
    batch_size: int = 100  # Batch size for uploads | حجم الدفعة للرفع
    vector_size: int = 1536  # Embedding dimension | بُعد التضمين


@dataclass
class DocumentChunk:
    """
    Represents a document chunk for embedding | يمثل قطعة مستند للتضمين
    """
    id: str  # Unique chunk ID | معرف القطعة الفريد
    content: str  # Text content | المحتوى النصي
    metadata: Dict[str, Any] = field(default_factory=dict)  # Metadata | البيانات الوصفية
    embedding: Optional[List[float]] = None  # Vector embedding | التضمين المتجهي


# =============================================================================
# EMBEDDING GENERATOR CLASS | فئة مولد التضمينات
# =============================================================================

class VectorEmbeddingGenerator:
    """
    Main class for generating and storing embeddings
    الفئة الرئيسية لتوليد وتخزين التضمينات
    """
    
    def __init__(self, config: EmbeddingConfig):
        """
        Initialize the generator | تهيئة المولد
        
        Args:
            config: Generator configuration | إعدادات المولد
        """
        self.config = config
        
        # Initialize OpenAI client | تهيئة عميل OpenAI
        self.openai_client = openai.OpenAI(api_key=config.openai_api_key)
        
        # Initialize Qdrant client | تهيئة عميل Qdrant
        self.qdrant = QdrantClient(
            url=config.qdrant_url,
            api_key=config.qdrant_api_key
        )
        
        # Initialize text splitter | تهيئة مقسم النص
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ".", "!", "?", "،", "؟", "!", " ", ""]
        )
        
        # Statistics | الإحصائيات
        self.stats = {
            'documents_processed': 0,
            'chunks_created': 0,
            'embeddings_generated': 0,
            'vectors_uploaded': 0,
            'errors': 0
        }
        
        logger.info("Vector embedding generator initialized | تم تهيئة مولد التضمينات")
    
    def ensure_collection(self) -> None:
        """
        Ensure Qdrant collection exists | التأكد من وجود مجموعة Qdrant
        Creates the collection if it doesn't exist
        ينشئ المجموعة إذا لم تكن موجودة
        """
        try:
            # Check if collection exists | التحقق من وجود المجموعة
            collections = self.qdrant.get_collections().collections
            exists = any(c.name == self.config.collection_name for c in collections)
            
            if not exists:
                logger.info(f"Creating collection: {self.config.collection_name}")
                self.qdrant.create_collection(
                    collection_name=self.config.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.config.vector_size,
                        distance=models.Distance.COSINE
                    )
                )
                
                # Create payload indexes for filtering | إنشاء فهارس للفلترة
                self.qdrant.create_payload_index(
                    collection_name=self.config.collection_name,
                    field_name="source_type",
                    field_schema=models.PayloadSchemaType.KEYWORD
                )
                self.qdrant.create_payload_index(
                    collection_name=self.config.collection_name,
                    field_name="department",
                    field_schema=models.PayloadSchemaType.KEYWORD
                )
                self.qdrant.create_payload_index(
                    collection_name=self.config.collection_name,
                    field_name="course_code",
                    field_schema=models.PayloadSchemaType.KEYWORD
                )
                
                logger.info(f"Collection created: {self.config.collection_name}")
            else:
                logger.info(f"Collection exists: {self.config.collection_name}")
                
        except Exception as e:
            logger.error(f"Error ensuring collection: {e}")
            raise
    
    def load_documents(self, directory: str, file_pattern: str = "**/*.pdf") -> List[Document]:
        """
        Load documents from directory | تحميل المستندات من المجلد
        
        Args:
            directory: Path to documents directory | مسار مجلد المستندات
            file_pattern: Glob pattern for files | نمط البحث عن الملفات
            
        Returns:
            List of loaded documents | قائمة المستندات المحملة
        """
        logger.info(f"Loading documents from: {directory} | تحميل المستندات من: {directory}")
        
        documents = []
        path = Path(directory)
        
        if not path.exists():
            logger.error(f"Directory not found: {directory} | المجلد غير موجود: {directory}")
            return []
        
        # Find all PDF files | إيجاد جميع ملفات PDF
        pdf_files = list(path.glob(file_pattern))
        logger.info(f"Found {len(pdf_files)} PDF files | تم إيجاد {len(pdf_files)} ملف PDF")
        
        for pdf_path in pdf_files:
            try:
                loader = PyPDFLoader(str(pdf_path))
                docs = loader.load()
                
                # Add source metadata | إضافة بيانات المصدر
                for doc in docs:
                    doc.metadata['source_file'] = pdf_path.name
                    doc.metadata['source_path'] = str(pdf_path)
                    
                    # Extract course code from filename if present
                    # استخراج رمز المقرر من اسم الملف إذا وجد
                    filename = pdf_path.stem.upper()
                    if any(c.isdigit() for c in filename):
                        doc.metadata['course_code'] = filename
                
                documents.extend(docs)
                self.stats['documents_processed'] += 1
                logger.info(f"Loaded: {pdf_path.name} ({len(docs)} pages)")
                
            except Exception as e:
                logger.error(f"Error loading {pdf_path.name}: {e}")
                self.stats['errors'] += 1
        
        logger.info(f"Loaded {len(documents)} document pages total")
        return documents
    
    def chunk_documents(self, documents: List[Document]) -> List[DocumentChunk]:
        """
        Split documents into chunks | تقسيم المستندات إلى قطع
        
        Args:
            documents: List of documents | قائمة المستندات
            
        Returns:
            List of document chunks | قائمة قطع المستندات
        """
        logger.info(f"Chunking {len(documents)} documents | تقطيع {len(documents)} مستند")
        
        chunks = []
        
        for doc in documents:
            try:
                # Split document text | تقسيم نص المستند
                text_chunks = self.text_splitter.split_text(doc.page_content)
                
                for i, chunk_text in enumerate(text_chunks):
                    # Skip empty chunks | تخطي القطع الفارغة
                    if not chunk_text.strip():
                        continue
                    
                    # Generate unique ID based on content hash | توليد معرف فريد من hash المحتوى
                    content_hash = hashlib.md5(chunk_text.encode()).hexdigest()[:12]
                    chunk_id = f"{doc.metadata.get('source_file', 'unknown')}_{i}_{content_hash}"
                    
                    chunk = DocumentChunk(
                        id=chunk_id,
                        content=chunk_text,
                        metadata={
                            **doc.metadata,
                            'chunk_index': i,
                            'chunk_count': len(text_chunks),
                            'content_length': len(chunk_text),
                            'source_type': 'pdf',
                            'processed_at': datetime.now().isoformat()
                        }
                    )
                    chunks.append(chunk)
                    
            except Exception as e:
                logger.error(f"Error chunking document: {e}")
                self.stats['errors'] += 1
        
        self.stats['chunks_created'] = len(chunks)
        logger.info(f"Created {len(chunks)} chunks | تم إنشاء {len(chunks)} قطعة")
        return chunks
    
    def generate_embeddings(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        """
        Generate embeddings for chunks | توليد التضمينات للقطع
        
        Args:
            chunks: List of document chunks | قائمة قطع المستندات
            
        Returns:
            Chunks with embeddings | القطع مع التضمينات
        """
        logger.info(f"Generating embeddings for {len(chunks)} chunks")
        logger.info(f"توليد التضمينات لـ {len(chunks)} قطعة")
        
        # Process in batches to avoid API limits | المعالجة على دفعات
        batch_size = min(self.config.batch_size, 2048)  # OpenAI limit
        
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            texts = [chunk.content for chunk in batch]
            
            try:
                # Call OpenAI embedding API | استدعاء API تضمين OpenAI
                response = self.openai_client.embeddings.create(
                    model=self.config.embedding_model,
                    input=texts
                )
                
                # Assign embeddings to chunks | تعيين التضمينات للقطع
                for j, embedding_data in enumerate(response.data):
                    batch[j].embedding = embedding_data.embedding
                    self.stats['embeddings_generated'] += 1
                
                logger.info(f"Generated embeddings for batch {i // batch_size + 1}")
                
            except Exception as e:
                logger.error(f"Error generating embeddings: {e}")
                self.stats['errors'] += 1
        
        return chunks
    
    def upload_to_qdrant(self, chunks: List[DocumentChunk]) -> None:
        """
        Upload embeddings to Qdrant | رفع التضمينات إلى Qdrant
        
        Args:
            chunks: Chunks with embeddings | القطع مع التضمينات
        """
        logger.info(f"Uploading {len(chunks)} vectors to Qdrant")
        logger.info(f"رفع {len(chunks)} متجه إلى Qdrant")
        
        # Filter chunks with embeddings | فلترة القطع مع التضمينات
        valid_chunks = [c for c in chunks if c.embedding is not None]
        
        if not valid_chunks:
            logger.warning("No valid chunks to upload | لا توجد قطع صالحة للرفع")
            return
        
        # Process in batches | المعالجة على دفعات
        for i in range(0, len(valid_chunks), self.config.batch_size):
            batch = valid_chunks[i:i + self.config.batch_size]
            
            try:
                # Prepare points for Qdrant | تحضير النقاط لـ Qdrant
                points = [
                    models.PointStruct(
                        id=str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.id)),
                        vector=chunk.embedding,
                        payload={
                            'content': chunk.content,
                            **chunk.metadata
                        }
                    )
                    for chunk in batch
                ]
                
                # Upsert points | إدراج/تحديث النقاط
                self.qdrant.upsert(
                    collection_name=self.config.collection_name,
                    points=points
                )
                
                self.stats['vectors_uploaded'] += len(points)
                logger.info(f"Uploaded batch {i // self.config.batch_size + 1}")
                
            except Exception as e:
                logger.error(f"Error uploading to Qdrant: {e}")
                self.stats['errors'] += 1
    
    def process_directory(self, directory: str) -> Dict[str, int]:
        """
        Process all documents in a directory | معالجة جميع المستندات في مجلد
        
        Args:
            directory: Path to documents directory | مسار مجلد المستندات
            
        Returns:
            Processing statistics | إحصائيات المعالجة
        """
        start_time = datetime.now()
        logger.info("=" * 60)
        logger.info("Starting embedding generation | بدء توليد التضمينات")
        logger.info("=" * 60)
        
        try:
            # Ensure collection exists | التأكد من وجود المجموعة
            self.ensure_collection()
            
            # Load documents | تحميل المستندات
            documents = self.load_documents(directory)
            
            if not documents:
                logger.warning("No documents found | لم يتم العثور على مستندات")
                return self.stats
            
            # Chunk documents | تقطيع المستندات
            chunks = self.chunk_documents(documents)
            
            # Generate embeddings | توليد التضمينات
            chunks = self.generate_embeddings(chunks)
            
            # Upload to Qdrant | الرفع إلى Qdrant
            self.upload_to_qdrant(chunks)
            
        except Exception as e:
            logger.error(f"Processing failed: {e} | فشلت المعالجة: {e}")
            raise
        
        # Print summary | طباعة الملخص
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info("=" * 60)
        logger.info("PROCESSING COMPLETE | اكتملت المعالجة")
        logger.info(f"Time elapsed: {elapsed:.2f}s | الوقت المنقضي: {elapsed:.2f} ثانية")
        logger.info(f"Documents processed: {self.stats['documents_processed']}")
        logger.info(f"Chunks created: {self.stats['chunks_created']}")
        logger.info(f"Embeddings generated: {self.stats['embeddings_generated']}")
        logger.info(f"Vectors uploaded: {self.stats['vectors_uploaded']}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info("=" * 60)
        
        return self.stats
    
    def search(self, query: str, limit: int = 5, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Search for similar documents | البحث عن مستندات مشابهة
        
        Args:
            query: Search query | استعلام البحث
            limit: Number of results | عدد النتائج
            filters: Optional filters | الفلاتر الاختيارية
            
        Returns:
            List of search results | قائمة نتائج البحث
        """
        # Generate query embedding | توليد تضمين الاستعلام
        response = self.openai_client.embeddings.create(
            model=self.config.embedding_model,
            input=[query]
        )
        query_embedding = response.data[0].embedding
        
        # Build filter | بناء الفلتر
        qdrant_filter = None
        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(models.FieldCondition(
                    key=key,
                    match=models.MatchValue(value=value)
                ))
            qdrant_filter = models.Filter(must=conditions)
        
        # Search | البحث
        results = self.qdrant.search(
            collection_name=self.config.collection_name,
            query_vector=query_embedding,
            limit=limit,
            query_filter=qdrant_filter
        )
        
        return [
            {
                'content': hit.payload.get('content', ''),
                'score': hit.score,
                'metadata': {k: v for k, v in hit.payload.items() if k != 'content'}
            }
            for hit in results
        ]


# =============================================================================
# MAIN ENTRY POINT | نقطة الدخول الرئيسية
# =============================================================================

def main():
    """
    Main entry point | نقطة الدخول الرئيسية
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description='IntelliPath Vector Embedding Generator | مولد تضمينات IntelliPath'
    )
    parser.add_argument(
        'directory',
        help='Path to documents directory | مسار مجلد المستندات'
    )
    parser.add_argument(
        '--collection',
        default='intellipath_documents',
        help='Qdrant collection name | اسم مجموعة Qdrant'
    )
    parser.add_argument(
        '--chunk-size',
        type=int,
        default=1000,
        help='Chunk size in characters (default: 1000) | حجم القطعة بالأحرف'
    )
    parser.add_argument(
        '--qdrant-url',
        default=os.getenv('QDRANT_URL', 'http://localhost:6333'),
        help='Qdrant server URL | رابط خادم Qdrant'
    )
    
    args = parser.parse_args()
    
    # Get API keys | الحصول على مفاتيح API
    openai_api_key = os.getenv('OPENAI_API_KEY')
    qdrant_api_key = os.getenv('QDRANT_API_KEY')
    
    if not openai_api_key:
        logger.error("Missing OPENAI_API_KEY environment variable")
        sys.exit(1)
    
    # Create configuration | إنشاء الإعدادات
    config = EmbeddingConfig(
        openai_api_key=openai_api_key,
        qdrant_url=args.qdrant_url,
        qdrant_api_key=qdrant_api_key,
        collection_name=args.collection,
        chunk_size=args.chunk_size
    )
    
    # Run generator | تشغيل المولد
    generator = VectorEmbeddingGenerator(config)
    stats = generator.process_directory(args.directory)
    
    sys.exit(1 if stats['errors'] > 0 else 0)


if __name__ == '__main__':
    main()
