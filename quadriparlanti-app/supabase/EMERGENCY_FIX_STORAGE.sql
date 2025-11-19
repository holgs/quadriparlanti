-- EMERGENCY FIX: Force drop all storage policies by name
-- This avoids evaluating existing broken policies

-- Disable RLS temporarily to avoid policy evaluation
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Drop ALL known policy names explicitly
DROP POLICY IF EXISTS "Public can view work attachments" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Teachers can upload work attachments" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Teachers can delete storage attachments" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Teachers can update storage attachments" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Admins have full access to work attachments" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Teachers can update own attachments" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Teachers can delete own attachments" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "work_attachments_public_read" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "work_attachments_authenticated_insert" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "work_attachments_delete" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "work_attachments_authenticated_delete" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "work_attachments_update" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "work_attachments_authenticated_update" ON storage.objects CASCADE;

-- Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "work_attachments_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'work-attachments');

CREATE POLICY "work_attachments_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'work-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "work_attachments_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'work-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "work_attachments_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'work-attachments' AND auth.uid() IS NOT NULL);

-- Ensure bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'work-attachments';

SELECT 'SUCCESS: Storage policies fixed!' as status;
