/**
 * Auth Callback Route Handler
 * Handles Supabase auth callbacks for:
 * - Email verification
 * - Password reset
 * - Invite acceptance
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Get user to check role and determine redirect
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // For invite type, redirect to set-password page
        if (type === 'invite') {
          return NextResponse.redirect(
            new URL('/it/set-password', requestUrl.origin)
          );
        }

        // For recovery type (password reset), redirect to set-password page
        if (type === 'recovery') {
          return NextResponse.redirect(
            new URL('/it/set-password', requestUrl.origin)
          );
        }

        // Get user role for standard verification
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        // Redirect based on role
        if (userData?.role === 'admin') {
          return NextResponse.redirect(new URL('/it/admin', requestUrl.origin));
        } else if (userData?.role === 'docente') {
          return NextResponse.redirect(new URL('/it/teacher', requestUrl.origin));
        }
      }

      // Default redirect
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If there's an error or no token, redirect to login with error
  return NextResponse.redirect(
    new URL('/it/login?error=auth_error', requestUrl.origin)
  );
}
