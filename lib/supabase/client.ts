/**
 * Supabase Client-Side Configuration
 * Used in Client Components for browser-side operations
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

/**
 * Creates a Supabase client for use in Client Components
 * This client will automatically handle cookie-based session management
 *
 * @returns Supabase client instance for browser use
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Default client export for convenience
 * Note: In most cases, you should call createClient() to get a fresh instance
 */
export const supabase = createClient();
