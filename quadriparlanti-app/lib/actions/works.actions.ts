/**
 * Works Server Actions
 * CRUD operations for student works
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createWorkSchema,
  updateWorkSchema,
  type CreateWorkInput,
  type UpdateWorkInput,
} from '@/lib/validations/schemas';

/**
 * Helper function to detect link type from URL
 */
function detectLinkType(url: string): 'youtube' | 'vimeo' | 'drive' | 'other' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    return 'drive';
  }
  return 'other';
}

/**
 * Create a new work
 * Teachers can create draft works
 *
 * @param input - Work data
 * @param attachments - Optional array of attachments to save
 * @param externalLinks - Optional array of external links to save
 * @returns Created work or error
 */
export async function createWork(
  input: CreateWorkInput,
  attachments?: Array<{
    file_name: string;
    file_size_bytes: number;
    file_type: string;
    mime_type?: string;
    storage_path: string;
    thumbnail_path?: string;
  }>,
  externalLinks?: Array<{
    url: string;
    platform?: string;
    embed_url?: string;
    link_type?: string;
  }>
) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Non autenticato' };
    }

    // Validate input
    const validatedInput = createWorkSchema.parse(input);

    // Extract theme_ids for later use
    const { theme_ids, ...workData } = validatedInput;

    // Insert work
    const { data: work, error: workError } = await supabase
      .from('works')
      .insert({
        ...workData,
        created_by: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (workError || !work) {
      console.error('Work creation error:', workError);
      return { success: false, error: 'Errore durante la creazione del lavoro' };
    }

    // Insert work-theme associations
    if (theme_ids.length > 0) {
      const workThemes = theme_ids.map((theme_id) => ({
        work_id: work.id,
        theme_id,
      }));

      const { error: themeError } = await supabase
        .from('work_themes')
        .insert(workThemes);

      if (themeError) {
        console.error('Work themes error:', themeError);
        // Don't fail the entire operation if themes fail
      }
    }

    // Insert attachments if provided
    if (attachments && attachments.length > 0) {
      const attachmentsToInsert = attachments.map((att) => ({
        work_id: work.id,
        file_name: att.file_name,
        file_size_bytes: att.file_size_bytes,
        file_type: att.file_type === 'image' ? 'image' : 'pdf',
        mime_type: att.mime_type || 'application/octet-stream',
        storage_path: att.storage_path,
        thumbnail_path: att.thumbnail_path || null,
        uploaded_by: user.id,
      }));

      const { error: attachError } = await supabase
        .from('work_attachments')
        .insert(attachmentsToInsert);

      if (attachError) {
        console.error('Attachments insert error:', attachError);
        // Don't fail the entire operation if attachments fail
      }
    }

    // Insert external links if provided
    if (externalLinks && externalLinks.length > 0) {
      const linksToInsert = externalLinks.map((link) => ({
        work_id: work.id,
        url: link.url,
        link_type: link.link_type || link.platform || detectLinkType(link.url),
        custom_label: null,
        preview_title: null,
        preview_thumbnail_url: link.embed_url || null,
      }));

      const { error: linksError } = await supabase
        .from('work_links')
        .insert(linksToInsert);

      if (linksError) {
        console.error('Links insert error:', linksError);
        // Don't fail the entire operation if links fail
      }
    }

    revalidatePath('/teacher/works');

    return {
      success: true,
      data: work,
    };
  } catch (error) {
    console.error('Create work error:', error);
    return { success: false, error: 'Errore durante la creazione del lavoro' };
  }
}

/**
 * Update an existing work
 * Teachers can update their own works in draft/needs_revision status
 * Admins can update any work
 *
 * @param id - Work ID
 * @param input - Updated work data
 * @param attachments - Optional array of attachments to save
 * @param externalLinks - Optional array of external links to save
 */
export async function updateWork(
  id: string,
  input: UpdateWorkInput,
  attachments?: Array<{
    file_name: string;
    file_size_bytes: number;
    file_type: string;
    mime_type?: string;
    storage_path: string;
    thumbnail_path?: string;
  }>,
  externalLinks?: Array<{
    url: string;
    platform?: string;
    embed_url?: string;
    link_type?: string;
  }>
) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Non autenticato' };
    }

    // Validate input
    const validatedInput = updateWorkSchema.parse(input);

    // Extract theme_ids if present
    const { theme_ids, ...workData } = validatedInput as any;

    // Check if user can update this work (RLS will also enforce this)
    const { data: existingWork } = await supabase
      .from('works')
      .select('created_by, status')
      .eq('id', id)
      .single();

    if (!existingWork) {
      return { success: false, error: 'Lavoro non trovato' };
    }

    // Update work
    const { data: work, error: updateError } = await supabase
      .from('works')
      .update(workData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !work) {
      console.error('Work update error:', updateError);
      return { success: false, error: 'Errore durante l\'aggiornamento del lavoro' };
    }

    // Update theme associations if provided
    if (theme_ids && Array.isArray(theme_ids)) {
      // Delete existing associations
      await supabase
        .from('work_themes')
        .delete()
        .eq('work_id', id);

      // Insert new associations
      if (theme_ids.length > 0) {
        const workThemes = theme_ids.map((theme_id: string) => ({
          work_id: id,
          theme_id,
        }));

        await supabase.from('work_themes').insert(workThemes);
      }
    }

    // Update attachments if provided
    if (attachments !== undefined) {
      // Delete existing attachments
      await supabase
        .from('work_attachments')
        .delete()
        .eq('work_id', id);

      // Insert new attachments
      if (attachments.length > 0) {
        const attachmentsToInsert = attachments.map((att) => ({
          work_id: id,
          file_name: att.file_name,
          file_size_bytes: att.file_size_bytes,
          file_type: att.file_type === 'image' ? 'image' : 'pdf',
          mime_type: att.mime_type || 'application/octet-stream',
          storage_path: att.storage_path,
          thumbnail_path: att.thumbnail_path || null,
          uploaded_by: user.id,
        }));

        const { error: attachError } = await supabase
          .from('work_attachments')
          .insert(attachmentsToInsert);

        if (attachError) {
          console.error('Attachments insert error:', attachError);
          // Don't fail the entire operation if attachments fail
        }
      }
    }

    // Update external links if provided
    if (externalLinks !== undefined) {
      // Delete existing links
      await supabase
        .from('work_links')
        .delete()
        .eq('work_id', id);

      // Insert new links
      if (externalLinks.length > 0) {
        const linksToInsert = externalLinks.map((link) => ({
          work_id: id,
          url: link.url,
          link_type: link.link_type || link.platform || detectLinkType(link.url),
          custom_label: null,
          preview_title: null,
          preview_thumbnail_url: link.embed_url || null,
        }));

        const { error: linksError } = await supabase
          .from('work_links')
          .insert(linksToInsert);

        if (linksError) {
          console.error('Links insert error:', linksError);
          // Don't fail the entire operation if links fail
        }
      }
    }

    revalidatePath('/teacher/works');
    revalidatePath(`/teacher/works/${id}`);
    revalidatePath('/admin/works/pending');

    return {
      success: true,
      data: work,
    };
  } catch (error) {
    console.error('Update work error:', error);
    return { success: false, error: 'Errore durante l\'aggiornamento del lavoro' };
  }
}

/**
 * Delete a work
 * Teachers can delete their own draft works
 * Admins can delete any work
 *
 * @param id - Work ID
 */
export async function deleteWork(id: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Non autenticato' };
    }

    // Delete work (RLS will enforce permissions)
    const { error: deleteError } = await supabase
      .from('works')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Work delete error:', deleteError);
      return { success: false, error: 'Errore durante l\'eliminazione del lavoro' };
    }

    revalidatePath('/teacher/works');

    return { success: true };
  } catch (error) {
    console.error('Delete work error:', error);
    return { success: false, error: 'Errore durante l\'eliminazione del lavoro' };
  }
}

