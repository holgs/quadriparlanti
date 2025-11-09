-- ============================================================================
-- CONSOLIDATED TEACHER MANAGEMENT MIGRATIONS
-- Description: Complete setup for teacher management functionality
-- Date: 2024-11-09
-- ============================================================================
--
-- HOW TO APPLY:
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- 2. Copy this entire file (Cmd+A, Cmd+C)
-- 3. Paste into SQL Editor and click "Run" (or Cmd+Enter)
-- 4. Verify success by checking Database → Tables → users
--
-- ============================================================================

-- ============================================================================
-- PART 1: Add Teacher Profile Fields
-- ============================================================================

-- Add bio column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
    COMMENT ON COLUMN users.bio IS 'Teacher biography (max 500 chars)';
  END IF;
END $$;

-- Add profile_image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_image_url TEXT;
    COMMENT ON COLUMN users.profile_image_url IS 'URL to teacher profile image';
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    COMMENT ON COLUMN users.updated_at IS 'Timestamp of last profile update';
  END IF;
END $$;

-- Add constraint for bio length (max 500 characters)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'bio_length_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT bio_length_check
      CHECK (bio IS NULL OR char_length(bio) <= 500);
  END IF;
END $$;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_updated_at ON users;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update role constraint to include 'studente' if not already present
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_role_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  -- Add new constraint with all three roles
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'docente', 'studente'));
END $$;

-- Update status constraint to include 'inactive' if not already present
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_status_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_status_check;
  END IF;

  -- Add new constraint with all statuses
  ALTER TABLE users ADD CONSTRAINT users_status_check
    CHECK (status IN ('active', 'invited', 'suspended', 'inactive'));
END $$;

-- Add index for status column for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================================
-- PART 2: Teacher Management Functions and Indexes
-- ============================================================================

-- Function: get_teacher_statistics
-- Returns aggregated statistics for teachers by status
CREATE OR REPLACE FUNCTION get_teacher_statistics()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'inactive', COUNT(*) FILTER (WHERE status = 'inactive'),
    'suspended', COUNT(*) FILTER (WHERE status = 'suspended'),
    'invited', COUNT(*) FILTER (WHERE status = 'invited')
  )
  INTO stats
  FROM users
  WHERE role = 'docente';

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_teacher_statistics() IS 'Returns teacher counts grouped by status';

-- Function: teacher_has_works
-- Checks if a teacher has any associated works
CREATE OR REPLACE FUNCTION teacher_has_works(teacher_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  work_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO work_count
  FROM works
  WHERE created_by = teacher_id;

  RETURN work_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION teacher_has_works(UUID) IS 'Checks if a teacher has any associated works';

-- Function: get_teacher_work_count
-- Returns the number of works created by a teacher
CREATE OR REPLACE FUNCTION get_teacher_work_count(teacher_id UUID)
RETURNS INTEGER AS $$
DECLARE
  work_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO work_count
  FROM works
  WHERE created_by = teacher_id;

  RETURN work_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_teacher_work_count(UUID) IS 'Returns the number of works created by a teacher';

-- Performance Indexes

-- Index for email lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));

-- Composite index for role and status filtering
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- Index for name searching (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_name_lower ON users(LOWER(name));

-- Trigram index for fuzzy name searching (requires pg_trgm extension)
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin(name gin_trgm_ops);

-- Index for created_at ordering
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Composite index for teacher queries with status and created_at
CREATE INDEX IF NOT EXISTS idx_users_docente_active ON users(role, status, created_at DESC)
  WHERE role = 'docente';

-- Grant Permissions

GRANT EXECUTE ON FUNCTION get_teacher_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION teacher_has_works(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_work_count(UUID) TO authenticated;

-- Add helpful comments on indexes
COMMENT ON INDEX idx_users_email_lower IS 'Case-insensitive email lookups';
COMMENT ON INDEX idx_users_role_status IS 'Fast filtering by role and status';
COMMENT ON INDEX idx_users_name_lower IS 'Case-insensitive name searches';
COMMENT ON INDEX idx_users_name_trgm IS 'Fuzzy name searching with trigrams';
COMMENT ON INDEX idx_users_docente_active IS 'Optimized for teacher listing queries';

-- Add comment on users table
COMMENT ON TABLE users IS 'User profiles for teachers, admins, and students';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Uncomment and run these to verify the migrations were applied successfully:
--
-- -- Check if columns exist
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- AND column_name IN ('bio', 'profile_image_url', 'updated_at');
--
-- -- Check if functions exist
-- SELECT routine_name
-- FROM information_schema.routines
-- WHERE routine_name IN ('get_teacher_statistics', 'teacher_has_works', 'get_teacher_work_count');
--
-- -- Check if indexes exist
-- SELECT indexname
-- FROM pg_indexes
-- WHERE tablename = 'users'
-- AND indexname LIKE 'idx_users_%';
--
-- -- Test the statistics function
-- SELECT get_teacher_statistics();
--
-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================
