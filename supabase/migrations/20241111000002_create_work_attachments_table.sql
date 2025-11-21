-- Migration: Fix and create work_attachments table with correct storage policies
-- Description: Cleans up incorrect previous attempts and creates correct structure
-- Date: 2024-11-11
-- Note: Fixes bucket naming (work-attachments vs work_attachments) and policy errors

-- ============================================================================
-- CLEANUP: Remove incorrect bucket and policies from failed migration attempts
-- ============================================================================

-- Drop all policies that may exist from previous attempts (both buckets)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (policyname LIKE '%work%attachment%' OR policyname LIKE '%Work%Attachment%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Remove the incorrect bucket 'work_attachments' if it exists
DELETE FROM storage.buckets WHERE id = 'work_attachments';

-- ============================================================================
-- ENSURE CORRECT BUCKET EXISTS: work-attachments (with hyphen)
-- ============================================================================

-- This bucket should already exist from 20240101000004_storage_buckets.sql
-- But we ensure it exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-attachments',
  'work-attachments',
  true, -- Public read access
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- CREATE STORAGE POLICIES (for 'work-attachments' bucket)
-- ============================================================================

-- Policy: Public read access to all files in bucket
CREATE POLICY "Public can view work attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'work-attachments');

-- Policy: Teachers and admins can upload files
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

-- Policy: Teachers can delete their own uploads (within 24h grace period)
-- Admins can delete any file
CREATE POLICY "Teachers can delete storage attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-attachments' AND
  (
    -- Admin can delete anything
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
    OR
    -- Teacher can delete own files uploaded less than 24h ago
    (
      owner = auth.uid() AND
      created_at > NOW() - INTERVAL '24 hours'
    )
  )
);

-- Policy: Teachers and admins can update file metadata
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
-- CREATE work_attachments TABLE
-- ============================================================================

-- Table to track uploaded files and their metadata
CREATE TABLE IF NOT EXISTS public.work_attachments (
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

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_work_attachments_work_id ON public.work_attachments(work_id);
CREATE INDEX IF NOT EXISTS idx_work_attachments_uploaded_by ON public.work_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_work_attachments_file_type ON public.work_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_work_attachments_created_at ON public.work_attachments(created_at DESC);

-- ============================================================================
-- RLS POLICIES FOR work_attachments TABLE
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view attachments of published works" ON public.work_attachments;
DROP POLICY IF EXISTS "Teachers can view own attachments" ON public.work_attachments;
DROP POLICY IF EXISTS "Teachers can create attachments" ON public.work_attachments;
DROP POLICY IF EXISTS "Teachers can delete table attachments" ON public.work_attachments;

-- Enable RLS
ALTER TABLE public.work_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view attachments for published works
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

-- Policy: Teachers can view their own attachments
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

-- Policy: Teachers can insert attachments
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

-- Policy: Teachers can delete their own attachments, admins can delete any
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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_work_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_work_attachments_updated_at ON public.work_attachments;

CREATE TRIGGER set_work_attachments_updated_at
  BEFORE UPDATE ON public.work_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_work_attachments_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.work_attachments IS 'Tracks file attachments for student works';
COMMENT ON COLUMN public.work_attachments.storage_path IS 'Path in Supabase Storage (format: user_id/work_id/filename)';
COMMENT ON COLUMN public.work_attachments.thumbnail_path IS 'Path to generated thumbnail for images';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✓ Migration completed successfully';
  RAISE NOTICE '✓ Bucket: work-attachments (with hyphen)';
  RAISE NOTICE '✓ Table: work_attachments created/verified';
  RAISE NOTICE '✓ All policies recreated correctly';
END $$;
