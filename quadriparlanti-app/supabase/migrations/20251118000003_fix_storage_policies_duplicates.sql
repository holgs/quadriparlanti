-- Fix duplicate storage policies for work-attachments bucket
-- Date: 2025-11-18
-- Problem: Multiple migrations created duplicate policies causing conflicts

-- ============================================================================
-- CLEANUP: Remove ALL existing policies for work-attachments bucket
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname LIKE '%work%attachment%'
        OR policyname LIKE '%Work%Attachment%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Dropped storage policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- ============================================================================
-- RECREATE: Storage policies for work-attachments bucket (clean version)
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
    WHERE users.id = auth.uid()
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
      WHERE users.id = auth.uid()
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
    WHERE users.id = auth.uid()
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
END $$;
