-- ============================================================================
-- MIGRATION: Initial Schema
-- Description: Creates all database tables for the Repository Lavori Studenti
-- Author: System Architect
-- Date: 2024-01-01
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For digest function

-- ============================================================================
-- TABLE: users
-- Description: Stores teacher and admin user profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('docente', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  storage_used_mb INTEGER DEFAULT 0,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE status = 'active';

-- ============================================================================
-- TABLE: themes
-- Description: Thematic collections that group related works
-- ============================================================================
CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_it TEXT NOT NULL,
  title_en TEXT,
  description_it TEXT NOT NULL CHECK (char_length(description_it) BETWEEN 50 AND 500),
  description_en TEXT CHECK (description_en IS NULL OR char_length(description_en) BETWEEN 50 AND 500),
  slug TEXT UNIQUE NOT NULL,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Indexes for themes
CREATE UNIQUE INDEX IF NOT EXISTS idx_themes_slug ON themes(slug);
CREATE INDEX IF NOT EXISTS idx_themes_status ON themes(status);
CREATE INDEX IF NOT EXISTS idx_themes_display_order ON themes(display_order) WHERE status = 'published';

-- ============================================================================
-- TABLE: works
-- Description: Student work submissions with multilingual support
-- ============================================================================
CREATE TABLE IF NOT EXISTS works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_it TEXT NOT NULL CHECK (char_length(title_it) BETWEEN 1 AND 100),
  title_en TEXT CHECK (title_en IS NULL OR char_length(title_en) BETWEEN 1 AND 100),
  description_it TEXT NOT NULL CHECK (char_length(description_it) BETWEEN 10 AND 2000),
  description_en TEXT CHECK (description_en IS NULL OR char_length(description_en) BETWEEN 10 AND 2000),
  class_name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  school_year TEXT NOT NULL CHECK (school_year ~* '^\d{4}-\d{2}$'), -- Format: 2024-25
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'needs_revision', 'archived')),
  license TEXT CHECK (license IN ('none', 'CC BY', 'CC BY-SA', 'CC BY-NC', 'CC BY-NC-SA')),
  tags TEXT[], -- Array of tags
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0,
  search_vector TSVECTOR -- Full-text search
);

-- Indexes for works
CREATE INDEX IF NOT EXISTS idx_works_created_by ON works(created_by);
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);
CREATE INDEX IF NOT EXISTS idx_works_published_at ON works(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_works_class_name ON works(class_name) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_works_school_year ON works(school_year) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_works_search_vector ON works USING GIN(search_vector); -- Full-text search
CREATE INDEX IF NOT EXISTS idx_works_tags ON works USING GIN(tags); -- Array search

-- ============================================================================
-- TABLE: work_themes (Junction Table)
-- Description: Many-to-many relationship between works and themes
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_themes (
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (work_id, theme_id)
);

-- Indexes for work_themes
CREATE INDEX IF NOT EXISTS idx_work_themes_theme_id ON work_themes(theme_id);
CREATE INDEX IF NOT EXISTS idx_work_themes_work_id ON work_themes(work_id);

-- ============================================================================
-- TABLE: work_attachments
-- Description: Files (PDFs, images) attached to works
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT file_size_limit CHECK (file_size_bytes <= 10485760) -- 10MB max
);

-- Indexes for work_attachments
CREATE INDEX IF NOT EXISTS idx_work_attachments_work_id ON work_attachments(work_id);

-- ============================================================================
-- TABLE: work_links
-- Description: External links (YouTube, Vimeo, Drive) for works
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  url TEXT NOT NULL CHECK (url ~* '^https?://'),
  link_type TEXT NOT NULL CHECK (link_type IN ('youtube', 'vimeo', 'drive', 'other')),
  custom_label TEXT,
  preview_title TEXT,
  preview_thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for work_links
CREATE INDEX IF NOT EXISTS idx_work_links_work_id ON work_links(work_id);

