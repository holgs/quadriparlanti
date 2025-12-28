/**
 * Teacher Management Server Actions
 * Handles CRUD operations for teacher accounts
 */

'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type {
  CreateTeacherInput,
  UpdateTeacherInput,
  TeacherFilters,
  TeacherStats,
  PaginatedTeachersResponse,
  User,
} from '@/lib/types/teacher.types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createTeacherSchema = z.object({
  email: z
    .string()
    .email({ message: 'Email non valida' })
    .min(1, { message: 'Email richiesta' }),
  name: z
    .string()
    .min(2, { message: 'Nome deve avere almeno 2 caratteri' })
    .max(100, { message: 'Nome deve avere massimo 100 caratteri' }),
  bio: z
    .string()
    .max(500, { message: 'Biografia deve avere massimo 500 caratteri' })
    .optional(),
  sendInvitation: z.boolean().optional().default(true),
  password: z
    .string()
    .min(8, { message: 'Password deve avere almeno 8 caratteri' })
    .optional(),
}).refine((data) => {
  // If not sending invitation, password is required
  if (!data.sendInvitation && !data.password) {
    return false;
  }
  return true;
}, {
  message: 'Password richiesta quando non si invia un invito',
  path: ['password'],
});

const updateTeacherSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Nome deve avere almeno 2 caratteri' })
    .max(100, { message: 'Nome deve avere massimo 100 caratteri' })
    .optional(),
  bio: z
    .string()
    .max(500, { message: 'Biografia deve avere massimo 500 caratteri' })
    .optional(),
  profile_image_url: z
    .string()
    .url({ message: 'URL immagine non valido' })
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'inactive', 'suspended'], {
      errorMap: () => ({ message: 'Status non valido' }),
    })
    .optional(),
});

const teacherFiltersSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  status: z
    .enum(['active', 'inactive', 'suspended', 'invited'])
    .optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if current user is admin
 */
async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin' && profile?.status === 'active';
  } catch {
    return false;
  }
}

/**
 * Generate a random password for new teachers
 */
function generateRandomPassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// ============================================================================
// CREATE TEACHER
// ============================================================================

/**
 * Create a new teacher account
 *
 * @param input - Teacher data including email, name, and optional bio
 * @returns Success status with created teacher data or error message
 */
export async function createTeacher(
  input: CreateTeacherInput
): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    // Validate input
    const validatedInput = createTeacherSchema.parse(input);

    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Permessi insufficienti',
      };
    }

    // Check if email already exists
    const supabase = await createClient();
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedInput.email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: 'Email già in uso',
      };
    }

    // Create auth user using Admin API
    const adminClient = createAdminClient();
    // Use provided password or generate a random one
    const password = validatedInput.password || generateRandomPassword();

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: validatedInput.email,
      password: password,
      email_confirm: !validatedInput.sendInvitation, // Auto-confirm if not sending invitation
      user_metadata: {
        name: validatedInput.name,
        role: 'docente',
      },
    });

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError);
      return {
        success: false,
        error: 'Errore durante la creazione del docente',
      };
    }

    // Create profile in users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: validatedInput.email,
        name: validatedInput.name,
        role: 'docente',
        status: validatedInput.sendInvitation ? 'invited' : 'active',
        bio: validatedInput.bio,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);

      // Rollback: Delete auth user
      await adminClient.auth.admin.deleteUser(authData.user.id);

      return {
        success: false,
        error: 'Errore durante la creazione del docente',
      };
    }

    // Send invitation email if requested
    if (validatedInput.sendInvitation) {
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        validatedInput.email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        }
      );

      if (inviteError) {
        console.error('Invitation email error:', inviteError);
        // Don't fail the creation if email fails
      }
    }

    return {
      success: true,
      data: profileData,
    };
  } catch (error) {
    console.error('Create teacher error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Dati non validi',
      };
    }

    return {
      success: false,
      error: 'Errore durante la creazione del docente',
    };
  }
}

// ============================================================================
// GET TEACHERS (LIST WITH PAGINATION)
// ============================================================================

/**
 * Get paginated list of teachers with optional filters
 *
 * @param params - Pagination and filter parameters
 * @returns Success status with paginated teachers data or error message
 */
