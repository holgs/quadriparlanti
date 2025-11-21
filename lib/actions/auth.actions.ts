/**
 * Authentication Server Actions
 * Handles user authentication and session management
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { loginSchema, type LoginInput } from '@/lib/validations/schemas';

/**
 * Login action
 * Authenticates a user with email and password
 *
 * @param input - Login credentials
 * @returns Success status and error message if failed
 */
export async function login(input: LoginInput) {
  try {
    // Validate input
    const validatedInput = loginSchema.parse(input);

    const supabase = await createClient();

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedInput.email,
      password: validatedInput.password,
    });

    if (error) {
      return {
        success: false,
        error: 'Credenziali non valide. Verifica email e password.',
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Si è verificato un errore durante l\'accesso.',
      };
    }

    // Update last_login_at in users table
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);

    // Get user role to determine redirect
    const { data: userData } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', data.user.id)
      .single();

    if (!userData || userData.status !== 'active') {
      // Sign out if user is not active
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Account non attivo. Contatta l\'amministratore.',
      };
    }

    revalidatePath('/', 'layout');

    return {
      success: true,
      role: userData.role,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante l\'accesso.',
    };
  }
}

/**
 * Logout action
 * Signs out the current user
 */
export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante il logout.',
    };
  }
}

/**
 * Get current user
 * Retrieves the authenticated user with their profile data
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get user profile from users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return null;
    }

    return {
      ...user,
      profile,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Check if user is admin
 * Returns true if the current user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin' && profile?.status === 'active';
  } catch {
    return false;
  }
}

/**
 * Request password reset
 * Sends a password reset email to the user
 *
 * @param email - User email address
 */
export async function requestPasswordReset(email: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: 'Si è verificato un errore. Verifica l\'indirizzo email.',
      };
    }

    return {
      success: true,
      message: 'Email di reset inviata. Controlla la tua casella di posta.',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Si è verificato un errore durante la richiesta.',
    };
  }
}

/**
 * Update password
 * Changes the user's password (requires authentication)
 * Also updates user status from 'invited' to 'active' if applicable
 *
 * @param newPassword - New password
 */
export async function updatePassword(newPassword: string) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Non autenticato.',
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: 'Errore durante l\'aggiornamento della password.',
      };
    }

    // Update user status from 'invited' to 'active' if applicable
    const { data: userData } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single();

    if (userData?.status === 'invited') {
      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id);
    }

    return {
      success: true,
      message: 'Password aggiornata con successo.',
    };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: 'Si è verificato un errore.',
    };
  }
}
