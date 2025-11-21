-- Fix work_attachments RLS policies to ensure admins can see all attachments
-- Date: 2025-11-18 (v2 - handles existing policies)

-- Drop ALL existing SELECT policies for work_attachments
DROP POLICY IF EXISTS "Public can view attachments of published works" ON public.work_attachments;
DROP POLICY IF EXISTS "Teachers can view own attachments" ON public.work_attachments;
DROP POLICY IF EXISTS "Public can view published work attachments" ON public.work_attachments;
DROP POLICY IF EXISTS "Authenticated users view work attachments" ON public.work_attachments;

-- Create new, clearer SELECT policies

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

-- Add helpful comment
COMMENT ON POLICY "Authenticated users view work attachments" ON public.work_attachments IS
'Allows users to view attachments if they: (1) uploaded it, (2) are admin, or (3) created the parent work';

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✓ RLS policies for work_attachments updated successfully';
  RAISE NOTICE '✓ Admins can now view all attachments (including pending review)';
  RAISE NOTICE '✓ Teachers can view their own attachments';
  RAISE NOTICE '✓ Public can view published work attachments';
END $$;
