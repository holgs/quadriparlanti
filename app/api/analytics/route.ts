/**
 * Analytics API Route
 * Provides analytics data for admin dashboard
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * GET /api/analytics
 * Returns comprehensive analytics summary
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    // Get analytics summary using the database function
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_analytics_summary');

    if (summaryError) {
      console.error('Analytics summary error:', summaryError);
      return NextResponse.json(
        { error: 'Errore durante il caricamento delle statistiche' },
        { status: 500 }
      );
    }

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('recent_activity')
      .select('*')
      .limit(20);

    // Get QR scan trends (last 30 days)
    const { data: scanTrends } = await supabase
      .from('qr_scan_trends')
      .select('*')
      .limit(30);

    // Get popular works (last 30 days)
    const { data: popularWorks } = await supabase
      .from('popular_works')
      .select('*')
      .limit(10);

    // Get theme statistics
    const { data: themeStats } = await supabase
      .from('theme_statistics')
      .select('*')
      .eq('status', 'published');

    // Get teacher statistics
    const { data: teacherStats } = await supabase
      .from('teacher_statistics')
      .select('*');

    return NextResponse.json({
      summary: summary || {},
      recent_activity: recentActivity || [],
      scan_trends: scanTrends || [],
      popular_works: popularWorks || [],
      theme_stats: themeStats || [],
      teacher_stats: teacherStats || [],
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/log-view
 * Logs a work view for analytics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { work_id, referrer, session_id } = body;

    if (!work_id) {
      return NextResponse.json(
        { error: 'work_id è obbligatorio' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Get daily salt for IP hashing
    const { data: config } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'daily_salt')
      .single();

    const dailySalt = config?.value || '';
    const hashedIp = createHash('sha256')
      .update(clientIp + dailySalt)
      .digest('hex');

    // Log work view
    const { error } = await supabase
      .from('work_views')
      .insert({
        work_id,
        hashed_ip: hashedIp,
        referrer: referrer || 'direct',
        user_agent: userAgent,
        session_id: session_id || null,
      });

    if (error) {
      console.error('Log view error:', error);
      return NextResponse.json(
        { error: 'Errore durante il logging della visualizzazione' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log view API error:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