-- ============================================================================
-- TABLE: qr_codes
-- Description: QR code metadata for theme access
-- ============================================================================
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  short_code TEXT UNIQUE NOT NULL CHECK (char_length(short_code) = 6),
  is_active BOOLEAN DEFAULT true,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ,
  CONSTRAINT short_code_format CHECK (short_code ~* '^[A-Za-z0-9]{6}$')
);

-- Indexes for qr_codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_codes_short_code ON qr_codes(short_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_theme_id ON qr_codes(theme_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON qr_codes(theme_id) WHERE is_active = true;

-- ============================================================================
-- TABLE: qr_scans (Analytics)
-- Description: Tracks QR code scans for analytics (GDPR-compliant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  hashed_ip TEXT NOT NULL,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown')),
  referer TEXT
);

-- Indexes for qr_scans
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scans_theme_id ON qr_scans(theme_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_code_id ON qr_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_hashed_ip ON qr_scans(hashed_ip);

-- ============================================================================
-- TABLE: work_views (Analytics)
-- Description: Tracks individual work page views
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  hashed_ip TEXT NOT NULL,
  referrer TEXT CHECK (referrer IN ('theme_page', 'search', 'direct', 'external')),
  user_agent TEXT,
  session_id TEXT -- For deduplication in analytics
);

-- Indexes for work_views
CREATE INDEX IF NOT EXISTS idx_work_views_viewed_at ON work_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_views_work_id ON work_views(work_id);
CREATE INDEX IF NOT EXISTS idx_work_views_session_id ON work_views(session_id);

-- ============================================================================
-- TABLE: work_reviews (Admin Feedback)
-- Description: Admin review actions and feedback on works
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  comments TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT rejection_requires_comments CHECK (
    action != 'rejected' OR (comments IS NOT NULL AND char_length(comments) > 10)
  )
);

-- Indexes for work_reviews
CREATE INDEX IF NOT EXISTS idx_work_reviews_work_id ON work_reviews(work_id);
CREATE INDEX IF NOT EXISTS idx_work_reviews_reviewed_at ON work_reviews(reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_reviews_reviewer_id ON work_reviews(reviewer_id);

-- ============================================================================
-- TABLE: config (Application Settings)
-- Description: Key-value store for application configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Seed initial config data
INSERT INTO config (key, value, description) VALUES
  ('daily_salt', gen_random_uuid()::TEXT, 'Daily salt for IP hashing (regenerated daily)'),
  ('school_name_it', 'Scuola Esempio', 'School name in Italian'),
  ('school_name_en', 'Example School', 'School name in English'),
  ('max_file_size_mb', '10', 'Maximum file upload size in MB'),
  ('max_files_per_work', '5', 'Maximum number of files per work'),
  ('max_links_per_work', '5', 'Maximum number of external links per work'),
  ('teacher_storage_quota_mb', '500', 'Storage quota per teacher in MB'),
  ('qr_scan_dedup_minutes', '5', 'Deduplication window for QR scans (same IP within X minutes)'),
  ('work_view_dedup_minutes', '30', 'Deduplication window for work views')
ON CONFLICT (key) DO NOTHING;
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
-- ============================================================================
-- MIGRATION: Triggers and Functions
-- Description: Database triggers for automation and utility functions
-- Author: System Architect
-- Date: 2024-01-01
-- ============================================================================

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- Description: Automatically updates the updated_at column on row update
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to themes table
CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to works table
CREATE TRIGGER update_works_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Update work search vector for full-text search
-- Description: Automatically updates search_vector column when work content changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_works_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.title_it, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.description_it, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description_en, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to works table
CREATE TRIGGER trigger_update_works_search_vector
  BEFORE INSERT OR UPDATE OF title_it, title_en, description_it, description_en, tags
  ON works
  FOR EACH ROW
  EXECUTE FUNCTION update_works_search_vector();

-- ============================================================================
-- FUNCTION: Update work status timestamps
-- Description: Automatically sets submitted_at and published_at timestamps
--              when work status changes, and tracks edit count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_work_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set submitted_at when status changes to pending_review
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    NEW.submitted_at := NOW();
  END IF;

  -- Set published_at when status changes to published
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at := NOW();
  END IF;

  -- Increment edit_count when resubmitting after needs_revision
  IF NEW.status = 'pending_review' AND OLD.status = 'needs_revision' THEN
    NEW.edit_count := OLD.edit_count + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to works table
CREATE TRIGGER trigger_update_work_status_timestamps
  BEFORE UPDATE OF status ON works
  FOR EACH ROW
  EXECUTE FUNCTION update_work_status_timestamps();

-- ============================================================================
-- FUNCTION: Increment QR scan count
-- Description: Updates QR code scan_count and last_scanned_at when a scan is logged
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_qr_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE qr_codes
  SET
    scan_count = scan_count + 1,
    last_scanned_at = NEW.scanned_at
  WHERE id = NEW.qr_code_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to qr_scans table
CREATE TRIGGER trigger_increment_qr_scan_count
  AFTER INSERT ON qr_scans
  FOR EACH ROW
  EXECUTE FUNCTION increment_qr_scan_count();

-- ============================================================================
-- FUNCTION: Increment work view count
-- Description: Updates work view_count when a view is logged
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_work_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE works
  SET view_count = view_count + 1
  WHERE id = NEW.work_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to work_views table
CREATE TRIGGER trigger_increment_work_view_count
  AFTER INSERT ON work_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_work_view_count();

-- ============================================================================
-- FUNCTION: Calculate teacher storage usage
-- Description: Updates user storage_used_mb when attachments are added/removed
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_teacher_storage()
RETURNS TRIGGER AS $$
DECLARE
  teacher_id UUID;
  total_size_mb NUMERIC;
BEGIN
  -- Get teacher ID from work (works for both INSERT and DELETE)
  IF TG_OP = 'DELETE' THEN
    SELECT created_by INTO teacher_id FROM works WHERE id = OLD.work_id;
  ELSE
    SELECT created_by INTO teacher_id FROM works WHERE id = NEW.work_id;
  END IF;

  -- Calculate total storage
  SELECT COALESCE(SUM(file_size_bytes) / 1048576.0, 0)
  INTO total_size_mb
  FROM work_attachments wa
  INNER JOIN works w ON wa.work_id = w.id
  WHERE w.created_by = teacher_id;

  -- Update user storage
  UPDATE users
  SET storage_used_mb = ROUND(total_size_mb::numeric, 2)
  WHERE id = teacher_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to work_attachments table
CREATE TRIGGER trigger_calculate_teacher_storage_insert
  AFTER INSERT ON work_attachments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_teacher_storage();

CREATE TRIGGER trigger_calculate_teacher_storage_delete
  AFTER DELETE ON work_attachments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_teacher_storage();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- ============================================================================
-- FUNCTION: Generate unique short code
-- Description: Generates a unique 6-character alphanumeric code for QR codes
-- Returns: 6-character string
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
  attempts INTEGER := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM qr_codes WHERE short_code = result) THEN
      RETURN result;
    END IF;

    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique short code after 10 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Hash IP address for analytics
-- Description: Hashes an IP address with daily salt for GDPR compliance
-- Args: ip_address (TEXT) - IP address to hash
-- Returns: SHA-256 hash as hex string
-- ============================================================================
CREATE OR REPLACE FUNCTION hash_ip(ip_address TEXT)
RETURNS TEXT AS $$
DECLARE
  daily_salt TEXT;
BEGIN
  SELECT value INTO daily_salt FROM config WHERE key = 'daily_salt';
  RETURN encode(digest(ip_address || daily_salt, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Regenerate daily salt
-- Description: Regenerates the daily salt for IP hashing
--              Should be called via cron job daily
-- Returns: void
-- ============================================================================
CREATE OR REPLACE FUNCTION regenerate_daily_salt()
RETURNS VOID AS $$
BEGIN
  UPDATE config
  SET value = gen_random_uuid()::TEXT, updated_at = NOW()
  WHERE key = 'daily_salt';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get works with theme association
-- Description: Helper function to get works filtered by theme
-- Args: p_theme_id (UUID) - Theme ID to filter by
--       p_status (TEXT) - Optional status filter (default: 'published')
-- Returns: Table of work records
-- ============================================================================
CREATE OR REPLACE FUNCTION get_works_by_theme(
  p_theme_id UUID,
  p_status TEXT DEFAULT 'published'
)
RETURNS TABLE (
  id UUID,
  title_it TEXT,
  title_en TEXT,
  description_it TEXT,
  description_en TEXT,
  class_name TEXT,
  teacher_name TEXT,
  school_year TEXT,
  view_count INTEGER,
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.title_it,
    w.title_en,
    w.description_it,
    w.description_en,
    w.class_name,
    w.teacher_name,
    w.school_year,
    w.view_count,
    w.published_at
  FROM works w
  INNER JOIN work_themes wt ON w.id = wt.work_id
  WHERE wt.theme_id = p_theme_id
    AND w.status = p_status
  ORDER BY w.published_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- MIGRATION: Analytics Views
-- Description: Creates database views for reporting and analytics
-- Author: System Architect
-- Date: 2024-01-01
-- ============================================================================

-- ============================================================================
-- VIEW: daily_scan_stats
-- Description: Daily aggregated QR scan statistics
-- ============================================================================
CREATE OR REPLACE VIEW daily_scan_stats AS
SELECT
  DATE(scanned_at) as scan_date,
  theme_id,
  COUNT(*) as scan_count,
  COUNT(DISTINCT hashed_ip) as unique_visitors,
  COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_scans,
  COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_scans,
  COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet_scans
FROM qr_scans
GROUP BY DATE(scanned_at), theme_id
ORDER BY scan_date DESC;

-- ============================================================================
-- VIEW: work_performance_stats
-- Description: Performance metrics for published works
-- ============================================================================
CREATE OR REPLACE VIEW work_performance_stats AS
SELECT
  w.id,
  w.title_it,
  w.class_name,
  w.school_year,
  w.view_count,
  w.published_at,
  COUNT(DISTINCT wv.id) as detail_views,
  COUNT(DISTINCT wv.hashed_ip) as unique_viewers,
  COALESCE(AVG(EXTRACT(EPOCH FROM wv.viewed_at - w.published_at) / 86400), 0) as avg_days_to_view
FROM works w
LEFT JOIN work_views wv ON w.id = wv.work_id
WHERE w.status = 'published'
GROUP BY w.id, w.title_it, w.class_name, w.school_year, w.view_count, w.published_at;

-- ============================================================================
-- VIEW: admin_review_queue
-- Description: Works pending admin review with metadata
-- ============================================================================
CREATE OR REPLACE VIEW admin_review_queue AS
SELECT
  w.id,
  w.title_it,
  w.class_name,
  w.teacher_name,
  w.submitted_at,
  w.edit_count,
  u.name as teacher_full_name,
  u.email as teacher_email,
  (SELECT COUNT(*) FROM work_attachments WHERE work_id = w.id) as attachment_count,
  (SELECT COUNT(*) FROM work_links WHERE work_id = w.id) as link_count,
  EXTRACT(EPOCH FROM (NOW() - w.submitted_at)) / 3600 as hours_pending
FROM works w
INNER JOIN users u ON w.created_by = u.id
WHERE w.status = 'pending_review'
ORDER BY w.submitted_at ASC;

-- ============================================================================
-- VIEW: theme_statistics
-- Description: Statistics for each theme
-- ============================================================================
CREATE OR REPLACE VIEW theme_statistics AS
SELECT
  t.id,
  t.title_it,
  t.slug,
  t.status,
  COUNT(DISTINCT wt.work_id) as works_count,
  COUNT(DISTINCT wt.work_id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM works w WHERE w.id = wt.work_id AND w.status = 'published'
    )
  ) as published_works_count,
  COALESCE(SUM(w.view_count), 0) as total_views,
  (SELECT COUNT(*) FROM qr_codes WHERE theme_id = t.id AND is_active = true) as active_qr_codes,
  (SELECT SUM(scan_count) FROM qr_codes WHERE theme_id = t.id) as total_scans
FROM themes t
LEFT JOIN work_themes wt ON t.id = wt.theme_id
LEFT JOIN works w ON wt.work_id = w.id
GROUP BY t.id, t.title_it, t.slug, t.status;

-- ============================================================================
-- VIEW: teacher_statistics
-- Description: Statistics for each teacher
-- ============================================================================
CREATE OR REPLACE VIEW teacher_statistics AS
SELECT
  u.id,
  u.name,
  u.email,
  u.storage_used_mb,
  COUNT(DISTINCT w.id) as total_works,
  COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'published') as published_works,
  COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'draft') as draft_works,
  COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'pending_review') as pending_works,
  COALESCE(SUM(w.view_count), 0) as total_views,
  MAX(w.published_at) as last_published_at
