/**
 * Study Materials Hook
 * Features: Upload, List, Download, Delete study materials
 */
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';

interface StudyMaterial {
  id: string;
  title: string;
  title_ar?: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  course_id?: string;
  is_public: boolean;
  is_processed: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  course?: {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
  };
}

interface UploadOptions {
  title: string;
  title_ar?: string;
  description?: string;
  course_id?: string;
  is_public?: boolean;
}

const MATERIALS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-materials`;

export function useStudyMaterials() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Fetch materials list
  const fetchMaterials = useCallback(async (courseId?: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('course_id', courseId);
      
      const response = await fetch(`${MATERIALS_URL}?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch materials');
      }

      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل المواد الدراسية',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Upload file
  const uploadMaterial = useCallback(async (
    file: File,
    options: UploadOptions
  ): Promise<StudyMaterial | null> => {
    if (!user) return null;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', options.title);
      if (options.title_ar) formData.append('title_ar', options.title_ar);
      if (options.description) formData.append('description', options.description);
      if (options.course_id) formData.append('course_id', options.course_id);
      formData.append('is_public', String(options.is_public ?? false));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(MATERIALS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Upload failed');
      }

      setUploadProgress(100);
      const data = await response.json();

      toast({
        title: 'تم الرفع بنجاح',
        description: 'تم رفع الملف وجاري معالجته',
      });

      // Refresh materials list
      await fetchMaterials();

      return data.material;
    } catch (error: any) {
      console.error('Error uploading material:', error);
      toast({
        title: 'خطأ في الرفع',
        description: error.message || 'فشل رفع الملف',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [user, toast, fetchMaterials]);

  // Download file
  const downloadMaterial = useCallback(async (material: StudyMaterial) => {
    try {
      const response = await fetch(`${MATERIALS_URL}/${material.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const data = await response.json();
      
      // Open download URL
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    } catch (error: any) {
      console.error('Error downloading material:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الملف',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Delete material
  const deleteMaterial = useCallback(async (materialId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${MATERIALS_URL}/${materialId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الملف بنجاح',
      });

      // Remove from local state
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      return true;
    } catch (error: any) {
      console.error('Error deleting material:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف الملف',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Get file icon based on type
  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📑';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    return '📁';
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    materials,
    isLoading,
    isUploading,
    uploadProgress,
    fetchMaterials,
    uploadMaterial,
    downloadMaterial,
    deleteMaterial,
    getFileIcon,
    formatFileSize,
  };
}
