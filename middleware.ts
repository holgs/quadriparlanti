/**
 * Next.js Middleware
 * Handles authentication and internationalization
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

const locales = ['it'];
const defaultLocale = 'it';

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

/**
 * Middleware function that handles both authentication and i18n
 */
export async function middleware(request: NextRequest) {
  // First handle i18n routing
  const response = intlMiddleware(request);

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { user }, error } = await supabase.auth.getUser();

  // Get the pathname without locale
  const pathname = request.nextUrl.pathname;
  const pathnameWithoutLocale = pathname.replace(/^\/(it|en)/, '');

  // Protected routes that require authentication
  const protectedRoutes = ['/teacher', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Admin-only routes
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && (error || !user)) {
    const loginUrl = new URL(`/${request.nextUrl.pathname.split('/')[1]}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin role for admin routes
  if (isAdminRoute && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      // Redirect non-admin users to teacher dashboard
      const teacherUrl = new URL(`/${request.nextUrl.pathname.split('/')[1]}/teacher`, request.url);
      return NextResponse.redirect(teacherUrl);
    }
  }

  return response;
}

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
