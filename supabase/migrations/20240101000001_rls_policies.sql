-- ============================================================================
-- MIGRATION: Row Level Security (RLS) Policies
-- Description: Implements fine-grained access control for all tables
-- Author: System Architect
-- Date: 2024-01-01
-- ============================================================================

-- ============================================================================
-- TABLE: users - RLS Policies
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admins can update users
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admins can insert users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: themes - RLS Policies
-- ============================================================================
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Published themes viewable by all (public access)
CREATE POLICY "Themes viewable by all (public)"
  ON themes FOR SELECT
  USING (status = 'published');

-- Authenticated users view all themes
CREATE POLICY "Authenticated users view all themes"
  ON themes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins manage themes
CREATE POLICY "Admins manage themes"
  ON themes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: works - RLS Policies
-- ============================================================================
ALTER TABLE works ENABLE ROW LEVEL SECURITY;

-- Published works viewable by all
CREATE POLICY "Published works viewable by all"
  ON works FOR SELECT
  USING (status = 'published');

-- Teachers view own works
CREATE POLICY "Teachers view own works"
  ON works FOR SELECT
  USING (created_by = auth.uid());

-- Admins view all works
CREATE POLICY "Admins view all works"
  ON works FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Teachers create works
CREATE POLICY "Teachers create works"
  ON works FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('docente', 'admin') AND status = 'active'
    )
  );

-- Teachers update own draft/revision works
CREATE POLICY "Teachers update own draft/revision works"
  ON works FOR UPDATE
  USING (
    created_by = auth.uid() AND
    status IN ('draft', 'needs_revision')
  );

-- Admins update all works
CREATE POLICY "Admins update all works"
  ON works FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Teachers delete own draft works
CREATE POLICY "Teachers delete own draft works"
  ON works FOR DELETE
  USING (
    created_by = auth.uid() AND
    status = 'draft'
  );

-- Admins delete works
CREATE POLICY "Admins delete works"
  ON works FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: work_themes - RLS Policies
-- ============================================================================
ALTER TABLE work_themes ENABLE ROW LEVEL SECURITY;

-- Work-theme associations viewable by all
CREATE POLICY "Work-theme associations viewable by all"
  ON work_themes FOR SELECT
  USING (true);

-- Teachers manage own work associations
CREATE POLICY "Teachers manage own work associations"
  ON work_themes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_themes.work_id AND created_by = auth.uid()
    )
  );

-- Admins manage all associations
CREATE POLICY "Admins manage all associations"
  ON work_themes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: work_attachments - RLS Policies
-- ============================================================================
ALTER TABLE work_attachments ENABLE ROW LEVEL SECURITY;

-- Attachments viewable with published works
CREATE POLICY "Attachments viewable with published works"
  ON work_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_attachments.work_id AND status = 'published'
    )
  );

-- Teachers view own work attachments
CREATE POLICY "Teachers view own work attachments"
  ON work_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_attachments.work_id AND created_by = auth.uid()
    )
  );

-- Admins view all attachments
CREATE POLICY "Admins view all attachments"
  ON work_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Teachers manage own work attachments
CREATE POLICY "Teachers manage own work attachments"
  ON work_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_attachments.work_id AND created_by = auth.uid()
    )
  );

-- Teachers delete own work attachments
CREATE POLICY "Teachers delete own work attachments"
  ON work_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_attachments.work_id AND created_by = auth.uid()
    )
  );

-- Admins manage all attachments
CREATE POLICY "Admins manage all attachments"
  ON work_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: work_links - RLS Policies
-- ============================================================================
ALTER TABLE work_links ENABLE ROW LEVEL SECURITY;

-- Links viewable with published works
CREATE POLICY "Links viewable with published works"
  ON work_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_links.work_id AND status = 'published'
    )
  );

-- Teachers view own work links
CREATE POLICY "Teachers view own work links"
  ON work_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_links.work_id AND created_by = auth.uid()
    )
  );

-- Admins view all links
CREATE POLICY "Admins view all links"
  ON work_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Teachers manage own work links
CREATE POLICY "Teachers manage own work links"
  ON work_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_links.work_id AND created_by = auth.uid()
    )
  );

-- Teachers delete own work links
CREATE POLICY "Teachers delete own work links"
  ON work_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_links.work_id AND created_by = auth.uid()
    )
  );

-- Admins manage all links
CREATE POLICY "Admins manage all links"
  ON work_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: qr_codes - RLS Policies
-- ============================================================================
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- QR codes viewable by all (for redirection)
CREATE POLICY "QR codes viewable by all (for redirection)"
  ON qr_codes FOR SELECT
  USING (true);

-- Admins manage QR codes
CREATE POLICY "Admins manage QR codes"
  ON qr_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- TABLE: qr_scans - RLS Policies
-- ============================================================================
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- Admins view all scans
CREATE POLICY "Admins view all scans"
  ON qr_scans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Public can insert scans (logging)
CREATE POLICY "Public can insert scans (logging)"
  ON qr_scans FOR INSERT
  WITH CHECK (true); -- No auth required for logging

-- ============================================================================
-- TABLE: work_views - RLS Policies
-- ============================================================================
ALTER TABLE work_views ENABLE ROW LEVEL SECURITY;

-- Admins view all views
CREATE POLICY "Admins view all views"
  ON work_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Public can insert views (logging)
CREATE POLICY "Public can insert views (logging)"
  ON work_views FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TABLE: work_reviews - RLS Policies
-- ============================================================================
ALTER TABLE work_reviews ENABLE ROW LEVEL SECURITY;

-- Teachers view reviews of own works
CREATE POLICY "Teachers view reviews of own works"
  ON work_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM works
      WHERE id = work_reviews.work_id AND created_by = auth.uid()
    )
  );

-- Admins view all reviews
CREATE POLICY "Admins view all reviews"
  ON work_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admins insert reviews
CREATE POLICY "Admins insert reviews"
  ON work_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    ) AND reviewer_id = auth.uid()
  );

-- ============================================================================
-- TABLE: config - RLS Policies
-- ============================================================================
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Config readable by all
CREATE POLICY "Config readable by all"
  ON config FOR SELECT
  USING (true);

-- Admins update config
CREATE POLICY "Admins update config"
  ON config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admins insert config
CREATE POLICY "Admins insert config"
  ON config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );
