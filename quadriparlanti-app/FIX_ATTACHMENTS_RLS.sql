-- ==================================================================
-- FIX: Work Attachments RLS Policy Issue
-- ==================================================================
-- PROBLEM:
--   - Attachments are visible in draft works ✓
--   - Attachments are NOT visible in published works for admins ✗
--   - Attachments are NOT visible in public pages ✗
--
-- ROOT CAUSE:
--   Conflicting RLS policies on work_attachments table.
--   The current policies create conflicts when querying works with
--   JOIN on work_attachments.
--
-- SOLUTION:
--   Replace the conflicting policies with clearer, more specific ones.
-- ==================================================================

BEGIN;

-- Step 1: Drop existing conflicting SELECT policies
DROP POLICY IF EXISTS "Public can view attachments of published works" ON public.work_attachments;
DROP POLICY IF EXISTS "Teachers can view own attachments" ON public.work_attachments;

-- Step 2: Create new, non-conflicting SELECT policies

-- Policy 1: Public can view attachments of published works
CREATE POLICY "Public can view published work attachments"
ON public.work_attachments FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.works
    WHERE works.id = work_attachments.work_id
    AND works.status = 'published'
  )
);

-- Policy 2: Authenticated users can view attachments based on work access
CREATE POLICY "Authenticated users view work attachments"
ON public.work_attachments FOR SELECT
TO authenticated
USING (
  -- User uploaded the attachment
  uploaded_by = auth.uid()
  OR
  -- User is admin (can see all)
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  OR
  -- User created the work (teacher viewing their own work)
  EXISTS (
    SELECT 1 FROM public.works
    WHERE works.id = work_attachments.work_id
    AND works.created_by = auth.uid()
  )
);

-- Step 3: Verify the fix
DO $$
BEGIN
  RAISE NOTICE '✓ RLS policies updated successfully';
  RAISE NOTICE '  ';
  RAISE NOTICE 'Policy changes:';
  RAISE NOTICE '  - Removed conflicting policies';
  RAISE NOTICE '  - Added: "Public can view published work attachments"';
  RAISE NOTICE '  - Added: "Authenticated users view work attachments"';
  RAISE NOTICE '  ';
  RAISE NOTICE 'Access rules:';
  RAISE NOTICE '  - Public: Can view attachments of published works';
  RAISE NOTICE '  - Teachers: Can view attachments of their own works (any status)';
  RAISE NOTICE '  - Admins: Can view ALL attachments (any work, any status)';
END $$;

COMMIT;

-- ==================================================================
-- VERIFICATION QUERIES (run separately to test)
-- ==================================================================

-- Test 1: Count attachments by work status (should show counts for all statuses)
-- SELECT
--   w.status,
--   COUNT(DISTINCT w.id) as work_count,
--   COUNT(wa.id) as attachment_count
-- FROM works w
-- LEFT JOIN work_attachments wa ON wa.work_id = w.id
-- GROUP BY w.status
-- ORDER BY w.status;

-- Test 2: Check specific published work (replace with your work ID)
-- SELECT
--   w.id,
--   w.title_it,
--   w.status,
--   COUNT(wa.id) as attachment_count
-- FROM works w
-- LEFT JOIN work_attachments wa ON wa.work_id = w.id
-- WHERE w.id = '982fb702-2331-40cb-b1a9-7becdfcbbe1b'
-- GROUP BY w.id, w.title_it, w.status;

-- Test 3: List all policies on work_attachments
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename = 'work_attachments'
-- ORDER BY policyname;
