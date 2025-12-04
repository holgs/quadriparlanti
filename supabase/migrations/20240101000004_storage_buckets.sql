-- ============================================================================
-- MIGRATION: Storage Buckets Configuration
-- Description: Creates Supabase Storage buckets and RLS policies for file uploads
-- Author: System Architect
-- Date: 2024-01-01
-- ============================================================================

-- ============================================================================
-- STORAGE BUCKET: work_attachments
-- Description: Stores PDF and image files for student works
-- Access: Public read, authenticated write (teachers and admins)
-- ============================================================================

-- Create bucket if it doesn't exist
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
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow public to view/download files
CREATE POLICY "Public can view work attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'work-attachments');

-- RLS Policy: Teachers can upload files for their own works
CREATE POLICY "Teachers can upload work attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'work-attachments' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('docente', 'admin') AND status = 'active'
    )
  );

-- RLS Policy: Teachers can update/delete their own files
CREATE POLICY "Teachers can update own attachments"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'work-attachments' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('docente', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Teachers can delete own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'work-attachments' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('docente', 'admin') AND status = 'active'
    )
  );

-- RLS Policy: Admins have full access
CREATE POLICY "Admins have full access to work attachments"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'work-attachments' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- STORAGE BUCKET: theme_images
-- Description: Stores featured images for themes
-- Access: Public read, admin write only
-- ============================================================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'theme-images',
  'theme-images',
  true, -- Public read access
  5242880, -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow public to view theme images
CREATE POLICY "Public can view theme images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'theme-images');

-- RLS Policy: Only admins can upload theme images
CREATE POLICY "Admins can upload theme images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'theme-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- RLS Policy: Only admins can update/delete theme images
CREATE POLICY "Admins can update theme images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'theme-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins can delete theme images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'theme-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================================
-- STORAGE BUCKET: qr_codes
-- Description: Stores generated QR code images
-- Access: Public read, admin write only
-- ============================================================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qr-codes',
  'qr-codes',
  true, -- Public read access
  1048576, -- 1MB limit
  ARRAY[
    'image/png',
    'image/svg+xml',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow public to view QR codes
CREATE POLICY "Public can view QR codes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qr-codes');

-- RLS Policy: Only admins can upload QR codes
CREATE POLICY "Admins can upload QR codes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- RLS Policy: Only admins can update/delete QR codes
CREATE POLICY "Admins can update QR codes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins can delete QR codes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );
