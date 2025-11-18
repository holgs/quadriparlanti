-- Debug script to check work_attachments issue
-- Run this in Supabase SQL Editor

-- 1. Check if attachments exist for both works
SELECT
  'Draft work attachments' as description,
  wa.*
FROM work_attachments wa
WHERE wa.work_id = '0de03589-9c82-4922-a23b-bdae94ec6dae';

SELECT
  'Published work attachments' as description,
  wa.*
FROM work_attachments wa
WHERE wa.work_id = '982fb702-2331-40cb-b1a9-7becdfcbbe1b';

-- 2. Check current RLS policies on work_attachments
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'work_attachments'
ORDER BY policyname;

-- 3. Check if migration has been applied by looking for new policy names
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'work_attachments'
      AND policyname = 'Authenticated users view work attachments'
    ) THEN 'Migration 20251118000001 HAS been applied ✓'
    ELSE 'Migration 20251118000001 NOT applied yet ✗'
  END as migration_status;

-- 4. Count attachments by work status
SELECT
  w.status,
  COUNT(wa.id) as attachment_count,
  COUNT(DISTINCT w.id) as work_count
FROM works w
LEFT JOIN work_attachments wa ON wa.work_id = w.id
GROUP BY w.status
ORDER BY w.status;
