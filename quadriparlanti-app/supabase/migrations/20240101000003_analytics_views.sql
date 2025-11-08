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