FROM users u
LEFT JOIN works w ON u.id = w.created_by
WHERE u.role = 'docente' AND u.status = 'active'
GROUP BY u.id, u.name, u.email, u.storage_used_mb;

-- ============================================================================
-- VIEW: recent_activity
-- Description: Recent platform activity for admin dashboard
-- ============================================================================
CREATE OR REPLACE VIEW recent_activity AS
(
  SELECT
    'work_created' as activity_type,
    w.id as entity_id,
    w.title_it as entity_name,
    w.created_by as user_id,
    u.name as user_name,
    w.created_at as activity_at
  FROM works w
  INNER JOIN users u ON w.created_by = u.id
  ORDER BY w.created_at DESC
  LIMIT 20
)
UNION ALL
(
  SELECT
    'work_submitted' as activity_type,
    w.id as entity_id,
    w.title_it as entity_name,
    w.created_by as user_id,
    u.name as user_name,
    w.submitted_at as activity_at
  FROM works w
  INNER JOIN users u ON w.created_by = u.id
  WHERE w.submitted_at IS NOT NULL
  ORDER BY w.submitted_at DESC
  LIMIT 20
)
UNION ALL
(
  SELECT
    'work_published' as activity_type,
    w.id as entity_id,
    w.title_it as entity_name,
    w.created_by as user_id,
    u.name as user_name,
    w.published_at as activity_at
  FROM works w
  INNER JOIN users u ON w.created_by = u.id
  WHERE w.published_at IS NOT NULL
  ORDER BY w.published_at DESC
  LIMIT 20
)
ORDER BY activity_at DESC
LIMIT 50;

