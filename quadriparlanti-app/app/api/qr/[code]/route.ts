/**
 * QR Code Redirect API Route
 * Handles QR code scans and redirects to theme pages
 * Logs analytics data for tracking
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { hashIP, detectDeviceType } from '@/lib/utils';

/**
 * GET /api/qr/[code]
 * Redirects QR code to theme page and logs scan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Get Supabase client
    const supabase = await createClient();

    // Look up QR code
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select('id, theme_id, is_active, themes(slug)')
      .eq('short_code', code)
      .single();

    if (error || !qrCode) {
      // QR code not found - redirect to home page
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (!qrCode.is_active) {
      // QR code is deactivated - redirect to home page
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Get client IP and user agent for analytics
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const userAgent = headersList.get('user-agent') || '';

    // Get daily salt for IP hashing
    const { data: config } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'daily_salt')
      .single();

    const dailySalt = config?.value || '';
    const hashedIp = hashIP(clientIp, dailySalt);

    // Detect device type
    const deviceType = detectDeviceType(userAgent);

    // Get referer
    const referer = headersList.get('referer') || null;

    // Log QR scan (async, don't wait for it)
    supabase
      .from('qr_scans')
      .insert({
        qr_code_id: qrCode.id,
        theme_id: qrCode.theme_id,
        hashed_ip: hashedIp,
        user_agent: userAgent,
        device_type: deviceType,
        referer: referer,
      })
      .then(({ error: scanError }) => {
        if (scanError) {
          console.error('QR scan logging error:', scanError);
        }
      });

    // Redirect to theme page
    const theme = qrCode.themes as any;
    const themeSlug = theme?.slug;

    if (!themeSlug) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Get locale from request (default to 'it')
    const locale = request.nextUrl.pathname.split('/')[1] || 'it';
    const redirectUrl = new URL(`/${locale}/themes/${themeSlug}`, request.url);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('QR redirect error:', error);
    // On error, redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
  }
}
