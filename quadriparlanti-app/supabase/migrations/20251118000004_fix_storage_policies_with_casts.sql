-- Fix duplicate storage policies for work-attachments bucket
-- Date: 2025-11-18 v3
-- Problem: Multiple migrations created duplicate policies causing conflicts
-- Fix: Explicit type casts for all UUID comparisons

-- ============================================================================
-- CLEANUP: Drop ALL known policies explicitly
-- ============================================================================

-- Drop by name (more reliable than LIKE pattern)
DROP POLICY IF EXISTS "Public can view work attachments" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload work attachments" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete storage attachments" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update storage attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access to work attachments" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own attachments" ON storage.objects;
DROP POLICY IF EXISTS "work_attachments_public_read" ON storage.objects;
DROP POLICY IF EXISTS "work_attachments_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "work_attachments_delete" ON storage.objects;
DROP POLICY IF EXISTS "work_attachments_update" ON storage.objects;

-- ============================================================================
-- RECREATE: Storage policies with explicit type casts
-- ============================================================================

-- Policy 1: Public can view/download files (anonymous + authenticated)
CREATE POLICY "work_attachments_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'work-attachments');

-- Policy 2: Authenticated users (teachers/admins) can upload files
CREATE POLICY "work_attachments_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('docente', 'admin')
    AND users.status = 'active'
  )
);

-- Policy 3: Users can delete their own files OR admins can delete any
CREATE POLICY "work_attachments_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-attachments'
  AND (
    -- Admin can delete anything
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
      AND users.status = 'active'
    )
    OR
    -- Owner can delete within 24h
    (
      owner = auth.uid()::text
      AND created_at > NOW() - INTERVAL '24 hours'
    )
  )
);

-- Policy 4: Authenticated users can update metadata
CREATE POLICY "work_attachments_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'work-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('docente', 'admin')
    AND users.status = 'active'
  )
)
WITH CHECK (
  bucket_id = 'work-attachments'
  AND auth.uid() IS NOT NULL
);

-- ============================================================================
-- VERIFY: Ensure bucket is public
-- ============================================================================

UPDATE storage.buckets
SET public = true
WHERE id = 'work-attachments';

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✓ Storage policies for work-attachments cleaned and recreated';
  RAISE NOTICE '✓ Bucket set to public = true';
  RAISE NOTICE '✓ Public can now read files anonymously';
  RAISE NOTICE '✓ Teachers/admins can upload, update, delete';
  RAISE NOTICE '✓ All UUID comparisons use explicit ::text casts';
END $$;