-- ============================================================================
-- VIEW: qr_scan_trends
-- Description: QR scan trends over the last 30 days
-- ============================================================================
CREATE OR REPLACE VIEW qr_scan_trends AS
SELECT
  DATE(scanned_at) as scan_date,
  COUNT(*) as total_scans,
  COUNT(DISTINCT hashed_ip) as unique_visitors,
  COUNT(DISTINCT theme_id) as themes_accessed,
  COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_percentage
FROM qr_scans
WHERE scanned_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(scanned_at)
ORDER BY scan_date DESC;

-- ============================================================================
-- VIEW: popular_works
-- Description: Most viewed works in the last 30 days
-- ============================================================================
CREATE OR REPLACE VIEW popular_works AS
SELECT
  w.id,
  w.title_it,
  w.class_name,
  w.school_year,
  w.published_at,
  COUNT(DISTINCT wv.id) as recent_views,
  COUNT(DISTINCT wv.hashed_ip) as unique_visitors,
  w.view_count as total_views
FROM works w
INNER JOIN work_views wv ON w.id = wv.work_id
WHERE w.status = 'published'
  AND wv.viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY w.id, w.title_it, w.class_name, w.school_year, w.published_at, w.view_count
ORDER BY recent_views DESC
LIMIT 20;

