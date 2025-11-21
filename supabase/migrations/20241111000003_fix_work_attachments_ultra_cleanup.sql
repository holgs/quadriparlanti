-- Migration: Ultra-aggressive cleanup and recreation of work_attachments
-- Description: Drops ALL storage policies and recreates only the correct ones
-- Date: 2024-11-11
-- Note: This is a nuclear option to fix persistent policy issues

-- ============================================================================
-- ULTRA CLEANUP: Drop ALL storage policies (nuclear option)
-- ============================================================================

-- Drop ALL policies on storage.objects table
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'Starting ultra cleanup - dropping ALL storage.objects policies...';

  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;

  RAISE NOTICE 'All storage.objects policies dropped';
END $$;

-- Remove ALL work attachment buckets
DELETE FROM storage.buckets WHERE id IN ('work_attachments', 'work-attachments');

-- Drop work_attachments table if exists (to start fresh)
DROP TABLE IF EXISTS public.work_attachments CASCADE;

-- ============================================================================
-- RECREATE CORRECT BUCKET: work-attachments (with hyphen)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-attachments',
  'work-attachments',
  true,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
);

-- ============================================================================
-- RECREATE ALL STORAGE POLICIES (work-attachments only)
-- ============================================================================

-- Public read
CREATE POLICY "Public can view work attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'work-attachments');

-- Teachers/admins upload
CREATE POLICY "Teachers can upload work attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-attachments' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('docente', 'admin')
    AND status = 'active'
  )
);

-- Delete with 24h grace period
CREATE POLICY "Teachers can delete storage attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-attachments' AND
  (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
    OR
    (
      owner = auth.uid() AND
      created_at > NOW() - INTERVAL '24 hours'
    )
  )
);

-- Update metadata
CREATE POLICY "Teachers can update storage attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'work-attachments' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('docente', 'admin')
    AND status = 'active'
  )
)
WITH CHECK (
  bucket_id = 'work-attachments' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('docente', 'admin')
    AND status = 'active'
  )
);

-- ============================================================================
-- RECREATE OTHER BUCKETS' POLICIES (theme-images, qr-codes)
-- ============================================================================

-- Theme images policies
CREATE POLICY "Public can view theme images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'theme-images');

CREATE POLICY "Admins can upload theme images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'theme-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

CREATE POLICY "Admins can update theme images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'theme-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

CREATE POLICY "Admins can delete theme images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'theme-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

-- QR codes policies
CREATE POLICY "Public can view QR codes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-codes');

CREATE POLICY "Admins can upload QR codes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'qr-codes' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

CREATE POLICY "Admins can update QR codes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'qr-codes' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

CREATE POLICY "Admins can delete QR codes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'qr-codes' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

-- ============================================================================
-- CREATE work_attachments TABLE
-- ============================================================================

CREATE TABLE public.work_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  thumbnail_path TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_work_attachments_work_id ON public.work_attachments(work_id);
CREATE INDEX idx_work_attachments_uploaded_by ON public.work_attachments(uploaded_by);
CREATE INDEX idx_work_attachments_file_type ON public.work_attachments(file_type);
CREATE INDEX idx_work_attachments_created_at ON public.work_attachments(created_at DESC);

-- Enable RLS
ALTER TABLE public.work_attachments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view attachments of published works"
ON public.work_attachments FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.works
    WHERE id = work_attachments.work_id
    AND status = 'published'
  )
);

CREATE POLICY "Teachers can view own attachments"
ON public.work_attachments FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Teachers can create attachments"
ON public.work_attachments FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('docente', 'admin')
    AND status = 'active'
  )
);

CREATE POLICY "Teachers can delete table attachments"
ON public.work_attachments FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Trigger
CREATE OR REPLACE FUNCTION update_work_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_work_attachments_updated_at
  BEFORE UPDATE ON public.work_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_work_attachments_updated_at();

-- Comments
COMMENT ON TABLE public.work_attachments IS 'Tracks file attachments for student works';
COMMENT ON COLUMN public.work_attachments.storage_path IS 'Path in Supabase Storage (format: user_id/work_id/filename)';
COMMENT ON COLUMN public.work_attachments.thumbnail_path IS 'Path to generated thumbnail for images';

-- Success
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ ULTRA CLEANUP COMPLETED';
  RAISE NOTICE '✓ All old policies removed';
  RAISE NOTICE '✓ Bucket: work-attachments recreated';
  RAISE NOTICE '✓ Table: work_attachments created';
  RAISE NOTICE '✓ All policies recreated correctly';
  RAISE NOTICE '========================================';
END $$;
