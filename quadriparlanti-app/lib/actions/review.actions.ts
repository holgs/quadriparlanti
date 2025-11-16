/**
 * Review Server Actions
 * Admin workflow for approving/rejecting works
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createReviewSchema, type CreateReviewInput } from '@/lib/validations/schemas';
import { sendWorkApprovedEmail, sendWorkRejectedEmail } from '@/lib/email/send-work-notification';

/**
 * Approve a work
 * Changes status to published and creates review record
 *
 * @param input - Review input with work_id and optional comments
 */
export async function approveWork(input: CreateReviewInput) {
  try {
    const supabase = await createClient();

    // Get current user (must be admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Non autenticato' };
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return { success: false, error: 'Permessi insufficienti' };
    }

    // Validate input
    const validatedInput = createReviewSchema.parse({
      ...input,
      action: 'approved',
    });

    // Update work status to published
    const { data: work, error: workError } = await supabase
      .from('works')
      .update({ status: 'published' })
      .eq('id', validatedInput.work_id)
      .select()
      .single();

    if (workError || !work) {
      console.error('Approve work error:', workError);
      return { success: false, error: 'Errore durante l\'approvazione del lavoro' };
    }

    // Create review record
    const { error: reviewError } = await supabase
      .from('work_reviews')
      .insert({
        work_id: validatedInput.work_id,
        reviewer_id: user.id,
        action: 'approved',
        comments: validatedInput.comments || null,
      });

    if (reviewError) {
      console.error('Review creation error:', reviewError);
      // Don't fail the operation if review record fails
    }

    // Send approval email to teacher
    await sendWorkApprovedEmail(work.id);

    // Revalidate relevant paths
    revalidatePath('/admin/review-queue');
    revalidatePath('/admin/works');

    // Get theme slugs to revalidate theme pages
    const { data: workThemes } = await supabase
      .from('work_themes')
      .select('themes (slug)')
      .eq('work_id', work.id);

    if (workThemes) {
      for (const wt of workThemes) {
        const theme = wt.themes as any;
        if (theme?.slug) {
          revalidatePath(`/themes/${theme.slug}`);
        }
      }
    }

    return {
      success: true,
      message: 'Lavoro approvato con successo',
      data: work,
    };
  } catch (error) {
    console.error('Approve work error:', error);
    return { success: false, error: 'Errore durante l\'approvazione del lavoro' };
  }
}

/**
 * Reject a work
 * Changes status to needs_revision and creates review record with required comments
 *
 * @param input - Review input with work_id and comments
 */
export async function rejectWork(input: CreateReviewInput) {
  try {
    const supabase = await createClient();

    // Get current user (must be admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Non autenticato' };
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return { success: false, error: 'Permessi insufficienti' };
    }

    // Validate input (rejection requires comments)
    const validatedInput = createReviewSchema.parse({
      ...input,
      action: 'rejected',
    });

    // Update work status to needs_revision
    const { data: work, error: workError } = await supabase
      .from('works')
      .update({ status: 'needs_revision' })
      .eq('id', validatedInput.work_id)
      .select()
      .single();

    if (workError || !work) {
      console.error('Reject work error:', workError);
      return { success: false, error: 'Errore durante il rifiuto del lavoro' };
    }

    // Create review record with comments
    const { error: reviewError } = await supabase
      .from('work_reviews')
      .insert({
        work_id: validatedInput.work_id,
        reviewer_id: user.id,
        action: 'rejected',
        comments: validatedInput.comments,
      });

    if (reviewError) {
      console.error('Review creation error:', reviewError);
      // Don't fail the operation if review record fails
    }

    // Send rejection email to teacher with feedback
    await sendWorkRejectedEmail(work.id, validatedInput.comments);

    // Revalidate relevant paths
    revalidatePath('/admin/review-queue');
    revalidatePath('/admin/works');

    return {
      success: true,
      message: 'Lavoro rinviato per revisione',
      data: work,
    };
  } catch (error) {
    console.error('Reject work error:', error);
    return { success: false, error: 'Errore durante il rifiuto del lavoro' };
  }
}

/**
 * Get review queue
 * Returns all works pending admin review with full attachments and links
 */
export async function getReviewQueue() {
  try {
    const supabase = await createClient();

    // Query works table directly to get full attachment and link data
    const { data, error } = await supabase
      .from('works')
      .select(`
        *,
        work_attachments (*),
        work_links (*),
        work_themes (
          themes (
            id,
            slug,
            title_it,
            title_en
          )
        ),
        users:created_by (
          id,
          name,
          email
        )
      `)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get review queue error:', error);
      return { success: false, error: 'Errore durante il caricamento della coda', data: [] };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Get review queue error:', error);
    return { success: false, error: 'Errore durante il caricamento della coda', data: [] };
  }
}

/**
 * Get work reviews
 * Returns all review history for a work
 *
 * @param workId - Work ID
 */
export async function getWorkReviews(workId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('work_reviews')
      .select(`
        *,
        users:reviewer_id (
          id,
          name,
          email
        )
      `)
      .eq('work_id', workId)
      .order('reviewed_at', { ascending: false });

    if (error) {
      console.error('Get work reviews error:', error);
      return { success: false, error: 'Errore durante il caricamento delle revisioni', data: [] };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Get work reviews error:', error);
    return { success: false, error: 'Errore durante il caricamento delle revisioni', data: [] };
  }
}