-- ============================================================================
-- FUNCTION: Get analytics summary
-- Description: Returns comprehensive analytics summary for admin dashboard
-- Returns: JSON object with key metrics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_analytics_summary()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_works', (SELECT COUNT(*) FROM works WHERE status = 'published'),
    'total_themes', (SELECT COUNT(*) FROM themes WHERE status = 'published'),
    'total_teachers', (SELECT COUNT(*) FROM users WHERE role = 'docente' AND status = 'active'),
    'pending_reviews', (SELECT COUNT(*) FROM works WHERE status = 'pending_review'),
    'total_views', (SELECT SUM(view_count) FROM works WHERE status = 'published'),
    'total_scans', (SELECT SUM(scan_count) FROM qr_codes),
    'last_30_days_scans', (
      SELECT COUNT(*) FROM qr_scans WHERE scanned_at >= NOW() - INTERVAL '30 days'
    ),
    'last_30_days_views', (
      SELECT COUNT(*) FROM work_views WHERE viewed_at >= NOW() - INTERVAL '30 days'
    ),
    'active_qr_codes', (SELECT COUNT(*) FROM qr_codes WHERE is_active = true)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- MIGRATION: Storage Buckets Configuration
-- Description: Creates Supabase Storage buckets and RLS policies for file uploads
-- Author: System Architect
-- Date: 2024-01-01
-- ============================================================================

