-- ============================================================================
-- MIGRATION: Fix RLS Recursion Issue
-- Description: Creates helper function to check user roles without triggering RLS recursion
-- Date: 2024-11-09
-- ============================================================================

-- Create a security definer function that bypasses RLS to check user role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$;

-- Create helper function to check if user is teacher or admin
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('docente', 'admin')
    AND status = 'active'
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_or_admin() TO authenticated;

-- ============================================================================
-- Drop existing policies that cause recursion
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins manage themes" ON themes;
DROP POLICY IF EXISTS "Admins view all works" ON works;
DROP POLICY IF EXISTS "Admins update all works" ON works;
DROP POLICY IF EXISTS "Admins delete works" ON works;
DROP POLICY IF EXISTS "Admins manage all associations" ON work_themes;
DROP POLICY IF EXISTS "Admins view all attachments" ON work_attachments;
DROP POLICY IF EXISTS "Admins manage all attachments" ON work_attachments;
DROP POLICY IF EXISTS "Admins view all links" ON work_links;
DROP POLICY IF EXISTS "Admins manage all links" ON work_links;
DROP POLICY IF EXISTS "Admins manage QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Admins view all scans" ON qr_scans;
DROP POLICY IF EXISTS "Admins view all views" ON work_views;
DROP POLICY IF EXISTS "Admins view all reviews" ON work_reviews;
DROP POLICY IF EXISTS "Admins insert reviews" ON work_reviews;
DROP POLICY IF EXISTS "Admins update config" ON config;
DROP POLICY IF EXISTS "Admins insert config" ON config;

-- ============================================================================
-- Recreate policies using helper functions (no recursion)
-- ============================================================================

-- Users table policies
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (public.is_admin());

-- Themes table policies
CREATE POLICY "Admins manage themes"
  ON themes FOR ALL
  USING (public.is_admin());

-- Works table policies
CREATE POLICY "Admins view all works"
  ON works FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins update all works"
  ON works FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins delete works"
  ON works FOR DELETE
  USING (public.is_admin());

-- Update Teachers create works policy to use helper function
DROP POLICY IF EXISTS "Teachers create works" ON works;
CREATE POLICY "Teachers create works"
  ON works FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    public.is_teacher_or_admin()
  );

-- Work themes policies
CREATE POLICY "Admins manage all associations"
  ON work_themes FOR ALL
  USING (public.is_admin());

-- Work attachments policies
CREATE POLICY "Admins view all attachments"
  ON work_attachments FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins manage all attachments"
  ON work_attachments FOR ALL
  USING (public.is_admin());

-- Work links policies
CREATE POLICY "Admins view all links"
  ON work_links FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins manage all links"
  ON work_links FOR ALL
  USING (public.is_admin());

-- QR codes policies
CREATE POLICY "Admins manage QR codes"
  ON qr_codes FOR ALL
  USING (public.is_admin());

-- QR scans policies
CREATE POLICY "Admins view all scans"
  ON qr_scans FOR SELECT
  USING (public.is_admin());

-- Work views policies
CREATE POLICY "Admins view all views"
  ON work_views FOR SELECT
  USING (public.is_admin());

-- Work reviews policies
CREATE POLICY "Admins view all reviews"
  ON work_reviews FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins insert reviews"
  ON work_reviews FOR INSERT
  WITH CHECK (
    public.is_admin() AND reviewer_id = auth.uid()
  );

-- Config policies
CREATE POLICY "Admins update config"
  ON config FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins insert config"
  ON config FOR INSERT
  WITH CHECK (public.is_admin());
