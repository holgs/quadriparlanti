-- Force cleanup and recreate storage policies
-- Date: 2025-11-18 v4
-- Problem: Existing policies with type mismatches prevent cleanup

-- ============================================================================
-- STEP 1: Force drop ALL policies on storage.objects for work-attachments
-- ============================================================================

DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  -- Drop all policies that mention 'work' and 'attach' in the name
  FOR policy_rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%work%attach%'
      )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY %I ON %I.%I',
        policy_rec.policyname,
        policy_rec.schemaname,
        policy_rec.tablename
      );
      RAISE NOTICE 'Dropped policy: %', policy_rec.policyname;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to drop policy % (continuing): %', policy_rec.policyname, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Recreate policies with proper type handling
-- ============================================================================

-- Policy 1: Public read (no auth needed, no type issues)
CREATE POLICY "work_attachments_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'work-attachments');

-- Policy 2: Authenticated insert (simplified - no user table lookup)
-- Just check that user is authenticated
CREATE POLICY "work_attachments_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-attachments'
  AND auth.uid() IS NOT NULL
);

-- Policy 3: Authenticated delete (simplified)
CREATE POLICY "work_attachments_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-attachments'
  AND auth.uid() IS NOT NULL
);

-- Policy 4: Authenticated update (simplified)
CREATE POLICY "work_attachments_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'work-attachments'
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'work-attachments'
  AND auth.uid() IS NOT NULL
);

-- ============================================================================
-- STEP 3: Verify bucket settings
-- ============================================================================

UPDATE storage.buckets
SET public = true
WHERE id = 'work-attachments';

-- ============================================================================
-- STEP 4: Log results
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓✓✓ SIMPLIFIED STORAGE POLICIES CREATED ✓✓✓';
  RAISE NOTICE 'Public read: ENABLED (anyone can download)';
  RAISE NOTICE 'Authenticated insert/update/delete: ENABLED (any authenticated user)';
  RAISE NOTICE 'NOTE: Role-based restrictions moved to application layer';
  RAISE NOTICE 'Bucket public: TRUE';
END $$;