export async function getTeachers(
  params: TeacherFilters = {}
): Promise<{
  success: boolean;
  data?: PaginatedTeachersResponse;
  error?: string;
}> {
  try {
    // Validate parameters
    const validatedParams = teacherFiltersSchema.parse(params);
    const { page, limit, search, status } = validatedParams;

    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Permessi insufficienti',
      };
    }

    const supabase = await createClient();

    // Build base query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('role', 'docente');

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply search filter (case-insensitive on name or email)
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`);
    }

    // Get total count
    const { count: totalCount, error: countError } = await query;

    if (countError) {
      console.error('Count error:', countError);
      return {
        success: false,
        error: 'Errore durante il recupero dei docenti',
      };
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: teachers, error: fetchError } = await query;

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return {
        success: false,
        error: 'Errore durante il recupero dei docenti',
      };
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return {
      success: true,
      data: {
        teachers: teachers || [],
        total: totalCount || 0,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Get teachers error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Parametri non validi',
      };
    }

    return {
      success: false,
      error: 'Errore durante il recupero dei docenti',
    };
  }
}

// ============================================================================
// UPDATE TEACHER
// ============================================================================

/**
 * Update teacher profile information
 *
 * @param id - Teacher ID
 * @param input - Fields to update
 * @returns Success status with updated teacher data or error message
 */
export async function updateTeacher(
  id: string,
  input: UpdateTeacherInput
): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    // Validate input
    const validatedInput = updateTeacherSchema.parse(input);

    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Permessi insufficienti',
      };
    }

    const supabase = await createClient();

    // Verify teacher exists and is a docente
    const { data: existingTeacher, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'docente')
      .single();

    if (fetchError || !existingTeacher) {
      return {
        success: false,
        error: 'Docente non trovato',
      };
    }

    // Build update object
    const updateData: Record<string, any> = {};

    if (validatedInput.name !== undefined) {
      updateData.name = validatedInput.name;
    }

    if (validatedInput.bio !== undefined) {
      updateData.bio = validatedInput.bio;
    }

    if (validatedInput.profile_image_url !== undefined) {
      updateData.profile_image_url = validatedInput.profile_image_url;
    }

    if (validatedInput.status !== undefined) {
      updateData.status = validatedInput.status;
    }

    // Update teacher
    const { data: updatedTeacher, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return {
        success: false,
        error: 'Errore durante l\'aggiornamento del docente',
      };
    }

    return {
      success: true,
      data: updatedTeacher,
    };
  } catch (error) {
    console.error('Update teacher error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Dati non validi',
      };
    }

    return {
      success: false,
      error: 'Errore durante l\'aggiornamento del docente',
    };
  }
}

// ============================================================================
// DELETE TEACHER
// ============================================================================

/**
 * Delete a teacher (soft or hard delete)
 *
 * @param id - Teacher ID
 * @param hard - If true, permanently delete; if false, set status to inactive
 * @returns Success status or error message
 */
export async function deleteTeacher(
  id: string,
  hard: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Permessi insufficienti',
      };
    }

    const supabase = await createClient();

    // Verify teacher exists
    const { data: teacher, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'docente')
      .single();

    if (fetchError || !teacher) {
      return {
        success: false,
        error: 'Docente non trovato',
      };
    }

    if (hard) {
      // Check if teacher has works
      const { data: worksData } = await supabase
        .from('works')
        .select('id')
        .eq('created_by', id)
        .limit(1);

      if (worksData && worksData.length > 0) {
        return {
          success: false,
          error: 'HAS_WORKS', // Special error code for UI handling
        };
      }

      // Hard delete: Delete from users table (CASCADE to auth.users)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return {
          success: false,
          error: 'Errore durante l\'eliminazione del docente',
        };
      }

      // Also delete from auth.users using admin API
      const adminClient = createAdminClient();
      await adminClient.auth.admin.deleteUser(id);
    } else {
      // Soft delete: Set status to inactive
      const { error: updateError } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (updateError) {
        console.error('Soft delete error:', updateError);
        return {
          success: false,
          error: 'Errore durante l\'eliminazione del docente',
        };
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete teacher error:', error);
    return {
      success: false,
      error: 'Errore durante l\'eliminazione del docente',
    };
  }
}

// ============================================================================
// RESEND INVITATION
// ============================================================================

/**
 * Resend invitation email to a teacher
 *
 * @param id - Teacher ID
 * @returns Success status or error message
 */
export async function resendInvitation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Permessi insufficienti',
      };
    }

    const supabase = await createClient();

    // Get teacher email
    const { data: teacher, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('id', id)
      .eq('role', 'docente')
      .single();

    if (fetchError || !teacher) {
      return {
        success: false,
        error: 'Docente non trovato',
      };
    }

    // Send invitation using admin API
    const adminClient = createAdminClient();
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      teacher.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }
    );

    if (inviteError) {
      console.error('Invite error:', inviteError);
      return {
        success: false,
        error: 'Errore durante l\'invio dell\'invito',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Resend invitation error:', error);
    return {
      success: false,
      error: 'Errore durante l\'invio dell\'invito',
    };
  }
}

// ============================================================================
// GENERATE INVITE LINK
// ============================================================================

/**
 * Generate an invitation link for a teacher
 * Useful when email delivery fails
 *
 * @param id - Teacher ID
 * @returns Success status with invite link or error message
 */
export async function generateInviteLink(
  id: string
): Promise<{ success: boolean; link?: string; error?: string }> {
  try {
    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Permessi insufficienti',
      };
    }

    const supabase = await createClient();

    // Get teacher email
    const { data: teacher, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('id', id)
      .eq('role', 'docente')
      .single();

    if (fetchError || !teacher) {
      return {
        success: false,
        error: 'Docente non trovato',
      };
    }

    // Generate link using admin API
    const adminClient = createAdminClient();

    // Check if user is already confirmed
    const { data: authUser, error: authUserError } = await adminClient.auth.admin.getUserById(id);

    if (authUserError || !authUser.user) {
      console.error('Error fetching auth user:', authUserError);
      return {
        success: false,
        error: 'Errore nel recupero dei dati utente',
      };
    }

    const isConfirmed = !!authUser.user.email_confirmed_at;
    const linkType = isConfirmed ? 'magiclink' : 'invite';

    console.log(`Generating ${linkType} for user ${id} (Confirmed: ${isConfirmed})`);

    const { data, error: linkError } = await adminClient.auth.admin.generateLink({
      type: linkType,
      email: teacher.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (linkError || !data.properties?.action_link) {
      console.error('Generate link error:', linkError);
      return {
        success: false,
        error: `Errore durante la generazione del link (${linkType})`,
      };
    }

    return {
      success: true,
      link: data.properties.action_link,
    };
  } catch (error) {
    console.error('Generate invite link error:', error);
    return {
      success: false,
      error: 'Errore durante la generazione del link',
    };
  }
}

// ============================================================================
// RESET TEACHER PASSWORD
// ============================================================================

/**
 * Send password reset email to a teacher
 *
 * @param id - Teacher ID
 * @returns Success status or error message
 */
export async function resetTeacherPassword(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Permessi insufficienti',
      };
    }

    const supabase = await createClient();

    // Get teacher email
    const { data: teacher, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('id', id)
      .eq('role', 'docente')
      .single();

    if (fetchError || !teacher) {
      return {
        success: false,
        error: 'Docente non trovato',
      };
    }

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      teacher.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      }
    );

    if (resetError) {
      console.error('Password reset error:', resetError);
      return {
        success: false,
        error: 'Errore durante il reset della password',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Reset teacher password error:', error);
    return {
      success: false,
      error: 'Errore durante il reset della password',
    };
  }
}

// ============================================================================
// GET TEACHER STATISTICS
// ============================================================================

/**
 * Get aggregated statistics for teachers
 *
 * @returns Success status with statistics or error message
 */
export async function getTeacherStats(): Promise<{
  success: boolean;
  data?: TeacherStats;
  error?: string;
}> {
  try {
    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Permessi insufficienti',
      };
    }

    const supabase = await createClient();

    // Call database function
    const { data, error } = await supabase.rpc('get_teacher_statistics');

    if (error) {
      console.error('Stats error:', error);
      return {
        success: false,
        error: 'Errore durante il recupero delle statistiche',
      };
    }

    return {
      success: true,
      data: data as TeacherStats,
    };
  } catch (error) {
    console.error('Get teacher stats error:', error);
    return {
      success: false,
      error: 'Errore durante il recupero delle statistiche',
    };
  }
}

// ============================================================================
// GET SINGLE TEACHER
// ============================================================================

/**
 * Get a single teacher by ID
 *
 * @param id - Teacher ID
 * @returns Success status with teacher data or error message
 */
export async function getTeacher(
  id: string
): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        success: false,
        error: 'Permessi insufficienti',
      };
    }

    const supabase = await createClient();

    const { data: teacher, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'docente')
      .single();

    if (error || !teacher) {
      return {
        success: false,
        error: 'Docente non trovato',
      };
    }

    return {
      success: true,
      data: teacher,
    };
  } catch (error) {
    console.error('Get teacher error:', error);
    return {
      success: false,
      error: 'Errore durante il recupero del docente',
    };
  }
}
