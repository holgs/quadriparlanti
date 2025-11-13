/**
 * Zod Validation Schemas
 * Type-safe validation schemas for forms and API endpoints
 */

import { z } from 'zod';

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const userRoleSchema = z.enum(['docente', 'admin']);
export const userStatusSchema = z.enum(['active', 'invited', 'suspended']);

export const createUserSchema = z.object({
  email: z.string().email('Email non valida'),
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri').optional(),
  role: userRoleSchema,
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri').optional(),
  status: userStatusSchema.optional(),
});

// ============================================================================
// THEME SCHEMAS
// ============================================================================

export const themeStatusSchema = z.enum(['draft', 'published', 'archived']);

export const createThemeSchema = z.object({
  title_it: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(100),
  title_en: z.string().min(5).max(100).optional(),
  description_it: z.string().min(50, 'La descrizione deve contenere almeno 50 caratteri').max(500),
  description_en: z.string().min(50).max(500).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug non valido (solo minuscole, numeri e trattini)'),
  featured_image_url: z.string().url().optional(),
  display_order: z.number().int().min(0).default(0),
});

export const updateThemeSchema = createThemeSchema.partial().extend({
  status: themeStatusSchema.optional(),
});

// ============================================================================
// WORK SCHEMAS
// ============================================================================

export const workStatusSchema = z.enum(['draft', 'pending_review', 'published', 'needs_revision', 'archived']);
export const licenseSchema = z.enum(['none', 'CC BY', 'CC BY-SA', 'CC BY-NC', 'CC BY-NC-SA']);

export const schoolYearSchema = z.string().regex(
  /^\d{4}-\d{2}$/,
  'Anno scolastico non valido (formato: YYYY-YY, es. 2024-25)'
).refine((val) => {
  const [startYear, endYear] = val.split('-').map(Number);
  return startYear >= 2000 && startYear < 2100 && endYear === (startYear + 1) % 100;
}, 'Anno scolastico non valido');

export const createWorkSchema = z.object({
  title_it: z.string().min(1, 'Il titolo è obbligatorio').max(100),
  title_en: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(1).max(100).optional()
  ),
  description_it: z.string().min(10, 'La descrizione deve contenere almeno 10 caratteri').max(2000),
  description_en: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(10).max(2000).optional()
  ),
  class_name: z.string().min(2, 'La classe è obbligatoria'),
  teacher_name: z.string().min(2, 'Il nome del docente è obbligatorio'),
  school_year: schoolYearSchema,
  license: licenseSchema.optional(),
  tags: z.array(z.string().min(1)).max(10, 'Massimo 10 tag').default([]),
  theme_ids: z.array(z.string().uuid()).min(1, 'Seleziona almeno un tema'),
});

export const updateWorkSchema = createWorkSchema.partial().extend({
  status: workStatusSchema.optional(),
});

// ============================================================================
// ATTACHMENT SCHEMAS
// ============================================================================

export const fileTypeSchema = z.enum(['pdf', 'image']);

export const createAttachmentSchema = z.object({
  work_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_size_bytes: z.number().int().positive().max(10485760, 'File troppo grande (max 10MB)'),
  file_type: fileTypeSchema,
  mime_type: z.string(),
  storage_path: z.string(),
  thumbnail_path: z.string().optional(),
});

// ============================================================================
// LINK SCHEMAS
// ============================================================================

export const linkTypeSchema = z.enum(['youtube', 'vimeo', 'drive', 'other']);

export const createLinkSchema = z.object({
  work_id: z.string().uuid(),
  url: z.string().url('URL non valido'),
  link_type: linkTypeSchema,
  custom_label: z.string().max(100).optional(),
  preview_title: z.string().max(200).optional(),
  preview_thumbnail_url: z.string().url().optional(),
});

// ============================================================================
// QR CODE SCHEMAS
// ============================================================================

export const createQRCodeSchema = z.object({
  theme_id: z.string().uuid(),
  short_code: z.string().length(6, 'Il codice deve essere di 6 caratteri').regex(/^[A-Za-z0-9]{6}$/, 'Codice non valido'),
});

export const logQRScanSchema = z.object({
  qr_code_id: z.string().uuid(),
  theme_id: z.string().uuid().optional(),
  hashed_ip: z.string(),
  user_agent: z.string().optional(),
  device_type: z.enum(['mobile', 'desktop', 'tablet', 'unknown']),
  referer: z.string().optional(),
});

// ============================================================================
// ANALYTICS SCHEMAS
// ============================================================================

export const logWorkViewSchema = z.object({
  work_id: z.string().uuid(),
  hashed_ip: z.string(),
  referrer: z.enum(['theme_page', 'search', 'direct', 'external']),
  user_agent: z.string().optional(),
  session_id: z.string().optional(),
});

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const reviewActionSchema = z.enum(['approved', 'rejected']);

export const createReviewSchema = z.object({
  work_id: z.string().uuid(),
  action: reviewActionSchema,
  comments: z.string().optional(),
}).refine((data) => {
  // If rejecting, comments are required
  if (data.action === 'rejected') {
    return data.comments && data.comments.length > 10;
  }
  return true;
}, {
  message: 'I commenti sono obbligatori per il rifiuto (minimo 10 caratteri)',
  path: ['comments'],
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'La password è obbligatoria'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email non valida'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La password corrente è obbligatoria'),
  newPassword: z.string().min(8, 'La nuova password deve contenere almeno 8 caratteri'),
  confirmPassword: z.string().min(1, 'Conferma la nuova password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
});

// ============================================================================
// SEARCH SCHEMAS
// ============================================================================

export const searchWorksSchema = z.object({
  query: z.string().optional(),
  theme_id: z.string().uuid().optional(),
  school_year: schoolYearSchema.optional(),
  tags: z.array(z.string()).optional(),
  status: workStatusSchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

// ============================================================================
// CONFIG SCHEMAS
// ============================================================================

export const updateConfigSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

// ============================================================================
// FILE UPLOAD SCHEMAS
// ============================================================================

export const fileUploadSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string(),
  fileSize: z.number().int().positive().max(10485760, 'File troppo grande (max 10MB)'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateThemeInput = z.infer<typeof createThemeSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
export type CreateWorkInput = z.infer<typeof createWorkSchema>;
export type UpdateWorkInput = z.infer<typeof updateWorkSchema>;
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type CreateQRCodeInput = z.infer<typeof createQRCodeSchema>;
export type LogQRScanInput = z.infer<typeof logQRScanSchema>;
export type LogWorkViewInput = z.infer<typeof logWorkViewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SearchWorksInput = z.infer<typeof searchWorksSchema>;
export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
