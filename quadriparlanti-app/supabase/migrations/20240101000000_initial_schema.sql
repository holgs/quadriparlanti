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
