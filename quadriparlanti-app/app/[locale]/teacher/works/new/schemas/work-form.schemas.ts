/**
 * Work Form Multi-Step Validation Schemas
 * Separate schemas for each step of the work creation wizard
 */

import { z } from 'zod';
import { schoolYearSchema, licenseSchema } from '@/lib/validations/schemas';

// ============================================================================
// STEP 1: Basic Information
// ============================================================================

export const step1BasicInfoSchema = z.object({
  title_it: z
    .string()
    .min(3, 'Il titolo deve contenere almeno 3 caratteri')
    .max(200, 'Il titolo non può superare i 200 caratteri'),
  title_en: z
    .string()
    .min(3, 'The title must be at least 3 characters')
    .max(200, 'The title cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
  description_it: z
    .string()
    .min(10, 'La descrizione deve contenere almeno 10 caratteri')
    .max(2000, 'La descrizione non può superare i 2000 caratteri'),
  description_en: z
    .string()
    .min(10, 'The description must be at least 10 characters')
    .max(2000, 'The description cannot exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  class_name: z
    .string()
    .min(2, 'Il nome della classe è obbligatorio')
    .max(50, 'Il nome della classe non può superare i 50 caratteri'),
  teacher_name: z
    .string()
    .min(2, 'Il nome del docente è obbligatorio')
    .max(100, 'Il nome del docente non può superare i 100 caratteri'),
  school_year: schoolYearSchema,
  license: licenseSchema.optional().default('none'),
  tags: z
    .array(z.string().min(1).max(30))
    .max(10, 'Massimo 10 tag')
    .default([]),
});

export type Step1BasicInfoInput = z.infer<typeof step1BasicInfoSchema>;

// ============================================================================
// STEP 2: Content (Attachments & Links)
// ============================================================================

// Note: Step 2 validation will be handled separately
// as file uploads and external links have different validation flows

export const step2ContentSchema = z.object({
  // Attachments will be validated separately during upload
  attachments: z
    .array(
      z.object({
        id: z.string().optional(), // For existing attachments (edit mode)
        file_name: z.string(),
        file_size_bytes: z.number(),
        file_type: z.enum(['pdf', 'image']),
        storage_path: z.string(),
        thumbnail_path: z.string().optional(),
      })
    )
    .default([]),

  // External links
  external_links: z
    .array(
      z.object({
        id: z.string().optional(), // For existing links (edit mode)
        url: z.string().url('URL non valido'),
        link_type: z.enum(['youtube', 'vimeo', 'drive', 'other']),
        custom_label: z.string().max(100).optional(),
      })
    )
    .default([]),
});

export type Step2ContentInput = z.infer<typeof step2ContentSchema>;

// ============================================================================
// STEP 3: Themes Selection
// ============================================================================

export const step3ThemesSchema = z.object({
  theme_ids: z
    .array(z.string().uuid('ID tema non valido'))
    .min(1, 'Seleziona almeno un tema'),
});

export type Step3ThemesInput = z.infer<typeof step3ThemesSchema>;

// ============================================================================
// COMPLETE FORM DATA (All Steps Combined)
// ============================================================================

export const completeWorkFormSchema = step1BasicInfoSchema
  .merge(step2ContentSchema)
  .merge(step3ThemesSchema);

export type CompleteWorkFormInput = z.infer<typeof completeWorkFormSchema>;

// ============================================================================
// DRAFT SAVE SCHEMA (Partial validation for saving drafts)
// ============================================================================

export const draftWorkSchema = z.object({
  title_it: z.string().min(1, 'Il titolo è obbligatorio'),
  title_en: z.string().optional().or(z.literal('')),
  description_it: z.string().optional().or(z.literal('')),
  description_en: z.string().optional().or(z.literal('')),
  class_name: z.string().optional().or(z.literal('')),
  teacher_name: z.string().optional().or(z.literal('')),
  school_year: z.string().optional().or(z.literal('')),
  license: licenseSchema.optional(),
  tags: z.array(z.string()).optional(),
  theme_ids: z.array(z.string().uuid()).optional(),
});

export type DraftWorkInput = z.infer<typeof draftWorkSchema>;
