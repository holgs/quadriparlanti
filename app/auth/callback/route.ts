/**
 * Auth Callback Route Handler
 * Handles Supabase auth callbacks for:
 * - Email verification
 * - Password reset
 * - Invite acceptance (PKCE flow)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') ?? '/';

  // Handle auth errors
  if (error) {
    console.error('Auth callback error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/it/login?error=${error}`, requestUrl.origin)
    );
  }

  // Handle code exchange (PKCE flow - used for invites and email confirmations)
  if (code) {
    const supabase = await createClient();

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(
        new URL('/it/login?error=auth_error', requestUrl.origin)
      );
    }

    // Get user to check role and determine redirect
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if this is a new invite (user status is 'invited')
      const { data: userData } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', user.id)
        .single();

      // If user is invited, redirect to set-password page
      if (userData?.status === 'invited') {
        return NextResponse.redirect(
          new URL('/it/set-password', requestUrl.origin)
        );
      }

      // If there is an explicit next param (that isn't the default '/'), use it
      // This is crucial for password reset flow which needs to go to /reset-password
      if (next && next !== '/') {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      // Otherwise, redirect based on role
      if (userData?.role === 'admin') {
        return NextResponse.redirect(new URL('/it/admin', requestUrl.origin));
      } else if (userData?.role === 'docente') {
        return NextResponse.redirect(new URL('/it/teacher', requestUrl.origin));
      }
    }

    // Default redirect
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(
    new URL('/it/login?error=no_code', requestUrl.origin)
  );
}
