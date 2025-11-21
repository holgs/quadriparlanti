-- ============================================================================
-- MIGRATION: Fix Teacher Update Policy for Works
-- Description: Allow teachers to submit works for review by updating status
-- Date: 2025-11-13
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Teachers update own draft/revision works" ON works;

-- Create new policy that allows teachers to:
-- 1. Update their own works in draft or needs_revision status
-- 2. Change status to pending_review when submitting
-- 3. Update all fields when work is in draft/needs_revision state
CREATE POLICY "Teachers update own draft/revision works"
  ON works FOR UPDATE
  USING (
    -- Can only update works they created
    created_by = auth.uid() AND
    -- Only if current status is draft or needs_revision
    status IN ('draft', 'needs_revision')
  )
  WITH CHECK (
    -- Ensure they still own the work after update
    created_by = auth.uid() AND
    -- Allow status to remain draft, needs_revision, or change to pending_review
    status IN ('draft', 'needs_revision', 'pending_review')
  );

-- Note: This policy allows teachers to:
-- - Update draft works (can remain draft or submit to pending_review)
-- - Update needs_revision works (can remain needs_revision or resubmit to pending_review)
-- - NOT modify published, archived, or other users' works
