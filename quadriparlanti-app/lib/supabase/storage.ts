/**
 * Supabase Storage Helper Functions
 * Utilities for uploading and managing files in Supabase Storage
 */

import { createClient } from './client';

const BUCKET_NAME = 'work-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = {
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

export interface UploadFileOptions {
  file: File;
  userId: string;
  workId?: string; // Optional for draft uploads
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  data?: {
    path: string;
    publicUrl: string;
    fileName: string;
    fileSize: number;
    fileType: 'pdf' | 'image';
    mimeType: string;
  };
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Il file è troppo grande. Dimensione massima: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check mime type
  const allAllowedTypes = [...ALLOWED_MIME_TYPES.pdf, ...ALLOWED_MIME_TYPES.image];
  if (!allAllowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo di file non supportato. Formati consentiti: PDF, JPG, PNG, WEBP',
    };
  }

  return { valid: true };
}

/**
 * Determine file type from mime type
 */
export function getFileType(mimeType: string): 'pdf' | 'image' | null {
  if (ALLOWED_MIME_TYPES.pdf.includes(mimeType)) return 'pdf';
  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) return 'image';
  return null;
}

/**
 * Generate storage path for file
 * Format: user_id/work_id/timestamp_filename
 */
export function generateStoragePath(
  userId: string,
  fileName: string,
  workId?: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const workFolder = workId || 'draft';
  return `${userId}/${workFolder}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadResult> {
  const { file, userId, workId, onProgress } = options;

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const supabase = createClient();

    // Generate storage path
    const storagePath = generateStoragePath(userId, file.name, workId);

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: `Errore durante l'upload: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const fileType = getFileType(file.type);
    if (!fileType) {
      return {
        success: false,
        error: 'Tipo di file non valido',
      };
    }

    return {
      success: true,
      data: {
        path: storagePath,
        publicUrl: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType,
        mimeType: file.type,
      },
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante l\'upload',
    };
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(storagePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: `Errore durante l'eliminazione: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete exception:', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante l\'eliminazione',
    };
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(storagePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
