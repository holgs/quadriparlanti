/**
 * Themes Server Actions
 * CRUD operations for themes management
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createThemeSchema, updateThemeSchema } from '@/lib/validations/schemas';
import { z } from 'zod';
import { isAdmin } from './auth.actions';
import { generateSlug } from '@/lib/utils/slug';

// Type definitions
type CreateThemeInput = z.infer<typeof createThemeSchema>;
type UpdateThemeInput = z.infer<typeof updateThemeSchema>;

/**
 * Create a new theme
 * Only admins can create themes
 *
 * @param input - Theme data
 * @returns Created theme or error
 */
export async function createTheme(input: CreateThemeInput) {
  try {
    const supabase = await createClient();

    // Check admin access
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return { success: false, error: 'Accesso negato: solo gli amministratori possono creare temi' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Non autenticato' };
    }

    // Validate input
    const validatedInput = createThemeSchema.parse(input);

    // Check if slug already exists
    const { data: existingTheme } = await supabase
      .from('themes')
      .select('id')
      .eq('slug', validatedInput.slug)
      .single();

    if (existingTheme) {
      return { success: false, error: 'Uno slug con questo nome esiste già' };
    }

    // Insert theme
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .insert({
        ...validatedInput,
        created_by: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (themeError || !theme) {
      console.error('Theme creation error:', themeError);
      return { success: false, error: 'Errore durante la creazione del tema' };
    }

    revalidatePath('/admin/themes');
    revalidatePath('/themes');

    return {
      success: true,
      data: theme,
    };
  } catch (error) {
    console.error('Create theme error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Errore durante la creazione del tema' };
  }
}

/**
 * Update an existing theme
 * Only admins can update themes
 *
 * @param id - Theme ID
 * @param input - Updated theme data
 */
export async function updateTheme(id: string, input: UpdateThemeInput) {
  try {
    const supabase = await createClient();

    // Check admin access
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return { success: false, error: 'Accesso negato: solo gli amministratori possono modificare temi' };
    }

    // Validate input
    const validatedInput = updateThemeSchema.parse(input);

    // If slug is being changed, check if new slug exists
    if (validatedInput.slug) {
      const { data: existingTheme } = await supabase
        .from('themes')
        .select('id')
        .eq('slug', validatedInput.slug)
        .neq('id', id)
        .single();

      if (existingTheme) {
        return { success: false, error: 'Uno slug con questo nome esiste già' };
      }
    }

    // Update theme
    const { data: theme, error: updateError } = await supabase
      .from('themes')
      .update({
        ...validatedInput,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !theme) {
      console.error('Theme update error:', updateError);
      return { success: false, error: 'Errore durante l\'aggiornamento del tema' };
    }

    revalidatePath('/admin/themes');
    revalidatePath('/themes');
    revalidatePath(`/themes/${theme.slug}`);

    return {
      success: true,
      data: theme,
    };
  } catch (error) {
    console.error('Update theme error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Errore durante l\'aggiornamento del tema' };
  }
}

/**
 * Delete a theme
 * Only admins can delete themes
 * Cannot delete themes with associated works
 *
 * @param id - Theme ID
 */
export async function deleteTheme(id: string) {
  try {
    const supabase = await createClient();

    // Check admin access
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return { success: false, error: 'Accesso negato: solo gli amministratori possono eliminare temi' };
    }

    // Check if theme has associated works
    const { count } = await supabase
      .from('work_themes')
      .select('*', { count: 'exact', head: true })
      .eq('theme_id', id);

    if (count && count > 0) {
      return {
        success: false,
        error: `Impossibile eliminare: questo tema è associato a ${count} ${count === 1 ? 'lavoro' : 'lavori'}`
      };
    }

    // Delete theme
    const { error: deleteError } = await supabase
      .from('themes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Theme deletion error:', deleteError);
      return { success: false, error: 'Errore durante l\'eliminazione del tema' };
    }

    revalidatePath('/admin/themes');
    revalidatePath('/themes');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete theme error:', error);
    return { success: false, error: 'Errore durante l\'eliminazione del tema' };
  }
}

/**
 * Get all themes (admin view with draft/archived)
 * Only admins can access this
 */
export async function getAllThemesAdmin() {
  try {
    const supabase = await createClient();

    // Check admin access
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return { success: false, error: 'Accesso negato' };
    }

    const { data: themes, error } = await supabase
      .from('themes')
      .select(`
        id,
        slug,
        title_it,
        title_en,
        description_it,
        description_en,
        featured_image_url,
        status,
        display_order,
        created_at,
        updated_at
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching themes:', error);
      return { success: false, error: 'Errore durante il recupero dei temi' };
    }

    // Get work counts for each theme
    const themesWithCounts = await Promise.all(
      (themes || []).map(async (theme) => {
        const { count } = await supabase
          .from('work_themes')
          .select('*', { count: 'exact', head: true })
          .eq('theme_id', theme.id);

        return {
          ...theme,
          worksCount: count || 0,
        };
      })
    );

    return {
      success: true,
      data: themesWithCounts,
    };
  } catch (error) {
    console.error('Get all themes error:', error);
    return { success: false, error: 'Errore durante il recupero dei temi' };
  }
}

/**
 * Get a single theme by ID (admin view)
 * Only admins can access this
 */
export async function getThemeById(id: string) {
  try {
    const supabase = await createClient();

    // Check admin access
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return { success: false, error: 'Accesso negato' };
    }

    const { data: theme, error } = await supabase
      .from('themes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !theme) {
      console.error('Error fetching theme:', error);
      return { success: false, error: 'Tema non trovato' };
    }

    // Get work count
    const { count } = await supabase
      .from('work_themes')
      .select('*', { count: 'exact', head: true })
      .eq('theme_id', theme.id);

    return {
      success: true,
      data: {
        ...theme,
        worksCount: count || 0,
      },
    };
  } catch (error) {
    console.error('Get theme error:', error);
    return { success: false, error: 'Errore durante il recupero del tema' };
  }
}

/**
 * Update theme display order
 * Only admins can reorder themes
 */
export async function updateThemeOrder(themes: { id: string; display_order: number }[]) {
  try {
    const supabase = await createClient();

    // Check admin access
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return { success: false, error: 'Accesso negato' };
    }

    // Update each theme's display order
    const updates = themes.map((theme) =>
      supabase
        .from('themes')
        .update({ display_order: theme.display_order })
        .eq('id', theme.id)
    );

    await Promise.all(updates);

    revalidatePath('/admin/themes');
    revalidatePath('/themes');

    return { success: true };
  } catch (error) {
    console.error('Update theme order error:', error);
    return { success: false, error: 'Errore durante l\'aggiornamento dell\'ordine' };
  }
}

