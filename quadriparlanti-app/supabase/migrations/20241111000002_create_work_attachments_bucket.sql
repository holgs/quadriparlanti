-- Migration: Create work_attachments storage bucket
-- Description: Creates bucket for teacher uploads (PDF, images) with RLS policies
-- Date: 2024-11-11

-- ============================================================================
-- CREATE STORAGE BUCKET
-- ============================================================================

-- Create bucket for work attachments (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work_attachments',
  'work_attachments',
  true, -- Public read access
  10485760, -- 10MB max file size
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Teachers and admins can upload files
CREATE POLICY "Teachers can upload work attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work_attachments' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('docente', 'admin')
    AND status = 'active'
  )
);

-- Policy: Public read access to all files
CREATE POLICY "Public can view work attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'work_attachments');

-- Policy: Teachers can delete their own uploads (within grace period)
-- Admins can delete any file
CREATE POLICY "Teachers can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'work_attachments' AND
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
      auth.uid()::text = (storage.foldername(name))[1] AND
      created_at > NOW() - INTERVAL '24 hours'
    )
  )
);

-- Policy: Teachers and admins can update file metadata
CREATE POLICY "Teachers can update work attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'work_attachments' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('docente', 'admin')
    AND status = 'active'
  )
)
WITH CHECK (
  bucket_id = 'work_attachments' AND
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
CREATE POLICY "Teachers can delete own attachments"
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
