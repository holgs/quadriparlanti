/**
 * Teacher Form Validation Schemas
 * Zod schemas for validating teacher CRUD operations
 */

import { z } from 'zod';

/**
 * Schema for creating a new teacher
 */
export const createTeacherSchema = z.object({
  email: z
    .string()
    .min(1, 'Email richiesta')
    .email('Email non valida'),
  name: z
    .string()
    .min(2, 'Nome deve avere almeno 2 caratteri')
    .max(100, 'Nome deve avere massimo 100 caratteri'),
  bio: z
    .string()
    .max(500, 'Bio deve avere massimo 500 caratteri')
    .optional()
    .or(z.literal('')),
  sendInvitation: z.boolean().default(true),
});

/**
 * Schema for updating an existing teacher
 */
export const updateTeacherSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve avere almeno 2 caratteri')
    .max(100, 'Nome deve avere massimo 100 caratteri'),
  bio: z
    .string()
    .max(500, 'Bio deve avere massimo 500 caratteri')
    .optional()
    .or(z.literal('')),
  profile_image_url: z
    .string()
    .url('URL non valido')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive', 'suspended'], {
    errorMap: () => ({ message: 'Stato non valido' }),
  }),
});

// TypeScript types inferred from schemas
export type CreateTeacherFormData = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>;