/**
 * Submit work for review
 * Changes work status from draft to pending_review
 *
 * @param id - Work ID
 */
export async function submitWorkForReview(id: string) {
  try {
    const supabase = await createClient();

    const { data: work, error } = await supabase
      .from('works')
      .update({ status: 'pending_review' })
      .eq('id', id)
      .select()
      .single();

    if (error || !work) {
      console.error('Submit for review error:', error);
      return { success: false, error: 'Errore durante l\'invio per revisione' };
    }

    revalidatePath('/teacher/works');
    revalidatePath(`/teacher/works/${id}`);
    revalidatePath('/admin/review-queue');

    return { success: true, data: work };
  } catch (error) {
    console.error('Submit for review error:', error);
    return { success: false, error: 'Errore durante l\'invio per revisione' };
  }
}

/**
 * Get work by ID with relations
 * Includes themes, attachments, links, and creator info
 *
 * @param id - Work ID
 */
export async function getWorkById(id: string) {
  try {
    const supabase = await createClient();

    // Get work with related data
    const { data: work, error } = await supabase
      .from('works')
      .select(`
        *,
        users:created_by (
          id,
          name,
          email
        ),
        work_themes (
          themes (
            id,
            title_it,
            title_en,
            slug
          )
        ),
        work_attachments (*),
        work_links (*)
      `)
      .eq('id', id)
      .single();

    if (error || !work) {
      return null;
    }

    return work;
  } catch (error) {
    console.error('Get work by ID error:', error);
    return null;
  }
}

/**
 * Get works for current user
 * Teachers see their own works, admins see all
 *
 * @param filters - Optional filters
 */
export async function getMyWorks(filters?: {
  status?: string;
  school_year?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Non autenticato', data: [] };
    }

    let query = supabase
      .from('works')
      .select(`
        *,
        work_themes (
          themes (
            id,
            title_it,
            slug
          )
        )
      `, { count: 'exact' })
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.school_year) {
      query = query.eq('school_year', filters.school_year);
    }

    // Apply pagination
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Get my works error:', error);
      return { success: false, error: 'Errore durante il caricamento dei lavori', data: [] };
    }

    return {
      success: true,
      data: data || [],
      count: count || 0,
    };
  } catch (error) {
    console.error('Get my works error:', error);
    return { success: false, error: 'Errore durante il caricamento dei lavori', data: [] };
  }
}

/**
 * Get published works by theme
 * Public endpoint for theme pages
 *
 * @param themeSlug - Theme slug
 */
export async function getPublishedWorksByTheme(themeSlug: string) {
  try {
    const supabase = await createClient();

    // Get theme by slug
    const { data: theme } = await supabase
      .from('themes')
      .select('id')
      .eq('slug', themeSlug)
      .eq('status', 'published')
      .single();

    if (!theme) {
      return { success: false, error: 'Tema non trovato', data: [] };
    }

    // Get published works for this theme
    const { data: workThemes, error } = await supabase
      .from('work_themes')
      .select(`
        works (
          id,
          title_it,
          title_en,
          description_it,
          description_en,
          class_name,
          teacher_name,
          school_year,
          tags,
          view_count,
          published_at,
          work_attachments (
            id,
            file_name,
            file_type,
            thumbnail_path
          ),
          work_links (
            id,
            url,
            link_type,
            custom_label
          )
        )
      `)
      .eq('theme_id', theme.id)
      .eq('works.status', 'published')
      .order('works.published_at', { ascending: false });

    if (error) {
      console.error('Get works by theme error:', error);
      return { success: false, error: 'Errore durante il caricamento dei lavori', data: [] };
    }

    // Extract works from nested structure
    const works = workThemes?.map((wt: any) => wt.works).filter(Boolean) || [];

    return {
      success: true,
      data: works,
    };
  } catch (error) {
    console.error('Get works by theme error:', error);
    return { success: false, error: 'Errore durante il caricamento dei lavori', data: [] };
  }
}
