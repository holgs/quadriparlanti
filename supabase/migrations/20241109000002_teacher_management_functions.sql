-- ============================================================================
-- MIGRATION: Teacher Management Functions and Indexes
-- Description: Creates helper functions and indexes for teacher management
-- Author: Senior Backend Engineer
-- Date: 2024-11-09
-- ============================================================================

-- ============================================================================
-- FUNCTION: get_teacher_statistics
-- Description: Returns aggregated statistics for teachers by status
-- Returns: JSON object with counts by status
-- Security: SECURITY DEFINER - runs with creator privileges
-- ============================================================================
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

-- Add comment on function
COMMENT ON FUNCTION get_teacher_statistics() IS 'Returns teacher counts grouped by status';

-- ============================================================================
-- FUNCTION: teacher_has_works
-- Description: Checks if a teacher has any associated works
-- Parameters: teacher_id UUID - ID of the teacher to check
-- Returns: BOOLEAN - true if teacher has works, false otherwise
-- Security: SECURITY DEFINER - runs with creator privileges
-- ============================================================================
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

-- Add comment on function
COMMENT ON FUNCTION teacher_has_works(UUID) IS 'Checks if a teacher has any associated works';

-- ============================================================================
-- FUNCTION: get_teacher_work_count
-- Description: Returns the number of works created by a teacher
-- Parameters: teacher_id UUID - ID of the teacher
-- Returns: INTEGER - number of works
-- Security: SECURITY DEFINER - runs with creator privileges
-- ============================================================================
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

-- Add comment on function
COMMENT ON FUNCTION get_teacher_work_count(UUID) IS 'Returns the number of works created by a teacher';

-- ============================================================================
-- INDEXES: Performance optimization for teacher queries
-- ============================================================================

-- Index for email lookups (if not already exists from initial schema)
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

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_teacher_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION teacher_has_works(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_work_count(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON INDEX idx_users_email_lower IS 'Case-insensitive email lookups';
COMMENT ON INDEX idx_users_role_status IS 'Fast filtering by role and status';
COMMENT ON INDEX idx_users_name_lower IS 'Case-insensitive name searches';
COMMENT ON INDEX idx_users_name_trgm IS 'Fuzzy name searching with trigrams';
COMMENT ON INDEX idx_users_docente_active IS 'Optimized for teacher listing queries';
