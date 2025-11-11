-- ============================================================================
-- MIGRATION: Add DELETE policy for users table
-- Description: Allows admins to delete users (teachers)
-- Date: 2024-11-11
-- ============================================================================

-- Add DELETE policy for admins on users table
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (public.is_admin());

-- Add comment on policy
COMMENT ON POLICY "Admins can delete users" ON users IS 'Allows admin users to delete any user record';
