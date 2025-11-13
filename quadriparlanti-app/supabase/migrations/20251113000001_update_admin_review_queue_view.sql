-- ============================================================================
-- MIGRATION: Update admin_review_queue view
-- Description: Adds missing fields (description_it, school_year, created_at)
--              to admin_review_queue view for complete work information
-- Author: System Architect
-- Date: 2025-11-13
-- ============================================================================

-- ============================================================================
-- VIEW: admin_review_queue (Updated)
-- Description: Works pending admin review with complete metadata
-- ============================================================================
CREATE OR REPLACE VIEW admin_review_queue AS
SELECT
  w.id,
  w.title_it,
  w.description_it,
  w.class_name,
  w.teacher_name,
  w.school_year,
  w.submitted_at,
  w.created_at,
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
-- Comments
-- ============================================================================
COMMENT ON VIEW admin_review_queue IS 'Works pending admin review with complete metadata including description and school year';
