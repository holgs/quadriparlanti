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
