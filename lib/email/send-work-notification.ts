/**
 * Work Notification Email Helper
 * Send emails for work approval/rejection workflow
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Send email when work is approved
 */
export async function sendWorkApprovedEmail(workId: string) {
  try {
    const supabase = await createClient();

    // Get work and teacher details
    const { data: work, error: workError } = await supabase
      .from('works')
      .select(`
        id,
        title_it,
        title_en,
        class_name,
        school_year,
        users:created_by (
          id,
          email,
          name
        )
      `)
      .eq('id', workId)
      .single();

    if (workError || !work || !work.users) {
      console.error('Error fetching work for email:', workError);
      return { success: false, error: 'Work not found' };
    }

    // Get work URL
    const workUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/works/${workId}`;

    // Send email using Supabase (requires custom email templates configured)
    // Note: This requires setting up custom email templates in Supabase Dashboard
    // For now, we log the email details
    console.log('[EMAIL] Work Approved:', {
      to: work.users.email,
      teacher: work.users.name,
      workTitle: work.title_it,
      workUrl,
    });

    // TODO: Implement actual email sending
    // This would require either:
    // 1. Supabase custom email templates
    // 2. Third-party email service (SendGrid, Resend, etc.)
    // 3. Custom SMTP configuration

    return {
      success: true,
      message: 'Approval notification logged (email configuration needed)',
    };
  } catch (error) {
    console.error('Send approved email error:', error);
    return {
      success: false,
      error: 'Failed to send approval email',
    };
  }
}

/**
 * Send email when work is rejected
 */
export async function sendWorkRejectedEmail(workId: string, feedback: string) {
  try {
    const supabase = await createClient();

    // Get work and teacher details
    const { data: work, error: workError } = await supabase
      .from('works')
      .select(`
        id,
        title_it,
        title_en,
        class_name,
        school_year,
        users:created_by (
          id,
          email,
          name
        )
      `)
      .eq('id', workId)
      .single();

    if (workError || !work || !work.users) {
      console.error('Error fetching work for email:', workError);
      return { success: false, error: 'Work not found' };
    }

    // Get edit URL
    const editUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/teacher/works/${workId}`;

    // Log email details
    console.log('[EMAIL] Work Rejected:', {
      to: work.users.email,
      teacher: work.users.name,
      workTitle: work.title_it,
      feedback,
      editUrl,
    });

    // TODO: Implement actual email sending
    // This would require either:
    // 1. Supabase custom email templates
    // 2. Third-party email service (SendGrid, Resend, etc.)
    // 3. Custom SMTP configuration

    return {
      success: true,
      message: 'Rejection notification logged (email configuration needed)',
    };
  } catch (error) {
    console.error('Send rejected email error:', error);
    return {
      success: false,
      error: 'Failed to send rejection email',
    };
  }
}

/**
 * Send email to admin when work is submitted for review
 */
export async function sendWorkSubmittedEmail(workId: string) {
  try {
    const supabase = await createClient();

    // Get work and teacher details
    const { data: work, error: workError } = await supabase
      .from('works')
      .select(`
        id,
        title_it,
        title_en,
        class_name,
        school_year,
        users:created_by (
          id,
          email,
          name
        )
      `)
      .eq('id', workId)
      .single();

    if (workError || !work || !work.users) {
      console.error('Error fetching work for email:', workError);
      return { success: false, error: 'Work not found' };
    }

    // Get admin users
    const { data: admins } = await supabase
      .from('users')
      .select('email, name')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (!admins || admins.length === 0) {
      console.warn('No active admins found to notify');
      return { success: false, error: 'No admins to notify' };
    }

    // Get review URL
    const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/admin/works/pending`;

    // Log email details
    console.log('[EMAIL] Work Submitted:', {
      toAdmins: admins.map(a => a.email),
      teacher: work.users.name,
      workTitle: work.title_it,
      reviewUrl,
    });

    // TODO: Implement actual email sending to all admins

    return {
      success: true,
      message: 'Submission notification logged (email configuration needed)',
    };
  } catch (error) {
    console.error('Send submitted email error:', error);
    return {
      success: false,
      error: 'Failed to send submission email',
    };
  }
}