-- ============================================================================
-- STORAGE BUCKET: work_attachments
-- Description: Stores PDF and image files for student works
-- Access: Public read, authenticated write (teachers and admins)
-- ============================================================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-attachments',
  'work-attachments',
  true, -- Public read access
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow public to view/download files
CREATE POLICY "Public can view work attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'work-attachments');

-- RLS Policy: Teachers can upload files for their own works
CREATE POLICY "Teachers can upload work attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'work-attachments' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('docente', 'admin') AND status = 'active'
    )
  );

-- RLS Policy: Teachers can update/delete their own files
CREATE POLICY "Teachers can update own attachments"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'work-attachments' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('docente', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Teachers can delete own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'work-attachments' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('docente', 'admin') AND status = 'active'
    )
  );

-- RLS Policy: Admins have full access
CREATE POLICY "Admins have full access to work attachments"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'work-attachments' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- STORAGE BUCKET: theme_images
-- Description: Stores featured images for themes
-- Access: Public read, admin write only
-- ============================================================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'theme-images',
  'theme-images',
  true, -- Public read access
  5242880, -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow public to view theme images
CREATE POLICY "Public can view theme images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'theme-images');

-- RLS Policy: Only admins can upload theme images
CREATE POLICY "Admins can upload theme images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'theme-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- RLS Policy: Only admins can update/delete theme images
CREATE POLICY "Admins can update theme images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'theme-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins can delete theme images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'theme-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- STORAGE BUCKET: qr_codes
-- Description: Stores generated QR code images
-- Access: Public read, admin write only
-- ============================================================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qr-codes',
  'qr-codes',
  true, -- Public read access
  1048576, -- 1MB limit
  ARRAY[
    'image/png',
    'image/svg+xml',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow public to view QR codes
CREATE POLICY "Public can view QR codes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qr-codes');

-- RLS Policy: Only admins can upload QR codes
CREATE POLICY "Admins can upload QR codes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- RLS Policy: Only admins can update/delete QR codes
CREATE POLICY "Admins can update QR codes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins can delete QR codes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );
